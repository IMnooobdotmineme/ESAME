import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const SESSION_COOKIE = "session_token";
export const RESET_COOKIE = "reset_token";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type UserType = "org" | "teacher";

export async function createSession(userType: UserType, userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id: token, userType, userId, expiresAt });
  return { token, expiresAt };
}

export function setSessionCookie(
  res: { cookies: { set: Function } },
  token: string,
  expiresAt: Date
) {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(res: { cookies: { set: Function } }) {
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
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
  return session;
}

export async function requireTeacherSession() {
  const session = await getSessionFromCookie();
  if (!session || session.userType !== "teacher") return null;
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
