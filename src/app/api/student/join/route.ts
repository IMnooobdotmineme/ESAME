import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, examStudents, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roomCode = String(body.roomCode ?? "").trim().toUpperCase();
    const studentName = String(body.studentName ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    if (!roomCode || !studentName || !studentId) return NextResponse.json({ message: "Please fill in all fields." }, { status: 400 });

    const [exam] = await db.select().from(exams).where(eq(exams.examCode, roomCode));
    if (!exam || !exam.isLaunched) return NextResponse.json({ message: "Invalid room code. Check with your teacher." }, { status: 404 });
    if (exam.status === "completed") return NextResponse.json({ message: "This exam has already ended." }, { status: 400 });

    const [existing] = await db.select().from(examStudents).where(and(eq(examStudents.examId, exam.id), eq(examStudents.studentId, studentId)));
    if (existing) {
      if (existing.status === "rejected") return NextResponse.json({ message: "Your request to join was declined by the teacher." }, { status: 403 });
      return NextResponse.json({ success: true, requestId: existing.id, status: existing.status });
    }

    const [row] = await db.insert(examStudents).values({ examId: exam.id, studentId, studentName, status: "pending" }).returning();
    await db.insert(notifications).values({
      orgId: exam.orgId, teacherId: exam.teacherId,
      title: "New Join Request",
      message: `${studentName} (${studentId}) requested to join "${exam.title}".`,
      type: "request", relatedEntityId: exam.id, relatedEntityType: "exam",
    });
    return NextResponse.json({ success: true, requestId: row.id, status: "pending" });
  } catch (error) {
    console.error("Student join error:", error);
    return NextResponse.json({ message: "Failed to join. Try again." }, { status: 500 });
  }
}