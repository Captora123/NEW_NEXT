import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, clientsTable, shootsTable, paymentsTable, freelancerPaymentsTable, salaryRecordsTable, expensesTable, deliverablesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;
  const todayStr = now.toISOString().split("T")[0];

  const [clients, shoots, payments, fpayments, salaries, expenses, deliverables] = await Promise.all([
    db.select().from(clientsTable),
    db.select().from(shootsTable),
    db.select().from(paymentsTable),
    db.select().from(freelancerPaymentsTable),
    db.select().from(salaryRecordsTable),
    db.select().from(expensesTable),
    db.select().from(deliverablesTable),
  ]);

  const thisMonthPayments = payments.filter((p) => {
    const d = new Date(p.paymentDate);
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
  });

  const lastMonthPayments = payments.filter((p) => {
    const d = new Date(p.paymentDate);
    return d.getMonth() + 1 === lastMonth && d.getFullYear() === lastMonthYear;
  });

  const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const thisMonthFreelancerCosts = fpayments
    .filter((p) => {
      const d = new Date(p.paymentDate);
      return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear && p.status === "Paid";
    })
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const thisMonthSalaries = salaries
    .filter((s) => s.month === thisMonth && s.year === thisYear && s.status === "Paid")
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const thisMonthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.expenseDate);
      return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const netProfitThisMonth = thisMonthRevenue - thisMonthFreelancerCosts - thisMonthSalaries - thisMonthExpenses;

  const todayShootsCount = shoots.filter((s) => s.shootDate === todayStr).length;

  const leadStatuses = ["Lead", "Contacted"];
  const totalLeadsThisMonth = clients.filter((c) => {
    const d = new Date(c.createdAt);
    return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const confirmedBookingsCount = clients.filter((c) => c.status === "Confirmed").length;

  const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalPackage = clients.reduce((sum, c) => sum + (c.packageAmount ? parseFloat(c.packageAmount) : 0), 0);
  const pendingPaymentsTotal = Math.max(0, totalPackage - totalReceived);

  const pendingFreelancerPaymentsTotal = fpayments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const pendingDeliverablesCount = deliverables.filter((d) => d.status !== "Done").length;

  res.json({
    todayShootsCount,
    thisMonthRevenue,
    lastMonthRevenue,
    totalLeadsThisMonth,
    confirmedBookingsCount,
    pendingPaymentsTotal,
    pendingFreelancerPaymentsTotal,
    netProfitThisMonth,
    pendingDeliverablesCount,
  });
});

router.get("/dashboard/upcoming-shoots", async (_req, res): Promise<void> => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const next7 = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];

  const shoots = await db
    .select({ shoot: shootsTable, clientName: clientsTable.name })
    .from(shootsTable)
    .leftJoin(clientsTable, eq(shootsTable.clientId, clientsTable.id))
    .orderBy(shootsTable.shootDate);

  const upcoming = shoots
    .filter(({ shoot }) => shoot.shootDate >= todayStr && shoot.shootDate <= next7)
    .map(({ shoot, clientName }) => ({
      ...shoot,
      functions: shoot.functions ?? [],
      equipmentChecklist: shoot.equipmentChecklist ?? [],
      clientName: clientName ?? null,
      createdAt: shoot.createdAt.toISOString(),
    }));

  res.json(upcoming);
});

router.get("/dashboard/overdue-payments", async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable);
  const payments = await db.select().from(paymentsTable);

  const result = clients
    .filter((c) => {
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const totalPaid = cPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const packageAmount = c.packageAmount ? parseFloat(c.packageAmount) : 0;
      return packageAmount > 0 && totalPaid < packageAmount && c.status !== "Completed";
    })
    .map((c) => {
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const totalPaid = cPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const packageAmount = c.packageAmount ? parseFloat(c.packageAmount) : 0;
      return {
        ...c,
        functions: c.functions ?? [],
        packageAmount,
        totalPaid,
        totalPending: packageAmount - totalPaid,
        createdAt: c.createdAt.toISOString(),
      };
    });

  res.json(result);
});

export default router;
