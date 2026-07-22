import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationCodes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { createAndSendVerificationCode } from "../../../../lib/verification";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const emailLower = String(email).toLowerCase().trim();

    const [lastRecord] = await db
      .select()
      .from(verificationCodes)
      .where(eq(verificationCodes.email, emailLower))
      .orderBy(desc(verificationCodes.createdAt))
      .limit(1);

    if (!lastRecord) {
      return NextResponse.json(
        { error: "No previous request found for this email." },
        { status: 400 }
      );
    }

    await createAndSendVerificationCode({
      email: emailLower,
      purpose: lastRecord.purpose,
      userType: lastRecord.userType,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("resend-code error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
