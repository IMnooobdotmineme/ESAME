import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { notifications, teachers } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;

    const teacherRows = await db
      .select({ orgId: teachers.orgId })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (teacherRows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    const orgId = teacherRows[0].orgId;

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        or(
          eq(notifications.teacherId, teacherId),
          and(
            isNull(notifications.teacherId),
            eq(notifications.orgId, orgId)
          )
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark all as read error:", error);
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 });
  }
}