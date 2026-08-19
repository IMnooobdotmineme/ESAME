import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { departments, notifications, organizations, subjects, teachers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireOrgSession } from "../../../../lib/session";
import {
  sendInviteEmail,
  sendTeacherAssignmentEmail,
  sendTeacherStatusEmail,
  sendOrgTeacherDeletedEmail,
} from "../../../../lib/email";
import {
  formatJoinedDate,
  normalizeAssignments,
  normalizeTeacherStatus,
} from "@/lib/org-utils";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type AssignmentDepartmentRow = {
  id: string;
  name: string;
};

type AssignmentSubjectRow = {
  id: string;
  departmentId: string;
  name: string;
};

type TeacherListRow = {
  id: string;
  name: string | null;
  email: string;
  status: "invited" | "active" | "suspended" | "deleted";
  suspendedBy: string | null;
  deletedBy: string | null;
  deletedAt: Date | null;
  assignments: unknown;
  createdAt: Date;
};

function normalizeTeacher(row: typeof teachers.$inferSelect) {
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email,
    status: normalizeTeacherStatus(row.status),
    suspendedBy: (row.suspendedBy as "admin" | "org" | null) ?? null,
    deletedBy: (row.deletedBy as "admin" | "org" | null) ?? null,
    deletedAt: row.deletedAt ? new Date(row.deletedAt).toISOString() : null,
    assignments: normalizeAssignments(row.assignments),
    joined: formatJoinedDate(row.createdAt),
    createdAt: row.createdAt,
  };
}

async function createOrgNotification({
  orgId,
  title,
  message,
  type,
  relatedEntityId,
  relatedEntityType,
}: {
  orgId: string;
  title: string;
  message: string;
  type: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}) {
  await db.insert(notifications).values({
    orgId,
    title,
    message,
    type,
    relatedEntityId,
    relatedEntityType,
  });
}

