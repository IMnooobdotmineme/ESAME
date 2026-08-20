import { NextResponse } from "next/server";
import { db } from "@/db";
import { admins, organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../../../../lib/password";
import { createAndSendVerificationCode } from "../../../../lib/verification";
import {
  createSession,
  setSessionCookie,
  REMEMBER_ME_TTL_MS,
  SHORT_SESSION_TTL_MS,
} from "../../../../lib/session";
import {
  checkRateLimit,
  getClientIp,
  assertAccountNotLocked,
  recordFailedLogin,
  clearFailedLogins,
  RateLimitError,
} from "../../../../lib/rate-limit";
import { recordLog, logLoginFailed } from "../../../../lib/logs";

const GENERIC_ERROR = "Invalid email or password.";
const IP_LOGIN_MAX = 20;
const IP_LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(`login:ip:${ip}`, IP_LOGIN_MAX, IP_LOGIN_WINDOW_MS);

    const { email, password, rememberMe } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const emailLower = String(email).toLowerCase().trim();
    const rememberMeBool = rememberMe === true;

    await assertAccountNotLocked(emailLower);

    // ---- Admin (checked first: single account, no signup, no verify-code step) ----
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.email, emailLower));

    if (admin) {
      const valid = await verifyPassword(password, admin.passwordHash);
      if (!valid) {
        await recordFailedLogin(emailLower);
        await logLoginFailed("admin", emailLower, null, null, 1).catch((err) =>
          console.error("Failed to log admin_login_failed:", err)
        );
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await clearFailedLogins(emailLower);

      // Admin skips email verification entirely — session is issued right away,
      // so this is the correct point to log a completed login.
      const ttlMs = rememberMeBool ? REMEMBER_ME_TTL_MS : SHORT_SESSION_TTL_MS;
      const { token, expiresAt } = await createSession("admin", admin.id, ttlMs);

      recordLog({
        action: "admin_login_success",
        entityType: "admin",
        entityId: admin.id,
        userId: admin.id,
        userType: "admin",
        actorLabel: emailLower,
      }).catch((err) => console.error("Failed to log admin_login_success:", err));

      const res = NextResponse.json({ ok: true, redirect: "/admin-dashboard" });
      setSessionCookie(res, token, expiresAt);
      return res;
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));

    if (org) {
      if (org.status === "suspended") {
        return NextResponse.json(
          { error: "This organization account has been suspended by the platform administrator." },
          { status: 403 }
        );
      }
      if (org.status === "pending_verification") {
        return NextResponse.json(
          { error: "Please verify your account before logging in." },
          { status: 403 }
        );
      }
      const valid = await verifyPassword(password, org.passwordHash);
      if (!valid) {
        await recordFailedLogin(emailLower);
        await logLoginFailed("org", org.name, org.id, org.name, 1).catch((err) =>
          console.error("Failed to log org_login_failed:", err)
        );
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await clearFailedLogins(emailLower);
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "org",
        rememberMe: rememberMeBool,
      });
      // NOTE: org_login_success is intentionally NOT logged here — password is
      // correct but login isn't complete until the emailed verification code is
      // confirmed. Log "org_login_success" in the verify-code route instead, once
      // the code check passes.
      return NextResponse.json({ ok: true, email: emailLower });
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, emailLower));

    if (teacher) {
      if (teacher.status === "deleted") {
        return NextResponse.json(
          { error: "This teacher account has been deleted." },
          { status: 403 }
        );
      }
      if (teacher.status === "invited" || !teacher.passwordHash) {
        return NextResponse.json(
          {
            error:
              "Please use the invite link sent to your email to set a password first.",
          },
          { status: 403 }
        );
      }
      if (teacher.status === "suspended") {
        return NextResponse.json(
          { error: "This teacher account has been suspended." },
          { status: 403 }
        );
      }
      const [parentOrg] = await db
        .select({ status: organizations.status, name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, teacher.orgId));
      if (parentOrg && parentOrg.status === "suspended") {
        return NextResponse.json(
          { error: "Your organization has been suspended by the platform administrator." },
          { status: 403 }
        );
      }
      const valid = await verifyPassword(password, teacher.passwordHash);
      if (!valid) {
        await recordFailedLogin(emailLower);
        await logLoginFailed(
          "teacher",
          teacher.name || teacher.email,
          teacher.orgId,
          parentOrg?.name ?? null,
          1
        ).catch((err) => console.error("Failed to log teacher_login_failed:", err));
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await clearFailedLogins(emailLower);
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "teacher",
        rememberMe: rememberMeBool,
      });
      // NOTE: same as org above — teacher_login_success belongs in the verify-code
      // route, once the emailed code is actually confirmed.
      return NextResponse.json({ ok: true, email: emailLower });
    }

    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    console.error("login error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}