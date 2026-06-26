import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SESSION_SECRET = process.env.SESSION_SECRET ?? "captora-secret-2024";

function makeToken(userId: number, username: string): string {
  const payload = JSON.stringify({ userId, username, exp: Date.now() + 86400000 * 30 });
  return Buffer.from(payload).toString("base64");
}

function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.username, username));

  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = makeToken(user.id, user.username);
  res.json({ token, user: { id: user.id, username: user.username } });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ id: payload.userId, username: payload.username });
});

export default router;
