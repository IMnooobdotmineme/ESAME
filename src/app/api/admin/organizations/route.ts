import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, exams, examStudents, activityLogs } from "@/db/schema";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import {
  sendOrgActivatedEmail,
  sendOrgDeletedEmail,
  sendOrgSuspendedEmail,
  sendTeacherOrgActivatedEmail,
  sendTeacherOrgDeletedEmail,
  sendTeacherOrgSuspendedEmail,
} from "@/lib/email";

export const dynamic = "force-dynamic";

function generateOrgCode(name: string, id: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const prefix = parts.length > 1
    ? parts.map((p) => p[0]).join("").slice(0, 4).toUpperCase()
    : name.slice(0, 4).toUpperCase();
  const suffix = id.slice(0, 4).toUpperCase();
  return `${prefix}-${suffix}`;
}

export async function GET() {
  try {
    const orgRows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
        status: organizations.status,
        orgType: organizations.orgType,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    const orgIds = orgRows.map((o: { id: string }) => o.id);

    const [teacherRows, examRows] = await Promise.all([
      orgIds.length > 0
        ? db
            .select({
              id: teachers.id,
              orgId: teachers.orgId,
              status: teachers.status,
            })
            .from(teachers)
            .where(inArray(teachers.orgId, orgIds))
        : [],
      orgIds.length > 0
        ? db
            .select({
              id: exams.id,
              orgId: exams.orgId,
              status: exams.status,
            })
            .from(exams)
            .where(inArray(exams.orgId, orgIds))
        : [],
    ]);

    const activeExamIds = examRows
      .filter((e: { status: string }) => e.status === "in_progress")
      .map((e: { id: string }) => e.id);

    const liveStudentRows =
      activeExamIds.length > 0
        ? await db
            .select({
              id: examStudents.id,
              examId: examStudents.examId,
              startedAt: examStudents.startedAt,
              completedAt: examStudents.completedAt,
            })
            .from(examStudents)
            .where(inArray(examStudents.examId, activeExamIds))
        : [];

    const examToOrg = new Map<string, string>();
    for (const e of examRows) {
      examToOrg.set(e.id, e.orgId);
    }

    const liveExaminersByOrg = new Map<string, number>();
    for (const student of liveStudentRows) {
      if (student.startedAt && !student.completedAt) {
        const orgId = examToOrg.get(student.examId);
        if (orgId) {
          liveExaminersByOrg.set(orgId, (liveExaminersByOrg.get(orgId) ?? 0) + 1);
        }
      }
    }

    const payload = orgRows.map((org: typeof orgRows[0]) => {
      const orgTeachers = teacherRows.filter((t: { orgId: string; status: string }) => t.orgId === org.id && t.status !== "deleted");
      const orgLiveExams = examRows.filter((e: { orgId: string; status: string }) => e.orgId === org.id && e.status === "in_progress");
      const liveExaminers = liveExaminersByOrg.get(org.id) ?? 0;

      return {
        id: org.id,
        name: org.name,
        code: generateOrgCode(org.name, org.id),
        email: org.email,
        status: (org.status === "suspended" ? "Suspended" : "Active") as "Active" | "Suspended",
        teachersCount: orgTeachers.length,
        liveExaminers,
        liveExams: orgLiveExams.length,
      };
    });

    return NextResponse.json({ organizations: payload });
  } catch (error) {
    console.error("Admin organizations GET error:", error);
    return NextResponse.json(
      { error: "Failed to load organizations." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const orgId = String(body.orgId ?? "").trim();
    const requestedStatus = String(body.status ?? "").trim(); // "Active" | "Suspended"

    if (!orgId || (requestedStatus !== "Active" && requestedStatus !== "Suspended")) {
      return NextResponse.json(
        { error: "Invalid organization ID or status." },
        { status: 400 }
      );
    }

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

    const newDbStatus = requestedStatus === "Suspended" ? "suspended" : "active";
    await db
      .update(organizations)
      .set({ status: newDbStatus, updatedAt: new Date() })
      .where(eq(organizations.id, orgId));

    // Fetch teachers to notify
    const teacherRows = await db
      .select({ id: teachers.id, email: teachers.email, name: teachers.name })
      .from(teachers)
      .where(and(eq(teachers.orgId, orgId), ne(teachers.status, "deleted")));

    if (newDbStatus === "suspended") {
      // 1. Send email to Org
      sendOrgSuspendedEmail(org.email, org.name).catch((err) =>
        console.error("sendOrgSuspendedEmail error:", err)
      );

      // 2. Send email to all teachers under this org
      for (const t of teacherRows) {
        sendTeacherOrgSuspendedEmail(t.email, org.name).catch((err) =>
          console.error("sendTeacherOrgSuspendedEmail error:", err)
        );
      }

      // 3. Log activity
      await db.insert(activityLogs).values({
        orgId: org.id,
        userType: "admin",
        action: "org_suspended",
        entityType: "org",
        entityId: org.id,
        details: {
          orgName: org.name,
          event: `Organization "${org.name}" suspended by admin`,
          message: `Organization "${org.name}" and ${teacherRows.length} teacher accounts frozen by admin`,
        },
      });
    } else {
      // 1. Send email to Org
      sendOrgActivatedEmail(org.email, org.name).catch((err) =>
        console.error("sendOrgActivatedEmail error:", err)
      );

      // 2. Send email to all teachers under this org
      for (const t of teacherRows) {
        sendTeacherOrgActivatedEmail(t.email, org.name).catch((err) =>
          console.error("sendTeacherOrgActivatedEmail error:", err)
        );
      }

      // 3. Log activity
      await db.insert(activityLogs).values({
        orgId: org.id,
        userType: "admin",
        action: "org_activated",
        entityType: "org",
        entityId: org.id,
        details: {
          orgName: org.name,
          event: `Organization "${org.name}" activated by admin`,
          message: `Organization "${org.name}" and its teacher accounts un-frozen by admin`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      org: {
        id: org.id,
        status: requestedStatus,
      },
    });
  } catch (error) {
    console.error("Admin organizations PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update organization status." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const orgId = String(body.orgId ?? "").trim();

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required." }, { status: 400 });
    }

    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId));

    if (!org) {
      return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    }

    // Load all teachers belonging to this org before deleting
    const teacherRows = await db
      .select({ id: teachers.id, email: teachers.email, name: teachers.name })
      .from(teachers)
      .where(eq(teachers.orgId, orgId));

    // Send deletion email to Org
    sendOrgDeletedEmail(org.email, org.name).catch((err) =>
      console.error("sendOrgDeletedEmail error:", err)
    );

    // Send deletion email to all teachers
    for (const t of teacherRows) {
      sendTeacherOrgDeletedEmail(t.email, org.name).catch((err) =>
        console.error("sendTeacherOrgDeletedEmail error:", err)
      );
    }

    // Delete organization (cascades to all child records)
    await db.delete(organizations).where(eq(organizations.id, orgId));

    // Log activity
    await db.insert(activityLogs).values({
      userType: "admin",
      action: "org_deleted",
      entityType: "org",
      details: {
        orgName: org.name,
        event: `Organization "${org.name}" permanently deleted by admin`,
        message: `Organization "${org.name}" and ${teacherRows.length} teacher accounts deleted`,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin organizations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete organization." },
      { status: 500 }
    );
  }
}
