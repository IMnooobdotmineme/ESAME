import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  departments,
  examPages,
  examQuestions,
  examSections,
  exams,
  examStudents,
  studentExamAttempts,
  subjects,
  teachers,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";

type ExamStatus = "Scheduled" | "In Progress" | "Completed" | "Locked";
type ReviewStatus = "Reviewed" | "Needs Review";

type ExamListRow = {
  id: string;
  examCode: string;
  title: string;
  academicYear: string;
  semester: string;
  scheduledDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  durationMinutes: number;
  status: "scheduled" | "in_progress" | "completed" | "locked";
  totalQuestions: number;
  totalPoints: number;
  createdAt: Date;
  teacherId: string;
  teacherName: string | null;
  teacherEmail: string;
  departmentName: string;
  subjectName: string;
};

type QuestionRow = {
  id: string;
  examId: string;
  text: string;
  type: "mcq" | "multiple_select" | "true_false" | "short_answer" | "essay" | "coding" | "fill_in_blank";
  points: number;
  questionOrder: number;
  pageOrder: number;
  sectionOrder: number;
};

type StudentRow = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
};

type AttemptRow = {
  id: string;
  examStudentId: string;
  attemptNumber: number;
  submittedAt: Date | null;
  autoPoints: number;
  manualPoints: number;
  maxPoints: number;
  status: "reviewed" | "needs_review";
  createdAt: Date;
};

type Trend = { value: string; direction: "up" | "down" };

function mapExamStatus(status: ExamListRow["status"]): ExamStatus {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "locked":
      return "Locked";
    default:
      return "Scheduled";
  }
}

function mapQuestionType(type: QuestionRow["type"]) {
  switch (type) {
    case "multiple_select":
      return "Multiple Select";
    case "true_false":
      return "True/False";
    case "short_answer":
      return "Short Answer";
    case "fill_in_blank":
      return "Fill in the Blank";
    case "essay":
      return "Essay";
    case "coding":
      return "Coding";
    default:
      return "MCQ";
  }
}

function mapReviewStatus(status: AttemptRow["status"]): ReviewStatus {
  return status === "reviewed" ? "Reviewed" : "Needs Review";
}

function formatDate(date: Date | null) {
  if (!date) return "Not scheduled";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatClock(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatTimeRange(start: Date | null, end: Date | null) {
  const startLabel = formatClock(start);
  const endLabel = formatClock(end);
  if (startLabel && endLabel) return `${startLabel} - ${endLabel}`;
  return startLabel || endLabel || "Time not set";
}

function formatDuration(minutes: number) {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (hours === 0) return `${remainder}m`;
  return `${hours}h ${String(remainder).padStart(2, "0")}m`;
}

function latestAttemptByStudent(attempts: AttemptRow[]) {
  const byStudent = new Map<string, AttemptRow>();
  for (const attempt of attempts) {
    const current = byStudent.get(attempt.examStudentId);
    if (
      !current ||
      attempt.attemptNumber > current.attemptNumber ||
      (attempt.attemptNumber === current.attemptNumber &&
        new Date(attempt.createdAt).getTime() > new Date(current.createdAt).getTime())
    ) {
      byStudent.set(attempt.examStudentId, attempt);
    }
  }
  return byStudent;
}

function isScheduledWithin24Hours(exam: ExamListRow) {
  if (exam.status !== "scheduled") return false;
  const scheduledAt = exam.startTime ?? exam.scheduledDate;
  if (!scheduledAt) return false;
  const now = Date.now();
  const time = new Date(scheduledAt).getTime();
  return time >= now && time <= now + 24 * 60 * 60 * 1000;
}

// ---------- Month-over-month trend helpers ----------

/** monthsAgo=0 -> current calendar month, monthsAgo=1 -> previous calendar month */
function getMonthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start, end };
}

function isWithinRange(date: Date | null, start: Date, end: Date) {
  if (!date) return false;
  const t = new Date(date).getTime();
  return t >= start.getTime() && t < end.getTime();
}

