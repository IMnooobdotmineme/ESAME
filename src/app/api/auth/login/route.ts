import { NextRequest, NextResponse } from "next/server";

import {
  createAndSendVerificationCode,
  findUserByEmail,
  jsonError,
  normalizeEmail,
} from "../../../../lib/auth/service";
import { verifyPassword } from "../../../../lib/auth/crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ""));
    const password = String(body.password || "");

    if (!email || !password) {
      return jsonError("Email and password are required.");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError("Invalid email or password.", 401);
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return jsonError("Invalid email or password.", 401);
    }

    if (user.status === "pending_verification" && user.role === "organization") {
      await createAndSendVerificationCode({
        email,
        userId: user.id,
        purpose: "signup",
      });

      return NextResponse.json({
        message: "Please verify your organization email.",
        email,
        purpose: "signup",
        from: "sign-up",
        role: user.role,
      });
    }

    if (user.status === "invited") {
      return jsonError("This teacher invitation has not been accepted yet.", 403);
    }

    if (user.status !== "active") {
      return jsonError("This account is not active.", 403);
    }

    await createAndSendVerificationCode({
      email,
      userId: user.id,
      purpose: "login",
    });

    return NextResponse.json({
      message: "Verification code sent.",
      email,
      purpose: "login",
      from: "login",
      role: user.role,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return jsonError("Unable to log in.", 500);
  }
}
