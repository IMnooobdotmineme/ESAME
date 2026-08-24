import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, examStudents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { buildResultSummary } from "@/lib/student-grading";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = (searchParams.get("roomCode") ?? "").trim().toUpperCase();
  const requestId = searchParams.get("requestId") ?? "";
  const [exam] = await db.select().from(exams).where(eq(exams.examCode, roomCode));
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  const [student] = await db.select().from(examStudents).where(and(eq(examStudents.id, requestId), eq(examStudents.examId, exam.id)));
  if (!student) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (!student.completedAt) return NextResponse.json({ error: "Not submitted yet" }, { status: 409 });
  const summary = await buildResultSummary(student.id);
  if (!summary) return NextResponse.json({ error: "No attempt found" }, { status: 404 });
  return NextResponse.json({ examTitle: exam.title, ...summary });
}