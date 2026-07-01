import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import {
  db, clientsTable, paymentsTable, shootsTable,
  clientNotesTable, clientFreelancerAssignmentsTable, freelancersTable,
} from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function parseNum(v: string | null | undefined): number {
  const n = parseFloat(v ?? "");
  return isNaN(n) ? 0 : n;
}

async function getClientWithTotals(id: number) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!client) return null;
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.clientId, id));
  const totalPaid = payments.reduce((sum, p) => sum + parseNum(p.amount), 0);
  const packageAmount = client.packageAmount ? parseNum(client.packageAmount) : 0;
  return {
    ...client,
    functions: client.functions ?? [],
    packageAmount: client.packageAmount ? parseNum(client.packageAmount) : null,
    albumCost: parseNum(client.albumCost ?? "0"),
    miscExpenses: parseNum(client.miscExpenses ?? "0"),
    totalPaid,
    totalPending: Math.max(0, packageAmount - totalPaid),
    createdAt: client.createdAt.toISOString(),
  };
}

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const { searchParams } = new URL(request.url);

  // Handle sub-routes: /clients/:id/notes, /clients/:id/freelancers
  const sub = searchParams.get("sub");

  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  if (sub === "notes") {
    const notes = await db
      .select()
      .from(clientNotesTable)
      .where(eq(clientNotesTable.clientId, id))
      .orderBy(clientNotesTable.createdAt);
    return Response.json(notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })));
  }

  if (sub === "freelancers") {
    const assignments = await db
      .select()
      .from(clientFreelancerAssignmentsTable)
      .where(eq(clientFreelancerAssignmentsTable.clientId, id));
    const freelancers = await db.select().from(freelancersTable);
    const result = assignments.map((a) => {
      const fl = freelancers.find((f) => f.id === a.freelancerId);
      return {
        ...a,
        rateForShoot: parseNum(a.rateForShoot),
        freelancerName: fl?.name ?? null,
        createdAt: a.createdAt.toISOString(),
      };
    });
    return Response.json(result);
  }

  const client = await getClientWithTotals(id);
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  const [notes, payments, shoots] = await Promise.all([
    db.select().from(clientNotesTable).where(eq(clientNotesTable.clientId, id)).orderBy(clientNotesTable.createdAt),
    db.select().from(paymentsTable).where(eq(paymentsTable.clientId, id)).orderBy(paymentsTable.paymentDate),
    db.select().from(shootsTable).where(eq(shootsTable.clientId, id)).orderBy(shootsTable.shootDate),
  ]);

  return Response.json({
    ...client,
    notes: notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    payments: payments.map((p) => ({
      ...p,
      amount: parseNum(p.amount),
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
}

export async function PATCH(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const { packageAmount, albumCost, miscExpenses, ...rest } = body;
  const updates: Record<string, unknown> = { ...rest };
  if (packageAmount !== undefined) updates.packageAmount = String(packageAmount);
  if (albumCost !== undefined) updates.albumCost = String(albumCost);
  if (miscExpenses !== undefined) updates.miscExpenses = String(miscExpenses);

  await db.update(clientsTable).set(updates as never).where(eq(clientsTable.id, id));
  const client = await getClientWithTotals(id);
  if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

  return Response.json(client);
}

export async function DELETE(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { id: idStr } = await ctx.params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return Response.json({ error: "Invalid id" }, { status: 400 });

  await db.delete(clientsTable).where(eq(clientsTable.id, id));
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

  if (sub === "notes") {
    const [note] = await db
      .insert(clientNotesTable)
      .values({ clientId: id, content: body.content })
      .returning();
    return Response.json({ ...note, createdAt: note.createdAt.toISOString() }, { status: 201 });
  }

  if (sub === "status") {
    await db.update(clientsTable).set({ status: body.status }).where(eq(clientsTable.id, id));
    const client = await getClientWithTotals(id);
    if (!client) return Response.json({ error: "Client not found" }, { status: 404 });
    return Response.json(client);
  }

  if (sub === "freelancers") {
    const { rateForShoot, ...rest } = body;
    const [assignment] = await db
      .insert(clientFreelancerAssignmentsTable)
      .values({ ...rest, clientId: id, rateForShoot: String(rateForShoot) })
      .returning();
    const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, assignment.freelancerId));
    return Response.json({
      ...assignment,
      rateForShoot: parseNum(assignment.rateForShoot),
      freelancerName: fl?.name ?? null,
      createdAt: assignment.createdAt.toISOString(),
    }, { status: 201 });
  }

  if (sub === "project-expenses") {
    const { albumCost, miscExpenses } = body;
    const updates: Record<string, unknown> = {};
    if (albumCost !== undefined) updates.albumCost = String(albumCost);
    if (miscExpenses !== undefined) updates.miscExpenses = String(miscExpenses);
    await db.update(clientsTable).set(updates as never).where(eq(clientsTable.id, id));
    const client = await getClientWithTotals(id);
    return Response.json(client);
  }

  return Response.json({ error: "Unknown sub-route" }, { status: 400 });
}
