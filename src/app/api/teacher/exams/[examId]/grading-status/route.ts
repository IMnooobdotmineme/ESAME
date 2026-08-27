import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { examId } = await params;
  const body = await req.json().catch(() => ({}));
  const gradingStatus = body.status === "complete" ? "complete" : "in_progress";

  const [updated] = await db
    .update(exams)
    .set({ gradingStatus })
    .where(and(eq(exams.id, examId), eq(exams.teacherId, session.userId)))
    .returning({ id: exams.id, gradingStatus: exams.gradingStatus });

  if (!updated) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, gradingStatus: updated.gradingStatus });
}