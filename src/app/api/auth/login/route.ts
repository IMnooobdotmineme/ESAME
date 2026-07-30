import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../../../../lib/password";
import { createAndSendVerificationCode } from "../../../../lib/verification";
import {
  checkRateLimit,
  getClientIp,
  assertAccountNotLocked,
  recordFailedLogin,
  clearFailedLogins,
  RateLimitError,
} from "../../../../lib/rate-limit";

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

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));

    if (org) {
      if (org.status === "suspended") {
        return NextResponse.json(
          { error: "This account has been suspended." },
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
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await clearFailedLogins(emailLower);
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "org",
        rememberMe: rememberMeBool,
      });
      return NextResponse.json({ ok: true, email: emailLower });
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, emailLower));

    if (teacher) {
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
          { error: "This account has been suspended." },
          { status: 403 }
        );
      }
      const valid = await verifyPassword(password, teacher.passwordHash);
      if (!valid) {
        await recordFailedLogin(emailLower);
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await clearFailedLogins(emailLower);
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "teacher",
        rememberMe: rememberMeBool,
      });
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
