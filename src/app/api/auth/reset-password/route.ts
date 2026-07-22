import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { organizations, teachers, passwordHistory, resetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, isPasswordReused } from "../../../../lib/password";
import { destroyAllSessionsForUser, RESET_COOKIE } from "../../../../lib/session";

export async function POST(req: Request) {
  try {
    const { password, confirmPassword } = await req.json();
    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: "Both password fields are required." },
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

    const cookieStore = await cookies();
    const token = cookieStore.get(RESET_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Your reset session has expired. Please start over." },
        { status: 401 }
      );
    }

    const [resetRecord] = await db
      .select()
      .from(resetTokens)
      .where(eq(resetTokens.id, token));

    if (
      !resetRecord ||
      resetRecord.consumedAt ||
      resetRecord.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Your reset session has expired. Please start over." },
        { status: 401 }
      );
    }

    const reused = await isPasswordReused(
      resetRecord.userType,
      resetRecord.userId,
      password
    );
    if (reused) {
      return NextResponse.json(
        { error: "You cannot reuse a previous password. Please choose a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    if (resetRecord.userType === "org") {
      await db
        .update(organizations)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(organizations.id, resetRecord.userId));
    } else {
      await db
        .update(teachers)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(teachers.id, resetRecord.userId));
    }

    await db.insert(passwordHistory).values({
      userType: resetRecord.userType,
      userId: resetRecord.userId,
      passwordHash,
    });

    await db
      .update(resetTokens)
      .set({ consumedAt: new Date() })
      .where(eq(resetTokens.id, token));

    // Force re-login everywhere with the new password.
    await destroyAllSessionsForUser(resetRecord.userType, resetRecord.userId);

    const res = NextResponse.json({ ok: true, redirect: "/login" });
    res.cookies.set(RESET_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    console.error("reset-password error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
