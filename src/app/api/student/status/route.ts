import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, examStudents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { autoEndExamIfExpired } from "@/lib/auto-end";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = (searchParams.get("roomCode") ?? "").trim().toUpperCase();
  const requestId = searchParams.get("requestId") ?? "";

  const [exam] = await db
    .select({
      id: exams.id,
      status: exams.status,
      isPaused: exams.isPaused,
      durationMinutes: exams.durationMinutes,
      startTime: exams.startTime,
      pausedAt: exams.pausedAt,
      pausedTotalSeconds: exams.pausedTotalSeconds,
    })
    .from(exams)
    .where(eq(exams.examCode, roomCode));

  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const [student] = await db
    .select()
    .from(examStudents)
    .where(and(eq(examStudents.id, requestId), eq(examStudents.examId, exam.id)));

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ✅ Auto-end if the timer expired (run ONCE, before computing time)
  await autoEndExamIfExpired(exam.id);

  // ✅ Re-read exam after auto-end so we use the fresh state
  const [freshExam] = await db
    .select()
    .from(exams)
    .where(eq(exams.id, exam.id));

  const currentStatus = freshExam?.status ?? exam.status;
  const currentIsPaused = freshExam?.isPaused ?? exam.isPaused;
  const currentPausedAt = freshExam?.pausedAt ?? exam.pausedAt;
  const currentPausedTotal = freshExam?.pausedTotalSeconds ?? exam.pausedTotalSeconds;

  const examStarted = currentStatus === "in_progress";
  const examEnded = currentStatus === "completed";
  const examPaused = !!currentIsPaused;

  let secondsRemaining: number | null = null;
  if (examStarted && exam.startTime && !examEnded) {
    const total = (exam.durationMinutes || 60) * 60;
    const now = Date.now();
    const paused =
      (currentPausedTotal || 0) +
      (examPaused && currentPausedAt
        ? Math.floor((now - new Date(currentPausedAt).getTime()) / 1000)
        : 0);
    const elapsed =
      Math.floor((now - new Date(exam.startTime).getTime()) / 1000) - paused;
    secondsRemaining = Math.max(0, total - elapsed);
  }

  return NextResponse.json({
    status: student.status,
    isLocked: !!student.isLocked,
    isRejectedLive: !!student.isRejectedLive,
    tabSwitches: student.tabSwitches ?? 0,
    examStarted,
    examEnded,
    examPaused,
    submitted: !!student.completedAt,
    secondsRemaining,
  });
}