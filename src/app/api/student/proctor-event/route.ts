import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { insertProctorEvent } from "@/lib/proctor-server";

const LOCK_TYPES = ["tab_switch", "fullscreen_exit", "dom_tamper", "second_session", "fingerprint_mismatch", "heartbeat_gap", "ip_changed"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    const type = String(body.type ?? "");
    if (!requestId || !type) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const severity = body.severity === "lock" || LOCK_TYPES.includes(type) ? "lock" : "flag";
    await insertProctorEvent(requestId, type, severity, body.details ?? {});

    const [student] = await db.select().from(examStudents).where(eq(examStudents.id, requestId));
    if (!student || student.completedAt) return NextResponse.json({ success: true });

    if (severity === "lock") {
      await db
        .update(examStudents)
        .set({
          isLocked: true,
          lastLockedAt: new Date(),
          tabSwitches: type === "tab_switch" ? sql`${examStudents.tabSwitches} + 1` : examStudents.tabSwitches,
        })
        .where(and(eq(examStudents.id, requestId), isNull(examStudents.completedAt)));
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Proctor event error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}