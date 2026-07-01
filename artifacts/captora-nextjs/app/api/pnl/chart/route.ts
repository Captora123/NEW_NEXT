import { NextRequest } from "next/server";
import {
  db, paymentsTable, freelancerPaymentsTable, salaryRecordsTable, expensesTable, staffTable,
} from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

async function calcPnL(month: number, year: number) {
  const [payments, fpayments, salaries, expenses, staff] = await Promise.all([
    db.select().from(paymentsTable),
    db.select().from(freelancerPaymentsTable),
    db.select().from(salaryRecordsTable),
    db.select().from(expensesTable),
    db.select().from(staffTable),
  ]);

  const totalRevenue = payments
    .filter((p) => { const d = new Date(p.paymentDate); return d.getMonth() + 1 === month && d.getFullYear() === year; })
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const totalFreelancerCosts = fpayments
    .filter((p) => { const d = new Date(p.paymentDate); return d.getMonth() + 1 === month && d.getFullYear() === year && p.status === "Paid"; })
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const paidSalaryRecords = salaries.filter((s) => s.month === month && s.year === year && s.status === "Paid");
  let totalSalaries: number;
  if (paidSalaryRecords.length > 0) {
    totalSalaries = paidSalaryRecords.reduce((s, r) => s + parseFloat(r.amount), 0);
  } else {
    const monthEnd = new Date(year, month, 0);
    totalSalaries = staff
      .filter((s) => { if (!s.joiningDate) return true; return new Date(s.joiningDate) <= monthEnd; })
      .reduce((s, m) => s + parseFloat(m.monthlySalary), 0);
  }

  const totalExpenses = expenses
    .filter((e) => { const d = new Date(e.expenseDate); return d.getMonth() + 1 === month && d.getFullYear() === year; })
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  return { month, year, totalRevenue, totalFreelancerCosts, totalSalaries, totalExpenses };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  const points = await Promise.all(Array.from({ length: 12 }, (_, i) => calcPnL(i + 1, year)));

  return Response.json(
    points.map((p) => ({
      month: p.month,
      year: p.year,
      revenue: p.totalRevenue,
      expenses: p.totalFreelancerCosts + p.totalSalaries + p.totalExpenses,
      profit: p.totalRevenue - p.totalFreelancerCosts - p.totalSalaries - p.totalExpenses,
    })),
  );
}
