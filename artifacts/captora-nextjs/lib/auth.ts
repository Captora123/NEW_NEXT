export type AuthPayload = { userId: number; username: string; exp: number };

export function makeToken(userId: number, username: string): string {
  const payload = JSON.stringify({ userId, username, exp: Date.now() + 86400000 * 30 });
  return Buffer.from(payload).toString("base64");
}

export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8")) as AuthPayload;
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

export const TOKEN_COOKIE = "captora_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
