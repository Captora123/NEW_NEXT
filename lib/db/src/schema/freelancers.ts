import { pgTable, text, serial, timestamp, numeric, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const freelancersTable = pgTable("freelancers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Candid Photographer, Traditional Photographer, etc.
  phone: text("phone").notNull(),
  bankDetails: text("bank_details"),
  perShootRate: numeric("per_shoot_rate", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFreelancerSchema = createInsertSchema(freelancersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFreelancer = z.infer<typeof insertFreelancerSchema>;
export type Freelancer = typeof freelancersTable.$inferSelect;

export const freelancerPaymentsTable = pgTable("freelancer_payments", {
  id: serial("id").primaryKey(),
  freelancerId: integer("freelancer_id").notNull().references(() => freelancersTable.id, { onDelete: "cascade" }),
  shootId: integer("shoot_id"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("Pending"), // Paid | Pending
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFreelancerPaymentSchema = createInsertSchema(freelancerPaymentsTable).omit({ id: true, createdAt: true });
export type InsertFreelancerPayment = z.infer<typeof insertFreelancerPaymentSchema>;
export type FreelancerPayment = typeof freelancerPaymentsTable.$inferSelect;
