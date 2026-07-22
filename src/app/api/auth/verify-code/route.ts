import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, verificationCodes, resetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashCode, getLatestActiveCode, MAX_ATTEMPTS } from "../../../../lib/verification";
import { createSession, setSessionCookie, RESET_COOKIE } from "../../../../lib/session";

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

    if (userType === "org") {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.email, emailLower));
      if (!org) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }
      userId = org.id;
      if (record.purpose === "signup" && org.status === "pending_verification") {
        await db
          .update(organizations)
          .set({ status: "active" })
          .where(eq(organizations.id, org.id));
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

    // signup or login -> establish a real session
    const { token, expiresAt } = await createSession(userType, userId);
    const redirect = userType === "org" ? "/org/dashboard" : "/teacher/dashboard";
    const res = NextResponse.json({ ok: true, purpose: record.purpose, redirect });
    setSessionCookie(res, token, expiresAt);
    return res;
  } catch (err) {
    console.error("verify-code error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
