import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, examStudents, studentExamAttempts, studentAnswers, examQuestions, examQuestionOptions, examPages, examSections, notifications } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildResultSummary } from "@/lib/student-grading";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    const answers = (body.answers ?? {}) as Record<string, string>;
    const reason = body.reason === "timeout" ? "timeout" : "manual";

    const [student] = await db.select().from(examStudents).where(eq(examStudents.id, requestId));
    if (!student) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (student.status !== "approved") return NextResponse.json({ error: "Not approved" }, { status: 403 });
    const [exam] = await db.select().from(exams).where(eq(exams.id, student.examId));
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    if (student.completedAt) {
      const summary = await buildResultSummary(student.id);
      return NextResponse.json({ alreadySubmitted: true, ...summary });
    }

    const now = new Date();
    const attemptCount = (await db.select().from(studentExamAttempts).where(eq(studentExamAttempts.examStudentId, student.id))).length;
    const [attempt] = await db.insert(studentExamAttempts).values({ examStudentId: student.id, attemptNumber: attemptCount + 1, submittedAt: now }).returning();

    const sectionRows = await db.select().from(examSections).where(eq(examSections.examId, exam.id));
    const pageRows = sectionRows.length ? await db.select().from(examPages).where(inArray(examPages.sectionId, sectionRows.map((s: any) => s.id))) : [];
    const questionRows = pageRows.length ? await db.select().from(examQuestions).where(inArray(examQuestions.pageId, pageRows.map((p: any) => p.id))) : [];
    const optionRows = questionRows.length ? await db.select().from(examQuestionOptions).where(inArray(examQuestionOptions.questionId, questionRows.map((q: any) => q.id))) : [];

    let autoTotal = 0, maxTotal = 0;
    const inserts: any[] = [];

    for (const q of questionRows as any[]) {
      const payload = (q.payload ?? {}) as any;
      const options = (optionRows as any[]).filter((o) => o.questionId === q.id);
      const value = answers[q.id];
      const answered = value !== undefined && value !== "";
      maxTotal += q.points;

      let correct = false, needsManual = false, selectedOptionIds: string[] = [], answerText = answered ? value : "";

      if (!answered) {
        needsManual = ["essay", "coding"].includes(q.questionType) || (q.questionType === "short_answer" && !(payload.acceptedVariants ?? []).length);
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
            correct = blanks.length > 0 && blanks.every((b) => (map[b.id] ?? "").trim().toLowerCase() === String(b.correctAnswer).trim().toLowerCase());
            break;
          }
          case "short_answer": {
            const variants = (payload.acceptedVariants ?? []) as string[];
            if (variants.length > 0) correct = variants.some((v) => v.trim().toLowerCase() === value.trim().toLowerCase());
            else needsManual = true;
            break;
          }
          default:
            needsManual = true;
        }
      }

      const autoPoints = !needsManual && correct ? q.points : 0;
      autoTotal += autoPoints;
      inserts.push({ attemptId: attempt.id, questionId: q.id, answerText, selectedOptionIds, markedCorrect: needsManual ? null : correct, autoPoints, submittedAt: now });
    }

    if (inserts.length > 0) await db.insert(studentAnswers).values(inserts);
    await db.update(studentExamAttempts).set({ autoPoints: autoTotal, maxPoints: maxTotal }).where(eq(studentExamAttempts.id, attempt.id));
    await db.update(examStudents).set({ completedAt: now }).where(eq(examStudents.id, student.id));
    await db.insert(notifications).values({
      orgId: exam.orgId, teacherId: exam.teacherId,
      title: "Submission Received",
      message: `${student.studentName} (${student.studentId}) submitted "${exam.title}"${reason === "timeout" ? " (time expired)" : ""}.`,
      type: "submission_received", relatedEntityId: exam.id, relatedEntityType: "exam",
    });

    const summary = await buildResultSummary(student.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Student submit error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}