import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, deliverablesTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const pending = searchParams.get("pending");

  let deliverables = await db.select().from(deliverablesTable);
  if (clientId) deliverables = deliverables.filter((d) => d.clientId === parseInt(clientId, 10));
  if (pending === "true") deliverables = deliverables.filter((d) => d.status !== "Done");

  return Response.json(deliverables.map((d) => ({ ...d, updatedAt: d.updatedAt.toISOString() })));
}
