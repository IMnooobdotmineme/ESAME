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

  try {
    const { examId } = await params;
    const teacherId = session.userId;

    const [existing] = await db.select().from(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));
    if (!existing) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Check if another exam is already live
    const [alreadyLive] = await db.select().from(exams)
      .where(and(eq(exams.teacherId, teacherId), eq(exams.status, "in_progress")));

    if (alreadyLive && alreadyLive.id !== examId) {
      return NextResponse.json({
        success: false,
        message: `"${alreadyLive.title}" is already live. End that session first.`,
      }, { status: 400 });
    }

    await db.update(exams).set({
      status: "in_progress",
      isLaunched: true,
      isPaused: false,
      startTime: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Start exam error:", error);
    return NextResponse.json({ success: false, message: "Failed to start exam" }, { status: 500 });
  }
}