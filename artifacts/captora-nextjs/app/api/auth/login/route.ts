import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { makeToken, TOKEN_COOKIE, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username?: string; password?: string };

    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, username));

    if (!user || user.password !== password) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = makeToken(user.id, user.username);

    const response = Response.json({
      token,
      user: { id: user.id, username: user.username },
    });

    response.headers.set(
      "Set-Cookie",
      `${TOKEN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`,
    );

    return response;
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
