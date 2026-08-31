import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import {
  exams,
  examSections,
  examPages,
  examQuestions,
  examQuestionOptions,
} from "@/db/schema";
import { eq, and, like } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { examId } = await params;

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const baseTitle = exam.title.replace(/\s*\(Copy(?:\s*\d+)?\)$/, "");
    const existingCopies = await db
      .select({ title: exams.title })
      .from(exams)
      .where(
        and(eq(exams.teacherId, session.userId), like(exams.title, `${baseTitle} (Copy%`))
      );
    const usedTitles = new Set(existingCopies.map((e: any) => e.title));
    let newTitle = `${baseTitle} (Copy)`;
    if (usedTitles.has(newTitle)) {
      let n = 1;
      while (usedTitles.has(`${baseTitle} (Copy ${n})`)) n++;
      newTitle = `${baseTitle} (Copy ${n})`;
    }

    const [newExam] = await db
      .insert(exams)
      .values({
        orgId: exam.orgId,
        teacherId: exam.teacherId,
        departmentId: exam.departmentId,
        subjectId: exam.subjectId,
        examCode: "DRAFT",
        title: newTitle,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        totalQuestions: exam.totalQuestions,
        parts: exam.parts,
        scheduledDate: null,
        status: "scheduled",
        isLaunched: false,
        isPaused: false,
      })
      .returning();

    const sections = await db
      .select()
      .from(examSections)
      .where(eq(examSections.examId, exam.id));

    for (const s of sections) {
      const [newSection] = await db
        .insert(examSections)
        .values({
          examId: newExam.id,
          title: s.title,
          allowedType: s.allowedType,
          sectionOrder: s.sectionOrder,
        })
        .returning();

      const pages = await db
        .select()
        .from(examPages)
        .where(eq(examPages.sectionId, s.id));

      for (const p of pages) {
        const [newPage] = await db
          .insert(examPages)
          .values({
            sectionId: newSection.id,
            pageTitle: p.pageTitle,
            pageOrder: p.pageOrder,
          })
          .returning();

        const questions = await db
          .select()
          .from(examQuestions)
          .where(eq(examQuestions.pageId, p.id));

        for (const q of questions) {
          const [newQuestion] = await db
            .insert(examQuestions)
            .values({
              pageId: newPage.id,
              questionText: q.questionText,
              questionType: q.questionType,
              points: q.points,
              questionOrder: q.questionOrder,
              explanation: q.explanation,
              payload: q.payload,
            })
            .returning();

          const options = await db
            .select()
            .from(examQuestionOptions)
            .where(eq(examQuestionOptions.questionId, q.id));

          if (options.length > 0) {
            await db.insert(examQuestionOptions).values(
              options.map((o: any) => ({
                
                questionId: newQuestion.id,
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                optionOrder: o.optionOrder,
              }))
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      examId: newExam.id,
      title: newExam.title,
    });
  } catch (error) {
    console.error("Duplicate exam error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate exam" },
      { status: 500 }
    );
  }
}