import { NextResponse } from "next/server";
import { assertDb } from "@/db";
import {
  organizations,
  teachers,
  departments,
  subjects,
  exams,
  examStudents,
  studentExamAttempts,
  activityLogs,
} from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";
import {
  assignmentKey,
  formatRelativeTime,
  mapExamStatus,
  normalizeAssignments,
  normalizeTeacherStatus,
} from "@/lib/org-utils";

const db = assertDb();

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type DashboardTeacherRow = {
  id: string;
  name: string | null;
  email: string;
  status: "invited" | "active" | "suspended";
  assignments: unknown;
  createdAt: Date;
};

type DashboardExamRow = {
  id: string;
  title: string;
  status: "scheduled" | "in_progress" | "completed" | "locked";
  gradingStatus: "in_progress" | "complete";
  teacherId: string;
  subjectId: string;
  createdAt: Date;
};

type DashboardActivityRow = {
  action: string;
  details: unknown;
  createdAt: Date;
};

type AttemptRow = {
  id: string;
  examStudentId: string;
  examId: string;
  attemptNumber: number;
  submittedAt: Date | null;
  autoPoints: number;
  manualPoints: number;
  maxPoints: number;
  createdAt: Date;
};

function attemptPct(a: AttemptRow): number {
  const total = (a.autoPoints || 0) + (a.manualPoints || 0);
  return a.maxPoints > 0 ? (total / a.maxPoints) * 100 : 0;
}

function latestPerStudent(rows: AttemptRow[]): AttemptRow[] {
  const byStudent = new Map<string, AttemptRow>();
  for (const a of rows) {
    const cur = byStudent.get(a.examStudentId);
    if (
      !cur ||
      a.attemptNumber > cur.attemptNumber ||
      (a.attemptNumber === cur.attemptNumber &&
        new Date(a.createdAt).getTime() > new Date(cur.createdAt).getTime())
    ) {
      byStudent.set(a.examStudentId, a);
    }
  }
  return Array.from(byStudent.values());
}

function getLastSixMonths() {
  const now = new Date();
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const base = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: MONTH_LABELS[base.getMonth()],
      start: new Date(base.getFullYear(), base.getMonth(), 1),
      end: new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999),
    });
  }
  return months;
}

