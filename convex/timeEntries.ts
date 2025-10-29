import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listTimeEntries = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("timeEntries"),
    _creationTime: v.number(),
    technicianId: v.id("technicians"),
    clockIn: v.number(),
    clockOut: v.optional(v.number()),
    totalHours: v.optional(v.number()),
    date: v.string(),
    notes: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    return await ctx.db
      .query("timeEntries")
      .order("desc")
      .take(100);
  },
});

export const getActiveEntry = query({
  args: { technicianId: v.id("technicians") },
  returns: v.union(
    v.object({
      _id: v.id("timeEntries"),
      _creationTime: v.number(),
      technicianId: v.id("technicians"),
      clockIn: v.number(),
      clockOut: v.optional(v.number()),
      totalHours: v.optional(v.number()),
      date: v.string(),
      notes: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .filter((q) => q.eq(q.field("clockOut"), undefined))
      .first();
  },
});

export const getTimeEntriesByTechnician = query({
  args: { 
    technicianId: v.id("technicians"),
    date: v.optional(v.string())
  },
  returns: v.array(v.object({
    _id: v.id("timeEntries"),
    _creationTime: v.number(),
    technicianId: v.id("technicians"),
    clockIn: v.number(),
    clockOut: v.optional(v.number()),
    totalHours: v.optional(v.number()),
    date: v.string(),
    notes: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("timeEntries")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .order("desc");

    if (args.date) {
      query = ctx.db
        .query("timeEntries")
        .withIndex("by_technician_and_date", (q) => 
          q.eq("technicianId", args.technicianId).eq("date", args.date!)
        )
        .order("desc");
    }

    return await query.take(50);
  },
});

export const clockIn = mutation({
  args: { 
    technicianId: v.id("technicians"),
    notes: v.optional(v.string())
  },
  returns: v.id("timeEntries"),
  handler: async (ctx, args) => {
    // Check if technician is already clocked in
    const activeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .filter((q) => q.eq(q.field("clockOut"), undefined))
      .first();

    if (activeEntry) {
      throw new Error("Technician is already clocked in");
    }

    const now = Date.now();
    const today = new Date(now).toISOString().split('T')[0];

    return await ctx.db.insert("timeEntries", {
      technicianId: args.technicianId,
      clockIn: now,
      date: today,
      notes: args.notes,
    });
  },
});

export const clockOut = mutation({
  args: { 
    entryId: v.id("timeEntries"),
    notes: v.optional(v.string())
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    if (entry.clockOut) {
      throw new Error("Already clocked out");
    }

    const clockOut = Date.now();
    const totalHours = (clockOut - entry.clockIn) / (1000 * 60 * 60);

    await ctx.db.patch(args.entryId, {
      clockOut,
      totalHours: parseFloat(totalHours.toFixed(2)),
      notes: args.notes || entry.notes,
    });

    return null;
  },
});

export const updateTimeEntry = mutation({
  args: {
    entryId: v.id("timeEntries"),
    clockIn: v.optional(v.number()),
    clockOut: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Time entry not found");
    }

    const updates: Partial<{ clockIn: number; clockOut: number; totalHours: number; notes: string }> = {};
    
    if (args.clockIn !== undefined) {
      updates.clockIn = args.clockIn;
    }
    
    if (args.clockOut !== undefined) {
      updates.clockOut = args.clockOut;
      
      // Recalculate total hours if both times are available
      const clockIn = args.clockIn ?? entry.clockIn;
      if (clockIn && args.clockOut) {
        const totalHours = (args.clockOut - clockIn) / (1000 * 60 * 60);
        updates.totalHours = parseFloat(totalHours.toFixed(2));
      }
    }
    
    if (args.notes !== undefined) {
      updates.notes = args.notes;
    }

    await ctx.db.patch(args.entryId, updates);
    return null;
  },
});

export const deleteTimeEntry = mutation({
  args: { entryId: v.id("timeEntries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.entryId);
    return null;
  },
});

export const getWeeklyHours = query({
  args: { 
    technicianId: v.id("technicians"),
    weekStart: v.string() // ISO date string for Monday of the week
  },
  returns: v.object({
    totalHours: v.number(),
    dailyHours: v.array(v.object({
      date: v.string(),
      hours: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const startDate = new Date(args.weekStart);
    const dates = [];
    
    // Generate 7 dates starting from weekStart
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    const dailyHours = [];
    let totalHours = 0;

    for (const date of dates) {
      const entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_technician_and_date", (q) => 
          q.eq("technicianId", args.technicianId).eq("date", date)
        )
        .collect();

      const dayHours = entries.reduce((sum, entry) => {
        if (entry.totalHours) {
          return sum + entry.totalHours;
        } else if (entry.clockOut) {
          const hours = (entry.clockOut - entry.clockIn) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);

      dailyHours.push({ date, hours: parseFloat(dayHours.toFixed(2)) });
      totalHours += dayHours;
    }

    return {
      totalHours: parseFloat(totalHours.toFixed(2)),
      dailyHours,
    };
  },
}); 