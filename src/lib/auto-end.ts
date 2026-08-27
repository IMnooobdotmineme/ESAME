import { db } from "@/db";
import { exams, examStudents, studentExamAttempts, studentAnswers } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// ✅ Ends the exam automatically when the timer expires and force-submits everyone still active.
export async function autoEndExamIfExpired(examId: string) {
  const [exam] = await db.select().from(exams).where(eq(exams.id, examId));
  if (!exam || exam.status !== "in_progress" || !exam.startTime) return;

  const now = Date.now();
  const paused =
    (exam.pausedTotalSeconds ?? 0) +
    (exam.isPaused && exam.pausedAt
      ? Math.floor((now - new Date(exam.pausedAt).getTime()) / 1000)
      : 0);
  const elapsed =
    Math.floor((now - new Date(exam.startTime).getTime()) / 1000) - paused;
  const total = (exam.durationMinutes || 60) * 60;
  if (elapsed < total) return; // not expired yet

  // ⏰ Time's up → end the exam for everyone
  await db
    .update(exams)
    .set({ status: "completed", endTime: new Date(), isPaused: false, updatedAt: new Date() })
    .where(eq(exams.id, examId));

  // Force-submit every student who hasn't finished
  const pending = await db
    .select()
    .from(examStudents)
    .where(and(eq(examStudents.examId, examId), isNull(examStudents.completedAt)));

  for (const s of pending) {
    await db
      .update(examStudents)
      .set({ completedAt: new Date(), isLocked: false })
      .where(eq(examStudents.id, s.id));

    const progress = (s.progress ?? {}) as Record<string, string>;
    const answeredIds = Object.keys(progress).filter((k) => progress[k] !== "");

    const [attempt] = await db
      .select()
      .from(studentExamAttempts)
      .where(eq(studentExamAttempts.examStudentId, s.id));

    let attemptId = attempt?.id;
    if (attempt) {
      await db
        .update(studentExamAttempts)
        .set({ submittedAt: new Date(), isForcedSubmit: true })
        .where(eq(studentExamAttempts.id, attempt.id));
    } else {
      const rows = await db
        .insert(studentExamAttempts)
        .values({
          examStudentId: s.id,
          submittedAt: new Date(),
          isForcedSubmit: true,
          status: "needs_review",
          gradingStatus: "in_progress",
        })
        .returning();
      attemptId = rows[0]?.id;
    }

    // Preserve saved answers so the teacher can grade them
    if (attemptId && answeredIds.length > 0) {
      for (const qid of answeredIds) {
        await db
          .insert(studentAnswers)
          .values({
            attemptId,
            questionId: qid,
            answerText: String(progress[qid]),
            markedCorrect: null,
          })
          .onConflictDoNothing();
      }
    }
  }
}