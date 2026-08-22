import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, examStudents, studentExamAttempts } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

type StudentRow = typeof examStudents.$inferSelect;
type AttemptRow = typeof studentExamAttempts.$inferSelect;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { examId } = await params;
    const body = await req.json();
    const { status, requestId } = body as {
      status: "in-progress" | "complete";
      requestId?: string;
    };

    const dbStatus = status === "complete" ? "complete" : "in_progress";

    const examRows = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    const exam = examRows[0];
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    if (requestId) {
      const rows: AttemptRow[] = await db
        .select()
        .from(studentExamAttempts)
        .where(eq(studentExamAttempts.examStudentId, requestId));
      const attemptIds = rows.map((r: AttemptRow) => r.id);
      if (attemptIds.length > 0) {
        await db
          .update(studentExamAttempts)
          .set({ gradingStatus: dbStatus })
          .where(inArray(studentExamAttempts.id, attemptIds));
      }
    } else {
      await db
        .update(exams)
        .set({ gradingStatus: dbStatus })
        .where(eq(exams.id, examId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set grading status error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}