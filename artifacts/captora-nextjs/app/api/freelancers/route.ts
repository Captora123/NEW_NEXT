import { NextRequest } from "next/server";
import { db, freelancersTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function fmt(f: typeof freelancersTable.$inferSelect) {
  return { ...f, perShootRate: parseFloat(f.perShootRate), createdAt: f.createdAt.toISOString() };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const freelancers = await db.select().from(freelancersTable).orderBy(freelancersTable.name);
  return Response.json(freelancers.map(fmt));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  const body = await request.json();
  const { perShootRate, ...rest } = body;
  const [f] = await db.insert(freelancersTable).values({ ...rest, perShootRate: String(perShootRate ?? 0) }).returning();
  return Response.json(fmt(f), { status: 201 });
}
