import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { exams, departments, subjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
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

    if (existing.status === "in_progress") {
      return NextResponse.json(
        { success: false, message: "This exam is live. End the session first." },
        { status: 400 }
      );
    }
    if (existing.status === "completed") {
      return NextResponse.json(
        { success: false, message: "Completed exams cannot be edited." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.durationMinutes !== undefined) updateData.durationMinutes = body.durationMinutes;
    if (body.questionCount !== undefined) updateData.totalQuestions = body.questionCount;
    if (body.parts !== undefined) updateData.parts = body.parts;
    if (body.startDate !== undefined) {
      updateData.scheduledDate = body.startDate ? new Date(body.startDate) : null;
    }

    if (body.department !== undefined) {
      const [dept] = await db.select().from(departments)
        .where(and(eq(departments.orgId, existing.orgId), eq(departments.name, body.department)));
      if (dept) {
        updateData.departmentId = dept.id;
        if (body.subject !== undefined) {
          const [subj] = await db.select().from(subjects)
            .where(and(eq(subjects.departmentId, dept.id), eq(subjects.name, body.subject)));
          if (subj) updateData.subjectId = subj.id;
        }
      }
    }

    await db.update(exams).set(updateData)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update exam error:", error);
    return NextResponse.json({ success: false, message: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(
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

    if (existing.status === "in_progress") {
      return NextResponse.json({ error: "Cannot delete a live exam" }, { status: 400 });
    }

    await db.delete(exams)
      .where(and(eq(exams.id, examId), eq(exams.teacherId, teacherId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete exam error:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}