/** Returns undefined when there's nothing to compare (both periods empty) — caller should omit the badge. */
function computeTrend(current: number, previous: number): Trend | undefined {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0) return { value: "New", direction: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: `${pct >= 0 ? "+" : ""}${pct}%`, direction: pct >= 0 ? "up" : "down" };
}

// Org exam views only ever show In Progress / Completed exams —
// Scheduled and Locked are excluded at the query level.
const VISIBLE_EXAM_STATUSES = ["in_progress", "completed"] as const;

async function loadExamRows(orgId: string, examId?: string) {
  const conditions = examId
    ? and(
        eq(exams.orgId, orgId),
        eq(exams.id, examId),
        inArray(exams.status, VISIBLE_EXAM_STATUSES)
      )
    : and(eq(exams.orgId, orgId), inArray(exams.status, VISIBLE_EXAM_STATUSES));

  return (await db
    .select({
      id: exams.id,
      examCode: exams.examCode,
      title: exams.title,
      academicYear: exams.academicYear,
      semester: exams.semester,
      scheduledDate: exams.scheduledDate,
      startTime: exams.startTime,
      endTime: exams.endTime,
      durationMinutes: exams.durationMinutes,
      status: exams.status,
      totalQuestions: exams.totalQuestions,
      totalPoints: exams.totalPoints,
      createdAt: exams.createdAt,
      teacherId: exams.teacherId,
      teacherName: teachers.name,
      teacherEmail: teachers.email,
      departmentName: departments.name,
      subjectName: subjects.name,
    })
    .from(exams)
    .innerJoin(teachers, eq(exams.teacherId, teachers.id))
    .innerJoin(departments, eq(exams.departmentId, departments.id))
    .innerJoin(subjects, eq(exams.subjectId, subjects.id))
    .where(conditions)
    .orderBy(desc(exams.createdAt))) as ExamListRow[];
}

async function loadRelatedRows(examIds: string[]) {
  if (examIds.length === 0) {
    return {
      questionRows: [] as QuestionRow[],
      studentRows: [] as StudentRow[],
      attemptRows: [] as AttemptRow[],
    };
  }

  const [questionRows, studentRows] = (await Promise.all([
    db
      .select({
        id: examQuestions.id,
        examId: examSections.examId,
        text: examQuestions.questionText,
        type: examQuestions.questionType,
        points: examQuestions.points,
        questionOrder: examQuestions.questionOrder,
        pageOrder: examPages.pageOrder,
        sectionOrder: examSections.sectionOrder,
      })
      .from(examQuestions)
      .innerJoin(examPages, eq(examQuestions.pageId, examPages.id))
      .innerJoin(examSections, eq(examPages.sectionId, examSections.id))
      .where(inArray(examSections.examId, examIds)),
    db
      .select({
        id: examStudents.id,
        examId: examStudents.examId,
        studentId: examStudents.studentId,
        studentName: examStudents.studentName,
        studentEmail: examStudents.studentEmail,
      })
      .from(examStudents)
      .where(inArray(examStudents.examId, examIds)),
  ])) as [QuestionRow[], StudentRow[]];

  const examStudentIds = studentRows.map((student) => student.id);
  const attemptRows =
    examStudentIds.length > 0
      ? ((await db
          .select({
            id: studentExamAttempts.id,
            examStudentId: studentExamAttempts.examStudentId,
            attemptNumber: studentExamAttempts.attemptNumber,
            submittedAt: studentExamAttempts.submittedAt,
            autoPoints: studentExamAttempts.autoPoints,
            manualPoints: studentExamAttempts.manualPoints,
            maxPoints: studentExamAttempts.maxPoints,
            status: studentExamAttempts.status,
            createdAt: studentExamAttempts.createdAt,
          })
          .from(studentExamAttempts)
          .where(inArray(studentExamAttempts.examStudentId, examStudentIds))) as AttemptRow[])
      : [];

  return { questionRows, studentRows, attemptRows };
}

