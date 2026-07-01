import { NextRequest } from "next/server";
import { db, expensesTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function formatExpense(e: typeof expensesTable.$inferSelect) {
  return { ...e, amount: parseFloat(e.amount), createdAt: e.createdAt.toISOString() };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const category = searchParams.get("category");

  const expenses = await db.select().from(expensesTable).orderBy(expensesTable.expenseDate);
  let result = expenses;

  if (month) result = result.filter((e) => new Date(e.expenseDate).getMonth() + 1 === month);
  if (year) result = result.filter((e) => new Date(e.expenseDate).getFullYear() === year);
  if (category) result = result.filter((e) => e.category === category);

  if (sub === "summary") {
    const totalExpenses = result.reduce((s, e) => s + parseFloat(e.amount), 0);
    const byCategoryMap: Record<string, number> = {};
    for (const e of result) byCategoryMap[e.category] = (byCategoryMap[e.category] ?? 0) + parseFloat(e.amount);
    const byCategory = Object.entries(byCategoryMap).map(([cat, total]) => ({ category: cat, total }));
    return Response.json({ totalExpenses, byCategory });
  }

  return Response.json(result.map(formatExpense));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { amount, ...rest } = body;
  const [expense] = await db.insert(expensesTable).values({ ...rest, amount: String(amount) }).returning();
  return Response.json(formatExpense(expense), { status: 201 });
}
