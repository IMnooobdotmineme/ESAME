import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAndSendVerificationCode } from "../../../../lib/verification";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const emailLower = String(email).toLowerCase().trim();

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));
    const [teacher] = org
      ? [null]
      : await db.select().from(teachers).where(eq(teachers.email, emailLower));

    // Don't reveal whether an account exists — always respond ok.
    if ((org && org.status === "active") || (teacher && teacher.status === "active")) {
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "forgot_password",
        userType: org ? "org" : "teacher",
      });
    }

    return NextResponse.json({ ok: true, email: emailLower });
  } catch (err) {
    console.error("forgot-password error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
