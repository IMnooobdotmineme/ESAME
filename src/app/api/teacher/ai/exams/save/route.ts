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
import { eq, and, like, sql } from "drizzle-orm";
import { materializeExamQuestions } from "@/lib/exam-materialize";
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
        let [dept] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.orgId, teacher.orgId), eq(departments.name, department)));
    
    if (!dept) {
      // ✅ Fallback: case-insensitive substring match ("SE" → "Software Engineering")
      [dept] = await db
        .select()
        .from(departments)
              .where(and(eq(departments.orgId, teacher.orgId), sql`LOWER(${departments.name}) LIKE LOWER(${`%${department}%`})`))
        .limit(1);
    }
    if (!dept) return NextResponse.json({ error: "Department not found" }, { status: 400 });

        let [subj] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.departmentId, dept.id), eq(subjects.name, subject)));
    
    if (!subj) {
      // ✅ Fallback: case-insensitive substring match ("IOT" → "Internet of Things")
      [subj] = await db
        .select()
        .from(subjects)
              .where(and(eq(subjects.departmentId, dept.id), sql`LOWER(${subjects.name}) LIKE LOWER(${`%${subject}%`})`))
        .limit(1);
    }
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

        // ✅ Create sections → pages → questions → options (handles all 9 types correctly)
    await materializeExamQuestions(newExam.id, sections);

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