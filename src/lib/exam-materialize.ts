import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { examSections, examPages, examQuestions, examQuestionOptions } from "@/db/schema";

const VALID_TYPES = [
  "mcq", "multiple_select", "true_false", "short_answer",
  "essay", "coding", "fill_in_blank", "matching", "ordering",
] as const;
type TeacherType = (typeof VALID_TYPES)[number];

function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function normalizeRawQuestion(raw: any, fallbackType: string) {
  const rawType = String(raw?.type ?? fallbackType ?? "mcq");

  // ✅ Map the BUILDER's type names → DB enum names
  const TYPE_MAP: Record<string, TeacherType> = {
    mcq: "mcq",
    multi_select: "multiple_select",
    multiple_select: "multiple_select",
    true_false: "true_false",
    short_answer: "short_answer",
    long_answer: "essay",
    essay: "essay",
    coding: "coding",
    fill_blank: "fill_in_blank",
    fill_in_blank: "fill_in_blank",
    matching: "matching",
    ordering: "ordering",
  };
  const type: TeacherType = TYPE_MAP[rawType] ?? "mcq";
  const prompt = String(raw?.text ?? raw?.prompt ?? raw?.questionText ?? "");

  const payload: Record<string, unknown> = {};
  let options: { id: string; text: string; isCorrect: boolean }[] = [];

  // 📎 Media attachment (image / audio / video)
  if (raw?.mediaType && raw.mediaType !== "none" && raw?.mediaUrl) {
    payload.media = { type: raw.mediaType, url: raw.mediaUrl };
  }
  // 🎚 Auto-grading toggle (OFF → manual grading)
  if (raw?.autoGrade === false) payload.autoGrade = false;

  switch (type) {
    case "mcq": {
      options = asArray(raw?.mcqOptions).map((t: any, i: number) => ({
        id: `opt-${i + 1}`,
        text: String(t ?? ""),
        isCorrect: i === Number(raw?.mcqCorrect ?? 0),
      }));
      break;
    }
    case "multiple_select": {
      options = asArray(raw?.multiOptions).map((t: any, i: number) => ({
        id: `opt-${i + 1}`,
        text: String(t ?? ""),
        isCorrect: Boolean(asArray(raw?.multiCorrect)[i]),
      }));
      break;
    }
    case "true_false": {
      payload.correctValue = raw?.tfCorrect === false ? "false" : "true";
      break;
    }
    case "fill_in_blank": {
      // Builder stores "The capital of France is [1]." + answerKey rows
      const text = String(raw?.blanksText ?? prompt);
      const segments = text.split(/\[\d+\]/);
      const blanks = asArray(raw?.answerKey)
        .slice()
        .sort((a: any, b: any) => Number(a?.number) - Number(b?.number))
        .map((r: any, i: number) => ({ id: `b${i + 1}`, correctAnswer: String(r?.answer ?? "") }));
      payload.segments = segments;
      payload.blanks = blanks;
      break;
    }
    case "matching": {
      const left = asArray(raw?.matchLeft).map((t: any, i: number) => ({ id: `l${i + 1}`, text: String(t ?? "") }));
      const right = asArray(raw?.matchRight).map((t: any, i: number) => ({ id: `r${i + 1}`, text: String(t ?? "") }));
      const correctPairs: Record<string, string> = {};
      for (const m of asArray(raw?.matchAnswers)) {
        const li = Number(m?.left) - 1;
        const ri = String(m?.right ?? "").toUpperCase().charCodeAt(0) - 65;
        if (li >= 0 && li < left.length && ri >= 0 && ri < right.length) {
          correctPairs[`l${li + 1}`] = `r${ri + 1}`;
        }
      }
      payload.left = left;
      payload.right = right;
      payload.correctPairs = correctPairs; // kept server-side only
      break;
    }
    case "ordering": {
      const correctItems = asArray(raw?.orderingItems).map((t: any, i: number) => ({ id: `i${i + 1}`, text: String(t ?? "") }));
      const correctOrder = correctItems.map((it: any) => it.id);
      // ✅ Serve a shuffled display order so the answer isn't given away
      let display = shuffled(correctItems);
      if (display.map((d) => d.id).join(",") === correctOrder.join(",")) {
        display = [...display.slice(1), display[0]];
      }
      payload.items = display;
      payload.correctOrder = correctOrder; // kept server-side only
      break;
    }
    case "coding": {
      payload.language = raw?.language ?? "JavaScript";
      break;
    }
    default:
      break;
  }

  const points =
    Number(
      raw?.marks ?? raw?.points ??
      (type === "fill_in_blank" ? Math.max(1, asArray(raw?.answerKey).length) : 1)
    ) || 1;

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