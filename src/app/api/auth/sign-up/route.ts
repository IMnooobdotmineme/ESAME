import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, passwordHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../../lib/password";
import { createAndSendVerificationCode } from "../../../../lib/verification";

export async function POST(req: Request) {
  try {
    const {
      orgName,
      workEmail,
      password,
      orgAddress,
      country,
      region,
      orgType,
    } = await req.json();

    if (!orgName || !workEmail || !password) {
      return NextResponse.json(
        { error: "Organization name, work email and password are required." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const emailLower = String(workEmail).toLowerCase().trim();

    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, emailLower));

    if (existingOrg || existingTeacher) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [org] = await db
      .insert(organizations)
      .values({
        name: orgName,
        email: emailLower,
        passwordHash,
        status: "pending_verification",
        orgType: orgType || null,
        country: country || null,
        region: region || null,
        address: orgAddress || null,
      })
      .returning();

    await db
      .insert(passwordHistory)
      .values({ userType: "org", userId: org.id, passwordHash });

    await createAndSendVerificationCode({
      email: emailLower,
      purpose: "signup",
      userType: "org",
    });

    return NextResponse.json({ ok: true, email: emailLower, purpose: "signup" });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error("sign-up error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}