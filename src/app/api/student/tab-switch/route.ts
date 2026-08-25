import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    if (!requestId) return NextResponse.json({ error: "Missing session" }, { status: 400 });

    const [student] = await db
      .select()
      .from(examStudents)
      .where(eq(examStudents.id, requestId));

    if (!student || student.completedAt) {
      return NextResponse.json({ error: "Not active" }, { status: 409 });
    }

    
    const alreadyLocked = !!student.isLocked;
    const nextCount = alreadyLocked ? (student.tabSwitches ?? 0) : (student.tabSwitches ?? 0) + 1;

    const rows = await db
      .update(examStudents)
      .set({
        isLocked: true,
        tabSwitches: nextCount,
        lastLockedAt: new Date(),
      })
      .where(and(eq(examStudents.id, requestId), isNull(examStudents.completedAt)))
      .returning();

    return NextResponse.json({ success: true, tabSwitches: rows[0]?.tabSwitches ?? nextCount });
  } catch (error) {
    console.error("Tab switch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}