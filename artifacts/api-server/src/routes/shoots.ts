import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, shootsTable, shootTeamTable, clientsTable, freelancersTable, staffTable } from "@workspace/db";
import {
  ListShootsQueryParams,
  CreateShootBody,
  GetShootParams,
  UpdateShootParams,
  UpdateShootBody,
  DeleteShootParams,
  UpdateShootStatusParams,
  UpdateShootStatusBody,
  GetShootTeamParams,
  AssignTeamToShootParams,
  AssignTeamToShootBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

function formatShoot(s: typeof shootsTable.$inferSelect, clientName?: string | null) {
  return {
    ...s,
    functions: s.functions ?? [],
    equipmentChecklist: s.equipmentChecklist ?? [],
    clientName: clientName ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/shoots", async (req, res): Promise<void> => {
  const query = ListShootsQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof and>[] = [];

  if (query.success) {
    if (query.data.clientId) filters.push(eq(shootsTable.clientId, query.data.clientId));
    if (query.data.status) filters.push(eq(shootsTable.status, query.data.status));
    if (query.data.date) filters.push(eq(shootsTable.shootDate, query.data.date));
  }

  const shoots = await db
    .select({ shoot: shootsTable, clientName: clientsTable.name })
    .from(shootsTable)
    .leftJoin(clientsTable, eq(shootsTable.clientId, clientsTable.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(shootsTable.shootDate);

  res.json(shoots.map(({ shoot, clientName }) => formatShoot(shoot, clientName)));
});

router.post("/shoots", async (req, res): Promise<void> => {
  const parsed = CreateShootBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [shoot] = await db.insert(shootsTable).values(parsed.data).returning();
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, shoot.clientId));

  res.status(201).json(formatShoot(shoot, client?.name));
});

router.get("/shoots/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [row] = await db
    .select({ shoot: shootsTable, clientName: clientsTable.name })
    .from(shootsTable)
    .leftJoin(clientsTable, eq(shootsTable.clientId, clientsTable.id))
    .where(eq(shootsTable.id, id));

  if (!row) { res.status(404).json({ error: "Shoot not found" }); return; }

  const teamRows = await db.select().from(shootTeamTable).where(eq(shootTeamTable.shootId, id));

  const teamWithNames = await Promise.all(
    teamRows.map(async (t) => {
      let memberName: string | null = null;
      let role: string | null = null;
      if (t.memberType === "staff") {
        const [m] = await db.select().from(staffTable).where(eq(staffTable.id, t.memberId));
        memberName = m?.name ?? null;
        role = m?.role ?? null;
      } else {
        const [m] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, t.memberId));
        memberName = m?.name ?? null;
        role = m?.role ?? null;
      }
      return { ...t, memberName, role };
    })
  );

  res.json({
    ...formatShoot(row.shoot, row.clientName),
    team: teamWithNames,
  });
});

router.patch("/shoots/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateShootBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [shoot] = await db.update(shootsTable).set(parsed.data).where(eq(shootsTable.id, id)).returning();
  if (!shoot) { res.status(404).json({ error: "Shoot not found" }); return; }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, shoot.clientId));
  res.json(formatShoot(shoot, client?.name));
});

router.delete("/shoots/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(shootsTable).where(eq(shootsTable.id, id));
  res.sendStatus(204);
});

router.patch("/shoots/:id/status", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateShootStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [shoot] = await db
    .update(shootsTable)
    .set({ status: parsed.data.status, deliveryNotes: parsed.data.deliveryNotes })
    .where(eq(shootsTable.id, id))
    .returning();

  if (!shoot) { res.status(404).json({ error: "Shoot not found" }); return; }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, shoot.clientId));
  res.json(formatShoot(shoot, client?.name));
});

router.get("/shoots/:id/team", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const teamRows = await db.select().from(shootTeamTable).where(eq(shootTeamTable.shootId, id));

  const teamWithNames = await Promise.all(
    teamRows.map(async (t) => {
      let memberName: string | null = null;
      let role: string | null = null;
      if (t.memberType === "staff") {
        const [m] = await db.select().from(staffTable).where(eq(staffTable.id, t.memberId));
        memberName = m?.name ?? null;
        role = m?.role ?? null;
      } else {
        const [m] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, t.memberId));
        memberName = m?.name ?? null;
        role = m?.role ?? null;
      }
      return { ...t, memberName, role };
    })
  );

  res.json(teamWithNames);
});

router.post("/shoots/:id/team", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AssignTeamToShootBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.delete(shootTeamTable).where(eq(shootTeamTable.shootId, id));

  if (parsed.data.members.length > 0) {
    await db.insert(shootTeamTable).values(
      parsed.data.members.map((m) => ({
        shootId: id,
        memberId: m.memberId,
        memberType: m.memberType,
        callTime: m.callTime,
      }))
    );
  }

  const teamRows = await db.select().from(shootTeamTable).where(eq(shootTeamTable.shootId, id));

  const teamWithNames = await Promise.all(
    teamRows.map(async (t) => {
      let memberName: string | null = null;
      let role: string | null = null;
      if (t.memberType === "staff") {
        const [m] = await db.select().from(staffTable).where(eq(staffTable.id, t.memberId));
        memberName = m?.name ?? null;
        role = m?.role ?? null;
      } else {
        const [m] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, t.memberId));
        memberName = m?.name ?? null;
        role = m?.role ?? null;
      }
      return { ...t, memberName, role };
    })
  );

  res.json(teamWithNames);
});

export default router;
