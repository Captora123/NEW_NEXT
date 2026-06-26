import { pgTable, text, serial, timestamp, numeric, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  monthlySalary: numeric("monthly_salary", { precision: 12, scale: 2 }).notNull(),
  joiningDate: date("joining_date", { mode: "string" }).notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStaffSchema = createInsertSchema(staffTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type Staff = typeof staffTable.$inferSelect;

export const salaryRecordsTable = pgTable("salary_records", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull().references(() => staffTable.id, { onDelete: "cascade" }),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("Pending"), // Paid | Pending
  paidDate: date("paid_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSalaryRecordSchema = createInsertSchema(salaryRecordsTable).omit({ id: true, createdAt: true });
export type InsertSalaryRecord = z.infer<typeof insertSalaryRecordSchema>;
export type SalaryRecord = typeof salaryRecordsTable.$inferSelect;
