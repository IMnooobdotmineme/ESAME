import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, examStudents, studentExamAttempts } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { examId } = await params;
    const now = new Date();

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // 1. Mark the exam completed
    await db
      .update(exams)
      .set({ status: "completed", isPaused: false, endTime: now, updatedAt: now })
      .where(eq(exams.id, examId));

    // 2. Force-submit every approved student who hasn't submitted yet
    const unsubmitted = await db
      .select()
      .from(examStudents)
      .where(
        and(
          eq(examStudents.examId, examId),
          eq(examStudents.status, "approved"),
          isNull(examStudents.completedAt)
        )
      );

    for (const s of unsubmitted) {
      await db
        .update(examStudents)
        .set({ completedAt: now })
        .where(eq(examStudents.id, s.id));

      const [attempt] = await db
        .select()
        .from(studentExamAttempts)
        .where(eq(studentExamAttempts.examStudentId, s.id));

      if (attempt) {
        await db
          .update(studentExamAttempts)
          .set({ submittedAt: now, isForcedSubmit: true })
          .where(eq(studentExamAttempts.id, attempt.id));
      } else {
        await db.insert(studentExamAttempts).values({
          examStudentId: s.id,
          submittedAt: now,
          isForcedSubmit: true,
          status: "needs_review",
          gradingStatus: "in_progress",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("End exam error:", error);
    return NextResponse.json({ error: "Failed to end exam" }, { status: 500 });
  }
}