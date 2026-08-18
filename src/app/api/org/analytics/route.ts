import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  departments,
  exams,
  examStudents,
  studentExamAttempts,
  subjects,
} from "@/db/schema";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";

type RangeKey = "Last 7 Days" | "Last 30 Days" | "Last 90 Days" | "This Semester" | "This Year" | "All Time";

type ExamRow = {
  id: string;
  title: string;
  status: "scheduled" | "in_progress" | "completed" | "locked";
  departmentId: string;
  subjectId: string;
  startTime: Date | null;
  endTime: Date | null;
  scheduledDate: Date | null;
  durationMinutes: number;
  createdAt: Date;
};

type StudentRow = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

type AttemptRow = {
  examStudentId: string;
  startedAt: Date;
  submittedAt: Date | null;
  autoPoints: number;
  manualPoints: number;
  maxPoints: number;
};

function getRangeStart(range: RangeKey) {
  const now = new Date();
  switch (range) {
    case "Last 7 Days":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "Last 30 Days":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "Last 90 Days":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "This Semester": {
      const month = now.getMonth();
      const startMonth = month < 6 ? 0 : 6;
      return new Date(now.getFullYear(), startMonth, 1);
    }
    case "This Year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

function getBuckets(range: RangeKey, start: Date | null, end: Date) {
  const labels = range === "Last 7 Days"
    ? Array.from({ length: 7 }, (_, index) => {
        const date = new Date(end);
        date.setDate(end.getDate() - (6 - index));
        return {
          label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999),
        };
      })
    : Array.from({ length: 6 }, (_, index) => {
        const base = start ?? new Date(end.getFullYear(), end.getMonth() - 5, 1);
        const date = new Date(base.getFullYear(), base.getMonth() + index, 1);
        return {
          label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999),
        };
      });

  return labels;
}

function within(date: Date, start: Date, end: Date) {
  const time = new Date(date).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function computeProgress(exam: ExamRow, student: StudentRow, attempt?: AttemptRow) {
  if (student.completedAt || attempt?.submittedAt) return 100;
  const startedAt = attempt?.startedAt ?? student.startedAt;
  if (!startedAt) return 0;
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const duration = Math.max(1, exam.durationMinutes) * 60 * 1000;
  return Math.min(99, Math.max(1, Math.round((elapsed / duration) * 100)));
}

export async function GET(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedRange = searchParams.get("range") as RangeKey | null;
  const range: RangeKey =
    requestedRange &&
    ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Semester", "This Year", "All Time"].includes(requestedRange)
      ? requestedRange
      : "All Time";
  const rangeStart = getRangeStart(range);
  const now = new Date();

  const examConditions = rangeStart
    ? and(eq(exams.orgId, session.userId), gte(exams.createdAt, rangeStart), lte(exams.createdAt, now))
    : eq(exams.orgId, session.userId);

  const [departmentRows, subjectRows, examRows] = (await Promise.all([
    db.select().from(departments).where(eq(departments.orgId, session.userId)),
    db.select().from(subjects).where(eq(subjects.orgId, session.userId)),
    db
      .select({
        id: exams.id,
        title: exams.title,
        status: exams.status,
        departmentId: exams.departmentId,
        subjectId: exams.subjectId,
        startTime: exams.startTime,
        endTime: exams.endTime,
        scheduledDate: exams.scheduledDate,
        durationMinutes: exams.durationMinutes,
        createdAt: exams.createdAt,
      })
      .from(exams)
      .where(examConditions),
  ])) as [Array<typeof departments.$inferSelect>, Array<typeof subjects.$inferSelect>, ExamRow[]];

  const examIds = examRows.map((exam) => exam.id);
  const studentRows =
    examIds.length > 0
      ? ((await db
          .select({
            id: examStudents.id,
            examId: examStudents.examId,
            studentId: examStudents.studentId,
            studentName: examStudents.studentName,
            studentEmail: examStudents.studentEmail,
            startedAt: examStudents.startedAt,
            completedAt: examStudents.completedAt,
          })
          .from(examStudents)
          .where(inArray(examStudents.examId, examIds))) as StudentRow[])
      : [];

  const studentIds = studentRows.map((student) => student.id);
  const attemptRows =
    studentIds.length > 0
      ? ((await db
          .select({
            examStudentId: studentExamAttempts.examStudentId,
            startedAt: studentExamAttempts.startedAt,
            submittedAt: studentExamAttempts.submittedAt,
            autoPoints: studentExamAttempts.autoPoints,
            manualPoints: studentExamAttempts.manualPoints,
            maxPoints: studentExamAttempts.maxPoints,
          })
          .from(studentExamAttempts)
          .where(inArray(studentExamAttempts.examStudentId, studentIds))) as AttemptRow[])
      : [];

  const subjectById = new Map(subjectRows.map((subject) => [subject.id, subject]));
  const studentsByExamId = studentRows.reduce<Map<string, StudentRow[]>>((map, student) => {
    const list = map.get(student.examId) ?? [];
    list.push(student);
    map.set(student.examId, list);
    return map;
  }, new Map());
  const latestAttemptByStudent = new Map<string, AttemptRow>();
  for (const attempt of attemptRows) {
    const current = latestAttemptByStudent.get(attempt.examStudentId);
    if (!current || new Date(attempt.startedAt).getTime() > new Date(current.startedAt).getTime()) {
      latestAttemptByStudent.set(attempt.examStudentId, attempt);
    }
  }

  const buckets = getBuckets(range, rangeStart, now);
  const volume = buckets.map((bucket, index) => {
    const actual = examRows.filter((exam) => within(exam.createdAt, bucket.start, bucket.end)).length;
    const previousActual = index > 0
      ? examRows.filter((exam) => within(exam.createdAt, buckets[index - 1].start, buckets[index - 1].end)).length
      : actual;
    return {
      day: bucket.label,
      volume: actual,
      type: "Actual",
      projected: Math.max(actual, Math.round((actual + previousActual) / 2)),
    };
  });

  const topDepartments = departmentRows
    .map((department) => {
      const departmentExams = examRows.filter((exam) => exam.departmentId === department.id);
      const departmentStudents = departmentExams.flatMap((exam) => studentsByExamId.get(exam.id) ?? []);
      const submitted = departmentStudents.filter((student) => {
        const attempt = latestAttemptByStudent.get(student.id);
        return !!student.completedAt || !!attempt?.submittedAt;
      }).length;
      const percent = departmentStudents.length
        ? Math.round((submitted / departmentStudents.length) * 100)
        : department.metricValue;
      return {
        code: department.name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 3)
          .toUpperCase() || department.name.slice(0, 3).toUpperCase(),
        name: department.name,
        percent: Math.max(0, Math.min(100, percent)),
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const liveActivity = examRows
    .filter((exam) => exam.status === "in_progress")
    .flatMap((exam) => {
      const subject = subjectById.get(exam.subjectId);
      return (studentsByExamId.get(exam.id) ?? [])
        .filter((student) => student.startedAt && !student.completedAt)
        .map((student) => ({
          studentId: student.studentId,
          module: subject ? `${exam.title} / ${subject.name}` : exam.title,
          progress: computeProgress(exam, student, latestAttemptByStudent.get(student.id)),
        }));
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 8);

  return NextResponse.json({
    volume,
    topDepartments,
    liveActivity,
    totals: {
      exams: examRows.length,
      departments: departmentRows.length,
      enrolledStudents: studentRows.length,
      activeExams: examRows.filter((exam) => exam.status === "in_progress").length,
    },
  });
}
