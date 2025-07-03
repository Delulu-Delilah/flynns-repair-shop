import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addPart = mutation({
  args: {
    ticketId: v.id("tickets"),
    partName: v.string(),
    partNumber: v.optional(v.string()),
    quantity: v.number(),
    unitCost: v.number(),
    supplier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const totalCost = args.quantity * args.unitCost;
    
    return await ctx.db.insert("parts", {
      ticketId: args.ticketId,
      partName: args.partName,
      partNumber: args.partNumber,
      quantity: args.quantity,
      unitCost: args.unitCost,
      totalCost,
      supplier: args.supplier,
    });
  },
});

export const getTicketParts = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("parts")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();
  },
});

export const removePart = mutation({
  args: { partId: v.id("parts") },
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    await ctx.db.delete(args.partId);
    return args.partId;
  },
});
