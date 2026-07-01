import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function verifyTokenEdge(token: string): boolean {
  try {
    const decoded = atob(token);
    const payload = JSON.parse(decoded);
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const token = request.cookies.get("captora_token")?.value;

  if (!token || !verifyTokenEdge(token)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
