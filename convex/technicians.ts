import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTechnician = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    specialization: v.optional(v.string()),
  },
  returns: v.id("technicians"),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db.insert("technicians", {
      name: args.name,
      email: args.email,
      specialization: args.specialization,
      isActive: true,
    });
  },
});

export const createTechnicianWithAccount = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    specialization: v.optional(v.string()),
  },
  returns: v.object({ technicianId: v.id("technicians"), email: v.string(), password: v.string() }),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if a technician with this email already exists
    const existingTechnician = await ctx.db
      .query("technicians")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    if (existingTechnician) {
      throw new Error("A technician with this email already exists");
    }
    
    // Create the technician record first
    const technicianId = await ctx.db.insert("technicians", {
      name: args.name,
      email: args.email,
      specialization: args.specialization,
      isActive: true,
    });
    
    // Return the technician ID - the frontend will handle auth account creation
    return { technicianId, email: args.email, password: args.password };
  },
});

export const listTechnicians = query({
  args: { activeOnly: v.optional(v.boolean()) },
  returns: v.array(
    v.object({
      _id: v.id("technicians"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      specialization: v.optional(v.string()),
      isActive: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let query = ctx.db.query("technicians");
    
    if (args.activeOnly !== false) {
      return await ctx.db
        .query("technicians")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }
    
    return await ctx.db.query("technicians").collect();
  },
});

export const getTechnicianWorkload = query({
  args: { technicianId: v.id("technicians") },
  returns: v.any(),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const technician = await ctx.db.get(args.technicianId);
    if (!technician) return null;
    
    const activeTickets = await ctx.db
      .query("tickets")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .filter((q) => q.neq(q.field("status"), "completed"))
      .filter((q) => q.neq(q.field("status"), "picked_up"))
      .collect();
    
    return {
      technician,
      activeTicketCount: activeTickets.length,
      tickets: activeTickets,
    };
  },
});
