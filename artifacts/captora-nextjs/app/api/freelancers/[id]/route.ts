import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, freelancersTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

function fmt(f: typeof freelancersTable.$inferSelect) {
  return { ...f, perShootRate: parseFloat(f.perShootRate), createdAt: f.createdAt.toISOString() };
}

export async function GET(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const [f] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, id));
  if (!f) return Response.json({ error: "Freelancer not found" }, { status: 404 });
  return Response.json(fmt(f));
}

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  const body = await request.json();
  const { perShootRate, ...rest } = body;
  const updates: Record<string, unknown> = { ...rest };
  if (perShootRate !== undefined) updates.perShootRate = String(perShootRate);
  const [f] = await db.update(freelancersTable).set(updates).where(eq(freelancersTable.id, id)).returning();
  if (!f) return Response.json({ error: "Freelancer not found" }, { status: 404 });
  return Response.json(fmt(f));
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });
  await db.delete(freelancersTable).where(eq(freelancersTable.id, id));
  return new Response(null, { status: 204 });
}
