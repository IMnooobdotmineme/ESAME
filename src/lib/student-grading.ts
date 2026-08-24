import { db } from "@/db";
import { examStudents, studentExamAttempts, studentAnswers, examQuestions, examPages, examSections } from "@/db/schema";
import { eq, inArray, asc, desc } from "drizzle-orm";

export async function buildResultSummary(examStudentId: string) {
  const attemptRows = await db.select().from(studentExamAttempts)
    .where(eq(studentExamAttempts.examStudentId, examStudentId))
    .orderBy(desc(studentExamAttempts.attemptNumber));
  const attempt = attemptRows[0];
  if (!attempt) return null;

  const studentRows = await db.select().from(examStudents).where(eq(examStudents.id, examStudentId));
  const student = studentRows[0];

  const sectionRows = await db.select().from(examSections).where(eq(examSections.examId, student.examId)).orderBy(asc(examSections.sectionOrder));
  const sectionIds = sectionRows.map((s: any) => s.id);
  const pageRows = sectionIds.length ? await db.select().from(examPages).where(inArray(examPages.sectionId, sectionIds)) : [];
  const pageIds = pageRows.map((p: any) => p.id);
  const questionRows = pageIds.length ? await db.select().from(examQuestions).where(inArray(examQuestions.pageId, pageIds)) : [];
  const answerRows = await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attempt.id));

    const answerByQuestion = new Map<string, any>(
    answerRows.map((a: any): [string, any] => [a.questionId, a])
  );
  const pageSection = new Map<string, string>(
    pageRows.map((p: any): [string, string] => [p.id, p.sectionId])
  );
  const MANUAL = ["essay", "coding"];

  let correctCount = 0, incorrectCount = 0, unansweredCount = 0, autoGradedQuestions = 0, manualCount = 0;
  const sectionStats = new Map<string, { total: number; answered: number; correct: number; manual: boolean; type: string }>();

  for (const q of questionRows as any[]) {
    const payload = (q.payload ?? {}) as any;
    const isManual = MANUAL.includes(q.questionType) || (q.questionType === "short_answer" && !(payload.acceptedVariants ?? []).length);
    const a = answerByQuestion.get(q.id);
    const answered = !!a && a.answerText !== "";
    if (!answered) unansweredCount++;

    const sectionId = pageSection.get(q.pageId) ?? "";
    const st = sectionStats.get(sectionId) ?? { total: 0, answered: 0, correct: 0, manual: isManual, type: q.questionType };
    st.total += 1;
    if (answered) st.answered += 1;

    if (isManual) manualCount++;
    else {
      autoGradedQuestions++;
      if (a?.markedCorrect === true) { correctCount++; st.correct += 1; }
      else if (answered) incorrectCount++;
    }
    sectionStats.set(sectionId, st);
  }

  const sections = sectionRows.map((s: any) => {
    const st = sectionStats.get(s.id) ?? { total: 0, answered: 0, correct: 0, manual: false, type: "mcq" };
    return { id: s.id, title: s.title, type: st.type, totalQuestions: st.total, answeredCount: st.answered, correctCount: st.correct, isManual: st.manual };
  });

  const percentage = autoGradedQuestions > 0 ? Math.round((correctCount / autoGradedQuestions) * 100) : 0;
  return {
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    hasManual: manualCount > 0,
    totalQuestions: questionRows.length,
    autoGradedQuestions, correctCount, incorrectCount, unansweredCount, manualCount,
    percentage,
    earnedPoints: attempt.autoPoints,
    autoTotalPoints: attempt.maxPoints,
    sections,
  };
}