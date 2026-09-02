import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import {
  exams,
  examStudents,
  studentExamAttempts,
  notifications,
  departments,
  subjects,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

type ExamRow = {
  id: string;
  title: string;
  examCode: string;
  durationMinutes: number;
  totalQuestions: number;
  status: "scheduled" | "in_progress" | "completed" | "locked";
  isLaunched: boolean;
  isPaused: boolean;
  scheduledDate: Date | null;
  createdAt: Date;
  departmentId: string;
  subjectId: string;
  departmentName: string | null;
  subjectName: string | null;
};

type NotificationRow = typeof notifications.$inferSelect;

export async function GET(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;

    const teacherExams: ExamRow[] = await db
      .select({
        id: exams.id,
        title: exams.title,
        examCode: exams.examCode,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        status: exams.status,
        isLaunched: exams.isLaunched,
        isPaused: exams.isPaused,
        scheduledDate: exams.scheduledDate,
        createdAt: exams.createdAt,
        departmentId: exams.departmentId,
        subjectId: exams.subjectId,
        departmentName: departments.name,
        subjectName: subjects.name,
      })
      .from(exams)
      .leftJoin(departments, eq(exams.departmentId, departments.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(eq(exams.teacherId, teacherId))
      .orderBy(desc(exams.createdAt));

    const teacherNotifications: NotificationRow[] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.teacherId, teacherId))
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    const liveExams = teacherExams.filter(
      (e: ExamRow) => e.status === "in_progress" && e.isLaunched
    );

    const pendingRequestsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(examStudents)
      .innerJoin(exams, eq(examStudents.examId, exams.id))
      .where(
        and(
          eq(exams.teacherId, teacherId),
          eq(examStudents.status, "pending")
        )
      );

    const lockedCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(examStudents)
      .innerJoin(exams, eq(examStudents.examId, exams.id))
      .where(
        and(
          eq(exams.teacherId, teacherId),
          eq(examStudents.isLocked, true)
        )
      );

        const attemptReviewRows = (await db
      .select({
        examStudentId: studentExamAttempts.examStudentId,
        attemptNumber: studentExamAttempts.attemptNumber,
        createdAt: studentExamAttempts.createdAt,
        submittedAt: studentExamAttempts.submittedAt,
        status: studentExamAttempts.status,
      })
      .from(studentExamAttempts)
      .innerJoin(examStudents, eq(studentExamAttempts.examStudentId, examStudents.id))
      .innerJoin(exams, eq(examStudents.examId, exams.id))
      .where(eq(exams.teacherId, teacherId))) as Array<{
      examStudentId: string;
      attemptNumber: number;
      createdAt: Date;
      submittedAt: Date | null;
      status: string;
    }>;

    const latestByStudent = new Map<string, (typeof attemptReviewRows)[number]>();
    for (const row of attemptReviewRows) {
      const cur = latestByStudent.get(row.examStudentId);
      if (
        !cur ||
        row.attemptNumber > cur.attemptNumber ||
        (row.attemptNumber === cur.attemptNumber &&
          new Date(row.createdAt).getTime() > new Date(cur.createdAt).getTime())
      ) {
        latestByStudent.set(row.examStudentId, row);
      }
    }
    const pendingEvaluations = Array.from(latestByStudent.values()).filter(
      (row) => row.submittedAt != null && row.status === "needs_review"
    ).length;

    return NextResponse.json({
      exams: teacherExams.map((e: ExamRow) => ({
        id: e.id,
        title: e.title,
        roomCode: e.examCode,
        durationMinutes: e.durationMinutes,
        questionCount: e.totalQuestions,
        status: e.status,
        isLaunched: e.isLaunched,
        isPaused: e.isPaused,
        isStarted:
          e.status === "in_progress" || e.status === "completed",
        isEnded: e.status === "completed",
        createdAt: e.createdAt?.toISOString() || "",
        startDate: e.scheduledDate?.toISOString() || undefined,
        department: e.departmentName || "",
        subject: e.subjectName || "",
      })),
      notifications: teacherNotifications.map((n: NotificationRow) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt.toISOString(),
        type: n.type,
        read: n.isRead,
        roomCode: n.relatedEntityId || undefined,
      })),
      stats: {
        liveExamsCount: liveExams.length,
        pendingEvaluations,
        joinRequestsWaiting: pendingRequestsResult[0]?.count || 0,
        lockedCount: lockedCountResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}