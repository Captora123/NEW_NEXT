import { Router, type IRouter } from "express";
import { eq, ilike, and } from "drizzle-orm";
import { z } from "zod";
import {
  db, clientsTable, clientNotesTable, paymentsTable, shootsTable,
  clientFreelancerAssignmentsTable, freelancersTable,
} from "@workspace/db";
import {
  ListClientsQueryParams,
  CreateClientBody,
  UpdateClientBody,
  UpdateClientStatusBody,
  AddClientNoteBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(s as string, 10);
  return isNaN(n) ? null : n;
}

async function getClientWithTotals(id: number) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) return null;

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.clientId, id));
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const packageAmount = client.packageAmount ? parseFloat(client.packageAmount) : 0;
  const totalPending = Math.max(0, packageAmount - totalPaid);

  return {
    ...client,
    functions: client.functions ?? [],
    packageAmount: client.packageAmount ? parseFloat(client.packageAmount) : null,
    albumCost: client.albumCost ? parseFloat(client.albumCost) : 0,
    miscExpenses: client.miscExpenses ? parseFloat(client.miscExpenses) : 0,
    totalPaid,
    totalPending,
    createdAt: client.createdAt.toISOString(),
  };
}

router.get("/clients", async (req, res): Promise<void> => {
  const query = ListClientsQueryParams.safeParse(req.query);
  const filters: ReturnType<typeof and>[] = [];

  if (query.success) {
    if (query.data.status) filters.push(eq(clientsTable.status, query.data.status));
    if (query.data.city) filters.push(ilike(clientsTable.city, `%${query.data.city}%`));
    if (query.data.search) {
      filters.push(ilike(clientsTable.name, `%${query.data.search}%`));
    }
  }

  const clients = await db
    .select()
    .from(clientsTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(clientsTable.createdAt);

  const allPayments = await db.select().from(paymentsTable);

  const result = clients.map((c) => {
    const cPayments = allPayments.filter((p) => p.clientId === c.id);
    const totalPaid = cPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const packageAmount = c.packageAmount ? parseFloat(c.packageAmount) : 0;
    return {
      ...c,
      functions: c.functions ?? [],
      packageAmount: c.packageAmount ? parseFloat(c.packageAmount) : null,
      albumCost: c.albumCost ? parseFloat(c.albumCost) : 0,
      miscExpenses: c.miscExpenses ? parseFloat(c.miscExpenses) : 0,
      totalPaid,
      totalPending: Math.max(0, packageAmount - totalPaid),
      createdAt: c.createdAt.toISOString(),
    };
  });

  res.json(result);
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { packageAmount, ...rest } = parsed.data;
  const [client] = await db
    .insert(clientsTable)
    .values({ ...rest, packageAmount: packageAmount?.toString() })
    .returning();

  res.status(201).json({
    ...client,
    functions: client.functions ?? [],
    packageAmount: client.packageAmount ? parseFloat(client.packageAmount) : null,
    albumCost: 0,
    miscExpenses: 0,
    totalPaid: 0,
    totalPending: packageAmount ?? 0,
    createdAt: client.createdAt.toISOString(),
  });
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const client = await getClientWithTotals(id);
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }

  const [notes, payments, shoots] = await Promise.all([
    db.select().from(clientNotesTable).where(eq(clientNotesTable.clientId, id)).orderBy(clientNotesTable.createdAt),
    db.select().from(paymentsTable).where(eq(paymentsTable.clientId, id)).orderBy(paymentsTable.paymentDate),
    db.select().from(shootsTable).where(eq(shootsTable.clientId, id)).orderBy(shootsTable.shootDate),
  ]);

  res.json({
    ...client,
    notes: notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    payments: payments.map((p) => ({
      ...p,
      amount: parseFloat(p.amount),
      clientName: client.name,
      createdAt: p.createdAt.toISOString(),
    })),
    shoots: shoots.map((s) => ({
      ...s,
      functions: s.functions ?? [],
      equipmentChecklist: s.equipmentChecklist ?? [],
      clientName: client.name,
      createdAt: s.createdAt.toISOString(),
    })),
  });
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { packageAmount, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (packageAmount !== undefined) updates.packageAmount = packageAmount.toString();

  const [client] = await db.update(clientsTable).set(updates).where(eq(clientsTable.id, id)).returning();
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }

  const clientWithTotals = await getClientWithTotals(id);
  res.json(clientWithTotals);
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.sendStatus(204);
});

