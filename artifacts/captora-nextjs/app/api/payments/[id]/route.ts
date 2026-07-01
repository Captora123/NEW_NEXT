import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, paymentsTable, clientsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

function formatPayment(p: typeof paymentsTable.$inferSelect, clientName?: string | null) {
  return { ...p, amount: parseFloat(p.amount), clientName: clientName ?? null, createdAt: p.createdAt.toISOString() };
}

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

  const [payment] = await db.update(paymentsTable).set(updates as never).where(eq(paymentsTable.id, id)).returning();
  if (!payment) return Response.json({ error: "Payment not found" }, { status: 404 });
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, payment.clientId));
  return Response.json(formatPayment(payment, client?.name));
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
  return new Response(null, { status: 204 });
}
