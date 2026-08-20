import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, exams, examStudents, notifications } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import {
  sendAdminTeacherDeletedEmail,
  sendAdminTeacherStatusEmail,
} from "@/lib/email";
import { formatJoinedDate, normalizeAssignments } from "@/lib/org-utils";
import { requireAdminSession } from "@/lib/session";
import { logTeacherActivated, logTeacherDeleted, logTeacherSuspended } from "@/lib/logs";

export const dynamic = "force-dynamic";

function generateOrgCode(name: string, id: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const prefix = parts.length > 1
    ? parts.map((p) => p[0]).join("").slice(0, 4).toUpperCase()
    : name.slice(0, 4).toUpperCase();
  const suffix = id.slice(0, 4).toUpperCase();
  return `${prefix}-${suffix}`;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;

    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
        status: organizations.status,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const [teacherRows, examRows] = await Promise.all([
      db
        .select({
          id: teachers.id,
          orgId: teachers.orgId,
          name: teachers.name,
          email: teachers.email,
          status: teachers.status,
          suspendedBy: teachers.suspendedBy,
          deletedBy: teachers.deletedBy,
          deletedAt: teachers.deletedAt,
          assignments: teachers.assignments,
          createdAt: teachers.createdAt,
        })
        .from(teachers)
        .where(eq(teachers.orgId, orgId))
        .orderBy(desc(teachers.createdAt)),
      db
        .select({
          id: exams.id,
          status: exams.status,
        })
        .from(exams)
        .where(eq(exams.orgId, orgId)),
    ]);

    const activeExamIds = examRows
      .filter((e: { status: string }) => e.status === "in_progress")
      .map((e: { id: string }) => e.id);

    const liveStudentRows =
      activeExamIds.length > 0
        ? await db
            .select({
              id: examStudents.id,
              startedAt: examStudents.startedAt,
              completedAt: examStudents.completedAt,
            })
            .from(examStudents)
            .where(inArray(examStudents.examId, activeExamIds))
        : [];

    const liveExaminers = liveStudentRows.filter(
      (s: { startedAt: Date | null; completedAt: Date | null }) => s.startedAt && !s.completedAt
    ).length;

    const teachersPayload = teacherRows.map((t: typeof teacherRows[0]) => {
      const assignments = normalizeAssignments(t.assignments);
      const departments = Array.from(new Set(assignments.map((a: { department: string }) => a.department))).filter(Boolean);
      const subjects = Array.from(new Set(assignments.map((a: { subject: string }) => a.subject))).filter(Boolean);

      let statusDisplay: "Active" | "Suspended" | "Pending" | "Deleted" = "Active";
      if (t.status === "deleted") statusDisplay = "Deleted";
      else if (t.status === "suspended") statusDisplay = "Suspended";
      else if (t.status === "invited") statusDisplay = "Pending";

      return {
        id: t.id,
        name: t.name || t.email,
        email: t.email,
        departments: departments.length > 0 ? departments : ["Unassigned"],
        subjects: subjects.length > 0 ? subjects : ["Unassigned"],
        status: statusDisplay,
        suspendedBy: (t.suspendedBy as "admin" | "org" | null) ?? null,
        deletedBy: (t.deletedBy as "admin" | "org" | null) ?? null,
        deletedAt: t.deletedAt ? new Date(t.deletedAt).toISOString() : null,
        joinedDate: formatJoinedDate(t.createdAt),
      };
    });

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        code: generateOrgCode(org.name, org.id),
        status: org.status,
        liveExaminers,
        liveExams: activeExamIds.length,
        totalTeachers: teacherRows.filter((t: { status: string }) => t.status !== "deleted").length,
      },
      teachers: teachersPayload,
    });
  } catch (error) {
    console.error("Admin org teachers GET error:", error);
    return NextResponse.json(
      { error: "Failed to load teacher roster." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const body = await req.json();
    const teacherId = String(body.teacherId ?? "").trim();
    const requestedStatus = String(body.status ?? "").trim(); // "Active" | "Suspended"

    if (!teacherId || (requestedStatus !== "Active" && requestedStatus !== "Suspended")) {
      return NextResponse.json({ error: "Invalid teacher ID or status." }, { status: 400 });
    }

    const [org] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher || teacher.orgId !== orgId) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }

    const teacherDisplayName = teacher.name || teacher.email;

    if (requestedStatus === "Suspended") {
      await db
        .update(teachers)
        .set({
          status: "suspended",
          suspendedBy: "admin",
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, teacherId));

      // Send real email to teacher (no email to org)
      sendAdminTeacherStatusEmail(teacher.email, org.name, "suspended").catch((err) =>
        console.error("sendAdminTeacherStatusEmail error:", err)
      );

      // Create in-app notification for Org account
      try {
        await db.insert(notifications).values({
          orgId: org.id,
          title: "Teacher Suspended by Admin",
          message: `${teacherDisplayName} has been suspended by admin.`,
          type: "teacher_suspended_by_admin",
          relatedEntityId: teacher.id,
          relatedEntityType: "teacher",
        });
      } catch (notifErr) {
        console.error("Failed to insert notification for org:", notifErr);
      }

      // Log activity — uses the catalog's "teacher_suspended" action (admin-initiated),
      // which sets group="user", severity, actorLabel, and orgLabel correctly.
      try {
        await logTeacherSuspended(teacher.id, teacherDisplayName, org.id, org.name, "admin");
      } catch (logErr) {
        console.error("Failed to insert activity log:", logErr);
      }
    } else {
      await db
        .update(teachers)
        .set({
          status: "active",
          suspendedBy: null,
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, teacherId));

      // Send real email to teacher
      sendAdminTeacherStatusEmail(teacher.email, org.name, "active").catch((err) =>
        console.error("sendAdminTeacherStatusEmail error:", err)
      );

      // Create in-app notification for Org account
      try {
        await db.insert(notifications).values({
          orgId: org.id,
          title: "Teacher Activated by Admin",
          message: `${teacherDisplayName} has been activated by admin.`,
          type: "teacher_activated_by_admin",
          relatedEntityId: teacher.id,
          relatedEntityType: "teacher",
        });
      } catch (notifErr) {
        console.error("Failed to insert notification for org:", notifErr);
      }

      // Log activity
      try {
        await logTeacherActivated(teacher.id, teacherDisplayName, org.id, org.name, "admin");
      } catch (logErr) {
        console.error("Failed to insert activity log:", logErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin org teachers PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update teacher status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = await context.params;
    const body = await req.json();
    const teacherId = String(body.teacherId ?? "").trim();

    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required." }, { status: 400 });
    }

    const [org] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher || teacher.orgId !== orgId) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }

    const teacherDisplayName = teacher.name || teacher.email;

    // Soft-delete teacher so exam questions, assignments, and student attempts remain preserved!
    await db
      .update(teachers)
      .set({
        status: "deleted",
        deletedBy: "admin",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    // Send real email to teacher (no email to org)
    sendAdminTeacherDeletedEmail(teacher.email, org.name).catch((err) =>
      console.error("sendAdminTeacherDeletedEmail error:", err)
    );

    // Create in-app notification for Org account
    try {
      await db.insert(notifications).values({
        orgId: org.id,
        title: "Teacher Deleted by Admin",
        message: `${teacherDisplayName} has been deleted by admin.`,
        type: "teacher_deleted_by_admin",
        relatedEntityId: teacher.id,
        relatedEntityType: "teacher",
      });
    } catch (notifErr) {
      console.error("Failed to insert notification for org:", notifErr);
    }

    // Log activity
    try {
      await logTeacherDeleted(teacher.id, teacherDisplayName, org.id, org.name, "admin");
    } catch (logErr) {
      console.error("Failed to insert activity log:", logErr);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin org teachers DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete teacher." },
      { status: 500 }
    );
  }
}