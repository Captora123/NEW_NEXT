import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth.error) return auth.error;
  return Response.json({ id: auth.user.userId, username: auth.user.username });
}
