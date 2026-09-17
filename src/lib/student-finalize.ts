import { db } from "@/db";
import { exams, examStudents, studentExamAttempts, studentAnswers, examQuestions, examPages, examSections, examQuestionOptions, notifications } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildResultSummary } from "./student-grading";

// ✅ Strong normalizer (same as submit)
function norm(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?"'`()\-\[\]{}]/g, "")
    .trim();
}

/**
 * Finalize a student's attempt: grade every question, insert studentAnswers rows,
 * create/update the attempt row, set completedAt, send teacher notification.
 * 
 * Called by both /api/student/submit and /api/teacher/.../reject-live (force-submit).
 * 
 * @param examStudentId - the student's ID
 * @param answers - the student's answers (merged from progress + body, or just progress)
 * @param reason - "manual" | "timeout" | "force"
 */
export async function finalizeAttempt(
  examStudentId: string,
  answers: Record<string, string>,
  reason: "manual" | "timeout" | "force"
) {
  const now = new Date();

  const [student] = await db.select().from(examStudents).where(eq(examStudents.id, examStudentId));
  if (!student) throw new Error("Student not found");
  if (student.status !== "approved") throw new Error("Not approved");
  if (student.completedAt) {
    // Already submitted — return existing summary (idempotent)
    return buildResultSummary(examStudentId);
  }

  const [exam] = await db.select().from(exams).where(eq(exams.id, student.examId));
  if (!exam) throw new Error("Exam not found");

  // Check for existing attempt (force-submit may have created one without answers)
  const existingAttempts = await db.select().from(studentExamAttempts).where(eq(studentExamAttempts.examStudentId, examStudentId));
  let attempt = existingAttempts[existingAttempts.length - 1]; // latest attempt

  if (!attempt) {
    // Create new attempt
    const attemptCount = existingAttempts.length;
        const [newAttempt] = await db.insert(studentExamAttempts).values({
      examStudentId: examStudentId,
      attemptNumber: attemptCount + 1,
      submittedAt: now,
      isForcedSubmit: reason === "force",
      ...(reason === "force" ? { status: "needs_review", gradingStatus: "in_progress" } : {}),
    }).returning();
    attempt = newAttempt;
  } else {
    // Update existing attempt (e.g. force-submit added one earlier without answers)
    await db.update(studentExamAttempts).set({
      submittedAt: now,
      isForcedSubmit: reason === "force",
    }).where(eq(studentExamAttempts.id, attempt.id));
  }

  // Load exam structure
  const sectionRows = await db.select().from(examSections).where(eq(examSections.examId, exam.id));
  const pageRows = sectionRows.length
    ? await db.select().from(examPages).where(inArray(examPages.sectionId, sectionRows.map((s: any) => s.id)))
    : [];
  const questionRows = pageRows.length
    ? await db.select().from(examQuestions).where(inArray(examQuestions.pageId, pageRows.map((p: any) => p.id)))
    : [];
  const optionRows = questionRows.length
    ? await db.select().from(examQuestionOptions).where(inArray(examQuestionOptions.questionId, questionRows.map((q: any) => q.id)))
    : [];

  let autoTotal = 0, maxTotal = 0;
  const inserts: any[] = [];

  for (const q of questionRows as any[]) {
    const payload = (q.payload ?? {}) as any;
    const options = (optionRows as any[]).filter((o) => o.questionId === q.id);
    const value = answers[q.id];
    const answered = value !== undefined && value !== "";
    maxTotal += q.points;

    let correct = false, needsManual = false, selectedOptionIds: string[] = [], answerText = answered ? value : "";

    const manualOverride = payload.autoGrade === false;
    if (!answered) {
      needsManual =
        manualOverride ||
        ["essay", "coding"].includes(q.questionType) ||
        (q.questionType === "short_answer" && !(payload.acceptedVariants ?? []).length);
    } else if (manualOverride) {
      needsManual = true;
      if (q.questionType === "mcq" || q.questionType === "true_false") {
        selectedOptionIds = [value];
        const chosen = options.find((o: any) => o.id === value);
        answerText = chosen?.optionText ?? value;
      } else if (q.questionType === "multiple_select" || q.questionType === "multi_select") {
        const ids = value.split(",").filter(Boolean);
        selectedOptionIds = ids;
        answerText = options
          .filter((o: any) => ids.includes(o.id))
          .map((o: any) => o.optionText)
          .join(", ");
      }
    } else {
      switch (q.questionType) {
        case "mcq": {
          selectedOptionIds = [value];
          const chosen = options.find((o) => o.id === value);
          answerText = chosen?.optionText ?? value;
          correct = !!chosen?.isCorrect;
          break;
        }
        case "multiple_select": {
          const ids = value.split(",").filter(Boolean).sort();
          selectedOptionIds = ids;
          answerText = options.filter((o) => ids.includes(o.id)).map((o) => o.optionText).join(", ");
          const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id).sort();
          correct = ids.length === correctIds.length && ids.every((id, i) => id === correctIds[i]);
          break;
        }
        case "true_false":
          correct = value.toLowerCase() === (payload.correctValue ?? "true");
          break;
        case "fill_in_blank": {
          let map: Record<string, string> = {};
          try { map = JSON.parse(value); } catch { /* ignore */ }
          const blanks = (payload.blanks ?? []) as { id: string; correctAnswer: string }[];
          const choices: string[] = Array.isArray(payload.blankChoices) ? payload.blankChoices : [];
          const resolve = (raw: string): string => {
            const t = raw.trim();
            const n = Number(t);
            if (choices.length && Number.isInteger(n) && n >= 1 && n <= choices.length) {
              return String(choices[n - 1]);
            }
            return t;
          };
          const getVal = (b: { id: string }): string => {
            const direct = map[b.id];
            if (direct !== undefined) return direct;
            const stripped = b.id.replace(/^b/, "");
            return map[stripped] ?? "";
          };
          correct = blanks.length > 0 && blanks.every((b) => {
            const studentAns = norm(resolve(getVal(b)));
            const keyAns = norm(b.correctAnswer);
            return studentAns === keyAns;
          });
          break;
        }
        case "short_answer": {
          const variants = (payload.acceptedVariants ?? []) as string[];
          if (variants.length > 0) correct = variants.some((v) => norm(v) === norm(value));
          else needsManual = true;
          break;
        }
        case "matching": {
          let map: Record<string, string> = {};
          try { map = JSON.parse(value); } catch { /* ignore */ }
          const pairs = (payload.correctPairs ?? {}) as Record<string, string>;
          const keys = Object.keys(pairs);
          correct = keys.length > 0 && keys.every((k) => map[k] === pairs[k]);
          break;
        }
        case "ordering": {
          const given = value.split(",").filter(Boolean);
          const correctOrder = (payload.correctOrder ?? []) as string[];
          correct = given.length === correctOrder.length && given.every((id, i) => id === correctOrder[i]);
          break;
        }
        default:
          needsManual = true;
      }
    }

    const autoPoints = !needsManual && correct ? q.points : 0;
    autoTotal += autoPoints;
    inserts.push({
      attemptId: attempt.id,
      questionId: q.id,
      answerText,
      selectedOptionIds,
      markedCorrect: needsManual ? null : correct,
      autoPoints,
      submittedAt: now,
    });
  }

  // Insert all studentAnswers rows (this is what grading reads)
  if (inserts.length > 0) {
    // Delete any existing rows for this attempt (in case force-submit is called twice)
    await db.delete(studentAnswers).where(eq(studentAnswers.attemptId, attempt.id));
    await db.insert(studentAnswers).values(inserts);
  }

  // Update attempt with totals
  await db.update(studentExamAttempts).set({
    autoPoints: autoTotal,
    maxPoints: maxTotal,
  }).where(eq(studentExamAttempts.id, attempt.id));

  // Mark student as completed
  await db.update(examStudents).set({ completedAt: now }).where(eq(examStudents.id, examStudentId));

  // Send teacher notification
  const reasonText = reason === "timeout" ? " (time expired)" : reason === "force" ? " (force-submitted by teacher)" : "";
  await db.insert(notifications).values({
    orgId: exam.orgId,
    teacherId: exam.teacherId,
    title: reason === "force" ? "Force Submission" : "Submission Received",
    message: `${student.studentName} (${student.studentId}) ${reason === "force" ? "was force-submitted for" : "submitted"} "${exam.title}"${reasonText}.`,
    type: "submission_received",
    relatedEntityId: exam.id,
    relatedEntityType: "exam",
  });

  return buildResultSummary(examStudentId);
}