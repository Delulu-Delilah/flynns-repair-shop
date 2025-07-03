import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate unique ticket number
async function generateTicketNumber(ctx: any): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Get count of tickets created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
  
  const todayTickets = await ctx.db
    .query("tickets")
    .withIndex("by_date_received", (q: any) => 
      q.gte("dateReceived", startOfDay).lt("dateReceived", endOfDay)
    )
    .collect();
  
  const sequence = (todayTickets.length + 1).toString().padStart(3, '0');
  return `T${year}${month}${day}-${sequence}`;
}

export const createTicket = mutation({
  args: {
    customerId: v.id("customers"),
    deviceMake: v.string(),
    deviceModel: v.string(),
    serialNumber: v.optional(v.string()),
    issueDescription: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    estimatedCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const ticketNumber = await generateTicketNumber(ctx);
    const now = Date.now();
    
    const ticketId = await ctx.db.insert("tickets", {
      ticketNumber,
      customerId: args.customerId,
      deviceMake: args.deviceMake,
      deviceModel: args.deviceModel,
      serialNumber: args.serialNumber,
      issueDescription: args.issueDescription,
      status: "received",
      priority: args.priority,
      estimatedCost: args.estimatedCost,
      dateReceived: now,
    });

    // Add initial status history
    await ctx.db.insert("statusHistory", {
      ticketId,
      newStatus: "received",
      timestamp: now,
      notes: "Ticket created",
    });

    return ticketId;
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    newStatus: v.union(
      v.literal("received"),
      v.literal("diagnosed"),
      v.literal("in_progress"),
      v.literal("awaiting_parts"),
      v.literal("completed"),
      v.literal("picked_up")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");
    
    const now = Date.now();
    const updates: any = { status: args.newStatus };
    
    if (args.newStatus === "completed") {
      updates.dateCompleted = now;
    } else if (args.newStatus === "picked_up") {
      updates.datePickedUp = now;
    }
    
    await ctx.db.patch(args.ticketId, updates);
    
    // Add status history
    await ctx.db.insert("statusHistory", {
      ticketId: args.ticketId,
      previousStatus: ticket.status,
      newStatus: args.newStatus,
      notes: args.notes,
      timestamp: now,
    });
    
    return args.ticketId;
  },
});

export const assignTechnician = mutation({
  args: {
    ticketId: v.id("tickets"),
    technicianId: v.id("technicians"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.patch(args.ticketId, {
      technicianId: args.technicianId,
    });
    
    return args.ticketId;
  },
});

export const updateTicketDetails = mutation({
  args: {
    ticketId: v.id("tickets"),
    diagnosticNotes: v.optional(v.string()),
    repairActions: v.optional(v.string()),
    finalCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const updates: any = {};
    if (args.diagnosticNotes !== undefined) updates.diagnosticNotes = args.diagnosticNotes;
    if (args.repairActions !== undefined) updates.repairActions = args.repairActions;
    if (args.finalCost !== undefined) updates.finalCost = args.finalCost;
    
    await ctx.db.patch(args.ticketId, updates);
    return args.ticketId;
  },
});

export const getTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) return null;
    
    const customer = await ctx.db.get(ticket.customerId);
    const technician = ticket.technicianId ? await ctx.db.get(ticket.technicianId) : null;
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
    
    return {
      ...ticket,
      customer,
      technician,
      parts,
    };
  },
});

export const listTickets = query({
  args: {
    status: v.optional(v.string()),
    technicianId: v.optional(v.id("technicians")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    let tickets;
    
    if (args.status) {
      tickets = await ctx.db
        .query("tickets")
        .withIndex("by_status", (q) => q.eq("status", args.status as any))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.technicianId) {
      tickets = await ctx.db
        .query("tickets")
        .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
        .order("desc")
        .take(args.limit || 50);
    } else {
      tickets = await ctx.db
        .query("tickets")
        .withIndex("by_date_received")
        .order("desc")
        .take(args.limit || 50);
    }
    
    // Get customer and technician info for each ticket
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const customer = await ctx.db.get(ticket.customerId);
        const technician = ticket.technicianId ? await ctx.db.get(ticket.technicianId) : null;
        return {
          ...ticket,
          customer,
          technician,
        };
      })
    );
    
    return ticketsWithDetails;
  },
});

export const searchTickets = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    if (!args.searchTerm.trim()) {
      return [];
    }
    
    // Search by ticket number
    const ticketResults = await ctx.db
      .query("tickets")
      .withSearchIndex("search_tickets", (q) => q.search("ticketNumber", args.searchTerm))
      .take(20);
    
    // Search customers and get their tickets
    const customerResults = await ctx.db
      .query("customers")
      .withSearchIndex("search_customers", (q) => q.search("name", args.searchTerm))
      .take(10);
    
    const customerTickets = await Promise.all(
      customerResults.map(async (customer) => {
        const tickets = await ctx.db
          .query("tickets")
          .withIndex("by_customer", (q) => q.eq("customerId", customer._id))
          .order("desc")
          .take(5);
        return tickets;
      })
    );
    
    const allTickets = [...ticketResults, ...customerTickets.flat()];
    const uniqueTickets = Array.from(new Map(allTickets.map(t => [t._id, t])).values());
    
    // Get customer and technician details
    const ticketsWithDetails = await Promise.all(
      uniqueTickets.map(async (ticket) => {
        const customer = await ctx.db.get(ticket.customerId);
        const technician = ticket.technicianId ? await ctx.db.get(ticket.technicianId) : null;
        return {
          ...ticket,
          customer,
          technician,
        };
      })
    );
    
    return ticketsWithDetails.slice(0, 20);
  },
});

export const getTicketHistory = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("statusHistory")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("desc")
      .collect();
  },
});

export const deleteTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    // Check if ticket exists
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    // Delete all related parts
    const parts = await ctx.db
      .query("parts")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
    
    for (const part of parts) {
      await ctx.db.delete(part._id);
    }
    
    // Delete all status history
    const statusHistory = await ctx.db
      .query("statusHistory")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
    
    for (const history of statusHistory) {
      await ctx.db.delete(history._id);
    }
    
    // Finally delete the ticket
    await ctx.db.delete(args.ticketId);
    
    return { success: true };
  },
});
