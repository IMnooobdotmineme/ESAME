import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { examId } = await params;

  const [exam] = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)));
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const added = exam.pausedAt
    ? Math.floor((Date.now() - new Date(exam.pausedAt).getTime()) / 1000)
    : 0;

  await db
    .update(exams)
    .set({
      isPaused: false,
      pausedAt: null,
      pausedTotalSeconds: (exam.pausedTotalSeconds ?? 0) + added,
      updatedAt: new Date(),
    })
    .where(eq(exams.id, examId));

  return NextResponse.json({ success: true });
}