import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  exams, examStudents, examSections, examPages, examQuestions,
  examQuestionOptions, departments, subjects,
} from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";

const TYPE_MAP: Record<string, string> = {
  mcq: "mcq",
  multiple_select: "multi_select",
  true_false: "true_false",
  short_answer: "short_answer",
  essay: "long_answer",
  coding: "coding",
  fill_in_blank: "fill_blank",
  matching: "matching",
  ordering: "ordering",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = (searchParams.get("roomCode") ?? "").trim().toUpperCase();
  const requestId = searchParams.get("requestId") ?? "";

  const [exam] = await db
    .select({
      id: exams.id, title: exams.title, status: exams.status, isPaused: exams.isPaused,
      durationMinutes: exams.durationMinutes, startTime: exams.startTime,
      departmentName: departments.name, subjectName: subjects.name,
    })
    .from(exams)
    .leftJoin(departments, eq(exams.departmentId, departments.id))
    .leftJoin(subjects, eq(exams.subjectId, subjects.id))
    .where(eq(exams.examCode, roomCode));
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const [student] = await db
    .select()
    .from(examStudents)
    .where(and(eq(examStudents.id, requestId), eq(examStudents.examId, exam.id)));
  if (!student || student.status !== "approved")
    return NextResponse.json({ error: "Not approved" }, { status: 403 });
  if (exam.status !== "in_progress")
    return NextResponse.json({ error: "Exam not started" }, { status: 409 });

  if (!student.startedAt)
    await db.update(examStudents).set({ startedAt: new Date() }).where(eq(examStudents.id, student.id));

  const totalSeconds = (exam.durationMinutes || 60) * 60;
  const elapsed = exam.startTime ? Math.floor((Date.now() - new Date(exam.startTime).getTime()) / 1000) : 0;
    let secondsRemaining: number | null = null;
  if (exam.status === "in_progress" && exam.startTime) {
    const total = (exam.durationMinutes || 60) * 60;
    const now = Date.now();
    const paused =
      (exam.pausedTotalSeconds || 0) +
      (exam.isPaused && exam.pausedAt
        ? Math.floor((now - new Date(exam.pausedAt).getTime()) / 1000)
        : 0);
    const elapsed =
      Math.floor((now - new Date(exam.startTime).getTime()) / 1000) - paused;
    secondsRemaining = Math.max(0, total - elapsed);
  }

  const sectionRows = await db.select().from(examSections)
    .where(eq(examSections.examId, exam.id)).orderBy(asc(examSections.sectionOrder));
  const sectionIds = sectionRows.map((s: any) => s.id);
  const pageRows = sectionIds.length
    ? await db.select().from(examPages).where(inArray(examPages.sectionId, sectionIds)).orderBy(asc(examPages.pageOrder))
    : [];
  const pageIds = pageRows.map((p: any) => p.id);
  const questionRows = pageIds.length
    ? await db.select().from(examQuestions).where(inArray(examQuestions.pageId, pageIds)).orderBy(asc(examQuestions.questionOrder))
    : [];
  const questionIds = questionRows.map((q: any) => q.id);
  const optionRows = questionIds.length
    ? await db.select().from(examQuestionOptions).where(inArray(examQuestionOptions.questionId, questionIds)).orderBy(asc(examQuestionOptions.optionOrder))
    : [];

  const pagesBySection = new Map<string, any[]>();
  for (const p of pageRows as any[]) { const l = pagesBySection.get(p.sectionId) ?? []; l.push(p); pagesBySection.set(p.sectionId, l); }
  const questionsByPage = new Map<string, any[]>();
  for (const q of questionRows as any[]) { const l = questionsByPage.get(q.pageId) ?? []; l.push(q); questionsByPage.set(q.pageId, l); }

  const sections = sectionRows.map((section: any) => {
    const pages = pagesBySection.get(section.id) ?? [];
    const questions = pages.flatMap((p) => questionsByPage.get(p.id) ?? []).map((q: any) => {
      const payload = (q.payload ?? {}) as any;
      const servedType = TYPE_MAP[q.questionType] ?? "mcq";
      const base = {
        id: q.id, type: servedType, prompt: q.questionText,
        points: q.points, marks: q.points, media: payload.media ?? null,
      };
      if (servedType === "mcq" || servedType === "multi_select") {
        return {
          ...base,
          options: (optionRows as any[])
            .filter((o) => o.questionId === q.id)
            .map((o, i) => ({ id: o.id, label: String.fromCharCode(65 + i), text: o.optionText })),
        };
      }
      if (servedType === "fill_blank")
        return { ...base, segments: payload.segments ?? [], blanks: (payload.blanks ?? []).map((b: any) => ({ id: b.id })) };
      if (servedType === "matching")
        return { ...base, left: payload.left ?? [], right: payload.right ?? [] };
      if (servedType === "ordering")
        return { ...base, items: payload.items ?? [] };
      if (servedType === "coding")
        return { ...base, language: payload.language ?? "JavaScript" };
      return base;
    });
    return { id: section.id, title: section.title, questions };
  });

  return NextResponse.json({
    exam: {
      title: exam.title, department: exam.departmentName || "", subject: exam.subjectName || "",
      durationMinutes: exam.durationMinutes,
    },
    secondsRemaining,
    isPaused: exam.isPaused,
    sections,
    progress: (student.progress ?? {}) as Record<string, string>,
  });
}