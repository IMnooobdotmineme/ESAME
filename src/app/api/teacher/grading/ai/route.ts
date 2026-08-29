import { NextRequest } from "next/server";
import { db } from "@/db";
import { exams, examSections, examPages, examQuestions, examQuestionOptions, examStudents, studentExamAttempts, studentAnswers, teachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { action, examId, attemptId, answerId, points, feedback } = await req.json();

  const [teacher] = await db.select({ orgId: teachers.orgId }).from(teachers).where(eq(teachers.id, session.userId));
  if (!teacher) return Response.json({ error: "Teacher not found" }, { status: 404 });

  // Get exam with all questions
  if (action === "getExam") {
    const [exam] = await db.select().from(exams).where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    if (!exam) return Response.json({ error: "Exam not found" }, { status: 404 });

    const sections = await db.select().from(examSections).where(eq(examSections.examId, examId));
    
    const questions = await db
      .select({
        id: examQuestions.id,
        pageId: examQuestions.pageId,
        questionText: examQuestions.questionText,
        questionType: examQuestions.questionType,
        points: examQuestions.points,
        questionOrder: examQuestions.questionOrder,
        explanation: examQuestions.explanation,
        payload: examQuestions.payload,
      })
      .from(examQuestions)
      .innerJoin(examPages, eq(examQuestions.pageId, examPages.id))
      .innerJoin(examSections, eq(examPages.sectionId, examSections.id))
      .where(eq(examSections.examId, examId));

    // Get options for all questions
    const questionIds = questions.map((q: any) => q.id);
    const options = questionIds.length > 0
      ? await db.select().from(examQuestionOptions).where(eq(examQuestionOptions.questionId, questionIds[0]))
      : [];

    return Response.json({ exam, questions, options });
  }

  // Get all student submissions
  if (action === "getSubmissions") {
    const students = await db.select().from(examStudents).where(eq(examStudents.examId, examId));
    
    const attempts = [];
    for (const student of students) {
      const studentAttempts = await db
        .select()
        .from(studentExamAttempts)
        .where(eq(studentExamAttempts.examStudentId, student.id));
      attempts.push(...studentAttempts);
    }

    const answers = [];
    for (const attempt of attempts) {
      const attemptAnswers = await db
        .select()
        .from(studentAnswers)
        .where(eq(studentAnswers.attemptId, attempt.id));
      answers.push(...attemptAnswers);
    }

    return Response.json({ students, attempts, answers });
  }

  // Grade a single answer
  if (action === "gradeAnswer") {
    const [answer] = await db
      .update(studentAnswers)
      .set({
        autoPoints: points || 0,
        feedback: feedback || null,
      })
      .where(eq(studentAnswers.id, answerId))
      .returning();

    return Response.json({ answer });
  }

  // Finalize a student's grading
  if (action === "finalizeStudent") {
    // Calculate total points
        const answers = await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attemptId));
    const totalAuto = answers.reduce((sum: number, a: any) => sum + (a.autoPoints || 0), 0);
    const totalManual = answers.reduce((sum: number, a: any) => sum + (a.manualPoints || 0), 0);
    const maxPoints = answers.reduce((sum: number, a: any) => {
      // Need to fetch question max points - simplified for now
      return sum + 1;
    }, 0);

    const [attempt] = await db
      .update(studentExamAttempts)
      .set({
        autoPoints: totalAuto,
        manualPoints: totalManual,
        maxPoints,
        status: "graded",
      })
      .where(eq(studentExamAttempts.id, attemptId))
      .returning();

    return Response.json({ attempt });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}