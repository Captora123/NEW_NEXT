import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, shootsTable, clientsTable, shootTeamTable, staffTable, freelancersTable } from "@workspace/db";
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

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");

  if (sub === "team") {
    const teamRows = await db.select().from(shootTeamTable).where(eq(shootTeamTable.shootId, id));
    const teamWithNames = await Promise.all(
      teamRows.map(async (t) => {
        let memberName: string | null = null;
        let role: string | null = null;
        if (t.memberType === "staff") {
          const [m] = await db.select().from(staffTable).where(eq(staffTable.id, t.memberId));
          memberName = m?.name ?? null; role = m?.role ?? null;
        } else {
          const [m] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, t.memberId));
          memberName = m?.name ?? null; role = m?.role ?? null;
        }
        return { ...t, memberName, role };
      }),
    );
    return Response.json(teamWithNames);
  }

  const [row] = await db
    .select({ shoot: shootsTable, clientName: clientsTable.name })
    .from(shootsTable)
    .leftJoin(clientsTable, eq(shootsTable.clientId, clientsTable.id))
    .where(eq(shootsTable.id, id));

  if (!row) return Response.json({ error: "Shoot not found" }, { status: 404 });
  return Response.json(formatShoot(row.shoot, row.clientName));
}

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");

  if (sub === "status") {
    const [shoot] = await db
      .update(shootsTable)
      .set({ status: body.status, deliveryNotes: body.deliveryNotes })
      .where(eq(shootsTable.id, id))
      .returning();
    if (!shoot) return Response.json({ error: "Shoot not found" }, { status: 404 });
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, shoot.clientId));
    return Response.json(formatShoot(shoot, client?.name));
  }

  const [shoot] = await db.update(shootsTable).set(body).where(eq(shootsTable.id, id)).returning();
  if (!shoot) return Response.json({ error: "Shoot not found" }, { status: 404 });
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, shoot.clientId));
  return Response.json(formatShoot(shoot, client?.name));
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(shootsTable).where(eq(shootsTable.id, id));
  return new Response(null, { status: 204 });
}

export async function POST(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const sub = searchParams.get("sub");
  const body = await request.json();

  if (sub === "team") {
    await db.delete(shootTeamTable).where(eq(shootTeamTable.shootId, id));
    if (body.members?.length > 0) {
      await db.insert(shootTeamTable).values(
        body.members.map((m: { memberId: number; memberType: string; callTime?: string }) => ({
          shootId: id, memberId: m.memberId, memberType: m.memberType, callTime: m.callTime,
        })),
      );
    }
    const teamRows = await db.select().from(shootTeamTable).where(eq(shootTeamTable.shootId, id));
    const teamWithNames = await Promise.all(
      teamRows.map(async (t) => {
        let memberName: string | null = null;
        let role: string | null = null;
        if (t.memberType === "staff") {
          const [m] = await db.select().from(staffTable).where(eq(staffTable.id, t.memberId));
          memberName = m?.name ?? null; role = m?.role ?? null;
        } else {
          const [m] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, t.memberId));
          memberName = m?.name ?? null; role = m?.role ?? null;
        }
        return { ...t, memberName, role };
      }),
    );
    return Response.json(teamWithNames);
  }

  return Response.json({ error: "Unknown sub-route" }, { status: 400 });
}
