import { NextRequest } from "next/server";
import { eq, ilike, and } from "drizzle-orm";
import {
  db, clientsTable, paymentsTable,
} from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function parseNum(v: string | null): number {
  const n = parseFloat(v ?? "");
  return isNaN(n) ? 0 : n;
}

function formatClient(c: typeof clientsTable.$inferSelect, allPayments: typeof paymentsTable.$inferSelect[]) {
  const cPayments = allPayments.filter((p) => p.clientId === c.id);
  const totalPaid = cPayments.reduce((sum, p) => sum + parseNum(p.amount), 0);
  const packageAmount = c.packageAmount ? parseNum(c.packageAmount) : 0;
  return {
    ...c,
    functions: c.functions ?? [],
    packageAmount: c.packageAmount ? parseNum(c.packageAmount) : null,
    albumCost: parseNum(c.albumCost ?? "0"),
    miscExpenses: parseNum(c.miscExpenses ?? "0"),
    totalPaid,
    totalPending: Math.max(0, packageAmount - totalPaid),
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const city = searchParams.get("city");
  const search = searchParams.get("search");

  const filters: ReturnType<typeof and>[] = [];
  if (status) filters.push(eq(clientsTable.status, status));
  if (city) filters.push(ilike(clientsTable.city, `%${city}%`));
  if (search) filters.push(ilike(clientsTable.name, `%${search}%`));

  const clients = await db
    .select()
    .from(clientsTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(clientsTable.createdAt);

  const allPayments = await db.select().from(paymentsTable);

  return Response.json(clients.map((c) => formatClient(c, allPayments)));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { packageAmount, albumCost, miscExpenses, ...rest } = body;

  const values: Record<string, unknown> = { ...rest };
  if (packageAmount !== undefined) values.packageAmount = String(packageAmount);
  if (albumCost !== undefined) values.albumCost = String(albumCost);
  if (miscExpenses !== undefined) values.miscExpenses = String(miscExpenses);

  const [client] = await db.insert(clientsTable).values(values as never).returning();

  return Response.json({
    ...client,
    functions: client.functions ?? [],
    packageAmount: client.packageAmount ? parseNum(client.packageAmount) : null,
    albumCost: 0,
    miscExpenses: 0,
    totalPaid: 0,
    totalPending: packageAmount ?? 0,
    createdAt: client.createdAt.toISOString(),
  }, { status: 201 });
}
