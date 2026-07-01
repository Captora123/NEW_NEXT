import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;

  const { currentPassword, newPassword } = await request.json() as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "currentPassword and newPassword are required" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(adminUsersTable)
    .where(eq(adminUsersTable.username, auth.user.username));

  if (!user || user.password !== currentPassword) {
    return Response.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await db
    .update(adminUsersTable)
    .set({ password: newPassword })
    .where(eq(adminUsersTable.username, auth.user.username));

  return Response.json({ success: true });
}
