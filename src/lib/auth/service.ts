import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import {
  authSessions,
  organizations,
  passwordResetTokens,
  teacherInvitations,
  users,
  verificationCodes,
  type User,
} from "../../db/schema";
import { generateVerificationCode, hashSecret, randomToken } from "./crypto";
import { getDb } from "./db";
import { sendVerificationEmail, type VerificationPurpose } from "./email";

export const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "esame_auth_session";
export const GOOGLE_STATE_COOKIE = "esame_google_state";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validatePassword(password: string) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  return null;
}

export function getBaseUrl(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  return user ?? null;
}

export async function findOrganizationById(id: string) {
  const db = getDb();
  const [organization] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return organization ?? null;
}

export async function createAndSendVerificationCode(input: {
  email: string;
  userId?: string | null;
  purpose: VerificationPurpose;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const email = normalizeEmail(input.email);
  const code = generateVerificationCode();

  await db.insert(verificationCodes).values({
    userId: input.userId ?? null,
    email,
    purpose: input.purpose,
    codeHash: hashSecret(code),
    metadata: input.metadata,
    expiresAt: addMinutes(10),
  });

  await sendVerificationEmail(email, code, input.purpose);
}

export async function consumeVerificationCode(input: {
  email: string;
  code: string;
  purpose: VerificationPurpose;
}) {
  const db = getDb();
  const email = normalizeEmail(input.email);

  const [record] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.purpose, input.purpose),
        isNull(verificationCodes.consumedAt),
        gt(verificationCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (!record) {
    return { ok: false as const, error: "Invalid or expired verification code." };
  }

  if (record.attempts >= 5) {
    return { ok: false as const, error: "Too many attempts. Please resend a new code." };
  }

  if (record.codeHash !== hashSecret(input.code)) {
    await db
      .update(verificationCodes)
      .set({ attempts: sql`${verificationCodes.attempts} + 1` })
      .where(eq(verificationCodes.id, record.id));

    return { ok: false as const, error: "Invalid verification code." };
  }

  await db.update(verificationCodes).set({ consumedAt: new Date() }).where(eq(verificationCodes.id, record.id));
  return { ok: true as const, record };
}

export async function createPasswordResetToken(userId: string) {
  const db = getDb();
  const token = randomToken(32);

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashSecret(token),
    expiresAt: addMinutes(30),
  });

  return token;
}

export async function attachSessionCookie(response: NextResponse, userId: string, request?: NextRequest) {
  const db = getDb();
  const token = randomToken(48);
  const maxAgeSeconds = 60 * 60 * 24 * 7;

  await db.insert(authSessions).values({
    userId,
    tokenHash: hashSecret(token),
    userAgent: request?.headers.get("user-agent") ?? null,
    ipAddress: request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    expiresAt: new Date(Date.now() + maxAgeSeconds * 1000),
  });

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return response;
}

export async function getAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(authSessions)
    .where(
      and(
        eq(authSessions.tokenHash, hashSecret(token)),
        isNull(authSessions.revokedAt),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user || user.status !== "active") return null;

  return { session, user };
}

export async function revokeUserSessions(userId: string) {
  const db = getDb();
  await db.update(authSessions).set({ revokedAt: new Date() }).where(eq(authSessions.userId, userId));
}

export function dashboardUrlForUser(user: User) {
  if (user.role === "teacher") {
    return process.env.NEXT_PUBLIC_TEACHER_DASHBOARD_URL || "/dashboard";
  }

  return process.env.NEXT_PUBLIC_ORG_DASHBOARD_URL || "/dashboard";
}

export function normalizePurpose(value: string | null | undefined): VerificationPurpose | null {
  if (value === "signup" || value === "login" || value === "forgot_password") return value;
  if (value === "forgot-password") return "forgot_password";
  if (value === "sign-up") return "signup";
  return null;
}

export async function createTeacherInvitation(input: {
  orgId: string;
  teacherId: string;
  invitedByUserId: string;
  email: string;
}) {
  const db = getDb();
  const token = randomToken(32);

  await db.insert(teacherInvitations).values({
    orgId: input.orgId,
    teacherId: input.teacherId,
    invitedByUserId: input.invitedByUserId,
    email: normalizeEmail(input.email),
    tokenHash: hashSecret(token),
    expiresAt: addDays(7),
  });

  return token;
}
