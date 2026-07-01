import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, shootsTable, clientsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function formatShoot(s: typeof shootsTable.$inferSelect, clientName?: string | null) {
  return {
    ...s,
    functions: s.functions ?? [],
    equipmentChecklist: s.equipmentChecklist ?? [],
    clientName: clientName ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  const filters: ReturnType<typeof and>[] = [];
  if (clientId) filters.push(eq(shootsTable.clientId, parseInt(clientId, 10)));
  if (status) filters.push(eq(shootsTable.status, status));
  if (date) filters.push(eq(shootsTable.shootDate, date));

  const shoots = await db
    .select({ shoot: shootsTable, clientName: clientsTable.name })
    .from(shootsTable)
    .leftJoin(clientsTable, eq(shootsTable.clientId, clientsTable.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(shootsTable.shootDate);

  return Response.json(shoots.map(({ shoot, clientName }) => formatShoot(shoot, clientName)));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const [shoot] = await db.insert(shootsTable).values(body).returning();
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, shoot.clientId));

  return Response.json(formatShoot(shoot, client?.name), { status: 201 });
}
