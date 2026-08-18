import { NextResponse } from "next/server";
import { db } from "@/db";
import { departments, notifications, subjects, teachers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";
import {
  assignmentKey,
  formatJoinedDate,
  normalizeAssignments,
  normalizeTeacherStatus,
  removeDepartmentFromAssignments,
  removeSubjectFromAssignments,
  renameDepartmentInAssignments,
  renameSubjectInAssignments,
} from "@/lib/org-utils";

type TeacherAssignment = { department: string; subject: string };
type AssignmentTeacherRow = {
  id: string;
  assignments: unknown;
};
type AcademicTeacherRow = {
  id: string;
  name: string | null;
  email: string;
  status: "invited" | "active" | "suspended";
  assignments: unknown;
  createdAt: Date;
};

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

async function updateTeacherAssignments(
  orgId: string,
  transform: (assignments: TeacherAssignment[]) => TeacherAssignment[]
) {
  const teacherRows = (await db
    .select({
      id: teachers.id,
      assignments: teachers.assignments,
    })
    .from(teachers)
    .where(eq(teachers.orgId, orgId))) as AssignmentTeacherRow[];

  await Promise.all(
    teacherRows.map(async (teacher) => {
      const previous = normalizeAssignments(teacher.assignments);
      const next = transform(previous);
      if (JSON.stringify(previous) === JSON.stringify(next)) return;
      await db
        .update(teachers)
        .set({ assignments: next, updatedAt: new Date() })
        .where(and(eq(teachers.id, teacher.id), eq(teachers.orgId, orgId)));
    })
  );
}

export async function GET() {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const departmentRows = (await db
    .select()
    .from(departments)
    .where(eq(departments.orgId, session.userId))) as Array<typeof departments.$inferSelect>;

  const subjectRows = (await db
    .select()
    .from(subjects)
    .where(eq(subjects.orgId, session.userId))) as Array<typeof subjects.$inferSelect>;

  const teacherRows = (await db
    .select({
      id: teachers.id,
      name: teachers.name,
      email: teachers.email,
      status: teachers.status,
      assignments: teachers.assignments,
      createdAt: teachers.createdAt,
    })
    .from(teachers)
    .where(eq(teachers.orgId, session.userId))) as AcademicTeacherRow[];

  const teachersBySubject = new Map<
    string,
    Array<{ id: string; name: string; email: string; status: string; joined: string }>
  >();
  for (const teacher of teacherRows) {
    for (const assignment of normalizeAssignments(teacher.assignments)) {
      const key = assignmentKey(assignment.department, assignment.subject);
      const list = teachersBySubject.get(key) ?? [];
      list.push({
        id: teacher.id,
        name: teacher.name || teacher.email,
        email: teacher.email,
        status: normalizeTeacherStatus(teacher.status),
        joined: formatJoinedDate(teacher.createdAt),
      });
      teachersBySubject.set(key, list);
    }
  }

  const departmentsPayload = departmentRows.map((department: typeof departments.$inferSelect) => ({
    id: department.id,
    name: department.name,
    courses: department.courses,
    students: department.students,
    faculty: department.faculty,
    metricLabel: department.metricLabel,
    metricValue: department.metricValue,
    subjects: subjectRows
      .filter((subject: typeof subjects.$inferSelect) => subject.departmentId === department.id)
      .map((subject: typeof subjects.$inferSelect) => ({
        id: subject.id,
        name: subject.name,
        teacherNames:
          teachersBySubject
            .get(assignmentKey(department.name, subject.name))
            ?.map((teacher) => teacher.name) ?? [],
        teachers: teachersBySubject.get(assignmentKey(department.name, subject.name)) ?? [],
      })),
  }));

  return NextResponse.json({ departments: departmentsPayload });
}

export async function POST(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const type = String(body.type ?? "").trim();

  if (type === "department") {
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Department name is required." }, { status: 400 });
    }

    const [existingDepartment] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(
        and(
          eq(departments.orgId, session.userId),
          sql`lower(${departments.name}) = ${name.toLowerCase()}`
        )
      );

    if (existingDepartment) {
      return NextResponse.json({ error: "A department with this name already exists." }, { status: 409 });
    }

    const [department] = await db
      .insert(departments)
      .values({
        orgId: session.userId,
        name,
        courses: Number(body.courses ?? 0),
        students: Number(body.students ?? 0),
        faculty: Number(body.faculty ?? 0),
        metricLabel: String(body.metricLabel ?? "Exam Completion Rate"),
        metricValue: Number(body.metricValue ?? 0),
      })
      .returning();

    await createOrgNotification({
      orgId: session.userId,
      title: "Department Added",
      message: `${department.name} was added to your academic structure.`,
      type: "department_added",
      relatedEntityId: department.id,
      relatedEntityType: "department",
    });

    return NextResponse.json({ ok: true, department });
  }

  if (type === "subject") {
    const departmentId = String(body.departmentId ?? "").trim();
    const name = String(body.name ?? "").trim();
    if (!departmentId || !name) {
      return NextResponse.json({ error: "Department and subject name are required." }, { status: 400 });
    }

    const [department] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.id, departmentId), eq(departments.orgId, session.userId)));

    if (!department) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const [existingSubject] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(
        and(
          eq(subjects.orgId, session.userId),
          eq(subjects.departmentId, departmentId),
          sql`lower(${subjects.name}) = ${name.toLowerCase()}`
        )
      );

    if (existingSubject) {
      return NextResponse.json({ error: "A subject with this name already exists in this department." }, { status: 409 });
    }

    const [subject] = await db
      .insert(subjects)
      .values({
        orgId: session.userId,
        departmentId,
        name,
      })
      .returning();

    await createOrgNotification({
      orgId: session.userId,
      title: "Subject Added",
      message: `${subject.name} was added to this department.`,
      type: "subject_added",
      relatedEntityId: subject.id,
      relatedEntityType: "subject",
    });

    return NextResponse.json({ ok: true, subject });
  }

  return NextResponse.json({ error: "Unsupported item type." }, { status: 400 });
}

