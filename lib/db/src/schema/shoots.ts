import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const shootsTable = pgTable("shoots", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  shootDate: date("shoot_date", { mode: "string" }).notNull(),
  shootTime: text("shoot_time"),
  venue: text("venue"),
  functions: text("functions").array().default([]),
  status: text("status").notNull().default("Scheduled"),
  specialInstructions: text("special_instructions"),
  deliveryNotes: text("delivery_notes"),
  equipmentChecklist: text("equipment_checklist").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertShootSchema = createInsertSchema(shootsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShoot = z.infer<typeof insertShootSchema>;
export type Shoot = typeof shootsTable.$inferSelect;

export const shootTeamTable = pgTable("shoot_team", {
  id: serial("id").primaryKey(),
  shootId: integer("shoot_id").notNull().references(() => shootsTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").notNull(),
  memberType: text("member_type").notNull(), // 'staff' | 'freelancer'
  callTime: text("call_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShootTeamSchema = createInsertSchema(shootTeamTable).omit({ id: true, createdAt: true });
export type InsertShootTeam = z.infer<typeof insertShootTeamSchema>;
export type ShootTeam = typeof shootTeamTable.$inferSelect;
