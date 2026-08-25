import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import {
  exams,
  examStudents,
  studentExamAttempts,
  studentAnswers,
  examQuestions,
  departments,
  subjects,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params; // ← Add this line
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;
    const { examId } = await params;

    const examRows = await db
      .select({
        id: exams.id,
        title: exams.title,
        examCode: exams.examCode,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        status: exams.status,
        isLaunched: exams.isLaunched,
        isPaused: exams.isPaused,
        createdAt: exams.createdAt,
        departmentName: departments.name,
        subjectName: subjects.name,
      })
      .from(exams)
      .leftJoin(departments, eq(exams.departmentId, departments.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));

    if (examRows.length === 0) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const exam = examRows[0];

    // Get all approved students with their attempts
    const studentsRows = await db
      .select({
        student: examStudents,
        attempt: studentExamAttempts,
      })
      .from(examStudents)
      .leftJoin(
        studentExamAttempts,
        eq(studentExamAttempts.examStudentId, examStudents.id)
      )
      .where(
        and(
          eq(examStudents.examId, examId),
          eq(examStudents.status, "approved")
        )
      );

    const requests = await Promise.all(
      studentsRows.map(
        async (row: { student: typeof examStudents.$inferSelect; attempt: typeof studentExamAttempts.$inferSelect | null }) => {
          const student = row.student;
          const attempt = row.attempt;

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

          return {
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
              attempt?.gradingStatus === "complete"
                ? "complete"
                : "in_progress",
          };
        }
      )
    );

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        roomCode: exam.examCode,
        durationMinutes: exam.durationMinutes,
        questionCount: exam.totalQuestions,
        status: exam.status,
        isLaunched: exam.isLaunched,
        isPaused: exam.isPaused,
        isStarted:
          exam.status === "in_progress" || exam.status === "completed",
        isEnded: exam.status === "completed",
        createdAt: exam.createdAt?.toISOString() || "",
        department: exam.departmentName || "",
        subject: exam.subjectName || "",
        requests,
      },
    });
  } catch (error) {
    console.error("Fetch grading data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grading data" },
      { status: 500 }
    );
  }
}