async function resolveAssignments(orgId: string, raw: unknown) {
  if (!Array.isArray(raw)) return [];

  const [departmentRows, subjectRows] = await Promise.all([
    db.select().from(departments).where(eq(departments.orgId, orgId)),
    db.select().from(subjects).where(eq(subjects.orgId, orgId)),
  ]) as [AssignmentDepartmentRow[], AssignmentSubjectRow[]];

  const departmentById = new Map(departmentRows.map((department) => [department.id, department]));
  const departmentByName = new Map(
    departmentRows.map((department) => [department.name.trim().toLowerCase(), department])
  );
  const subjectById = new Map(subjectRows.map((subject) => [subject.id, subject]));
  const seen = new Set<string>();
  const resolved: Array<{ department: string; subject: string }> = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const departmentId = typeof item.departmentId === "string" ? item.departmentId.trim() : "";
    const subjectId = typeof item.subjectId === "string" ? item.subjectId.trim() : "";

    let department: AssignmentDepartmentRow | undefined;
    let subject: AssignmentSubjectRow | undefined;

    if (departmentId && subjectId) {
      department = departmentById.get(departmentId);
      subject = subjectById.get(subjectId);
      if (!department || !subject || subject.departmentId !== department.id) continue;
    } else {
      const departmentName =
        typeof item.department === "string" ? item.department.trim().toLowerCase() : "";
      const subjectName = typeof item.subject === "string" ? item.subject.trim().toLowerCase() : "";
      department = departmentByName.get(departmentName);
      subject = subjectRows.find(
        (candidate) =>
          candidate.departmentId === department?.id &&
          candidate.name.trim().toLowerCase() === subjectName
      );
      if (!department || !subject) continue;
    }

    const key = `${department.id}::${subject.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    resolved.push({ department: department.name, subject: subject.name });
  }

  return resolved;
}

export async function GET(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("id")?.trim();
  const teacherName = searchParams.get("name")?.trim();

  if (teacherId || teacherName) {
    const nameLower = teacherName?.toLowerCase() ?? "";
    const list = (await db
      .select({
        id: teachers.id,
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
      .where(eq(teachers.orgId, session.userId))) as TeacherListRow[];

    const teacher = teacherId
      ? list.find((entry) => entry.id === teacherId)
      : list.find(
          (entry) =>
            (entry.name ?? "").toLowerCase() === nameLower ||
            entry.email.toLowerCase() === nameLower
        );
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }

    return NextResponse.json({ teacher: normalizeTeacher(teacher as typeof teachers.$inferSelect) });
  }

  const list = (await db
    .select({
      id: teachers.id,
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
    .where(eq(teachers.orgId, session.userId))) as TeacherListRow[];

  return NextResponse.json({
    teachers: list.map((teacher) => normalizeTeacher(teacher as typeof teachers.$inferSelect)),
  });
}

export async function POST(req: Request) {
  try {
    const session = await requireOrgSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const rawAssignments = Array.isArray(body.assignments) ? body.assignments : [];

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedAssignments = await resolveAssignments(session.userId, rawAssignments);
    if (normalizedAssignments.length === 0) {
      return NextResponse.json({ error: "At least one department and subject is required." }, { status: 400 });
    }

    const [existingOrg] = await db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.email, email));

    if (existingOrg) {
      return NextResponse.json(
        { error: "This email is registered as an organization account and cannot be invited as a teacher." },
        { status: 409 }
      );
    }

    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, email));

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.userId));

    if (existingTeacher) {
      if (existingTeacher.orgId !== session.userId) {
        return NextResponse.json(
          {
            error:
              "This email is already associated with another organization. Each teacher account can belong to only one organization.",
          },
          { status: 409 }
        );
      }
      if (existingTeacher.status !== "deleted") {
        return NextResponse.json(
          { error: "A teacher with this email already exists in your organization." },
          { status: 409 }
        );
      }

      // If previously deleted within this organization, allow re-inviting
      const inviteToken = crypto.randomBytes(32).toString("hex");
      const [updated] = await db
        .update(teachers)
        .set({
          name: name || existingTeacher.name,
          status: "invited",
          suspendedBy: null,
          deletedBy: null,
          deletedAt: null,
          assignments: normalizedAssignments,
          inviteToken,
          inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, existingTeacher.id))
        .returning();

      const link = `${process.env.APP_URL || "http://localhost:3000"}/accept-invite?token=${inviteToken}`;
      try {
        await sendInviteEmail(email, link, org?.name || "your organization", normalizedAssignments);
      } catch (mailError) {
        console.error("send invite email error", mailError);
        return NextResponse.json(
          { error: "Invitation email could not be sent. Please check email settings and try again." },
          { status: 502 }
        );
      }

      await createOrgNotification({
        orgId: session.userId,
        title: "Teacher Invitation Sent",
        message: `${name || email} was invited to join ${org?.name || "your organization"} as a teacher.`,
        type: "teacher_invite_sent",
        relatedEntityId: updated.id,
        relatedEntityType: "teacher",
      });

      return NextResponse.json({
        ok: true,
        teacher: normalizeTeacher(updated),
      });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");

    const [teacher] = await db
      .insert(teachers)
      .values({
        orgId: session.userId,
        email,
        name: name || null,
        status: "invited",
        assignments: normalizedAssignments,
        inviteToken,
        inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
      })
      .returning();

    const link = `${process.env.APP_URL || "http://localhost:3000"}/accept-invite?token=${inviteToken}`;
    try {
      await sendInviteEmail(email, link, org?.name || "your organization", normalizedAssignments);
    } catch (mailError) {
      await db.delete(teachers).where(eq(teachers.id, teacher.id));
      console.error("send invite email error", mailError);
      return NextResponse.json(
        { error: "Invitation email could not be sent. Please check email settings and try again." },
        { status: 502 }
      );
    }

    await createOrgNotification({
      orgId: session.userId,
      title: "Teacher Invitation Sent",
      message: `${name || email} was invited to join ${org?.name || "your organization"} as a teacher.`,
      type: "teacher_invite_sent",
      relatedEntityId: teacher.id,
      relatedEntityType: "teacher",
    });

    return NextResponse.json({
      ok: true,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        status: normalizeTeacherStatus(teacher.status),
        assignments: normalizeAssignments(teacher.assignments),
      },
    });
  } catch (error) {
    console.error("invite teacher error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireOrgSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const teacherId = String(body.teacherId ?? "");
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher is required." }, { status: 400 });
    }

    const [teacher] = await db
      .select({
        id: teachers.id,
        email: teachers.email,
        status: teachers.status,
        suspendedBy: teachers.suspendedBy,
        assignments: teachers.assignments,
        name: teachers.name,
        orgId: teachers.orgId,
      })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher || teacher.orgId !== session.userId) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    let orgName = "your organization";
    const [org] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, session.userId));
    if (org) orgName = org.name;

    if (typeof body.status === "string") {
      if (body.status === "Active") {
        if (teacher.status === "suspended" && teacher.suspendedBy === "admin") {
          return NextResponse.json(
            {
              error:
                "This teacher account was suspended by the platform administrator and can only be reactivated by an administrator.",
            },
            { status: 403 }
          );
        }
        updates.status = "active";
        updates.suspendedBy = null;
      } else if (body.status === "Suspended") {
        updates.status = "suspended";
        updates.suspendedBy = "org";
      } else {
        updates.status = "invited";
      }
    }

    if (Array.isArray(body.assignments)) {
      const nextAssignments = await resolveAssignments(session.userId, body.assignments);
      if (nextAssignments.length === 0) {
        return NextResponse.json({ error: "At least one department and subject is required." }, { status: 400 });
      }
      updates.assignments = nextAssignments;
    }

    const [updatedTeacher] = await db
      .update(teachers)
      .set(updates)
      .where(and(eq(teachers.id, teacherId), eq(teachers.orgId, session.userId)))
      .returning();

    if (typeof body.status === "string") {
      const nextStatus = updatedTeacher.status;
      if (nextStatus === "active" || nextStatus === "suspended") {
        sendTeacherStatusEmail(teacher.email, orgName, nextStatus).catch((error) => {
          console.error("send teacher status email error", error);
        });
      }
      await createOrgNotification({
        orgId: session.userId,
        title: nextStatus === "active" ? "Teacher Activated" : "Teacher Suspended",
        message: `${teacher.name || teacher.email} was ${nextStatus === "active" ? "activated" : "suspended"}.`,
        type: nextStatus === "active" ? "teacher_activated" : "teacher_suspended",
        relatedEntityId: teacher.id,
        relatedEntityType: "teacher",
      });
    }

    if (Array.isArray(body.assignments)) {
      sendTeacherAssignmentEmail(
        teacher.email,
        orgName,
        normalizeAssignments(updatedTeacher.assignments),
        normalizeAssignments(teacher.assignments)
      ).catch((error) => {
        console.error("send teacher assignment email error", error);
      });
      await createOrgNotification({
        orgId: session.userId,
        title: "Teacher Assignments Updated",
        message: `${teacher.name || teacher.email}'s department and subject assignments were updated.`,
        type: "teacher_assignments_updated",
        relatedEntityId: teacher.id,
        relatedEntityType: "teacher",
      });
    }

    return NextResponse.json({
      ok: true,
      teacher: {
        id: updatedTeacher.id,
        email: updatedTeacher.email,
        status: normalizeTeacherStatus(updatedTeacher.status),
        assignments: normalizeAssignments(updatedTeacher.assignments),
      },
    });
  } catch (error) {
    console.error("update teacher error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireOrgSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teacherId } = await req.json();
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher is required." }, { status: 400 });
    }

    const [teacher] = await db
      .select({ id: teachers.id, orgId: teachers.orgId, email: teachers.email, name: teachers.name })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher || teacher.orgId !== session.userId) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }

    let orgName = "your organization";
    const [org] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, session.userId));
    if (org) orgName = org.name;

    // Soft-delete teacher account so questions, exams and student results remain preserved!
    await db
      .update(teachers)
      .set({
        status: "deleted",
        deletedBy: "org",
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, teacherId));

    sendOrgTeacherDeletedEmail(teacher.email, orgName).catch((error) => {
      console.error("send teacher deleted email error", error);
    });

    await createOrgNotification({
      orgId: session.userId,
      title: "Teacher Removed",
      message: `${teacher.name || teacher.email} was removed from your active teacher roster.`,
      type: "teacher_removed",
      relatedEntityId: teacherId,
      relatedEntityType: "teacher",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete teacher error", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
