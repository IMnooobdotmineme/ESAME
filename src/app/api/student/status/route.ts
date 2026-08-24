import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, examStudents, departments, subjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = (searchParams.get("roomCode") ?? "").trim().toUpperCase();
  const requestId = searchParams.get("requestId") ?? "";
  if (!roomCode || !requestId) return NextResponse.json({ error: "Missing session" }, { status: 400 });

  const [exam] = await db.select({
    id: exams.id, title: exams.title, status: exams.status, isPaused: exams.isPaused,
    durationMinutes: exams.durationMinutes, totalQuestions: exams.totalQuestions,
    departmentName: departments.name, subjectName: subjects.name,
  }).from(exams)
    .leftJoin(departments, eq(exams.departmentId, departments.id))
    .leftJoin(subjects, eq(exams.subjectId, subjects.id))
    .where(eq(exams.examCode, roomCode));
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const [student] = await db.select().from(examStudents).where(and(eq(examStudents.id, requestId), eq(examStudents.examId, exam.id)));
  if (!student) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  return NextResponse.json({
    status: student.status, isLocked: student.isLocked, isRejectedLive: student.isRejectedLive,
    submitted: !!student.completedAt,
    examStarted: exam.status === "in_progress", examEnded: exam.status === "completed", examPaused: exam.isPaused,
    title: exam.title, department: exam.departmentName || "", subject: exam.subjectName || "",
    durationMinutes: exam.durationMinutes, totalQuestions: exam.totalQuestions,
  });
}