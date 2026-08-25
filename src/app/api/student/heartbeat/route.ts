import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { insertProctorEvent } from "@/lib/proctor-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    const fingerprint = String(body.fingerprint ?? "");
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    if (!requestId) return NextResponse.json({ lock: false });

    const [student] = await db.select().from(examStudents).where(eq(examStudents.id, requestId));
    if (!student || student.completedAt) return NextResponse.json({ lock: false });

    const now = new Date();
    let lock = false;

    // 20. Heartbeat gap (tab killed / frozen / script blocked)
    if (student.lastHeartbeatAt && now.getTime() - new Date(student.lastHeartbeatAt).getTime() > 20000) {
      await insertProctorEvent(student.id, "heartbeat_gap", "lock", {});
      lock = true;
    }
    // 16. Fingerprint bind / mismatch mid-exam
    if (student.fingerprint && fingerprint && student.fingerprint !== fingerprint) {
      await insertProctorEvent(student.id, "fingerprint_mismatch", "lock", {});
      lock = true;
    }
    // 16. IP changed mid-exam
    if (student.ipAddress && ip && student.ipAddress !== ip) {
      await insertProctorEvent(student.id, "ip_changed", "lock", {});
      lock = true;
    }
    // 15. Same device fingerprint as another active student
    if (fingerprint) {
      const sameDevice = await db
        .select({ id: examStudents.id })
        .from(examStudents)
        .where(and(eq(examStudents.examId, student.examId), eq(examStudents.fingerprint, fingerprint), isNull(examStudents.completedAt)));
        if (sameDevice.some((s: any) => s.id !== student.id)) {
        await insertProctorEvent(student.id, "duplicate_device", "lock", {});
        lock = true;
      }
    }
    // 14. Same IP as another active student (flag)
    if (ip) {
      const sameIp = await db
        .select({ id: examStudents.id })
        .from(examStudents)
        .where(and(eq(examStudents.examId, student.examId), eq(examStudents.ipAddress, ip), isNull(examStudents.completedAt)));
    if (sameIp.some((s: any) => s.id !== student.id)) {
        await insertProctorEvent(student.id, "same_ip", "flag", {});
      }
    }
    // 13. Abnormally long idle (flag)
    if (typeof body.idleSeconds === "number" && body.idleSeconds > 120) {
      await insertProctorEvent(student.id, "idle_too_long", "flag", { idle: body.idleSeconds });
    }

    await db
      .update(examStudents)
      .set({
        lastHeartbeatAt: now,
        fingerprint: student.fingerprint || fingerprint || null,
        ipAddress: student.ipAddress || ip || null,
        questionStartedAt: body.questionStartedAt ? new Date(body.questionStartedAt) : student.questionStartedAt,
        isLocked: lock ? true : student.isLocked,
      })
      .where(eq(examStudents.id, student.id));

    return NextResponse.json({ lock: lock || !!student.isLocked });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ lock: false });
  }
}