export async function GET() {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.userId;

  const [org] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  const [teacherRows, departmentRows, subjectRows, examRows, activityRows] = (await Promise.all([
    db
      .select({
        id: teachers.id,
        name: teachers.name,
        email: teachers.email,
        status: teachers.status,
        assignments: teachers.assignments,
        createdAt: teachers.createdAt,
      })
      .from(teachers)
      .where(eq(teachers.orgId, orgId)),
    db.select().from(departments).where(eq(departments.orgId, orgId)),
    db.select().from(subjects).where(eq(subjects.orgId, orgId)),
    db
      .select({
        id: exams.id,
        title: exams.title,
        status: exams.status,
        gradingStatus: exams.gradingStatus,
        teacherId: exams.teacherId,
        subjectId: exams.subjectId,
        createdAt: exams.createdAt,
      })
      .from(exams)
      .where(eq(exams.orgId, orgId))
      .orderBy(desc(sql`COALESCE(${exams.endTime}, ${exams.createdAt})`)),
    db
      .select({
        action: activityLogs.action,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(eq(activityLogs.orgId, orgId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(8),
  ])) as [
    DashboardTeacherRow[],
    Array<typeof departments.$inferSelect>,
    Array<typeof subjects.$inferSelect>,
    DashboardExamRow[],
    DashboardActivityRow[],
  ];

  const examIds = examRows.map((e) => e.id);

  // ✅ Real submission data
  const attemptRows =
    examIds.length > 0
      ? ((await db
          .select({
            id: studentExamAttempts.id,
            examStudentId: studentExamAttempts.examStudentId,
            examId: examStudents.examId,
            attemptNumber: studentExamAttempts.attemptNumber,
            submittedAt: studentExamAttempts.submittedAt,
            autoPoints: studentExamAttempts.autoPoints,
            manualPoints: studentExamAttempts.manualPoints,
            maxPoints: studentExamAttempts.maxPoints,
            createdAt: studentExamAttempts.createdAt,
          })
          .from(studentExamAttempts)
          .innerJoin(examStudents, eq(studentExamAttempts.examStudentId, examStudents.id))
          .where(inArray(examStudents.examId, examIds))) as AttemptRow[])
      : [];

  const submittedAll = attemptRows.filter((a) => a.submittedAt != null);
  const latestAll = latestPerStudent(attemptRows).filter((a) => a.submittedAt != null);

  const attemptsByExam = new Map<string, AttemptRow[]>();
  for (const a of attemptRows) {
    const list = attemptsByExam.get(a.examId) ?? [];
    list.push(a);
    attemptsByExam.set(a.examId, list);
  }

  const teacherById = new Map(teacherRows.map((t) => [t.id, t]));
  const subjectById = new Map(subjectRows.map((s) => [s.id, s]));
  const departmentById = new Map(departmentRows.map((d) => [d.id, d]));

  const totalTeachers = teacherRows.length;
  const pendingTeachers = teacherRows.filter((t) => normalizeTeacherStatus(t.status) === "Pending").length;
  const activeTeachers = teacherRows.filter((t) => normalizeTeacherStatus(t.status) === "Active").length;
  const totalDepartments = departmentRows.length;
  const totalSubjects = subjectRows.length;

  // ✅ Active = only in_progress
    // "Total Exams" card — counts every exam in the org
  const activeExams = examRows.length;
  // ✅ Participated = unique students with a submitted attempt
  const studentsParticipated = latestAll.length;

  // ✅ Pass rate from real scores (pass = >= 50%)
  const allPcts: number[] = latestAll.map((a) => attemptPct(a));
  const passedCount = allPcts.filter((p) => p >= 50).length;
  const averagePassRate = allPcts.length > 0 ? Math.round((passedCount / allPcts.length) * 100) : 0;

  // ✅ Chart: submissions per month + pass rate per month
  const chart = getLastSixMonths().map((bucket) => {
    const monthLatest = latestAll.filter((a) => {
      const d = new Date(a.submittedAt as Date);
      return d >= bucket.start && d <= bucket.end;
    });
    const pcts: number[] = monthLatest.map((a) => attemptPct(a));
    const passed = pcts.filter((p) => p >= 50).length;
    return {
      month: bucket.label,
      participants: monthLatest.length,
      passRate: pcts.length > 0 ? Math.round((passed / pcts.length) * 100) : 0,
    };
  });

  // ✅ Recent exams with real participants + avg score
  const recentExams = examRows.slice(0, 5).map((exam) => {
    const teacher = teacherById.get(exam.teacherId);
    const subject = subjectById.get(exam.subjectId);
    const latest = latestPerStudent(attemptsByExam.get(exam.id) ?? []).filter((a) => a.submittedAt != null);
    const pcts: number[] = latest.map((a) => attemptPct(a));
    const avg = pcts.length > 0 ? Math.round(pcts.reduce((sum: number, x: number) => sum + x, 0) / pcts.length) : null;

    return {
      name: exam.title,
      subject: subject?.name ?? "—",
      teacher: teacher?.name ?? teacher?.email ?? "—",
      status:
        exam.status === "completed" && exam.gradingStatus === "in_progress"
          ? "In Progress"
          : mapExamStatus(exam.status),
      participants: latest.length,
      avgScore: avg != null ? `${avg}%` : "—",
    };
  });

  const activityFromLogs = activityRows.map((entry) => {
    const details =
      entry.details && typeof entry.details === "object" ? (entry.details as Record<string, unknown>) : {};
    return {
      text: typeof details.text === "string" ? details.text : entry.action.replace(/_/g, " "),
      time: formatRelativeTime(new Date(entry.createdAt)),
      icon: typeof details.icon === "string" ? details.icon : "listChecks",
      color: typeof details.color === "string" ? details.color : "text-sky-600 bg-sky-50",
    };
  });

  const fallbackActivity = [
    ...teacherRows
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((t) => ({
        text: `${t.name || t.email} was invited as a teacher`,
        time: formatRelativeTime(new Date(t.createdAt)),
        icon: "userPlus",
        color: "text-sky-600 bg-sky-50",
      })),
    ...examRows.slice(0, 2).map((exam) => ({
      text: `Exam "${exam.title}" was created`,
      time: formatRelativeTime(new Date(exam.createdAt)),
      icon: "calendarPlus",
      color: "text-emerald-600 bg-emerald-50",
    })),
  ].slice(0, 5);

  const recentActivity = activityFromLogs.length > 0 ? activityFromLogs : fallbackActivity;

  const teachersBySubject = new Map<string, number>();
  for (const teacher of teacherRows) {
    for (const assignment of normalizeAssignments(teacher.assignments)) {
      const key = assignmentKey(assignment.department, assignment.subject);
      teachersBySubject.set(key, (teachersBySubject.get(key) ?? 0) + 1);
    }
  }

  const examsBySubjectId = examRows.reduce<Map<string, DashboardExamRow[]>>((map, exam) => {
    const list = map.get(exam.subjectId) ?? [];
    list.push(exam);
    map.set(exam.subjectId, list);
    return map;
  }, new Map());

  // ✅ Subject performance from real attempts
  const subjectPerformance = subjectRows.map((subject) => {
    const department = departmentById.get(subject.departmentId);
    const key = assignmentKey(department?.name ?? "", subject.name);
    const subjectExams = examsBySubjectId.get(subject.id) ?? [];

    const subjectAttempts: AttemptRow[] = [];
    for (const exam of subjectExams) {
      subjectAttempts.push(...(attemptsByExam.get(exam.id) ?? []));
    }
    const latest = latestPerStudent(subjectAttempts).filter((a) => a.submittedAt != null);
    const pcts: number[] = latest.map((a) => attemptPct(a));
    const passed = pcts.filter((p) => p >= 50).length;

    return {
      subject: subject.name,
      teachers: teachersBySubject.get(key) ?? 0,
      exams: subjectExams.length,
      avgScore:
        pcts.length > 0
          ? `${Math.round(pcts.reduce((sum: number, x: number) => sum + x, 0) / pcts.length)}%`
          : "—",
      passRate: pcts.length > 0 ? `${Math.round((passed / pcts.length) * 100)}%` : "—",
    };
  });

  return NextResponse.json({
    org: org ? { id: org.id, name: org.name } : null,
    stats: {
      totalTeachers,
      activeExams,
      studentsParticipated,
      averagePassRate,
      totalDepartments,
      totalSubjects,
      pendingTeachers,
      activeTeachers,
    },
    chart,
    recentExams,
    recentActivity,
    subjectPerformance,
  });
}