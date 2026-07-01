import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, shootsTable, clientsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

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

  return Response.json(upcoming);
}
