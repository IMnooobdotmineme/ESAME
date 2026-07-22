import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { users } from "../../../../../db/schema";
import { getDb } from "../../../../../lib/auth/db";
import {
  createAndSendVerificationCode,
  findUserByEmail,
  getBaseUrl,
  GOOGLE_STATE_COOKIE,
  normalizeEmail,
} from "../../../../../lib/auth/service";

export const runtime = "nodejs";

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const fail = (reason: string) => NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(reason)}`);

  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;

    if (!code || !state || !storedState || state !== storedState) {
      return fail("google_state_failed");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return fail("google_not_configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return fail("google_token_failed");
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      return fail("google_token_missing");
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });

    if (!profileResponse.ok) {
      return fail("google_profile_failed");
    }

    const profile = (await profileResponse.json()) as GoogleUserInfo;
    if (!profile.email || !profile.email_verified) {
      return fail("google_email_not_verified");
    }

    const email = normalizeEmail(profile.email);
    const user = await findUserByEmail(email);

    if (!user) {
      return fail("google_account_not_found");
    }

    if (user.status === "invited") {
      return fail("teacher_invitation_not_accepted");
    }

    const purpose = user.status === "pending_verification" && user.role === "organization" ? "signup" : "login";

    if (purpose === "login" && user.status !== "active") {
      return fail("account_not_active");
    }

    const db = getDb();
    await db
      .update(users)
      .set({
        googleSub: profile.sub,
        authProvider: user.passwordHash ? "google_password" : "google",
        name: user.name || profile.name || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await createAndSendVerificationCode({
      email,
      userId: user.id,
      purpose,
      metadata: { googleSub: profile.sub },
    });

    const response = NextResponse.redirect(
      `${baseUrl}/verify-code?email=${encodeURIComponent(email)}&from=login&purpose=${purpose}`,
    );
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Google login callback failed:", error);
    return fail("google_login_failed");
  }
}
