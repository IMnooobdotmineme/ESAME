// src/app/api/teacher/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { notifications, teachers } from "@/db/schema";
import { eq, desc, isNull, or, and } from "drizzle-orm";

type NotificationRow = typeof notifications.$inferSelect;

export async function GET(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;

    // Get the teacher's orgId to scope notifications properly
    const teacherRows = await db
      .select({ orgId: teachers.orgId })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (teacherRows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    const orgId = teacherRows[0].orgId;

    // Fetch notifications that are either:
    // 1. Directly assigned to this teacher, OR
    // 2. Broadcast to the teacher's organization (teacherId is null but orgId matches)
    const teacherNotifications: NotificationRow[] = await db
      .select()
      .from(notifications)
      .where(
        or(
          eq(notifications.teacherId, teacherId),
          and(
            isNull(notifications.teacherId),
            eq(notifications.orgId, orgId)
          )
        )
      )
      .orderBy(desc(notifications.createdAt));

    return NextResponse.json({
      notifications: teacherNotifications.map((n: NotificationRow) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt.toISOString(),
        type: n.type,
        read: n.isRead,
        archived: n.isArchived,
        roomCode: n.relatedEntityId || undefined,
      })),
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}