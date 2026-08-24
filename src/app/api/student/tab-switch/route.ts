import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents } from "@/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    if (!requestId) return NextResponse.json({ error: "Missing session" }, { status: 400 });
    const rows = await db.update(examStudents)
      .set({ isLocked: true, tabSwitches: sql`${examStudents.tabSwitches} + 1`, lastLockedAt: new Date() })
      .where(and(eq(examStudents.id, requestId), isNull(examStudents.completedAt)))
      .returning();
    if (rows.length === 0) return NextResponse.json({ error: "Not active" }, { status: 409 });
    return NextResponse.json({ success: true, tabSwitches: rows[0].tabSwitches });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}