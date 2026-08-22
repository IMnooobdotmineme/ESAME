import { NextResponse } from "next/server";
import { assertDb } from "@/db";
import {
  organizations,
  teachers,
  departments,
  subjects,
  exams,
  examStudents,
  examAnalytics,
  activityLogs,
} from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
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

type DashboardAnalyticsRow = {
  examId: string;
  totalSubmitted: number;
  averageScore: number;
  passRate: number;
};

type DashboardActivityRow = {
  action: string;
  details: unknown;
  createdAt: Date;
};

type DashboardEnrolledRow = {
  examId: string;
  completedAt: Date | null;
};

function getLastSixMonths() {
  const now = new Date();
  const months: { label: string; year: number; month: number; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({
      label: MONTH_LABELS[date.getMonth()],
      year: date.getFullYear(),
      month: date.getMonth(),
      start,
      end,
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

  const [teacherRows, departmentRows, subjectRows, examRows, analyticsRows, activityRows] =
    (await Promise.all([
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
        .orderBy(desc(exams.createdAt)),
      db
        .select({
          examId: examAnalytics.examId,
          totalSubmitted: examAnalytics.totalSubmitted,
          averageScore: examAnalytics.averageScore,
          passRate: examAnalytics.passRate,
        })
        .from(examAnalytics)
        .innerJoin(exams, eq(examAnalytics.examId, exams.id))
        .where(eq(exams.orgId, orgId)),
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
      DashboardAnalyticsRow[],
      DashboardActivityRow[],
    ];

  const examIds = examRows.map((exam) => exam.id);
  const enrolledRows =
    examIds.length > 0
      ? ((await db
          .select({
            examId: examStudents.examId,
            completedAt: examStudents.completedAt,
          })
          .from(examStudents)
          .where(inArray(examStudents.examId, examIds))) as DashboardEnrolledRow[])
      : [];

  const teacherById = new Map(teacherRows.map((teacher) => [teacher.id, teacher]));
  const subjectById = new Map(subjectRows.map((subject) => [subject.id, subject]));
  const departmentById = new Map(departmentRows.map((department) => [department.id, department]));
  const analyticsByExamId = new Map(analyticsRows.map((row) => [row.examId, row]));

  const totalTeachers = teacherRows.length;
  const pendingTeachers = teacherRows.filter(
    (teacher) => normalizeTeacherStatus(teacher.status) === "Pending"
  ).length;
  const activeTeachers = teacherRows.filter(
    (teacher) => normalizeTeacherStatus(teacher.status) === "Active"
  ).length;

  const totalDepartments = departmentRows.length;
  const totalSubjects = subjectRows.length;

  const activeExams = examRows.filter(
    (exam) => exam.status === "in_progress" || exam.status === "scheduled"
  ).length;

  const studentsParticipated = enrolledRows.filter((row) => row.completedAt != null).length;

  const passRates = analyticsRows.map((row) => row.passRate).filter((rate) => rate > 0);
  const averagePassRate =
    passRates.length > 0
      ? Math.round(passRates.reduce((sum, rate) => sum + rate, 0) / passRates.length)
      : 0;

  const monthBuckets = getLastSixMonths();
  const chart = monthBuckets.map((bucket) => {
    const participants = enrolledRows.filter((row) => {
      if (!row.completedAt) return false;
      const completed = new Date(row.completedAt);
      return completed >= bucket.start && completed <= bucket.end;
    }).length;

    const monthExamIds = examRows
      .filter((exam) => {
        const created = new Date(exam.createdAt);
        return created >= bucket.start && created <= bucket.end;
      })
      .map((exam) => exam.id);

    const monthPassRates = monthExamIds
      .map((examId) => analyticsByExamId.get(examId)?.passRate ?? 0)
      .filter((rate) => rate > 0);

    const passRate =
      monthPassRates.length > 0
        ? Math.round(monthPassRates.reduce((sum, rate) => sum + rate, 0) / monthPassRates.length)
        : 0;

    return { month: bucket.label, participants, passRate };
  });

  const recentExams = examRows.slice(0, 5).map((exam) => {
    const teacher = teacherById.get(exam.teacherId);
    const subject = subjectById.get(exam.subjectId);
    const analytics = analyticsByExamId.get(exam.id);
    const participants =
      analytics?.totalSubmitted ??
      enrolledRows.filter((row) => row.examId === exam.id && row.completedAt != null).length;

    return {
      name: exam.title,
      subject: subject?.name ?? "—",
      teacher: teacher?.name ?? teacher?.email ?? "—",
            status:
        exam.status === "completed" && exam.gradingStatus === "in_progress"
          ? "In Progress"
          : mapExamStatus(exam.status),
      participants,
      avgScore: analytics?.averageScore != null ? `${analytics.averageScore}%` : "—",
    };
  });

  const activityFromLogs = activityRows.map((entry) => {
    const details =
      entry.details && typeof entry.details === "object"
        ? (entry.details as Record<string, unknown>)
        : {};
    const icon = typeof details.icon === "string" ? details.icon : "listChecks";
    const color =
      typeof details.color === "string" ? details.color : "text-sky-600 bg-sky-50";
    const text =
      typeof details.text === "string"
        ? details.text
        : entry.action.replace(/_/g, " ");

    return {
      text,
      time: formatRelativeTime(new Date(entry.createdAt)),
      icon,
      color,
    };
  });

  const fallbackActivity = [
    ...teacherRows
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .map((teacher) => ({
        text: `${teacher.name || teacher.email} was invited as a teacher`,
        time: formatRelativeTime(new Date(teacher.createdAt)),
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

  const subjectPerformance = subjectRows.map((subject) => {
    const department = departmentById.get(subject.departmentId);
    const key = assignmentKey(department?.name ?? "", subject.name);
    const subjectExams = examsBySubjectId.get(subject.id) ?? [];
    const subjectAnalytics = subjectExams
      .map((exam) => analyticsByExamId.get(exam.id))
      .filter((row): row is NonNullable<typeof row> => !!row);

    const avgScores = subjectAnalytics.map((row) => row.averageScore).filter((score) => score > 0);
    const passRateValues = subjectAnalytics.map((row) => row.passRate).filter((rate) => rate > 0);

    return {
      subject: subject.name,
      teachers: teachersBySubject.get(key) ?? 0,
      exams: subjectExams.length,
      avgScore: avgScores.length
        ? `${Math.round(avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length)}%`
        : "—",
      passRate: passRateValues.length
        ? `${Math.round(passRateValues.reduce((sum, rate) => sum + rate, 0) / passRateValues.length)}%`
        : "—",
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
