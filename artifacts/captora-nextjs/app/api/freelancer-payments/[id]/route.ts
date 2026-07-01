import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, freelancerPaymentsTable, freelancersTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { amount, ...rest } = body;
  const updates: Record<string, unknown> = { ...rest };
  if (amount !== undefined) updates.amount = String(amount);

  const [fp] = await db.update(freelancerPaymentsTable).set(updates as never).where(eq(freelancerPaymentsTable.id, id)).returning();
  if (!fp) return Response.json({ error: "Payment not found" }, { status: 404 });
  const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, fp.freelancerId));
  return Response.json({ ...fp, amount: parseFloat(fp.amount), freelancerName: fl?.name ?? null, createdAt: fp.createdAt.toISOString() });
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(freelancerPaymentsTable).where(eq(freelancerPaymentsTable.id, id));
  return new Response(null, { status: 204 });
}
