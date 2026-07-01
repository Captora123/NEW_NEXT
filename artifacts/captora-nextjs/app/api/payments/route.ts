import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, paymentsTable, clientsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function formatPayment(p: typeof paymentsTable.$inferSelect, clientName?: string | null) {
  return {
    ...p,
    amount: parseFloat(p.amount),
    clientName: clientName ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");
  const clientId = searchParams.get("clientId");

  if (sub === "summary") {
    const payments = await db.select().from(paymentsTable);
    const clients = await db.select().from(clientsTable);
    const totalReceived = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalPackage = clients.reduce((s, c) => s + (c.packageAmount ? parseFloat(c.packageAmount) : 0), 0);
    return Response.json({ totalReceived, totalPending: Math.max(0, totalPackage - totalReceived) });
  }

  const rows = await db
    .select({ payment: paymentsTable, clientName: clientsTable.name })
    .from(paymentsTable)
    .leftJoin(clientsTable, eq(paymentsTable.clientId, clientsTable.id))
    .orderBy(paymentsTable.paymentDate);

  const filtered = clientId
    ? rows.filter((r) => r.payment.clientId === parseInt(clientId, 10))
    : rows;

  return Response.json(filtered.map(({ payment, clientName }) => formatPayment(payment, clientName)));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { amount, ...rest } = body;
  const [payment] = await db.insert(paymentsTable).values({ ...rest, amount: String(amount) }).returning();
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, payment.clientId));

  return Response.json(formatPayment(payment, client?.name), { status: 201 });
}
