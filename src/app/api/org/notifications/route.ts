import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";

type NotificationRow = typeof notifications.$inferSelect;

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatTime(date);
}

function categoryFromType(type: string) {
  if (type.includes("teacher")) return "Teacher Management";
  if (type.includes("exam")) return "Exam Management";
  if (type.includes("submission") || type.includes("grade")) return "Student Results";
  return "Organization";
}

function hrefFromEntity(type: string | null, id: string | null) {
  if (type === "exam" && id) return `/exams/${id}`;
  if (type === "teacher" && id) return `/teachers/${id}`;
  if (type === "subject" || type === "department") return "/academic-structure";
  return undefined;
}

export async function GET() {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = (await db
    .select()
    .from(notifications)
    .where(eq(notifications.orgId, session.userId))
    .orderBy(desc(notifications.createdAt))) as NotificationRow[];

  const payload = rows.map((notification) => ({
    id: notification.id,
    title: notification.title,
    description: notification.message,
    detail: notification.message,
    category: categoryFromType(notification.type),
    actor: "System",
    timestamp: formatTime(notification.createdAt),
    time: formatRelativeTime(notification.createdAt),
    type: notification.type,
    read: notification.isRead,
    archived: notification.isArchived,
    href: hrefFromEntity(notification.relatedEntityType, notification.relatedEntityId),
  }));

  return NextResponse.json({
    notifications: payload,
    counts: {
      unread: payload.filter((notification) => !notification.read && !notification.archived).length,
      archived: payload.filter((notification) => notification.archived).length,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action = typeof body.action === "string" ? body.action : "";

  if (action === "mark_all_read") {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.orgId, session.userId), eq(notifications.isArchived, false)));
    return NextResponse.json({ ok: true });
  }

  if (!id) {
    return NextResponse.json({ error: "Notification id is required." }, { status: 400 });
  }

  const updates: Partial<typeof notifications.$inferInsert> = {};
  if (action === "mark_read") {
    updates.isRead = true;
    updates.readAt = new Date();
  } else if (action === "archive") {
    updates.isArchived = true;
  } else if (action === "unarchive") {
    updates.isArchived = false;
  } else {
    return NextResponse.json({ error: "Unsupported notification action." }, { status: 400 });
  }

  await db
    .update(notifications)
    .set(updates)
    .where(and(eq(notifications.id, id), eq(notifications.orgId, session.userId)));

  return NextResponse.json({ ok: true });
}
