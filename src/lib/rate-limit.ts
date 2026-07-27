import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq } from "drizzle-orm";

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Fixed-window counter: allows up to `max` calls per `windowMs` for a given
 * key. Throws RateLimitError once the limit is hit; the window resets
 * automatically once `resetAt` passes.
 */
export async function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = new Date();
  const [existing] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));

  if (!existing || existing.resetAt < now) {
    const resetAt = new Date(now.getTime() + windowMs);
    if (existing) {
      await db.update(rateLimits).set({ count: 1, resetAt }).where(eq(rateLimits.key, key));
    } else {
      await db.insert(rateLimits).values({ key, count: 1, resetAt });
    }
    return;
  }

  if (existing.count >= max) {
    const retryAfterSeconds = Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000);
    throw new RateLimitError(
      "Too many attempts. Please try again later.",
      retryAfterSeconds
    );
  }

  await db
    .update(rateLimits)
    .set({ count: existing.count + 1 })
    .where(eq(rateLimits.key, key));
}

/** Extracts the caller's IP from standard proxy headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// ---------- Account-based login lockout (failed password attempts) ----------
const LOGIN_LOCKOUT_MAX = 5;
const LOGIN_LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function loginLockKey(email: string) {
  return `failed-login:${email}`;
}

export async function assertAccountNotLocked(email: string) {
  const [row] = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.key, loginLockKey(email)));

  if (!row || row.resetAt < new Date()) return;

  if (row.count >= LOGIN_LOCKOUT_MAX) {
    const retryAfterSeconds = Math.ceil((row.resetAt.getTime() - Date.now()) / 1000);
    throw new RateLimitError(
      "Too many failed login attempts. Please try again later.",
      retryAfterSeconds
    );
  }
}

export async function recordFailedLogin(email: string) {
  const key = loginLockKey(email);
  const now = new Date();
  const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));

  if (!row || row.resetAt < now) {
    const resetAt = new Date(now.getTime() + LOGIN_LOCKOUT_WINDOW_MS);
    if (row) {
      await db.update(rateLimits).set({ count: 1, resetAt }).where(eq(rateLimits.key, key));
    } else {
      await db.insert(rateLimits).values({ key, count: 1, resetAt });
    }
    return;
  }

  await db
    .update(rateLimits)
    .set({ count: row.count + 1 })
    .where(eq(rateLimits.key, key));
}

export async function clearFailedLogins(email: string) {
  await db.delete(rateLimits).where(eq(rateLimits.key, loginLockKey(email)));
}