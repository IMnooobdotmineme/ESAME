import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { autoEndExamIfExpired } from "@/lib/auto-end";
import {
  exams,
  examStudents,
  departments,
  subjects,
  teachers,
  organizations,
  studentExamAttempts,
  studentAnswers,
  examQuestions,
  examQuestionOptions,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

type ExamRow = {
  id: string;
  title: string;
  examCode: string;
  durationMinutes: number;
  totalQuestions: number;
  status: "scheduled" | "in_progress" | "completed" | "locked";
  gradingStatus: "in_progress" | "complete";
  isLaunched: boolean;
  isPaused: boolean;
  pausedAt: Date | null;
  pausedTotalSeconds: number;
  scheduledDate: Date | null;
  endTime: Date | null;
  startTime: Date | null;
  createdAt: Date;
  parts: unknown[];
  departmentId: string;
  subjectId: string;
  departmentName: string | null;
  subjectName: string | null;
  teacherName: string | null;
  orgName: string | null;
};

type StudentRow = typeof examStudents.$inferSelect;
type AttemptRow = typeof studentExamAttempts.$inferSelect;
type OptionRow = typeof examQuestionOptions.$inferSelect;
type AnswerRow = {
  answer: typeof studentAnswers.$inferSelect;
  question: typeof examQuestions.$inferSelect | null;
};

export async function GET(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;

    // ✅ Auto-end any expired exam BEFORE building the response
    const inProgress = await db
      .select({ id: exams.id })
      .from(exams)
      .where(and(eq(exams.teacherId, teacherId), eq(exams.status, "in_progress")));
    for (const e of inProgress) await autoEndExamIfExpired(e.id);

    const teacherExams: ExamRow[] = await db
      .select({
        id: exams.id,
        title: exams.title,
        examCode: exams.examCode,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        status: exams.status,
        gradingStatus: exams.gradingStatus,
        isLaunched: exams.isLaunched,
        isPaused: exams.isPaused,
        scheduledDate: exams.scheduledDate,
        createdAt: exams.createdAt,
        endTime: exams.endTime,
        startTime: exams.startTime,
        pausedAt: exams.pausedAt,               
        pausedTotalSeconds: exams.pausedTotalSeconds,
        parts: exams.parts,
        departmentId: exams.departmentId,
        subjectId: exams.subjectId,
        departmentName: departments.name,
        subjectName: subjects.name,
        teacherName: teachers.name,
        orgName: organizations.name,
      })
      .from(exams)
      .leftJoin(departments, eq(exams.departmentId, departments.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .leftJoin(teachers, eq(exams.teacherId, teachers.id))
      .leftJoin(organizations, eq(exams.orgId, organizations.id))
      .where(eq(exams.teacherId, teacherId))
      .orderBy(desc(exams.createdAt));

    const examsWithStudents = await Promise.all(
      teacherExams.map(async (exam: ExamRow) => {
        const studentRows: StudentRow[] = await db
          .select()
          .from(examStudents)
          .where(eq(examStudents.examId, exam.id));

        const studentIds = studentRows.map((s: StudentRow) => s.id);

        const attemptRows: AttemptRow[] =
          studentIds.length > 0
            ? await db
                .select()
                .from(studentExamAttempts)
                .where(inArray(studentExamAttempts.examStudentId, studentIds))
            : [];

        const attemptByStudent = new Map<string, AttemptRow>(
          attemptRows.map((a: AttemptRow): [string, AttemptRow] => [a.examStudentId, a])
        );

        const attemptIds = attemptRows.map((a: AttemptRow) => a.id);
        const answerRows: AnswerRow[] =
          attemptIds.length > 0
            ? await db
                .select({ answer: studentAnswers, question: examQuestions })
                .from(studentAnswers)
                .leftJoin(examQuestions, eq(studentAnswers.questionId, examQuestions.id))
                .where(inArray(studentAnswers.attemptId, attemptIds))
            : [];

        const questionIds = Array.from(
          new Set(answerRows.map((r: AnswerRow) => r.answer.questionId))
        );
        const optionRows: OptionRow[] =
          questionIds.length > 0
            ? await db
                .select()
                .from(examQuestionOptions)
                .where(inArray(examQuestionOptions.questionId, questionIds))
            : [];

        const buildAnswers = (attemptId: string) =>
          answerRows
            .filter((r: AnswerRow) => r.answer.attemptId === attemptId)
            .map((r: AnswerRow) => {
              const qType = r.question?.questionType;
              const qPayload = (r.question?.payload ?? {}) as any;
              const isAuto =
                (qType === "mcq" ||
                  qType === "multiple_select" ||
                  qType === "true_false" ||
                  qType === "fill_in_blank" ||
                  qType === "matching" ||
                  qType === "ordering") &&
                qPayload.autoGrade !== false;
              const opts = optionRows.filter(
                (o: OptionRow) => o.questionId === (r.question?.id ?? "")
              );
              let studentAnswer = r.answer.answerText || "";
              if (isAuto && (r.answer.selectedOptionIds || []).length > 0) {
                studentAnswer = opts
                  .filter((o: OptionRow) =>
                    r.answer.selectedOptionIds.includes(o.id)
                  )
                  .map((o: OptionRow) => o.optionText)
                  .join(", ");
              }
              return {
                id: r.answer.id,
                type: isAuto ? ("mcq" as const) : ("long" as const),
                questionText: r.question?.questionText || "",
                maxPoints: r.question?.points || 0,
                studentAnswer,
                correctAnswer: isAuto
                  ? opts
                      .filter((o: OptionRow) => o.isCorrect)
                      .map((o: OptionRow) => o.optionText)
                      .join(", ")
                  : undefined,
                autoScore: r.answer.autoPoints,
                manualScore:
                  r.answer.markedCorrect === null ? undefined : r.answer.manualPoints,
                feedback: r.answer.feedback || undefined,
                needsManualGrading: !isAuto && r.answer.markedCorrect === null,
              };
            });

        return {
          id: exam.id,
          title: exam.title,
          roomCode: exam.examCode === "DRAFT" ? "" : exam.examCode,
          courseCode: exam.examCode === "DRAFT" ? "" : exam.examCode,
          durationMinutes: exam.durationMinutes,
          questionCount: exam.totalQuestions,
          status: exam.status,
          gradingStatus: exam.gradingStatus,
          isLaunched: exam.isLaunched,
          isPaused: exam.isPaused,
          pausedAt: exam.pausedAt ? exam.pausedAt.toISOString() : undefined,
          pausedTotalSeconds: exam.pausedTotalSeconds ?? 0,
          isStarted: exam.status === "in_progress" || exam.status === "completed",
          isEnded: exam.status === "completed",
          createdAt: exam.createdAt?.toISOString() || "",
          endedAt: exam.endTime ? exam.endTime.toISOString() : null,
          endTime: exam.endTime ? exam.endTime.toISOString() : null,
          startedAt: exam.startTime ? exam.startTime.toISOString() : undefined,
          startDate: exam.scheduledDate?.toISOString() || undefined,
          department: exam.departmentName || "",
          subject: exam.subjectName || "",
          teacherName: exam.teacherName || "",
          orgName: exam.orgName || "",
          parts: exam.parts || [],
          requests: studentRows.map((s: StudentRow) => {
            const attempt: AttemptRow | undefined = attemptByStudent.get(s.id);
            const answers = attempt ? buildAnswers(attempt.id) : [];
            return {
              id: s.id,
              name: s.studentName || "",
              studentId: s.studentId,
              status: s.status,
              timestamp: s.invitedAt?.toISOString() || "",
              tabSwitches: s.tabSwitches,
              isLocked: s.isLocked,
              isRejectedLive: s.isRejectedLive,
              lastLockedAt: s.lastLockedAt?.toISOString() || undefined,
              violationMessage: s.violationMessage || undefined,
              isSubmitted: !!s.completedAt,
              isForcedSubmit: attempt?.isForcedSubmit || false,
              submittedAt: s.completedAt?.toISOString() || undefined,
              answers,
              totalMaxPoints: answers.reduce(
                (sum: number, a: { maxPoints: number }) => sum + a.maxPoints,
                0
              ),
              gradingStatus: attempt
                ? attempt.gradingStatus === "complete"
                  ? ("complete" as const)
                  : ("in_progress" as const)
                : undefined,
            };
          }),
        };
      })
    );

    return NextResponse.json({ exams: examsWithStudents });
  } catch (error) {
    console.error("Fetch exams error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;

    const teacherRows = await db
      .select({ orgId: teachers.orgId })
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (teacherRows.length === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }
    const teacher = teacherRows[0];

    const body = await req.json();
    const {
      title,
      description,
      department,
      subject,
      durationMinutes,
      parts,
      questionCount,
      startDate,
    } = body;

    const deptRows = await db
      .select()
      .from(departments)
      .where(and(eq(departments.orgId, teacher.orgId), eq(departments.name, department)));

    if (deptRows.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 400 });
    }
    const dept = deptRows[0];

    const subjRows = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.departmentId, dept.id), eq(subjects.name, subject)));

    if (subjRows.length === 0) {
      return NextResponse.json({ error: "Subject not found" }, { status: 400 });
    }
    const subj = subjRows[0];

    const newExamRows = await db
      .insert(exams)
      .values({
        orgId: teacher.orgId,
        teacherId,
        departmentId: dept.id,
        subjectId: subj.id,
        examCode: "DRAFT",
        title: title || "Untitled Examination",
        description: description || null,
        durationMinutes: durationMinutes || 60,
        totalQuestions: questionCount || 0,
        parts: parts || [],
        scheduledDate: startDate ? new Date(startDate) : null,
        status: "scheduled",
        isLaunched: false,
        isPaused: false,
      })
      .returning();

    const newExam = newExamRows[0];

    return NextResponse.json({ id: newExam.id, roomCode: "" });
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}