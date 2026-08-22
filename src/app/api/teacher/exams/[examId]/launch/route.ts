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

    if (existing.isLaunched) {
      return NextResponse.json({
        success: true,
        roomCode: existing.examCode,
      });
    }

    // Generate unique 6-char room code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let roomCode = "";
    let isUnique = false;
    while (!isUnique) {
      roomCode = "";
      for (let i = 0; i < 6; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const [dup] = await db.select().from(exams).where(eq(exams.examCode, roomCode));
      isUnique = !dup;
    }

    await db.update(exams).set({
      examCode: roomCode,
      isLaunched: true,
      updatedAt: new Date(),
    }).where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));

    return NextResponse.json({ success: true, roomCode });
  } catch (error) {
    console.error("Launch exam error:", error);
    return NextResponse.json({ error: "Failed to launch exam" }, { status: 500 });
  }
}