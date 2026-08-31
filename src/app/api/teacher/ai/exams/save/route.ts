import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import {
  exams,
  departments,
  subjects,
  teachers,
  examSections,
  examPages,
  examQuestions,
  examQuestionOptions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Generate 6-char exam code like HZARYU
function generateExamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const teacherId = session.userId;
    const [teacher] = await db.select({ orgId: teachers.orgId }).from(teachers).where(eq(teachers.id, teacherId));
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const body = await req.json();
    const {
      title,
      description,
      department,
      subject,
      durationMinutes,
      sections,
      startDate,
    } = body;

    // ✅ Validate department + subject belong to teacher's org
    const [dept] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.orgId, teacher.orgId), eq(departments.name, department)));
    if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 400 });

    const [subj] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.departmentId, dept.id), eq(subjects.name, subject)));
    if (!subj) return NextResponse.json({ error: "Subject not found" }, { status: 400 });

    // ✅ Count total questions
    let totalQuestions = 0;
    if (Array.isArray(sections)) {
      for (const s of sections) {
        if (s.questions && Array.isArray(s.questions)) {
          totalQuestions += s.questions.length;
        }
      }
    }
    // ✅ Prevent duplicates: same teacher + same title = return existing exam
    const [existingExam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.teacherId, teacherId), eq(exams.title, title || "Untitled Examination")));
    if (existingExam) {
      return NextResponse.json({
        success: true,
        examId: existingExam.id,
        roomCode: existingExam.examCode === "DRAFT" ? "" : existingExam.examCode,
        title: existingExam.title,
        alreadySaved: true,
      });
    }

    // ✅ Create exam (same as human save)
    const [newExam] = await db
      .insert(exams)
      .values({
        orgId: teacher.orgId,
        teacherId,
        departmentId: dept.id,
        subjectId: subj.id,
        examCode: "DRAFT",
        title: title || "Untitled Examination",
        description: description || null,
        durationMinutes: durationMinutes || 60,
        totalQuestions,
        parts: sections || [],
        scheduledDate: startDate ? new Date(startDate) : null,
        status: "scheduled",
        isLaunched: false,
        isPaused: false,
      })
      .returning();

    // ✅ Create sections → pages → questions → options
    if (Array.isArray(sections)) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const s = sections[sIdx];
        const [section] = await db
          .insert(examSections)
          .values({
            examId: newExam.id,
            title: s.title || `Section ${sIdx + 1}`,
            allowedType: s.type || s.allowedType || "mcq",
            sectionOrder: sIdx,
          })
          .returning();

        const [page] = await db
          .insert(examPages)
          .values({
            sectionId: section.id,
            pageTitle: `Page ${sIdx + 1}`,
            pageOrder: 0,
          })
          .returning();

        if (Array.isArray(s.questions)) {
          for (let qIdx = 0; qIdx < s.questions.length; qIdx++) {
            const q = s.questions[qIdx];
            const [question] = await db
              .insert(examQuestions)
              .values({
                pageId: page.id,
                questionText: q.text || q.questionText || "",
                questionType: q.type || "mcq",
                points: q.points || q.marks || 1,
                questionOrder: qIdx,
                explanation: q.explanation || null,
                payload: q.payload || {},
              })
              .returning();

            if (Array.isArray(q.options)) {
              const optionInserts = q.options.map((opt: any, oIdx: number) => ({
                questionId: question.id,
                optionText: opt.text || opt,
                isCorrect: opt.isCorrect || false,
                optionOrder: oIdx,
              }));
              if (optionInserts.length > 0) {
                await db.insert(examQuestionOptions).values(optionInserts);
              }
            }
          }
        }
      }
    }

    // ✅ Generate unique exam code
    let examCode = generateExamCode();
    const [existing] = await db.select().from(exams).where(eq(exams.examCode, examCode));
    if (existing) examCode = generateExamCode();

    await db.update(exams).set({ examCode }).where(eq(exams.id, newExam.id));

    return NextResponse.json({
      success: true,
      examId: newExam.id,
      roomCode: examCode,
      title: newExam.title,
    });
  } catch (error: any) {
    console.error("Save AI exam error:", error);
    return NextResponse.json({ error: error.message || "Failed to save exam" }, { status: 500 });
  }
}