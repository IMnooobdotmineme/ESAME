import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../../../../lib/password";
import { createAndSendVerificationCode } from "../../../../lib/verification";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }
    const emailLower = String(email).toLowerCase().trim();

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
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "org",
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
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
      }
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "teacher",
      });
      return NextResponse.json({ ok: true, email: emailLower });
    }

    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
