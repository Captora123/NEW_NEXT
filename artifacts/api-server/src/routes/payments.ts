import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, paymentsTable, clientsTable } from "@workspace/db";
import {
  ListPaymentsQueryParams,
  CreatePaymentBody,
  UpdatePaymentParams,
  UpdatePaymentBody,
  DeletePaymentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

function formatPayment(p: typeof paymentsTable.$inferSelect, clientName?: string | null) {
  return {
    ...p,
    amount: parseFloat(p.amount),
    clientName: clientName ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/payments/summary", async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable);
  const clients = await db.select().from(clientsTable);

  const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalPackage = clients.reduce((sum, c) => sum + (c.packageAmount ? parseFloat(c.packageAmount) : 0), 0);
  const totalPending = Math.max(0, totalPackage - totalReceived);

  res.json({ totalReceived, totalPending });
});

router.get("/payments", async (req, res): Promise<void> => {
  const query = ListPaymentsQueryParams.safeParse(req.query);

  const rows = await db
    .select({ payment: paymentsTable, clientName: clientsTable.name })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .orderBy(paymentsTable.paymentDate);

  const filtered = query.success && query.data.clientId
    ? rows.filter((r) => r.payment.clientId === query.data.clientId)
    : rows;

  res.json(filtered.map(({ payment, clientName }) => formatPayment(payment, clientName)));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, ...rest } = parsed.data;
  const [payment] = await db.insert(paymentsTable).values({ ...rest, amount: amount.toString() }).returning();
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, payment.clientId));

  res.status(201).json(formatPayment(payment, client?.name));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { amount, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (amount !== undefined) updates.amount = amount.toString();

  const [payment] = await db.update(paymentsTable).set(updates).where(eq(paymentsTable.id, id)).returning();
  if (!payment) { res.status(404).json({ error: "Payment not found" }); return; }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, payment.clientId));
  res.json(formatPayment(payment, client?.name));
});

router.delete("/payments/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
  res.sendStatus(204);
});

export default router;
