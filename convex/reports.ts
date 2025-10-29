import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc } from "./_generated/dataModel";

export const getTicketStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || now;
    
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_date_received", (q) => 
        q.gte("dateReceived", startDate).lte("dateReceived", endDate)
      )
      .collect();
    
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalRevenue = tickets
      .filter(t => t.finalCost)
      .reduce((sum, t) => sum + (t.finalCost || 0), 0);
    
    const completedTickets = tickets.filter(t => t.dateCompleted);
    const avgRepairTime = completedTickets.length > 0 
      ? completedTickets.reduce((sum, t) => 
          sum + ((t.dateCompleted || 0) - t.dateReceived), 0
        ) / completedTickets.length
      : 0;
    
    return {
      totalTickets: tickets.length,
      statusCounts,
      totalRevenue,
      completedTickets: completedTickets.length,
      avgRepairTimeHours: Math.round(avgRepairTime / (1000 * 60 * 60)),
      ticketsByDay: groupTicketsByDay(tickets),
    };
  },
});

function groupTicketsByDay(tickets: Doc<"tickets">[]) {
  const groups: Record<string, number> = {};
  
  tickets.forEach(ticket => {
    const date = new Date(ticket.dateReceived);
    const dateKey = date.toISOString().split('T')[0];
    groups[dateKey] = (groups[dateKey] || 0) + 1;
  });
  
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export const getTechnicianPerformance = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000);
    const endDate = args.endDate || now;
    
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_date_received", (q) => 
        q.gte("dateReceived", startDate).lte("dateReceived", endDate)
      )
      .filter((q) => q.neq(q.field("technicianId"), undefined))
      .collect();
    
    const technicians = await ctx.db
      .query("technicians")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    const performance = await Promise.all(
      technicians.map(async (tech) => {
        const techTickets = tickets.filter(t => t.technicianId === tech._id);
        const completed = techTickets.filter(t => t.status === "completed" || t.status === "picked_up");
        
        const avgTime = completed.length > 0
          ? completed.reduce((sum, t) => 
              sum + ((t.dateCompleted || t.datePickedUp || 0) - t.dateReceived), 0
            ) / completed.length
          : 0;
        
        const revenue = completed
          .filter(t => t.finalCost)
          .reduce((sum, t) => sum + (t.finalCost || 0), 0);
        
        return {
          technician: tech,
          totalTickets: techTickets.length,
          completedTickets: completed.length,
          avgRepairTimeHours: Math.round(avgTime / (1000 * 60 * 60)),
          revenue,
        };
      })
    );
    
    return performance.sort((a, b) => b.completedTickets - a.completedTickets);
  },
});
