import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deliverablesTable, clientsTable } from "@workspace/db";
import {
  ListDeliverablesQueryParams,
  UpsertClientDeliverablesParams,
  UpsertClientDeliverablesBody,
  GetClientDeliverablesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

function formatDeliverable(d: typeof deliverablesTable.$inferSelect) {
  return {
    ...d,
    updatedAt: d.updatedAt.toISOString(),
  };
}

router.get("/deliverables", async (req, res): Promise<void> => {
  const query = ListDeliverablesQueryParams.safeParse(req.query);
  let deliverables = await db.select().from(deliverablesTable);

  if (query.success) {
    if (query.data.clientId) {
      deliverables = deliverables.filter((d) => d.clientId === query.data.clientId);
    }
    if (query.data.pending) {
      deliverables = deliverables.filter((d) => d.status !== "Done");
    }
  }

  res.json(deliverables.map(formatDeliverable));
});

router.get("/deliverables/:clientId", async (req, res): Promise<void> => {
  const clientId = parseId(req.params.clientId);
  if (!clientId) { res.status(400).json({ error: "Invalid clientId" }); return; }

  const [deliverable] = await db.select().from(deliverablesTable).where(eq(deliverablesTable.clientId, clientId));
  if (!deliverable) {
    // Return a default empty one
    res.json({
      id: 0,
      clientId,
      editedPhotos: false,
      cinematicHighlight: false,
      traditionalVideo: false,
      instagramReels: false,
      albumOrdered: false,
      albumDelivered: false,
      rawDataCopied: false,
      magazineDelivered: false,
      photoFrameDelivered: false,
      status: "In Progress",
      completedAt: null,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  res.json(formatDeliverable(deliverable));
});

router.put("/deliverables/:clientId", async (req, res): Promise<void> => {
  const clientId = parseId(req.params.clientId);
  if (!clientId) { res.status(400).json({ error: "Invalid clientId" }); return; }

  const parsed = UpsertClientDeliverablesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const existing = await db.select().from(deliverablesTable).where(eq(deliverablesTable.clientId, clientId));

  if (existing.length > 0) {
    const [d] = await db
      .update(deliverablesTable)
      .set(parsed.data)
      .where(eq(deliverablesTable.clientId, clientId))
      .returning();
    res.json(formatDeliverable(d));
  } else {
    const [d] = await db
      .insert(deliverablesTable)
      .values({ clientId, ...parsed.data })
      .returning();
    res.json(formatDeliverable(d));
  }
});

export default router;
