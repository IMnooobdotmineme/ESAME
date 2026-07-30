import crypto from "crypto";
import { db } from "@/db";
import { verificationCodes } from "@/db/schema";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { sendVerificationEmail } from "./email";
import { RateLimitError } from "./rate-limit";

export type Purpose = "signup" | "login" | "forgot_password";
export type UserType = "org" | "teacher";

const CODE_LENGTH_MIN = 100000;
const CODE_LENGTH_MAX = 999999;
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_RESENDS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export function generateCode(): string {
  return crypto.randomInt(CODE_LENGTH_MIN, CODE_LENGTH_MAX + 1).toString();
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Call this ONLY from the resend-code route, before calling
 * createAndSendVerificationCode. Throws RateLimitError if resending too
 * fast or too often for this email.
 */
export async function assertResendNotRateLimited(email: string) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recent = await db
    .select()
    .from(verificationCodes)
    .where(
      and(eq(verificationCodes.email, email), gt(verificationCodes.createdAt, windowStart))
    )
    .orderBy(desc(verificationCodes.createdAt));

  if (recent.length > 0) {
    const mostRecent = recent[0];
    const msSinceLast = Date.now() - mostRecent.createdAt.getTime();
    if (msSinceLast < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - msSinceLast) / 1000);
      throw new RateLimitError(
        `Please wait ${retryAfterSeconds}s before requesting another code.`,
        retryAfterSeconds
      );
    }
  }

  if (recent.length >= MAX_RESENDS_PER_WINDOW) {
    throw new RateLimitError(
      "Too many verification codes requested. Please try again later.",
      Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    );
  }
}

/**
 * Invalidates any previous unconsumed codes for this email, creates a fresh
 * one, and emails it. `rememberMe` is only meaningful for purpose "login" —
 * it's stored on the code so verify-code can pick the right session length
 * once the code is confirmed.
 */
export async function createAndSendVerificationCode(params: {
  email: string;
  purpose: Purpose;
  userType: UserType;
  rememberMe?: boolean;
}) {
  const { email, purpose, userType, rememberMe = false } = params;

  await db
    .update(verificationCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(eq(verificationCodes.email, email), isNull(verificationCodes.consumedAt))
    );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await db.insert(verificationCodes).values({
    email,
    code: hashCode(code),
    purpose,
    userType,
    rememberMe,
    expiresAt,
  });

  await sendVerificationEmail(email, code, purpose);
}

export async function getLatestActiveCode(email: string) {
  const [record] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(eq(verificationCodes.email, email), isNull(verificationCodes.consumedAt))
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);
  return record ?? null;
}

export { MAX_ATTEMPTS, RateLimitError };
