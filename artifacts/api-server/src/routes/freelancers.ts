import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, freelancersTable, freelancerPaymentsTable } from "@workspace/db";
import {
  CreateFreelancerBody,
  GetFreelancerParams,
  UpdateFreelancerParams,
  UpdateFreelancerBody,
  DeleteFreelancerParams,
  ListFreelancerPaymentsParams,
  AddFreelancerPaymentParams,
  AddFreelancerPaymentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

async function getFreelancerWithTotals(id: number) {
  const [f] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, id));
  if (!f) return null;
  const payments = await db.select().from(freelancerPaymentsTable).where(eq(freelancerPaymentsTable.freelancerId, id));
  const totalEarned = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalPaid = payments.filter((p) => p.status === "Paid").reduce((sum, p) => sum + parseFloat(p.amount), 0);
  return {
    ...f,
    perShootRate: parseFloat(f.perShootRate),
    totalEarned,
    totalPaid,
    totalDue: totalEarned - totalPaid,
    createdAt: f.createdAt.toISOString(),
  };
}

router.get("/freelancers", async (_req, res): Promise<void> => {
  const freelancers = await db.select().from(freelancersTable).orderBy(freelancersTable.name);
  const allPayments = await db.select().from(freelancerPaymentsTable);

  const result = freelancers.map((f) => {
    const fps = allPayments.filter((p) => p.freelancerId === f.id);
    const totalEarned = fps.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalPaid = fps.filter((p) => p.status === "Paid").reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return {
      ...f,
      perShootRate: parseFloat(f.perShootRate),
      totalEarned,
      totalPaid,
      totalDue: totalEarned - totalPaid,
      createdAt: f.createdAt.toISOString(),
    };
  });

  res.json(result);
});

router.post("/freelancers", async (req, res): Promise<void> => {
  const parsed = CreateFreelancerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { perShootRate, ...rest } = parsed.data;
  const [f] = await db.insert(freelancersTable).values({ ...rest, perShootRate: perShootRate.toString() }).returning();

  res.status(201).json({
    ...f,
    perShootRate: parseFloat(f.perShootRate),
    totalEarned: 0,
    totalPaid: 0,
    totalDue: 0,
    createdAt: f.createdAt.toISOString(),
  });
});

router.get("/freelancers/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const f = await getFreelancerWithTotals(id);
  if (!f) { res.status(404).json({ error: "Freelancer not found" }); return; }

  const payments = await db
    .select()
    .from(freelancerPaymentsTable)
    .where(eq(freelancerPaymentsTable.freelancerId, id))
    .orderBy(freelancerPaymentsTable.paymentDate);

  res.json({
    ...f,
    payments: payments.map((p) => ({
      ...p,
      amount: parseFloat(p.amount),
      createdAt: p.createdAt.toISOString(),
    })),
  });
});

router.patch("/freelancers/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateFreelancerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { perShootRate, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (perShootRate !== undefined) updates.perShootRate = perShootRate.toString();

  await db.update(freelancersTable).set(updates).where(eq(freelancersTable.id, id));
  const f = await getFreelancerWithTotals(id);
  if (!f) { res.status(404).json({ error: "Freelancer not found" }); return; }
  res.json(f);
});

router.delete("/freelancers/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(freelancersTable).where(eq(freelancersTable.id, id));
  res.sendStatus(204);
});

router.get("/freelancers/:id/payments", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const payments = await db
    .select()
    .from(freelancerPaymentsTable)
    .where(eq(freelancerPaymentsTable.freelancerId, id))
    .orderBy(freelancerPaymentsTable.paymentDate);

  res.json(payments.map((p) => ({ ...p, amount: parseFloat(p.amount), createdAt: p.createdAt.toISOString() })));
});

router.post("/freelancers/:id/payments", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AddFreelancerPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, ...rest } = parsed.data;
  const [payment] = await db
    .insert(freelancerPaymentsTable)
    .values({ ...rest, freelancerId: id, amount: amount.toString() })
    .returning();

  res.status(201).json({ ...payment, amount: parseFloat(payment.amount), createdAt: payment.createdAt.toISOString() });
});

export default router;
