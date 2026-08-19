import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  broadcasts,
  organizations,
  teachers,
  notifications,
  activityLogs,
  examStudents,
} from "@/db/schema";
import { desc, eq, inArray, ne, countDistinct } from "drizzle-orm";

export const dynamic = "force-dynamic";

function formatSentAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export async function GET() {
  try {
    const [orgRows, teacherRows, studentCountResult, broadcastRows] = await Promise.all([
      db
        .select({
          id: organizations.id,
          name: organizations.name,
          email: organizations.email,
          status: organizations.status,
        })
        .from(organizations)
        .where(ne(organizations.status, "suspended"))
        .orderBy(organizations.name),
      db
        .select({
          id: teachers.id,
          name: teachers.name,
          email: teachers.email,
          orgId: teachers.orgId,
          status: teachers.status,
        })
        .from(teachers)
        .where(ne(teachers.status, "deleted"))
        .orderBy(teachers.name),
      db.select({ count: countDistinct(examStudents.studentEmail) }).from(examStudents),
      db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt)),
    ]);

    const orgMap = new Map<string, string>();
    for (const org of orgRows) {
      orgMap.set(org.id, org.name);
    }

    const orgTeacherCount = new Map<string, number>();
    for (const t of teacherRows) {
      orgTeacherCount.set(t.orgId, (orgTeacherCount.get(t.orgId) ?? 0) + 1);
    }

    const orgDirectory = orgRows.map((org: typeof orgRows[0]) => ({
      id: org.id,
      name: org.name,
      email: org.email,
      teachersCount: orgTeacherCount.get(org.id) ?? 0,
    }));

    const teacherDirectory = teacherRows.map((t: typeof teacherRows[0]) => ({
      id: t.id,
      name: t.name || t.email,
      email: t.email,
      orgId: t.orgId,
      orgName: orgMap.get(t.orgId) || "Organization",
    }));

    const totalStudents = Number(studentCountResult[0]?.count ?? 0);
    const totalTeachers = teacherRows.length;
    const totalOrgs = orgRows.length;
    const allUsersTotal = totalOrgs + totalTeachers + totalStudents;

    const formattedBroadcasts = broadcastRows.map((b: typeof broadcastRows[0]) => ({
      id: b.id,
      subject: b.subject,
      message: b.message,
      audience: b.audience,
      audienceLabel: b.audienceLabel,
      recipients: b.recipientsCount,
      priority: (b.priority === "urgent" ? "urgent" : "normal") as "normal" | "urgent",
      isArchived: b.isArchived,
      sentAt: formatSentAt(b.createdAt),
    }));

    return NextResponse.json({
      directories: {
        organizations: orgDirectory,
        teachers: teacherDirectory,
        totals: {
          organizations: totalOrgs,
          teachers: totalTeachers,
          students: totalStudents,
          allUsers: allUsersTotal > 0 ? allUsersTotal : totalOrgs + totalTeachers,
        },
      },
      broadcasts: formattedBroadcasts,
    });
  } catch (error) {
    console.error("Admin broadcast GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load broadcast data." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const audience = String(body.audience ?? "").trim(); // "all_users" | "all_organizations" | "all_teachers" | "specific_organization" | "specific_teacher"
    const targetOrgId = body.orgId ? String(body.orgId).trim() : null;
    const targetTeacherId = body.teacherId ? String(body.teacherId).trim() : null;
    const priority = body.priority === "urgent" ? "urgent" : "normal";

    if (!subject || !message || !audience) {
      return NextResponse.json(
        { error: "Subject, message, and audience are required." },
        { status: 400 }
      );
    }

    const [orgRows, teacherRows, studentCountResult] = await Promise.all([
      db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(ne(organizations.status, "suspended")),
      db
        .select({ id: teachers.id, name: teachers.name, email: teachers.email, orgId: teachers.orgId })
        .from(teachers)
        .where(ne(teachers.status, "deleted")),
      db.select({ count: countDistinct(examStudents.studentEmail) }).from(examStudents),
    ]);

    const orgMap = new Map<string, string>();
    for (const o of orgRows) {
      orgMap.set(o.id, o.name);
    }

    let audienceLabel = "All Users";
    let recipientCount = 0;

    if (audience === "all_users") {
      audienceLabel = "All Users";
      const totalStudents = Number(studentCountResult[0]?.count ?? 0);
      recipientCount = orgRows.length + teacherRows.length + totalStudents;
    } else if (audience === "all_organizations") {
      audienceLabel = "All Organizations";
      recipientCount = orgRows.length;
    } else if (audience === "all_teachers") {
      audienceLabel = "All Teachers";
      recipientCount = teacherRows.length;
    } else if (audience === "specific_organization") {
      if (!targetOrgId) {
        return NextResponse.json({ error: "Organization is required." }, { status: 400 });
      }
      const orgName = orgMap.get(targetOrgId) || "Selected Organization";
      audienceLabel = `Org: ${orgName}`;
      const orgTeachers = teacherRows.filter((t: typeof teacherRows[0]) => t.orgId === targetOrgId);
      recipientCount = orgTeachers.length + 1;
    } else if (audience === "specific_teacher") {
      if (!targetTeacherId) {
        return NextResponse.json({ error: "Teacher is required." }, { status: 400 });
      }
      const teacher = teacherRows.find((t: typeof teacherRows[0]) => t.id === targetTeacherId);
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
      }
      audienceLabel = `Teacher: ${teacher.name || teacher.email}`;
      recipientCount = 1;
    }

    // 1. Insert broadcast record first
    const [inserted] = await db
      .insert(broadcasts)
      .values({
        subject,
        message,
        audience,
        targetOrgId,
        targetTeacherId,
        audienceLabel,
        recipientsCount: recipientCount,
        priority,
        isArchived: false,
      })
      .returning();

    // 2. Build explicit notification records for each targeted recipient
    const notifValues: Array<{
      orgId: string;
      teacherId: string | null;
      title: string;
      message: string;
      type: string;
      relatedEntityId: string;
      relatedEntityType: string;
    }> = [];

    if (audience === "all_users") {
      // All organizations
      for (const org of orgRows) {
        notifValues.push({
          orgId: org.id,
          teacherId: null,
          title: subject,
          message,
          type: "admin_broadcast",
          relatedEntityId: inserted.id,
          relatedEntityType: "broadcast",
        });
      }
      // All teachers
      for (const teacher of teacherRows) {
        notifValues.push({
          orgId: teacher.orgId,
          teacherId: teacher.id,
          title: subject,
          message,
          type: "admin_broadcast",
          relatedEntityId: inserted.id,
          relatedEntityType: "broadcast",
        });
      }
    } else if (audience === "all_organizations") {
      for (const org of orgRows) {
        notifValues.push({
          orgId: org.id,
          teacherId: null,
          title: subject,
          message,
          type: "admin_broadcast",
          relatedEntityId: inserted.id,
          relatedEntityType: "broadcast",
        });
      }
    } else if (audience === "all_teachers") {
      for (const teacher of teacherRows) {
        notifValues.push({
          orgId: teacher.orgId,
          teacherId: teacher.id,
          title: subject,
          message,
          type: "admin_broadcast",
          relatedEntityId: inserted.id,
          relatedEntityType: "broadcast",
        });
      }
    } else if (audience === "specific_organization") {
      notifValues.push({
        orgId: targetOrgId!,
        teacherId: null,
        title: subject,
        message,
        type: "admin_broadcast",
        relatedEntityId: inserted.id,
        relatedEntityType: "broadcast",
      });
      const orgTeachers = teacherRows.filter((t: typeof teacherRows[0]) => t.orgId === targetOrgId);
      for (const t of orgTeachers) {
        notifValues.push({
          orgId: targetOrgId!,
          teacherId: t.id,
          title: subject,
          message,
          type: "admin_broadcast",
          relatedEntityId: inserted.id,
          relatedEntityType: "broadcast",
        });
      }
    } else if (audience === "specific_teacher") {
      const teacher = teacherRows.find((t: typeof teacherRows[0]) => t.id === targetTeacherId);
      if (teacher) {
        notifValues.push({
          orgId: teacher.orgId,
          teacherId: teacher.id,
          title: subject,
          message,
          type: "admin_broadcast",
          relatedEntityId: inserted.id,
          relatedEntityType: "broadcast",
        });
      }
    }

    // 3. Batch insert notifications into DB
    if (notifValues.length > 0) {
      try {
        await db.insert(notifications).values(notifValues);
      } catch (err) {
        console.error("Failed to insert broadcast notifications:", err);
      }
    }

    // 4. Log admin activity
    try {
      await db.insert(activityLogs).values({
        userType: "admin",
        action: "broadcast_sent",
        entityType: "system",
        entityId: inserted.id,
        details: {
          subject,
          audienceLabel,
          recipientsCount: recipientCount,
          priority,
          event: `Broadcast announcement "${subject}" sent to ${audienceLabel}`,
        },
      });
    } catch (err) {
      console.error("Failed to log broadcast activity:", err);
    }

    return NextResponse.json({
      ok: true,
      broadcast: {
        id: inserted.id,
        subject: inserted.subject,
        message: inserted.message,
        audience: inserted.audience,
        audienceLabel: inserted.audienceLabel,
        recipients: inserted.recipientsCount,
        priority: inserted.priority as "normal" | "urgent",
        isArchived: inserted.isArchived,
        sentAt: formatSentAt(inserted.createdAt),
      },
    });
  } catch (error) {
    console.error("Admin broadcast POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send broadcast." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const action = String(body.action ?? "").trim();
    const id = body.id ? String(body.id).trim() : null;

    if (action === "archive_all") {
      await db
        .update(broadcasts)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(broadcasts.isArchived, false));
      return NextResponse.json({ ok: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Broadcast ID is required." }, { status: 400 });
    }

    if (action === "archive") {
      await db
        .update(broadcasts)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(broadcasts.id, id));
      return NextResponse.json({ ok: true });
    }

    if (action === "unarchive") {
      await db
        .update(broadcasts)
        .set({ isArchived: false, updatedAt: new Date() })
        .where(eq(broadcasts.id, id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Admin broadcast PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update broadcast status." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = String(body.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Broadcast ID is required." }, { status: 400 });
    }

    await db.delete(broadcasts).where(eq(broadcasts.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin broadcast DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete broadcast." },
      { status: 500 }
    );
  }
}
