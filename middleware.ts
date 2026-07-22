import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight check: only confirms a session cookie is present. Full
// validation (expiry, org vs teacher, status) happens server-side via
// getSessionFromCookie() in each page/API route.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("session_token")?.value;

  const protectedPrefixes = ["/org", "/teacher"];
  if (protectedPrefixes.some((p) => pathname.startsWith(p)) && !sessionToken) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/org/:path*", "/teacher/:path*"],
};
