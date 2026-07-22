import crypto from "crypto";
import { db } from "@/db";
import { verificationCodes } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { sendVerificationEmail } from "./email";

export type Purpose = "signup" | "login" | "forgot_password";
export type UserType = "org" | "teacher";

const CODE_LENGTH_MIN = 100000;
const CODE_LENGTH_MAX = 999999;
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateCode(): string {
  return crypto.randomInt(CODE_LENGTH_MIN, CODE_LENGTH_MAX + 1).toString();
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Invalidates any previous unconsumed codes for this email, creates a fresh
 * one, and emails it. Used for signup, login (manual + Google), and
 * forgot-password — every one of those flows always requires this step.
 */
export async function createAndSendVerificationCode(params: {
  email: string;
  purpose: Purpose;
  userType: UserType;
}) {
  const { email, purpose, userType } = params;

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

export { MAX_ATTEMPTS };
