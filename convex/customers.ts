import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    return await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
    });
  },
});

export const listCustomers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.string(),
      address: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    await getAuthUserId(ctx);
    
    return await ctx.db
      .query("customers")
      .withIndex("by_name")
      .order("asc")
      .collect();
  },
});

export const searchCustomers = query({
  args: { searchTerm: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.string(),
      address: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    if (!args.searchTerm.trim()) {
      return [];
    }
    
    return await ctx.db
      .query("customers")
      .withSearchIndex("search_customers", (q) => q.search("name", args.searchTerm))
      .take(10);
  },
});

export const getCustomer = query({
  args: { customerId: v.id("customers") },
  returns: v.union(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.string(),
      address: v.optional(v.string()),
      tickets: v.array(
        v.object({
          _id: v.id("tickets"),
          _creationTime: v.number(),
          ticketNumber: v.string(),
          customerId: v.id("customers"),
          technicianId: v.optional(v.id("technicians")),
          deviceMake: v.string(),
          deviceModel: v.string(),
          serialNumber: v.optional(v.string()),
          issueDescription: v.string(),
          diagnosticNotes: v.optional(v.string()),
          repairActions: v.optional(v.string()),
          status: v.union(
            v.literal("received"),
            v.literal("diagnosed"),
            v.literal("in_progress"),
            v.literal("awaiting_parts"),
            v.literal("completed"),
            v.literal("picked_up")
          ),
          priority: v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("urgent")
          ),
          estimatedCost: v.optional(v.number()),
          finalCost: v.optional(v.number()),
          dateReceived: v.number(),
          dateCompleted: v.optional(v.number()),
          datePickedUp: v.optional(v.number()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await getAuthUserId(ctx);
    
    const customer = await ctx.db.get(args.customerId);
    if (!customer) return null;
    
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_customer", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .collect();
    
    return {
      ...customer,
      tickets,
    };
  },
});
