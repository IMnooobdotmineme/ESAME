import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, examStudents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
      startTime: exams.startTime, // ← ADD
    })
    .from(exams)
    .where(eq(exams.examCode, roomCode));

  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const [student] = await db
    .select()
    .from(examStudents)
    .where(and(eq(examStudents.id, requestId), eq(examStudents.examId, exam.id)));

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let secondsRemaining: number | null = null;
  if (exam.status === "in_progress" && exam.startTime) {
    const total = (exam.durationMinutes || 60) * 60;
    const now = Date.now();
    const paused =
      (exam.pausedTotalSeconds || 0) +
      (exam.isPaused && exam.pausedAt
        ? Math.floor((now - new Date(exam.pausedAt).getTime()) / 1000)
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
    examStarted: exam.status === "in_progress",
    examEnded: exam.status === "completed",
    examPaused: !!exam.isPaused,
    submitted: !!student.completedAt,
    secondsRemaining, // ← ADD
  });
}