import bcrypt from "bcryptjs";
import { db } from "@/db";
import { passwordHistory } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Returns true if `newPassword` matches any password this user has used before
 * (including their current one), based on the password_history table.
 */
export async function isPasswordReused(
  userType: "org" | "teacher",
  userId: string,
  newPassword: string
): Promise<boolean> {
  const history = await db
    .select()
    .from(passwordHistory)
    .where(
      and(
        eq(passwordHistory.userType, userType),
        eq(passwordHistory.userId, userId)
      )
    );

  for (const entry of history) {
    if (await bcrypt.compare(newPassword, entry.passwordHash)) {
      return true;
    }
  }
  return false;
}