router.patch("/clients/:id/status", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateClientStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await db.update(clientsTable).set({ status: parsed.data.status }).where(eq(clientsTable.id, id));
  const client = await getClientWithTotals(id);
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }

  res.json(client);
});

router.get("/clients/:id/notes", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const notes = await db
    .select()
    .from(clientNotesTable)
    .where(eq(clientNotesTable.clientId, id))
    .orderBy(clientNotesTable.createdAt);

  res.json(notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

router.post("/clients/:id/notes", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = AddClientNoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [note] = await db
    .insert(clientNotesTable)
    .values({ clientId: id, content: parsed.data.content })
    .returning();

  res.status(201).json({ ...note, createdAt: note.createdAt.toISOString() });
});

// ── CLIENT FREELANCER ASSIGNMENTS ──────────────────────────────────────────

const ClientFreelancerInputSchema = z.object({
  freelancerId: z.number().int().positive(),
  functionName: z.string().min(1),
  rateForShoot: z.number().min(0),
  notes: z.string().optional(),
});

const ProjectExpensesSchema = z.object({
  albumCost: z.number().min(0).optional(),
  miscExpenses: z.number().min(0).optional(),
});

router.get("/clients/:id/freelancers", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const assignments = await db
    .select({
      id: clientFreelancerAssignmentsTable.id,
      clientId: clientFreelancerAssignmentsTable.clientId,
      freelancerId: clientFreelancerAssignmentsTable.freelancerId,
      functionName: clientFreelancerAssignmentsTable.functionName,
      rateForShoot: clientFreelancerAssignmentsTable.rateForShoot,
      notes: clientFreelancerAssignmentsTable.notes,
      createdAt: clientFreelancerAssignmentsTable.createdAt,
      freelancerName: freelancersTable.name,
      freelancerRole: freelancersTable.role,
    })
    .from(clientFreelancerAssignmentsTable)
    .leftJoin(freelancersTable, eq(clientFreelancerAssignmentsTable.freelancerId, freelancersTable.id))
    .where(eq(clientFreelancerAssignmentsTable.clientId, id))
    .orderBy(clientFreelancerAssignmentsTable.functionName);

  res.json(assignments.map(a => ({
    ...a,
    rateForShoot: parseFloat(a.rateForShoot),
    createdAt: a.createdAt.toISOString(),
  })));
});

router.post("/clients/:id/freelancers", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ClientFreelancerInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: String(parsed.error) }); return; }

  const [assignment] = await db
    .insert(clientFreelancerAssignmentsTable)
    .values({
      clientId: id,
      freelancerId: parsed.data.freelancerId,
      functionName: parsed.data.functionName,
      rateForShoot: parsed.data.rateForShoot.toString(),
      notes: parsed.data.notes ?? null,
    })
    .returning();

  // Fetch freelancer name/role
  const [freelancer] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, assignment.freelancerId));

  res.status(201).json({
    ...assignment,
    rateForShoot: parseFloat(assignment.rateForShoot),
    freelancerName: freelancer?.name ?? null,
    freelancerRole: freelancer?.role ?? null,
    createdAt: assignment.createdAt.toISOString(),
  });
});

router.delete("/clients/:id/freelancers/:assignmentId", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  const assignmentId = parseId(req.params.assignmentId);
  if (!id || !assignmentId) { res.status(400).json({ error: "Invalid id" }); return; }

  await db
    .delete(clientFreelancerAssignmentsTable)
    .where(
      and(
        eq(clientFreelancerAssignmentsTable.id, assignmentId),
        eq(clientFreelancerAssignmentsTable.clientId, id)
      )
    );

  res.sendStatus(204);
});

router.patch("/clients/:id/project-expenses", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = ProjectExpensesSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: String(parsed.error) }); return; }

  const updates: Record<string, unknown> = {};
  if (parsed.data.albumCost !== undefined) updates.albumCost = parsed.data.albumCost.toString();
  if (parsed.data.miscExpenses !== undefined) updates.miscExpenses = parsed.data.miscExpenses.toString();

  await db.update(clientsTable).set(updates).where(eq(clientsTable.id, id));

  const client = await getClientWithTotals(id);
  if (!client) { res.status(404).json({ error: "Not found" }); return; }

  res.json(client);
});

export default router;