export async function PATCH(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const type = String(body.type ?? "").trim();

  if (type === "department") {
    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    if (!id || !name) {
      return NextResponse.json({ error: "Department is invalid." }, { status: 400 });
    }

    const [existingDepartment] = await db
      .select()
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.orgId, session.userId)));

    if (!existingDepartment) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const [duplicateDepartment] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(
        and(
          eq(departments.orgId, session.userId),
          sql`${departments.id} <> ${id}`,
          sql`lower(${departments.name}) = ${name.toLowerCase()}`
        )
      );

    if (duplicateDepartment) {
      return NextResponse.json({ error: "A department with this name already exists." }, { status: 409 });
    }

    const [department] = await db
      .update(departments)
      .set({
        name,
        courses: Number(body.courses ?? 0),
        students: Number(body.students ?? 0),
        faculty: Number(body.faculty ?? 0),
        metricLabel: String(body.metricLabel ?? "Exam Completion Rate"),
        metricValue: Number(body.metricValue ?? 0),
        updatedAt: new Date(),
      })
      .where(and(eq(departments.id, id), eq(departments.orgId, session.userId)))
      .returning();

    if (existingDepartment.name !== name) {
      await updateTeacherAssignments(session.userId, (assignments) =>
        renameDepartmentInAssignments(assignments, existingDepartment.name, name)
      );
    }

    await createOrgNotification({
      orgId: session.userId,
      title: "Department Updated",
      message: `${existingDepartment.name} was updated${existingDepartment.name !== name ? ` to ${name}` : ""}.`,
      type: "department_updated",
      relatedEntityId: department.id,
      relatedEntityType: "department",
    });

    return NextResponse.json({ ok: true, department });
  }

  if (type === "subject") {
    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    if (!id || !name) {
      return NextResponse.json({ error: "Subject is invalid." }, { status: 400 });
    }

    const [existingSubject] = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        departmentId: subjects.departmentId,
        departmentName: departments.name,
      })
      .from(subjects)
      .innerJoin(departments, eq(subjects.departmentId, departments.id))
      .where(and(eq(subjects.id, id), eq(subjects.orgId, session.userId)));

    if (!existingSubject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    const [duplicateSubject] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(
        and(
          eq(subjects.orgId, session.userId),
          eq(subjects.departmentId, existingSubject.departmentId),
          sql`${subjects.id} <> ${id}`,
          sql`lower(${subjects.name}) = ${name.toLowerCase()}`
        )
      );

    if (duplicateSubject) {
      return NextResponse.json({ error: "A subject with this name already exists in this department." }, { status: 409 });
    }

    const [subject] = await db
      .update(subjects)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(subjects.id, id), eq(subjects.orgId, session.userId)))
      .returning();

    if (existingSubject.name !== name) {
      await updateTeacherAssignments(session.userId, (assignments) =>
        renameSubjectInAssignments(assignments, existingSubject.departmentName, existingSubject.name, name)
      );
    }

    await createOrgNotification({
      orgId: session.userId,
      title: "Subject Updated",
      message: `${existingSubject.name} was updated${existingSubject.name !== name ? ` to ${name}` : ""}.`,
      type: "subject_updated",
      relatedEntityId: subject.id,
      relatedEntityType: "subject",
    });

    return NextResponse.json({ ok: true, subject });
  }

  return NextResponse.json({ error: "Unsupported item type." }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const type = String(body.type ?? "").trim();
  const id = String(body.id ?? "").trim();
  if (!id) {
    return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  }

  if (type === "department") {
    const [department] = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(and(eq(departments.id, id), eq(departments.orgId, session.userId)));

    if (!department) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    await updateTeacherAssignments(session.userId, (assignments) =>
      removeDepartmentFromAssignments(assignments, department.name)
    );
    await db.delete(departments).where(and(eq(departments.id, id), eq(departments.orgId, session.userId)));
    await createOrgNotification({
      orgId: session.userId,
      title: "Department Deleted",
      message: `${department.name} was deleted from your academic structure.`,
      type: "department_deleted",
      relatedEntityId: department.id,
      relatedEntityType: "department",
    });
    return NextResponse.json({ ok: true });
  }

  if (type === "subject") {
    const [subject] = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        departmentName: departments.name,
      })
      .from(subjects)
      .innerJoin(departments, eq(subjects.departmentId, departments.id))
      .where(and(eq(subjects.id, id), eq(subjects.orgId, session.userId)));

    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    }

    await updateTeacherAssignments(session.userId, (assignments) =>
      removeSubjectFromAssignments(assignments, subject.departmentName, subject.name)
    );
    await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.orgId, session.userId)));
    await createOrgNotification({
      orgId: session.userId,
      title: "Subject Deleted",
      message: `${subject.name} was deleted from ${subject.departmentName}.`,
      type: "subject_deleted",
      relatedEntityId: subject.id,
      relatedEntityType: "subject",
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported item type." }, { status: 400 });
}
