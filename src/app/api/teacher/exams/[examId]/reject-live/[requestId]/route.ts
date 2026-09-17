import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, examStudents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { finalizeAttempt } from "@/lib/student-finalize";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string; requestId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { examId, requestId } = await params;

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const [student] = await db
      .select()
      .from(examStudents)
      .where(and(eq(examStudents.id, requestId), eq(examStudents.examId, examId)));
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ✅ REJECT + FORCE SUBMIT using the same finalize logic as normal submit
    //    This guarantees studentAnswers rows exist so grading shows questions + answers.
    await db
      .update(examStudents)
      .set({
        isRejectedLive: true,
        isLocked: false,
        violationMessage: null,
      })
      .where(eq(examStudents.id, requestId));

    // Use autosaved progress as the answers (whatever the student typed before force-submit)
    const savedProgress = (student.progress && typeof student.progress === "object" ? student.progress : {}) as Record<string, string>;
    await finalizeAttempt(requestId, savedProgress, "force");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject live error:", error);
    return NextResponse.json({ error: "Failed to reject student" }, { status: 500 });
  }
}