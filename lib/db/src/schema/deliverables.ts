import { pgTable, text, serial, timestamp, boolean, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const deliverablesTable = pgTable("deliverables", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().unique().references(() => clientsTable.id, { onDelete: "cascade" }),
  editedPhotos: boolean("edited_photos").notNull().default(false),
  cinematicHighlight: boolean("cinematic_highlight").notNull().default(false),
  traditionalVideo: boolean("traditional_video").notNull().default(false),
  instagramReels: boolean("instagram_reels").notNull().default(false),
  albumOrdered: boolean("album_ordered").notNull().default(false),
  albumDelivered: boolean("album_delivered").notNull().default(false),
  rawDataCopied: boolean("raw_data_copied").notNull().default(false),
  magazineDelivered: boolean("magazine_delivered").notNull().default(false),
  photoFrameDelivered: boolean("photo_frame_delivered").notNull().default(false),
  status: text("status").notNull().default("In Progress"), // In Progress | Done
  completedAt: date("completed_at", { mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDeliverableSchema = createInsertSchema(deliverablesTable).omit({ id: true, updatedAt: true });
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;
export type Deliverable = typeof deliverablesTable.$inferSelect;
