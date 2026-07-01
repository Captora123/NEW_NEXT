import { NextRequest } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "./auth";

export type AuthUser = { userId: number; username: string };

export function getAuthUser(request: NextRequest): AuthUser | null {
  const authHeader = request.headers.get("authorization");
  let token: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (authHeader?.startsWith("Basic ")) {
    token = authHeader.slice(6);
  }

  if (!token) {
    token = request.cookies.get(TOKEN_COOKIE)?.value ?? null;
  }

  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(request: NextRequest):
  | { user: AuthUser; error: null }
  | { user: null; error: Response } {
  const user = getAuthUser(request);
  if (!user) {
    return {
      user: null,
      error: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null };
}
