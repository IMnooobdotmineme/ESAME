import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT_PER_TEACHER || "0", 10); // 0 = unlimited

export async function checkQuota(teacherId: string, orgId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (DAILY_LIMIT === 0) {
    return { allowed: true, used: 0, limit: 0 };
  }

  const today = new Date().toISOString().split("T")[0];
  const [usage] = await db
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.teacherId, teacherId), eq(aiUsage.date, today)))
    .limit(1);

  const used = usage?.requestCount || 0;
  const allowed = used < DAILY_LIMIT;

  return { allowed, used, limit: DAILY_LIMIT };
}

export async function incrementQuota(teacherId: string, orgId: string, tokens: number) {
  if (DAILY_LIMIT === 0) return; // no tracking if unlimited

  const today = new Date().toISOString().split("T")[0];
  
  const [existing] = await db
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.teacherId, teacherId), eq(aiUsage.date, today)))
    .limit(1);

  if (existing) {
    await db
      .update(aiUsage)
      .set({
        requestCount: existing.requestCount + 1,
        tokenCount: existing.tokenCount + tokens,
        updatedAt: new Date(),
      })
      .where(eq(aiUsage.id, existing.id));
  } else {
    await db.insert(aiUsage).values({
      orgId,
      teacherId,
      date: today,
      requestCount: 1,
      tokenCount: tokens,
    });
  }
}

export async function getQuotaUsage(teacherId: string): Promise<{ used: number; limit: number; date: string }> {
  const today = new Date().toISOString().split("T")[0];
  const [usage] = await db
    .select()
    .from(aiUsage)
    .where(and(eq(aiUsage.teacherId, teacherId), eq(aiUsage.date, today)))
    .limit(1);

  return {
    used: usage?.requestCount || 0,
    limit: DAILY_LIMIT,
    date: today,
  };
}