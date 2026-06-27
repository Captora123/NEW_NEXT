import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { freelancersTable } from "./freelancers";

export const clientFreelancerAssignmentsTable = pgTable("client_freelancer_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  freelancerId: integer("freelancer_id").notNull().references(() => freelancersTable.id, { onDelete: "cascade" }),
  functionName: text("function_name").notNull(),
  rateForShoot: numeric("rate_for_shoot", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClientFreelancerAssignmentSchema = createInsertSchema(clientFreelancerAssignmentsTable)
  .omit({ id: true, createdAt: true });
export type InsertClientFreelancerAssignment = z.infer<typeof insertClientFreelancerAssignmentSchema>;
export type ClientFreelancerAssignment = typeof clientFreelancerAssignmentsTable.$inferSelect;
