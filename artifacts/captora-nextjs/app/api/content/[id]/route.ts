import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, contentIdeasTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const [idea] = await db.update(contentIdeasTable).set(body).where(eq(contentIdeasTable.id, id)).returning();
  if (!idea) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ...idea, createdAt: idea.createdAt.toISOString() });
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(contentIdeasTable).where(eq(contentIdeasTable.id, id));
  return new Response(null, { status: 204 });
}
