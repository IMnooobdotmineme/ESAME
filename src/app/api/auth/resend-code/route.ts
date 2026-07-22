import { NextRequest, NextResponse } from "next/server";

import {
  createAndSendVerificationCode,
  findUserByEmail,
  jsonError,
  normalizeEmail,
  normalizePurpose,
} from "../../../../lib/auth/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body.email || ""));
    const purpose = normalizePurpose(String(body.purpose || ""));

    if (!email || !purpose) {
      return jsonError("Email and verification purpose are required.");
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return jsonError("No account was found for this email.", 404);
    }

    if (purpose === "login" && user.status !== "active") {
      return jsonError("This account is not active.", 403);
    }

    await createAndSendVerificationCode({
      email,
      userId: user.id,
      purpose,
    });

    return NextResponse.json({ message: "Verification code resent.", email, purpose });
  } catch (error) {
    console.error("Resend verification code failed:", error);
    return jsonError("Unable to resend verification code.", 500);
  }
}
