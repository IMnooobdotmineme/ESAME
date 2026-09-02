import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_SECRET = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "esame-role-secret";

// ─── Protected routes per role ───
// NOTE: (organization) and (admin) are route GROUPS in Next.js — they do
// NOT add a URL prefix. These lists now match the real URLs from src/app.

const protectedOrgRoutes = [
  "/dashboard",
  "/academic-structure",
  "/analytics",
  "/exams",
  "/notifications",
  "/settings",
  "/teachers",
];

const protectedTeacherRoutes = [
  "/teacher-dashboard",
  "/teacher-exams",
  "/teacher-settings",
  "/teacher-notifications",
  "/ai",
  "/grading",
  "/monitor",
];

const protectedAdminRoutes = [
  "/admin-dashboard",
  "/broadcast",
  "/logs",
  "/organizations",
  "/profile",
];

const publicRoutes = [
  "/",
  "/login",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-code",
  "/accept-invite",
];

const ROLE_HOME: Record<string, string> = {
  org: "/dashboard",
  teacher: "/teacher-dashboard",
  admin: "/admin-dashboard",
};

// ✅ Web Crypto (Edge-compatible)
async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(ROLE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyRoleCookie(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = await hmacSign(payload);
  if (sig !== expected) return null;
  const [userType] = payload.split(":");
  return userType || null;
}

function isRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log("[PROXY HIT]", pathname);

  // ✅ Read both cookies once
  const sessionToken = req.cookies.get("session_token")?.value;
  const role = await verifyRoleCookie(req.cookies.get("session_role")?.value);

  // 1) APIs handle their own auth
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // 2) Public routes
  if (isRoute(pathname, publicRoutes)) {
    if (role && (pathname === "/login" || pathname === "/sign-up")) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
    }
    return NextResponse.next();
  }

  // 3) Which protected area?
  const inOrgArea = isRoute(pathname, protectedOrgRoutes);
  const inTeacherArea = isRoute(pathname, protectedTeacherRoutes);
  const inAdminArea = isRoute(pathname, protectedAdminRoutes);

  // 4) Unknown route (e.g. student area, which is intentionally public) → pass through
  if (!inOrgArea && !inTeacherArea && !inAdminArea) return NextResponse.next();

  // 5) No session → login
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 6) Session but no valid role cookie → re-login
  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7) Role mismatch → redirect to role home
  if (inOrgArea && role !== "org") return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
  if (inTeacherArea && role !== "teacher") return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));
  if (inAdminArea && role !== "admin") return NextResponse.redirect(new URL(ROLE_HOME[role], req.url));

  // 8) All good
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/verify-code",
    "/accept-invite",
    "/dashboard/:path*",
    "/academic-structure/:path*",
    "/analytics/:path*",
    "/exams/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/teachers/:path*",
    "/teacher-dashboard/:path*",
    "/teacher-exams/:path*",
    "/teacher-settings/:path*",
    "/teacher-notifications/:path*",
    "/ai/:path*",
    "/grading/:path*",
    "/monitor/:path*",
    "/admin-dashboard/:path*",
    "/broadcast/:path*",
    "/logs/:path*",
    "/organizations/:path*",
    "/profile/:path*",
  ],
};