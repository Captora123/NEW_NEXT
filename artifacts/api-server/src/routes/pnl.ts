import { Router, type IRouter } from "express";
import { db, paymentsTable, freelancerPaymentsTable, salaryRecordsTable, expensesTable } from "@workspace/db";
import { GetMonthlyPnLQueryParams, GetPnLChartQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function calcPnL(month: number, year: number) {
  const [payments, fpayments, salaries, expenses] = await Promise.all([
    db.select().from(paymentsTable),
    db.select().from(freelancerPaymentsTable),
    db.select().from(salaryRecordsTable),
    db.select().from(expensesTable),
  ]);

  const totalRevenue = payments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalFreelancerCosts = fpayments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() + 1 === month && d.getFullYear() === year && p.status === "Paid";
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalSalaries = salaries
    .filter((s) => s.month === month && s.year === year && s.status === "Paid")
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const totalExpenses = expenses
    .filter((e) => {
      const d = new Date(e.expenseDate);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const netProfit = totalRevenue - totalFreelancerCosts - totalSalaries - totalExpenses;

  return { month, year, totalRevenue, totalFreelancerCosts, totalSalaries, totalExpenses, netProfit };
}

router.get("/pnl/monthly", async (req, res): Promise<void> => {
  const query = GetMonthlyPnLQueryParams.safeParse(req.query);
  const now = new Date();
  const month = query.success && query.data.month ? query.data.month : now.getMonth() + 1;
  const year = query.success && query.data.year ? query.data.year : now.getFullYear();

  const report = await calcPnL(month, year);
  res.json(report);
});

router.get("/pnl/chart", async (req, res): Promise<void> => {
  const query = GetPnLChartQueryParams.safeParse(req.query);
  const year = query.success && query.data.year ? query.data.year : new Date().getFullYear();

  const points = await Promise.all(
    Array.from({ length: 12 }, (_, i) => calcPnL(i + 1, year))
  );

  res.json(
    points.map((p) => ({
      month: p.month,
      year: p.year,
      revenue: p.totalRevenue,
      expenses: p.totalFreelancerCosts + p.totalSalaries + p.totalExpenses,
      profit: p.netProfit,
    }))
  );
});

export default router;
