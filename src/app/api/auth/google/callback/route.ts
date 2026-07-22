import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { exchangeCodeForGoogleProfile } from "../../../../../lib/google";
import { createAndSendVerificationCode } from "../../../../../lib/verification";

function redirectToLoginWithError(req: Request, message: string) {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return redirectToLoginWithError(req, "Google sign-in was cancelled.");
    }

    const profile = await exchangeCodeForGoogleProfile(code);
    if (!profile.emailVerified) {
      return redirectToLoginWithError(req, "Your Google email is not verified.");
    }
    const emailLower = profile.email.toLowerCase().trim();

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));

    if (org) {
      if (org.status !== "active") {
        return redirectToLoginWithError(
          req,
          "This account is not active yet. Please verify your account first."
        );
      }
      if (!org.googleId) {
        await db
          .update(organizations)
          .set({ googleId: profile.googleId })
          .where(eq(organizations.id, org.id));
      }
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "org",
      });
      const verifyUrl = new URL("/verify-code", req.url);
      verifyUrl.searchParams.set("email", emailLower);
      verifyUrl.searchParams.set("from", "login");
      return NextResponse.redirect(verifyUrl);
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, emailLower));

    if (teacher) {
      if (teacher.status !== "active") {
        return redirectToLoginWithError(
          req,
          "This account is not active yet. Please accept your invite first."
        );
      }
      if (!teacher.googleId) {
        await db
          .update(teachers)
          .set({ googleId: profile.googleId })
          .where(eq(teachers.id, teacher.id));
      }
      await createAndSendVerificationCode({
        email: emailLower,
        purpose: "login",
        userType: "teacher",
      });
      const verifyUrl = new URL("/verify-code", req.url);
      verifyUrl.searchParams.set("email", emailLower);
      verifyUrl.searchParams.set("from", "login");
      return NextResponse.redirect(verifyUrl);
    }

    return redirectToLoginWithError(
      req,
      "No account found for this Google email."
    );
  } catch (err) {
    console.error("google callback error", err);
    return redirectToLoginWithError(req, "Google sign-in failed. Please try again.");
  }
}
