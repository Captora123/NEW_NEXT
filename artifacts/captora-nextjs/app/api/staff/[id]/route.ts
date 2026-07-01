import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, staffTable, salaryRecordsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

type Context = { params: Promise<{ id: string }> };

function formatStaff(s: typeof staffTable.$inferSelect) {
  return { ...s, monthlySalary: parseFloat(s.monthlySalary), createdAt: s.createdAt.toISOString() };
}

export async function GET(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");

  if (sub === "salary") {
    const records = await db.select().from(salaryRecordsTable).where(eq(salaryRecordsTable.staffId, id))
      .orderBy(salaryRecordsTable.year, salaryRecordsTable.month);
    return Response.json(records.map((r) => ({ ...r, amount: parseFloat(r.amount), createdAt: r.createdAt.toISOString() })));
  }

  const [s] = await db.select().from(staffTable).where(eq(staffTable.id, id));
  if (!s) return Response.json({ error: "Staff not found" }, { status: 404 });

  const records = await db.select().from(salaryRecordsTable).where(eq(salaryRecordsTable.staffId, id))
    .orderBy(salaryRecordsTable.year, salaryRecordsTable.month);

  return Response.json({
    ...formatStaff(s),
    salaryRecords: records.map((r) => ({ ...r, amount: parseFloat(r.amount), createdAt: r.createdAt.toISOString() })),
  });
}

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { monthlySalary, ...rest } = body;
  const updates: Record<string, unknown> = { ...rest };
  if (monthlySalary !== undefined) updates.monthlySalary = String(monthlySalary);

  const [s] = await db.update(staffTable).set(updates as never).where(eq(staffTable.id, id)).returning();
  if (!s) return Response.json({ error: "Staff not found" }, { status: 404 });
  return Response.json(formatStaff(s));
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(staffTable).where(eq(staffTable.id, id));
  return new Response(null, { status: 204 });
}

export async function POST(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");
  const body = await request.json();

  if (sub === "salary") {
    const { amount, ...rest } = body;
    const [record] = await db.insert(salaryRecordsTable)
      .values({ ...rest, staffId: id, amount: String(amount) }).returning();
    return Response.json({ ...record, amount: parseFloat(record.amount), createdAt: record.createdAt.toISOString() }, { status: 201 });
  }

  return Response.json({ error: "Unknown sub-route" }, { status: 400 });
}
