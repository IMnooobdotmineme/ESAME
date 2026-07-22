import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { organizations, users } from "../../../../db/schema";
import { getDb } from "../../../../lib/auth/db";
import {
  attachSessionCookie,
  consumeVerificationCode,
  createPasswordResetToken,
  dashboardUrlForUser,
  jsonError,
  normalizeEmail,
  normalizePurpose,
} from "../../../../lib/auth/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ""));
    const code = String(body.code || "").replace(/\D/g, "");
    const purpose = normalizePurpose(String(body.purpose || ""));

    if (!email || code.length !== 6 || !purpose) {
      return jsonError("Email, 6-digit code, and purpose are required.");
    }

    const result = await consumeVerificationCode({ email, code, purpose });
    if (!result.ok) {
      return jsonError(result.error, 400);
    }

    const db = getDb();
    if (!result.record.userId) {
      return jsonError("Verification code is not linked to an account.", 400);
    }

    const [user] = await db.select().from(users).where(eq(users.id, result.record.userId)).limit(1);
    if (!user) {
      return jsonError("Account was not found.", 404);
    }

    if (purpose === "forgot_password") {
      const token = await createPasswordResetToken(user.id);
      return NextResponse.json({
        message: "Code verified. You can reset your password.",
        redirectTo: `/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`,
      });
    }

    if (purpose === "signup") {
      if (user.role !== "organization" || !user.orgId) {
        return jsonError("Only organization sign-up can use this verification flow.", 400);
      }

      await db
        .update(users)
        .set({
          status: "active",
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await db
        .update(organizations)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, user.orgId));

      const activeUser = { ...user, status: "active" };
      const response = NextResponse.json({
        message: "Organization verified.",
        role: activeUser.role,
        redirectTo: dashboardUrlForUser(activeUser),
      });

      return attachSessionCookie(response, user.id, request);
    }

    if (user.status !== "active") {
      return jsonError("This account is not active.", 403);
    }

    await db
      .update(users)
      .set({
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const response = NextResponse.json({
      message: "Login verified.",
      role: user.role,
      redirectTo: dashboardUrlForUser(user),
    });

    return attachSessionCookie(response, user.id, request);
  } catch (error) {
    console.error("Verify code failed:", error);
    return jsonError("Unable to verify code.", 500);
  }
}
