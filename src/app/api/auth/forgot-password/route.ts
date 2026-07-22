import { NextRequest, NextResponse } from "next/server";

import {
  createAndSendVerificationCode,
  findUserByEmail,
  jsonError,
  normalizeEmail,
} from "../../../../lib/auth/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ""));

    if (!email) {
      return jsonError("Email is required.");
    }

    const user = await findUserByEmail(email);
    if (user && user.status === "active") {
      await createAndSendVerificationCode({
        email,
        userId: user.id,
        purpose: "forgot_password",
      });
    }

    return NextResponse.json({
      message: "If this email has an account, a verification code has been sent.",
      email,
      purpose: "forgot_password",
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return jsonError("Unable to send password reset code.", 500);
  }
}
