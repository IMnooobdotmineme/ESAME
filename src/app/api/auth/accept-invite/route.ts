import { NextResponse } from "next/server";
import { assertDb } from "@/db";
import { notifications, teachers, passwordHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../../lib/password";

const db = assertDb();

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

    await db.insert(notifications).values({
      orgId: teacher.orgId,
      title: "Invitation Accepted",
      message: `${teacher.name || teacher.email} accepted the invitation and completed account setup.`,
      type: "teacher_invite_accepted",
      relatedEntityId: teacher.id,
      relatedEntityType: "teacher",
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
