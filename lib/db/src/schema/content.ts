import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentIdeasTable = pgTable("content_ideas", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // Reel, Post, Story, Ad
  status: text("status").notNull().default("Idea"), // Idea, Script Written, Shot, Editing, Posted
  assignedTo: text("assigned_to"),
  dueDate: date("due_date", { mode: "string" }),
  shootId: integer("shoot_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContentIdeaSchema = createInsertSchema(contentIdeasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContentIdea = z.infer<typeof insertContentIdeaSchema>;
export type ContentIdea = typeof contentIdeasTable.$inferSelect;
