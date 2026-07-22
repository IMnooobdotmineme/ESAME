import { and, eq, gt, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { passwordResetTokens, teacherInvitations, users } from "../../../../db/schema";
import { hashPassword, hashSecret, verifyPassword } from "../../../../lib/auth/crypto";
import { getDb } from "../../../../lib/auth/db";
import { jsonError, revokeUserSessions, validatePassword } from "../../../../lib/auth/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");

    if (!token) {
      return jsonError("Reset token is required.");
    }

    const passwordError = validatePassword(password);
    if (passwordError) return jsonError(passwordError);

    const db = getDb();
    const tokenHash = hashSecret(token);

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.consumedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (resetToken) {
      const [user] = await db.select().from(users).where(eq(users.id, resetToken.userId)).limit(1);
      if (!user) return jsonError("Account was not found.", 404);

      const isOldPassword = await verifyPassword(password, user.passwordHash);
      if (isOldPassword) {
        return jsonError("New password cannot be the same as your old password.");
      }

      await db
        .update(users)
        .set({
          passwordHash: await hashPassword(password),
          authProvider: user.googleSub ? "google_password" : "password",
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await db
        .update(passwordResetTokens)
        .set({ consumedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      await revokeUserSessions(user.id);

      return NextResponse.json({
        message: "Password reset successfully.",
        redirectTo: "/login",
      });
    }

    const [invitation] = await db
      .select()
      .from(teacherInvitations)
      .where(
        and(
          eq(teacherInvitations.tokenHash, tokenHash),
          eq(teacherInvitations.status, "pending"),
          gt(teacherInvitations.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!invitation) {
      return jsonError("Invalid or expired reset link.", 400);
    }

    const [teacher] = await db.select().from(users).where(eq(users.id, invitation.teacherId)).limit(1);
    if (!teacher) return jsonError("Teacher account was not found.", 404);

    const isOldPassword = await verifyPassword(password, teacher.passwordHash);
    if (isOldPassword) {
      return jsonError("New password cannot be the same as your old password.");
    }

    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(password),
        authProvider: "password",
        status: "active",
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, teacher.id));

    await db
      .update(teacherInvitations)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(teacherInvitations.id, invitation.id));

    await revokeUserSessions(teacher.id);

    return NextResponse.json({
      message: "Invitation accepted. Password created.",
      redirectTo: "/login",
    });
  } catch (error) {
    console.error("Reset password failed:", error);
    return jsonError("Unable to reset password.", 500);
  }
}
