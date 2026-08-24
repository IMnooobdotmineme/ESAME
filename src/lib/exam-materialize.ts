import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { examSections, examPages, examQuestions, examQuestionOptions } from "@/db/schema";

const VALID_TYPES = ["mcq","multiple_select","true_false","short_answer","essay","coding","fill_in_blank"] as const;
type TeacherType = (typeof VALID_TYPES)[number];

function asArray(v: unknown): any[] { return Array.isArray(v) ? v : []; }

export function normalizeRawQuestion(raw: any, fallbackType: string) {
  const rawType = String(raw?.type ?? fallbackType ?? "mcq");
  const type: TeacherType = (VALID_TYPES as readonly string[]).includes(rawType) ? (rawType as TeacherType) : "mcq";
  const prompt = String(raw?.prompt ?? raw?.text ?? raw?.questionText ?? "");
  const options = asArray(raw?.options).map((o: any, i: number) => ({
    id: String(o?.id ?? `opt-${i + 1}`),
    text: String(o?.text ?? o?.optionText ?? o?.label ?? ""),
    isCorrect: Boolean(o?.isCorrect ?? o?.correct ?? false),
  }));
  const correctAnswers = asArray(raw?.correctAnswers ?? (raw?.correctAnswer != null ? [raw.correctAnswer] : [])).map((v: any) => String(v));

  let segments = asArray(raw?.segments).map(String);
  let blanks = asArray(raw?.blanks).map((b: any, i: number) => ({
    id: String(b?.id ?? `b${i + 1}`),
    correctAnswer: String(b?.correctAnswer ?? correctAnswers[i] ?? ""),
  }));
  if (type === "fill_in_blank" && segments.length === 0) {
    segments = prompt.split("___");
    blanks = correctAnswers.map((c, i) => ({ id: `b${i + 1}`, correctAnswer: c }));
  }

  const acceptedVariants = asArray(raw?.acceptedVariants ?? raw?.acceptedAnswers ?? correctAnswers).map((v: any) => String(v));
  const correctValue = raw?.correctValue != null
    ? String(raw.correctValue).toLowerCase()
    : options.length ? (options.find((o) => o.isCorrect)?.text || "true").toLowerCase() : "true";
  const points = Number(raw?.points ?? raw?.marks ?? (type === "fill_in_blank" ? Math.max(1, blanks.length) : 1)) || 1;

  const payload: Record<string, unknown> = {};
  if (type === "true_false") payload.correctValue = correctValue === "false" ? "false" : "true";
  if (type === "fill_in_blank") { payload.segments = segments; payload.blanks = blanks; }
  if (type === "short_answer" && acceptedVariants.length) payload.acceptedVariants = acceptedVariants;
  if (type === "coding") payload.language = raw?.language ?? "JavaScript";

  return { type, prompt, points, options, payload };
}

export async function materializeExamQuestions(examId: string, parts: unknown) {
  const oldSections = await db.select().from(examSections).where(eq(examSections.examId, examId));
  const oldSectionIds = oldSections.map((s: any) => s.id);
  if (oldSectionIds.length > 0) {
    const oldPages = await db.select().from(examPages).where(inArray(examPages.sectionId, oldSectionIds));
    const oldPageIds = oldPages.map((p: any) => p.id);
    if (oldPageIds.length > 0) {
      const oldQuestions = await db.select().from(examQuestions).where(inArray(examQuestions.pageId, oldPageIds));
      const oldQuestionIds = oldQuestions.map((q: any) => q.id);
      if (oldQuestionIds.length > 0) {
        await db.delete(examQuestionOptions).where(inArray(examQuestionOptions.questionId, oldQuestionIds));
        await db.delete(examQuestions).where(inArray(examQuestions.id, oldQuestionIds));
      }
      await db.delete(examPages).where(inArray(examPages.id, oldPageIds));
    }
    await db.delete(examSections).where(inArray(examSections.id, oldSectionIds));
  }

  let totalQuestions = 0;
  let totalPoints = 0;
  const sectionList = asArray(parts);

  for (let sIdx = 0; sIdx < sectionList.length; sIdx++) {
    const part = sectionList[sIdx] || {};
    const sectionRows = await db.insert(examSections).values({
      examId,
      title: String(part?.title ?? `Section ${sIdx + 1}`),
      description: part?.description ?? null,
      sectionOrder: sIdx,
    }).returning();
    const section = sectionRows[0];

    const pageRows = await db.insert(examPages).values({ sectionId: section.id, pageOrder: 0 }).returning();
    const page = pageRows[0];

    const questions = asArray(part?.questions);
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const nq = normalizeRawQuestion(questions[qIdx], String(part?.allowedType ?? "mcq"));
      totalQuestions += 1;
      totalPoints += nq.points;

      const questionRows = await db.insert(examQuestions).values({
        pageId: page.id,
        questionText: nq.prompt,
        questionType: nq.type,
        points: nq.points,
        questionOrder: qIdx,
        payload: nq.payload,
      }).returning();
      const question = questionRows[0];

      if (nq.options.length > 0) {
        await db.insert(examQuestionOptions).values(
          nq.options.map((o, oIdx) => ({
            questionId: question.id,
            optionText: o.text,
            isCorrect: o.isCorrect,
            optionOrder: oIdx,
          }))
        );
      }
    }
  }
  return { totalQuestions, totalPoints };
}