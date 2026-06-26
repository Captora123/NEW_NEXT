import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contentIdeasTable } from "@workspace/db";
import {
  ListContentIdeasQueryParams,
  CreateContentIdeaBody,
  UpdateContentIdeaParams,
  UpdateContentIdeaBody,
  DeleteContentIdeaParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

function formatIdea(c: typeof contentIdeasTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/content", async (req, res): Promise<void> => {
  const query = ListContentIdeasQueryParams.safeParse(req.query);
  let ideas = await db.select().from(contentIdeasTable).orderBy(contentIdeasTable.createdAt);

  if (query.success && query.data.status) {
    ideas = ideas.filter((i) => i.status === query.data.status);
  }

  res.json(ideas.map(formatIdea));
});

router.post("/content", async (req, res): Promise<void> => {
  const parsed = CreateContentIdeaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [idea] = await db.insert(contentIdeasTable).values(parsed.data).returning();
  res.status(201).json(formatIdea(idea));
});

router.patch("/content/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateContentIdeaBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [idea] = await db.update(contentIdeasTable).set(parsed.data).where(eq(contentIdeasTable.id, id)).returning();
  if (!idea) { res.status(404).json({ error: "Content idea not found" }); return; }
  res.json(formatIdea(idea));
});

router.delete("/content/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(contentIdeasTable).where(eq(contentIdeasTable.id, id));
  res.sendStatus(204);
});

export default router;
