import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { notifications, teachers } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;
    const { id } = await params;

    // Get teacher's orgId for scoping
    const teacherRows = await db
      .select({ orgId: teachers.orgId })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (teacherRows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    const orgId = teacherRows[0].orgId;

    // Verify the notification belongs to this teacher or their org
    const updated = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          or(
            eq(notifications.teacherId, teacherId),
            and(
              isNull(notifications.teacherId),
              eq(notifications.orgId, orgId)
            )
          )
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}