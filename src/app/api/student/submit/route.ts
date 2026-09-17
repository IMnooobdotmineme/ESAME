import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents, exams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { finalizeAttempt } from "@/lib/student-finalize";
import { insertProctorEvent } from "@/lib/proctor-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    const bodyAnswers = (body.answers ?? {}) as Record<string, string>;
    const reason = body.reason === "timeout" ? "timeout" : "manual";

    const [student] = await db.select().from(examStudents).where(eq(examStudents.id, requestId));
    if (!student) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (student.status !== "approved") return NextResponse.json({ error: "Not approved" }, { status: 403 });

    const [exam] = await db.select().from(exams).where(eq(exams.id, student.examId));
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // ✅ SERVER-SIDE DEADLINE ENFORCEMENT
    const deadlineNow = new Date();
    if ((exam as any).endTime) {
      const endTime = new Date((exam as any).endTime).getTime();
      if (endTime < deadlineNow.getTime()) {
        await insertProctorEvent(student.id, "late_submission", "flag", {
          lateSeconds: Math.floor((deadlineNow.getTime() - endTime) / 1000),
        });
        return NextResponse.json({ error: "Exam deadline has passed" }, { status: 403 });
      }
    }

    // ✅ NEVER LOSE WORK: merge autosaved progress with whatever the client sent
    const savedProgress = (student.progress && typeof student.progress === "object" ? student.progress : {}) as Record<string, string>;
    const mergedAnswers: Record<string, string> = { ...savedProgress, ...bodyAnswers };

    const summary = await finalizeAttempt(student.id, mergedAnswers, reason);

    // Flag too-fast answers (only if they actually answered)
    const answeredCount = Object.values(mergedAnswers).filter((v) => v && String(v).trim() !== "").length;
    if (exam.startTime && answeredCount > 0) {
      const paused = (exam as any).pausedTotalSeconds ?? 0;
      const elapsed = Math.floor((Date.now() - new Date(exam.startTime).getTime()) / 1000) - paused;
      const avg = elapsed / answeredCount;
      if (avg < 5) {
        await insertProctorEvent(student.id, "too_fast_answer", "flag", { avgSecondsPerQuestion: avg });
      }
    }

    if (!summary) {
      return NextResponse.json({ error: "Failed to build result summary" }, { status: 500 });
    }
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Student submit error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}