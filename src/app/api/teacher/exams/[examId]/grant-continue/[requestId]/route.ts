import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, examStudents } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string; requestId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { examId, requestId } = await params;

    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Unlock the student so they can continue the exam
    await db
      .update(examStudents)
      .set({ isLocked: false })
      .where(and(eq(examStudents.id, requestId), eq(examStudents.examId, examId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to grant continue" }, { status: 500 });
  }
}