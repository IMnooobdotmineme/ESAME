import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, passwordHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createAndSendVerificationCode } from "../../../../lib/verification";
import { checkRateLimit, getClientIp, RateLimitError } from "../../../../lib/rate-limit";
import { logOrgSignup } from "../../../../lib/logs";
import { hashPassword, validatePasswordStrength } from "../../../../lib/password";
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    await checkRateLimit(`sign-up:ip:${ip}`, 5, 60 * 60 * 1000);

    const {
      orgName,
      workEmail,
      password,
      orgAddress,
      country,
      region,
      orgType,
    } = await req.json();

    if (!orgName || !workEmail || !password) {
      return NextResponse.json(
        { error: "Organization name, work email and password are required." },
        { status: 400 }
      );
    }
        const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const emailLower = String(workEmail).toLowerCase().trim();

    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, emailLower));

    if (existingOrg) {
      return NextResponse.json(
        { error: "An organization with this email address already exists. Please log in instead." },
        { status: 409 }
      );
    }

    if (existingTeacher) {
      return NextResponse.json(
        { error: "This email address is already registered as a teacher account." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [org] = await db
      .insert(organizations)
      .values({
        name: orgName,
        email: emailLower,
        passwordHash,
        status: "pending_verification",
        orgType: orgType || null,
        country: country || null,
        region: region || null,
        address: orgAddress || null,
      })
      .returning();

    await db
      .insert(passwordHistory)
      .values({ userType: "org", userId: org.id, passwordHash });

    // Log activity — group="user", actorLabel/orgLabel set from the catalog.
    // NOTE: this fires as soon as the org row exists, i.e. while status is still
    // "pending_verification". If you'd rather only log once the org confirms their
    // email, move this call into the verify-code route's signup branch instead.
    logOrgSignup(org.id, orgName).catch((err) =>
      console.error("Failed to log org_signup:", err)
    );

    await createAndSendVerificationCode({
      email: emailLower,
      purpose: "signup",
      userType: "org",
    });

    return NextResponse.json({ ok: true, email: emailLower, purpose: "signup" });
  } catch (err: unknown) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message },
        { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } }
      );
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error("sign-up error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}