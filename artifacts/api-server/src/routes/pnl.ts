import { Router, type IRouter } from "express";
import { db, paymentsTable, freelancerPaymentsTable, salaryRecordsTable, expensesTable, staffTable } from "@workspace/db";

const router: IRouter = Router();

async function calcPnL(month: number, year: number) {
  const [payments, fpayments, salaries, expenses, staff] = await Promise.all([
    db.select().from(paymentsTable),
    db.select().from(freelancerPaymentsTable),
    db.select().from(salaryRecordsTable),
    db.select().from(expensesTable),
    db.select().from(staffTable),
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

  // Use salary records if any exist for this month; otherwise fall back to
  // each active staff member's fixed monthly salary (joining date ≤ start of month).
  const paidSalaryRecords = salaries.filter(
    (s) => s.month === month && s.year === year && s.status === "Paid"
  );

  let totalSalaries: number;
  if (paidSalaryRecords.length > 0) {
    totalSalaries = paidSalaryRecords.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  } else {
    const monthStart = new Date(year, month - 1, 1);
    totalSalaries = staff
      .filter((s) => {
        if (!s.joiningDate) return true;
        const joined = new Date(s.joiningDate);
        return joined <= monthStart;
      })
      .reduce((sum, s) => sum + parseFloat(s.monthlySalary), 0);
  }

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
  const now = new Date();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
  const year = req.query.year ? Number(req.query.year) : now.getFullYear();

  const report = await calcPnL(month, year);
  res.json(report);
});

router.get("/pnl/chart", async (req, res): Promise<void> => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

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
