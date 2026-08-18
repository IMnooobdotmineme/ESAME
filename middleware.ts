import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight check: only confirms a session cookie is present. Full
// validation (expiry, org vs teacher, status) happens server-side via
// getSessionFromCookie() in each page/API route.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("session_token")?.value;

  const protectedPrefixes = [
    "/organization",
    "/teacher",
    "/dashboard",
    "/teachers",
    "/academic-structure",
    "/analytics",
    "/notifications",
    "/settings",
    "/profile",
    "/exams",
    "/logs",
  ];

  if (protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !sessionToken) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/organization/:path*",
    "/teacher/:path*",
    "/dashboard/:path*",
    "/teachers/:path*",
    "/academic-structure/:path*",
    "/analytics/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/exams/:path*",
    "/logs/:path*",
  ],
};
