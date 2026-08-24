import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, examStudents, studentExamAttempts, studentAnswers, examQuestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string; requestId: string }> }) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { examId, requestId } = await params;
    const body = await req.json();
    const grades = (body.grades || []) as { questionId: string; score: number }[];

    const [exam] = await db.select().from(exams).where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    const [student] = await db.select().from(examStudents).where(and(eq(examStudents.id, requestId), eq(examStudents.examId, examId)));
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
    const [attempt] = await db.select().from(studentExamAttempts).where(eq(studentExamAttempts.examStudentId, requestId));
    if (!attempt) return NextResponse.json({ error: "No submission found" }, { status: 404 });

    for (const g of grades) {
      await db.update(studentAnswers)
        .set({ manualPoints: g.score, markedCorrect: g.score > 0 })
        .where(and(eq(studentAnswers.id, g.questionId), eq(studentAnswers.attemptId, attempt.id)));
    }

    const allRows = await db.select({ answer: studentAnswers, question: examQuestions })
      .from(studentAnswers)
      .leftJoin(examQuestions, eq(studentAnswers.questionId, examQuestions.id))
      .where(eq(studentAnswers.attemptId, attempt.id));

    let autoTotal = 0, manualTotal = 0, maxTotal = 0, needsManual = false;
    for (const { answer, question } of allRows as any[]) {
      const qType = question?.questionType;
      const isAuto = qType === "mcq" || qType === "multiple_select" || qType === "true_false" || qType === "fill_in_blank";
      maxTotal += question?.points || 0;
      if (isAuto && answer.markedCorrect !== null) autoTotal += answer.manualPoints; // overridden
      else if (isAuto) autoTotal += answer.autoPoints;
      else { manualTotal += answer.manualPoints; if (answer.markedCorrect === null) needsManual = true; }
    }

    await db.update(studentExamAttempts).set({
      autoPoints: autoTotal, manualPoints: manualTotal, maxPoints: maxTotal,
      gradingStatus: needsManual ? "in_progress" : "complete",
      status: needsManual ? "needs_review" : "reviewed",
    }).where(eq(studentExamAttempts.id, attempt.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save grades error:", error);
    return NextResponse.json({ error: "Failed to save grades" }, { status: 500 });
  }
}