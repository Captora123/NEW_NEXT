import { pgTable, text, serial, timestamp, numeric, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: date("payment_date", { mode: "string" }).notNull(),
  installmentType: text("installment_type").notNull(), // Advance, Pre-wedding, Before wedding, After delivery
  mode: text("mode").notNull(), // Cash, UPI, Bank Transfer, Cheque
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
