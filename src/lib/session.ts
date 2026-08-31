import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { organizations, sessions, teachers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const SESSION_COOKIE = "session_token";
export const RESET_COOKIE = "reset_token";
export const ROLE_COOKIE = "session_role";

const ROLE_SECRET = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "esame-role-secret";

export const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (signup, Google login)
export const REMEMBER_ME_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days ("Remember me" checked)
export const SHORT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day ("Remember me" unchecked)

export type UserType = "org" | "teacher" | "admin";

export function signRoleCookie(userType: UserType): string {
  const payload = `${userType}:${Date.now()}`;
  const sig = crypto.createHmac("sha256", ROLE_SECRET).update(payload).digest("hex").slice(0, 16);
  return `${payload}.${sig}`;
}

export function verifyRoleCookie(value: string | undefined): UserType | null {
  if (!value) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", ROLE_SECRET).update(payload).digest("hex").slice(0, 16);
  if (sig !== expected) return null;
  const [userType] = payload.split(":");
  if (userType === "org" || userType === "teacher" || userType === "admin") return userType;
  return null;
}

export async function createSession(
  userType: UserType,
  userId: string,
  ttlMs: number = DEFAULT_SESSION_TTL_MS
) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMs);
  await db.insert(sessions).values({ id: token, userType, userId, expiresAt });
  return { token, expiresAt };
}

export function setSessionCookie(
  res: { cookies: { set: Function } },
  token: string,
  expiresAt: Date,
  userType?: UserType
) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  if (userType) {
    res.cookies.set(ROLE_COOKIE, signRoleCookie(userType), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }
}

export function clearSessionCookie(res: { cookies: { set: Function } }) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(ROLE_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, token));
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }
  return session;
}

export async function requireOrgSession() {
  const session = await getSessionFromCookie();
  if (!session || session.userType !== "org") return null;

  const [org] = await db
    .select({ status: organizations.status })
    .from(organizations)
    .where(eq(organizations.id, session.userId));

  if (!org || org.status === "suspended") {
    return null;
  }

  return session;
}

export async function requireTeacherSession() {
  const session = await getSessionFromCookie();
  if (!session || session.userType !== "teacher") return null;

  const [teacher] = await db
    .select({ status: teachers.status, orgId: teachers.orgId })
    .from(teachers)
    .where(eq(teachers.id, session.userId));

  if (!teacher || teacher.status === "suspended" || teacher.status === "deleted") {
    return null;
  }

  const [parentOrg] = await db
    .select({ status: organizations.status })
    .from(organizations)
    .where(eq(organizations.id, teacher.orgId));

  if (!parentOrg || parentOrg.status === "suspended") {
    return null;
  }

  return session;
}

// Admin has no separate status table (single env-provisioned admin row) —
// just needs a valid, unexpired session with userType === "admin".
export async function requireAdminSession() {
  const session = await getSessionFromCookie();
  if (!session || session.userType !== "admin") return null;
  return session;
}

export async function destroySessionByToken(token: string) {
  await db.delete(sessions).where(eq(sessions.id, token));
}

export async function destroyAllSessionsForUser(
  userType: UserType,
  userId: string
) {
  await db
    .delete(sessions)
    .where(and(eq(sessions.userType, userType), eq(sessions.userId, userId)));
}