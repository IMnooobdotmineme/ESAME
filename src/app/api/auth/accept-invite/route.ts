import { NextResponse } from "next/server";
import { db } from "@/db";
import { teachers, passwordHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../../lib/password";

export async function POST(req: Request) {
  try {
    const { token, password, confirmPassword } = await req.json();
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.inviteToken, token));

    if (
      !teacher ||
      teacher.status !== "invited" ||
      !teacher.inviteTokenExpiresAt ||
      teacher.inviteTokenExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "This invite link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db
      .update(teachers)
      .set({
        passwordHash,
        status: "active",
        inviteToken: null,
        inviteTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacher.id));

    await db.insert(passwordHistory).values({
      userType: "teacher",
      userId: teacher.id,
      passwordHash,
    });

    return NextResponse.json({ ok: true, redirect: "/login" });
  } catch (err) {
    console.error("accept-invite error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