function buildExamPayload(
  exam: ExamListRow,
  questionRows: QuestionRow[],
  studentRows: StudentRow[],
  latestAttempts: Map<string, AttemptRow>
) {
  const questions = questionRows
    .filter((question) => question.examId === exam.id)
    .sort(
      (a, b) =>
        a.sectionOrder - b.sectionOrder ||
        a.pageOrder - b.pageOrder ||
        a.questionOrder - b.questionOrder
    )
    .map((question) => ({
      id: question.id,
      text: question.text,
      type: mapQuestionType(question.type),
      points: question.points,
    }));

  const students = studentRows.filter((student) => student.examId === exam.id);
  const results = students
    .map((student) => {
      const attempt = latestAttempts.get(student.id);
      if (!attempt?.submittedAt) return null;
      return {
        studentId: student.studentId,
        studentName: student.studentName || student.studentEmail || student.studentId,
        autoPoints: attempt.autoPoints,
        manualPoints: attempt.manualPoints,
        maxPoints: attempt.maxPoints || exam.totalPoints || 0,
        status: mapReviewStatus(attempt.status),
      };
    })
    .filter(
      (
        result
      ): result is {
        studentId: string;
        studentName: string;
        autoPoints: number;
        manualPoints: number;
        maxPoints: number;
        status: ReviewStatus;
      } => !!result
    );

  return {
    id: exam.id,
    teacherId: exam.teacherId,
    examCode: exam.examCode,
    title: exam.title,
    department: exam.departmentName,
    subject: exam.subjectName,
    teacher: exam.teacherName || exam.teacherEmail,
    academicYear: exam.academicYear,
    semester: exam.semester,
    date: formatDate(exam.scheduledDate ?? exam.startTime ?? exam.createdAt),
    time: formatTimeRange(exam.startTime, exam.endTime),
    duration: formatDuration(exam.durationMinutes),
    status: mapExamStatus(exam.status),
    totalQuestions: exam.totalQuestions || questions.length,
    totalStudents: students.length,
    questions,
    results,
  };
}

export async function GET(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("id")?.trim();
  const teacherId = searchParams.get("teacherId")?.trim();

  const examRows = await loadExamRows(session.userId, examId);
  const scopedRows = teacherId ? examRows.filter((exam) => exam.teacherId === teacherId) : examRows;
  const { questionRows, studentRows, attemptRows } = await loadRelatedRows(scopedRows.map((exam) => exam.id));
  const latestAttempts = latestAttemptByStudent(attemptRows);
  const examsPayload = scopedRows.map((exam) =>
    buildExamPayload(exam, questionRows, studentRows, latestAttempts)
  );

  if (examId) {
    return NextResponse.json({ exam: examsPayload[0] ?? null });
  }

  // --- Trend: Active Exams = in_progress exams created this month vs last month ---
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  const activeThisMonth = scopedRows.filter(
    (exam) => exam.status === "in_progress" && isWithinRange(exam.createdAt, thisMonth.start, thisMonth.end)
  ).length;
  const activeLastMonth = scopedRows.filter(
    (exam) => exam.status === "in_progress" && isWithinRange(exam.createdAt, lastMonth.start, lastMonth.end)
  ).length;

  // --- Trend: Total Submissions = latest submitted attempts, bucketed by submittedAt month ---
  const allLatestAttempts = Array.from(latestAttempts.values());
  const submittedThisMonth = allLatestAttempts.filter(
    (attempt) => attempt.submittedAt && isWithinRange(attempt.submittedAt, thisMonth.start, thisMonth.end)
  ).length;
  const submittedLastMonth = allLatestAttempts.filter(
    (attempt) => attempt.submittedAt && isWithinRange(attempt.submittedAt, lastMonth.start, lastMonth.end)
  ).length;

  return NextResponse.json({
    exams: examsPayload,
    totals: {
      active: scopedRows.filter((exam) => exam.status === "in_progress").length,
      scheduled: scopedRows.filter(isScheduledWithin24Hours).length,
      totalSubmissions: examsPayload.reduce((sum, exam) => sum + exam.results.length, 0),
      activeTrend: computeTrend(activeThisMonth, activeLastMonth) ?? null,
      submissionsTrend: computeTrend(submittedThisMonth, submittedLastMonth) ?? null,
    },
  });
}