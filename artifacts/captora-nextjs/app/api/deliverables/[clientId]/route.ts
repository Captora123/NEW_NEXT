import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, deliverablesTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

type Context = { params: Promise<{ clientId: string }> };

export async function GET(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { clientId: cidStr } = await ctx.params;
  const clientId = parseInt(cidStr, 10);
  if (isNaN(clientId)) return Response.json({ error: "Invalid clientId" }, { status: 400 });

  const [d] = await db.select().from(deliverablesTable).where(eq(deliverablesTable.clientId, clientId));
  if (!d) {
    return Response.json({
      id: 0, clientId, editedPhotos: false, cinematicHighlight: false, traditionalVideo: false,
      instagramReels: false, albumOrdered: false, albumDelivered: false, rawDataCopied: false,
      magazineDelivered: false, photoFrameDelivered: false, status: "In Progress",
      completedAt: null, updatedAt: new Date().toISOString(),
    });
  }
  return Response.json({ ...d, updatedAt: d.updatedAt.toISOString() });
}

export async function PUT(request: NextRequest, ctx: Context) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { clientId: cidStr } = await ctx.params;
  const clientId = parseInt(cidStr, 10);
  if (isNaN(clientId)) return Response.json({ error: "Invalid clientId" }, { status: 400 });

  const body = await request.json();
  const existing = await db.select().from(deliverablesTable).where(eq(deliverablesTable.clientId, clientId));

  if (existing.length > 0) {
    const [d] = await db.update(deliverablesTable).set(body).where(eq(deliverablesTable.clientId, clientId)).returning();
    return Response.json({ ...d, updatedAt: d.updatedAt.toISOString() });
  } else {
    const [d] = await db.insert(deliverablesTable).values({ clientId, ...body }).returning();
    return Response.json({ ...d, updatedAt: d.updatedAt.toISOString() });
  }
}
