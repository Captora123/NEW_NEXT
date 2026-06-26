import { pgTable, text, serial, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp"),
  email: text("email"),
  weddingDate: date("wedding_date", { mode: "string" }),
  venue: text("venue"),
  city: text("city"),
  functions: text("functions").array().default([]),
  status: text("status").notNull().default("Lead"),
  packageAmount: numeric("package_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;

export const clientNotesTable = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  clientId: serial("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClientNoteSchema = createInsertSchema(clientNotesTable).omit({ id: true, createdAt: true });
export type InsertClientNote = z.infer<typeof insertClientNoteSchema>;
export type ClientNote = typeof clientNotesTable.$inferSelect;
