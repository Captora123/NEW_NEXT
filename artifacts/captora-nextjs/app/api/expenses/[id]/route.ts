import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
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

  const [expense] = await db.update(expensesTable).set(updates as never).where(eq(expensesTable.id, id)).returning();
  if (!expense) return Response.json({ error: "Expense not found" }, { status: 404 });
  return Response.json({ ...expense, amount: parseFloat(expense.amount), createdAt: expense.createdAt.toISOString() });
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(expensesTable).where(eq(expensesTable.id, id));
  return new Response(null, { status: 204 });
}
