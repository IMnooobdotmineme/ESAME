import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { materializeExamQuestions } from "@/lib/exam-materialize";

export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { examId } = await params;
    const examRows = await db.select().from(exams).where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    const exam = examRows[0];
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    if (exam.status === "completed") return NextResponse.json({ error: "Exam already ended" }, { status: 400 });

    let roomCode = exam.examCode;
    if (!roomCode || roomCode === "DRAFT") {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let isUnique = false;
      while (!isUnique) {
        roomCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        const existing = await db.select().from(exams).where(eq(exams.examCode, roomCode));
        isUnique = existing.length === 0;
      }
    }

    const { totalQuestions, totalPoints } = await materializeExamQuestions(examId, (exam.parts as unknown[]) || []);
    await db.update(exams).set({ examCode: roomCode, isLaunched: true, totalQuestions, totalPoints, updatedAt: new Date() }).where(eq(exams.id, examId));
    return NextResponse.json({ success: true, roomCode });
  } catch (error) {
    console.error("Launch exam error:", error);
    return NextResponse.json({ error: "Failed to launch exam" }, { status: 500 });
  }
}