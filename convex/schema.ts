import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  customers: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
  })
    .index("by_name", ["name"])
    .index("by_phone", ["phone"])
    .searchIndex("search_customers", {
      searchField: "name",
      filterFields: ["phone"],
    }),

  technicians: defineTable({
    name: v.string(),
    email: v.string(),
    specialization: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"]),

  tickets: defineTable({
    ticketNumber: v.string(),
    customerId: v.id("customers"),
    technicianId: v.optional(v.id("technicians")),
    
    // Device information
    deviceMake: v.string(),
    deviceModel: v.string(),
    serialNumber: v.optional(v.string()),
    
    // Issue details
    issueDescription: v.string(),
    diagnosticNotes: v.optional(v.string()),
    repairActions: v.optional(v.string()),
    
    // Status and tracking
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
    
    // Financial
    estimatedCost: v.optional(v.number()),
    finalCost: v.optional(v.number()),
    
    // Dates
    dateReceived: v.number(),
    dateCompleted: v.optional(v.number()),
    datePickedUp: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_customer", ["customerId"])
    .index("by_technician", ["technicianId"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_date_received", ["dateReceived"])
    .searchIndex("search_tickets", {
      searchField: "ticketNumber",
      filterFields: ["status", "customerId"],
    }),

  parts: defineTable({
    ticketId: v.id("tickets"),
    partName: v.string(),
    partNumber: v.optional(v.string()),
    quantity: v.number(),
    unitCost: v.number(),
    totalCost: v.number(),
    supplier: v.optional(v.string()),
  })
    .index("by_ticket", ["ticketId"]),

  statusHistory: defineTable({
    ticketId: v.id("tickets"),
    previousStatus: v.optional(v.string()),
    newStatus: v.string(),
    notes: v.optional(v.string()),
    changedBy: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_timestamp", ["timestamp"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
