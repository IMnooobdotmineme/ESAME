import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import {
  exams,
  examStudents,
  studentExamAttempts,
  studentAnswers,
  examQuestions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string; requestId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;
    const { examId, requestId } = await params;

    // Verify exam ownership
    const examRows = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));

    if (examRows.length === 0) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get student
    const studentRows = await db
      .select()
      .from(examStudents)
      .where(
        and(
          eq(examStudents.id, requestId),
          eq(examStudents.examId, examId)
        )
      );

    if (studentRows.length === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    const student = studentRows[0];

    // Get attempt
    const attemptRows = await db
      .select()
      .from(studentExamAttempts)
      .where(eq(studentExamAttempts.examStudentId, requestId));

    const attempt = attemptRows.length > 0 ? attemptRows[0] : null;

    let answers: Array<{
      id: string;
      type: string;
      questionText: string;
      maxPoints: number;
      studentAnswer: string;
      correctAnswer?: string;
      autoScore?: number;
      manualScore?: number;
      feedback?: string;
      needsManualGrading?: boolean;
    }> = [];

    if (attempt) {
      const answerRows = await db
        .select({
          answer: studentAnswers,
          question: examQuestions,
        })
        .from(studentAnswers)
        .leftJoin(
          examQuestions,
          eq(studentAnswers.questionId, examQuestions.id)
        )
        .where(eq(studentAnswers.attemptId, attempt.id));

      answers = answerRows.map(
        (ar: { answer: typeof studentAnswers.$inferSelect; question: typeof examQuestions.$inferSelect | null }) => ({
          id: ar.answer.id,
          type: ar.question?.questionType === "mcq" ? "mcq" : "long",
          questionText: ar.question?.questionText || "",
          maxPoints: ar.question?.points || 0,
          studentAnswer: ar.answer.answerText || "",
          autoScore: ar.answer.autoPoints,
          manualScore: ar.answer.manualPoints,
          feedback: ar.answer.feedback || undefined,
          needsManualGrading:
            ar.question?.questionType !== "mcq" &&
            ar.answer.markedCorrect === null,
        })
      );
    }

    const totalMaxPoints = answers.reduce(
      (sum: number, a: { maxPoints: number }) => sum + a.maxPoints,
      0
    );

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.studentName || "",
        studentId: student.studentId,
        status: student.status,
        timestamp: student.invitedAt?.toISOString() || "",
        isSubmitted: !!student.completedAt,
        isForcedSubmit: attempt?.isForcedSubmit || false,
        submittedAt: student.completedAt?.toISOString() || undefined,
        totalMaxPoints,
        answers,
        gradingStatus:
          attempt?.gradingStatus === "complete" ? "complete" : "in_progress",
      },
    });
  } catch (error) {
    console.error("Fetch student submission error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student submission" },
      { status: 500 }
    );
  }
}