import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, examStudents, studentExamAttempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string; requestId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { examId, requestId } = await params;
    const now = new Date();

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // 1. Mark student rejected + finished (auto-submit)
    await db
      .update(examStudents)
      .set({ isRejectedLive: true, isLocked: false, completedAt: now })
      .where(and(eq(examStudents.id, requestId), eq(examStudents.examId, examId)));

    // 2. Force-submit their attempt (create one if it doesn't exist)
    const [attempt] = await db
      .select()
      .from(studentExamAttempts)
      .where(eq(studentExamAttempts.examStudentId, requestId));

    if (attempt) {
      await db
        .update(studentExamAttempts)
        .set({ submittedAt: now, isForcedSubmit: true })
        .where(eq(studentExamAttempts.id, attempt.id));
    } else {
      await db.insert(studentExamAttempts).values({
        examStudentId: requestId,
        submittedAt: now,
        isForcedSubmit: true,
        status: "needs_review",
        gradingStatus: "in_progress",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject live student error:", error);
    return NextResponse.json({ error: "Failed to reject student" }, { status: 500 });
  }
}