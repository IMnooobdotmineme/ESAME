import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, verificationCodes, resetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashCode, getLatestActiveCode, MAX_ATTEMPTS } from "../../../../lib/verification";
import {
  createSession,
  setSessionCookie,
  RESET_COOKIE,
  DEFAULT_SESSION_TTL_MS,
  REMEMBER_ME_TTL_MS,
  SHORT_SESSION_TTL_MS,
} from "../../../../lib/session";
import { recordLog } from "../../../../lib/logs";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required." },
        { status: 400 }
      );
    }
    const emailLower = String(email).toLowerCase().trim();

    const record = await getLatestActiveCode(emailLower);
    if (!record) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new one." },
        { status: 400 }
      );
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 }
      );
    }
    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 400 }
      );
    }

    if (hashCode(String(code)) !== record.code) {
      await db
        .update(verificationCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(verificationCodes.id, record.id));
      return NextResponse.json({ error: "Invalid code." }, { status: 400 });
    }

    await db
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(eq(verificationCodes.id, record.id));

    const userType = record.userType;
    let userId: string;
    // Populated below so we have a label + orgId/orgLabel ready for whichever
    // activity log call applies once we know the purpose.
    let actorLabel = emailLower;
    let orgIdForLog: string | null = null;
    let orgLabelForLog: string | null = null;

    if (userType === "org") {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.email, emailLower));
      if (!org) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }
      userId = org.id;
      actorLabel = `${org.name} (Org Admin)`;
      orgIdForLog = org.id;
      orgLabelForLog = org.name;

      if (record.purpose === "signup" && org.status === "pending_verification") {
        await db
          .update(organizations)
          .set({ status: "active" })
          .where(eq(organizations.id, org.id));

        recordLog({
          action: "org_email_verified",
          entityType: "org",
          entityId: org.id,
          orgId: org.id,
          userId: org.id,
          userType: "org",
          actorLabel,
          orgLabel: org.name,
        }).catch((err) => console.error("Failed to log org_email_verified:", err));
      }
    } else {
      const [teacher] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.email, emailLower));
      if (!teacher) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }
      userId = teacher.id;
      actorLabel = teacher.name || teacher.email;
      orgIdForLog = teacher.orgId;

      const [parentOrg] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, teacher.orgId));
      orgLabelForLog = parentOrg?.name ?? null;
    }

    if (record.purpose === "forgot_password") {
      const resetToken = crypto.randomBytes(32).toString("hex");
      await db.insert(resetTokens).values({
        id: resetToken,
        userType,
        userId,
        email: emailLower,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      const res = NextResponse.json({
        ok: true,
        purpose: "forgot_password",
        redirect: "/reset-password",
      });
      res.cookies.set(RESET_COOKIE, resetToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60,
      });
      return res;
    }

    // signup or login -> establish a real session.
    // "Remember me" only applies to login; signup always uses the default length.
    const ttlMs =
      record.purpose === "login"
        ? record.rememberMe
          ? REMEMBER_ME_TTL_MS
          : SHORT_SESSION_TTL_MS
        : DEFAULT_SESSION_TTL_MS;

    const { token, expiresAt } = await createSession(userType, userId, ttlMs);

    // Login is only truly complete once the code is verified — this is the
    // correct place to log org_login_success / teacher_login_success (NOT the
    // /api/auth/login route, which only gets as far as sending the code).
    if (record.purpose === "login") {
      recordLog({
        action: userType === "org" ? "org_login_success" : "teacher_login_success",
        entityType: userType,
        entityId: userId,
        orgId: orgIdForLog,
        userId,
        userType,
        actorLabel,
        orgLabel: orgLabelForLog,
      }).catch((err) => console.error(`Failed to log ${userType}_login_success:`, err));
    }

    const redirect = userType === "org" ? "/dashboard" : "/teacher-dashboard";
    const res = NextResponse.json({ ok: true, purpose: record.purpose, redirect });
        setSessionCookie(res, token, expiresAt, userType);
    return res;
  } catch (err) {
    console.error("verify-code error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}