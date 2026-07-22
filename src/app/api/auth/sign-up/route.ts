import { NextRequest, NextResponse } from "next/server";

import { organizations, users } from "../../../../db/schema";
import { hashPassword } from "../../../../lib/auth/crypto";
import { getDb } from "../../../../lib/auth/db";
import {
  createAndSendVerificationCode,
  findUserByEmail,
  jsonError,
  normalizeEmail,
  validatePassword,
} from "../../../../lib/auth/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgName = String(body.orgName || "").trim();
    const orgType = String(body.orgType || "").trim();
    const country = String(body.country || "").trim();
    const region = String(body.region || "").trim();
    const orgAddress = String(body.orgAddress || "").trim();
    const email = normalizeEmail(String(body.workEmail || ""));
    const password = String(body.password || "");

    if (!orgName || !orgType || !country || !email) {
      return jsonError("Please fill all required organization fields.");
    }

    const passwordError = validatePassword(password);
    if (passwordError) return jsonError(passwordError);

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return jsonError("An account already exists with this email.", 409);
    }

    const db = getDb();
    const [organization] = await db
      .insert(organizations)
      .values({
        name: orgName,
        email,
        orgType,
        address: orgAddress || null,
        country,
        region: region || null,
        status: "pending_verification",
      })
      .returning();

    const [user] = await db
      .insert(users)
      .values({
        orgId: organization.id,
        role: "organization",
        email,
        name: orgName,
        passwordHash: await hashPassword(password),
        authProvider: "password",
        status: "pending_verification",
      })
      .returning();

    await createAndSendVerificationCode({
      email,
      userId: user.id,
      purpose: "signup",
    });

    return NextResponse.json({
      message: "Organization created. Verification code sent.",
      email,
      purpose: "signup",
    });
  } catch (error) {
    console.error("Organization sign-up failed:", error);
    return jsonError("Unable to create organization account.", 500);
  }
}
