import { NextRequest } from "next/server";
import { db, contentIdeasTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let ideas = await db.select().from(contentIdeasTable).orderBy(contentIdeasTable.createdAt);
  if (status) ideas = ideas.filter((i) => i.status === status);

  return Response.json(ideas.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })));
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const [idea] = await db.insert(contentIdeasTable).values(body).returning();
  return Response.json({ ...idea, createdAt: idea.createdAt.toISOString() }, { status: 201 });
}
