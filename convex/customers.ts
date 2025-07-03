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
