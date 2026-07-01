import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import {
  db, clientsTable, shootsTable, paymentsTable,
  freelancerPaymentsTable, salaryRecordsTable, expensesTable, deliverablesTable,
} from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub") ?? "summary";

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const todayStr = now.toISOString().split("T")[0];

  if (sub === "upcoming-shoots") {
    const next7 = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
    const shoots = await db
      .select({ shoot: shootsTable, clientName: clientsTable.name })
      .from(shootsTable)
      .leftJoin(clientsTable, eq(shootsTable.clientId, clientsTable.id))
      .orderBy(shootsTable.shootDate);

    return Response.json(
      shoots
        .filter(({ shoot }) => shoot.shootDate >= todayStr && shoot.shootDate <= next7)
        .map(({ shoot, clientName }) => ({
          ...shoot,
          functions: shoot.functions ?? [],
          equipmentChecklist: shoot.equipmentChecklist ?? [],
          clientName: clientName ?? null,
          createdAt: shoot.createdAt.toISOString(),
        })),
    );
  }

  if (sub === "overdue-payments") {
    const clients = await db.select().from(clientsTable);
    const payments = await db.select().from(paymentsTable);
    return Response.json(
      clients
        .filter((c) => {
          const paid = payments.filter((p) => p.clientId === c.id).reduce((s, p) => s + parseFloat(p.amount), 0);
          const pkg = c.packageAmount ? parseFloat(c.packageAmount) : 0;
          return pkg > 0 && paid < pkg && c.status !== "Completed";
        })
        .map((c) => {
          const paid = payments.filter((p) => p.clientId === c.id).reduce((s, p) => s + parseFloat(p.amount), 0);
          const pkg = c.packageAmount ? parseFloat(c.packageAmount) : 0;
          return { ...c, functions: c.functions ?? [], packageAmount: pkg, totalPaid: paid, totalPending: pkg - paid, createdAt: c.createdAt.toISOString() };
        }),
    );
  }

  const [clients, shoots, payments, fpayments, salaries, expenses, deliverables] = await Promise.all([
    db.select().from(clientsTable),
    db.select().from(shootsTable),
    db.select().from(paymentsTable),
    db.select().from(freelancerPaymentsTable),
    db.select().from(salaryRecordsTable),
    db.select().from(expensesTable),
    db.select().from(deliverablesTable),
  ]);

  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

  const thisMonthRevenue = payments
    .filter((p) => { const d = new Date(p.paymentDate); return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const lastMonthRevenue = payments
    .filter((p) => { const d = new Date(p.paymentDate); return d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear; })
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const thisMonthFreelancerCosts = fpayments
    .filter((p) => { const d = new Date(p.paymentDate); return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear && p.status === "Paid"; })
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const thisMonthSalaries = salaries
    .filter((s) => s.month === thisMonth && s.year === thisYear && s.status === "Paid")
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const thisMonthExpenses = expenses
    .filter((e) => { const d = new Date(e.expenseDate); return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, e) => s + parseFloat(e.amount), 0);

  const netProfitThisMonth = thisMonthRevenue - thisMonthFreelancerCosts - thisMonthSalaries - thisMonthExpenses;
  const todayShootsCount = shoots.filter((s) => s.shootDate === todayStr).length;
  const thisMonthShootsCount = shoots.filter((s) => { const d = new Date(s.shootDate); return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear; }).length;
  const totalLeadsThisMonth = clients.filter((c) => { const d = new Date(c.createdAt); return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear; }).length;
  const confirmedBookingsCount = clients.filter((c) => c.status === "Confirmed").length;
  const totalReceived = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalPackage = clients.reduce((s, c) => s + (c.packageAmount ? parseFloat(c.packageAmount) : 0), 0);
  const pendingPaymentsTotal = Math.max(0, totalPackage - totalReceived);
  const pendingFreelancerPaymentsTotal = fpayments.filter((p) => p.status === "Pending").reduce((s, p) => s + parseFloat(p.amount), 0);
  const pendingDeliverablesCount = deliverables.filter((d) => d.status !== "Done").length;

  return Response.json({
    todayShootsCount,
    thisMonthShootsCount,
    thisMonthRevenue,
    lastMonthRevenue,
    totalLeadsThisMonth,
    confirmedBookingsCount,
    pendingPaymentsTotal,
    pendingFreelancerPaymentsTotal,
    netProfitThisMonth,
    pendingDeliverablesCount,
  });
}
