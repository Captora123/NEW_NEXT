import { NextRequest } from "next/server";
import { db, staffTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

function formatStaff(s: typeof staffTable.$inferSelect) {
  return { ...s, monthlySalary: parseFloat(s.monthlySalary), createdAt: s.createdAt.toISOString() };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const staff = await db.select().from(staffTable).orderBy(staffTable.name);
  return Response.json(staff.map(formatStaff));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { monthlySalary, ...rest } = body;
  const [s] = await db.insert(staffTable).values({ ...rest, monthlySalary: String(monthlySalary) }).returning();
  return Response.json(formatStaff(s), { status: 201 });
}
