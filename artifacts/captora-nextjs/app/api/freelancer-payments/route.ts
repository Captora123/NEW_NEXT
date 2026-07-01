import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, freelancersTable, freelancerPaymentsTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function fmtFP(fp: typeof freelancerPaymentsTable.$inferSelect, name?: string | null) {
  return { ...fp, amount: parseFloat(fp.amount), freelancerName: name ?? null, createdAt: fp.createdAt.toISOString() };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const freelancerId = searchParams.get("freelancerId");

  const rows = await db
    .select({ fp: freelancerPaymentsTable, name: freelancersTable.name })
    .from(freelancerPaymentsTable)
    .leftJoin(freelancersTable, eq(freelancerPaymentsTable.freelancerId, freelancersTable.id))
    .orderBy(freelancerPaymentsTable.paymentDate);

  const filtered = freelancerId
    ? rows.filter((r) => r.fp.freelancerId === parseInt(freelancerId, 10))
    : rows;

  return Response.json(filtered.map(({ fp, name }) => fmtFP(fp, name)));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { amount, ...rest } = body;
  const [fp] = await db.insert(freelancerPaymentsTable).values({ ...rest, amount: String(amount) }).returning();
  const [fl] = await db.select().from(freelancersTable).where(eq(freelancersTable.id, fp.freelancerId));
  return Response.json(fmtFP(fp, fl?.name), { status: 201 });
}
