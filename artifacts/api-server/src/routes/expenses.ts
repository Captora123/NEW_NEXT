import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  ListExpensesQueryParams,
  CreateExpenseBody,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
  GetExpenseSummaryQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

function formatExpense(e: typeof expensesTable.$inferSelect) {
  return {
    ...e,
    amount: parseFloat(e.amount),
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/expenses/summary", async (req, res): Promise<void> => {
  const query = GetExpenseSummaryQueryParams.safeParse(req.query);
  const expenses = await db.select().from(expensesTable);

  let filtered = expenses;
  if (query.success) {
    if (query.data.month) {
      filtered = filtered.filter((e) => {
        const d = new Date(e.expenseDate);
        return d.getMonth() + 1 === query.data.month;
      });
    }
    if (query.data.year) {
      filtered = filtered.filter((e) => {
        const d = new Date(e.expenseDate);
        return d.getFullYear() === query.data.year;
      });
    }
  }

  const totalExpenses = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const byCategoryMap: Record<string, number> = {};
  for (const e of filtered) {
    byCategoryMap[e.category] = (byCategoryMap[e.category] ?? 0) + parseFloat(e.amount);
  }
  const byCategory = Object.entries(byCategoryMap).map(([category, total]) => ({ category, total }));

  res.json({ totalExpenses, byCategory });
});

router.get("/expenses", async (req, res): Promise<void> => {
  const query = ListExpensesQueryParams.safeParse(req.query);
  const expenses = await db.select().from(expensesTable).orderBy(expensesTable.expenseDate);

  let result = expenses;
  if (query.success) {
    if (query.data.month) {
      result = result.filter((e) => new Date(e.expenseDate).getMonth() + 1 === query.data.month);
    }
    if (query.data.year) {
      result = result.filter((e) => new Date(e.expenseDate).getFullYear() === query.data.year);
    }
    if (query.data.category) {
      result = result.filter((e) => e.category === query.data.category);
    }
  }

  res.json(result.map(formatExpense));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, ...rest } = parsed.data;
  const [expense] = await db.insert(expensesTable).values({ ...rest, amount: amount.toString() }).returning();
  res.status(201).json(formatExpense(expense));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (amount !== undefined) updates.amount = amount.toString();

  const [expense] = await db.update(expensesTable).set(updates).where(eq(expensesTable.id, id)).returning();
  if (!expense) { res.status(404).json({ error: "Expense not found" }); return; }
  res.json(formatExpense(expense));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(expensesTable).where(eq(expensesTable.id, id));
  res.sendStatus(204);
});

export default router;
