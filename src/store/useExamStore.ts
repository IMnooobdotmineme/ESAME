import { create } from "zustand";
import { getDepartmentCode } from "@/lib/department-utils";

export type GradingStatus = "in-progress" | "complete";

export interface GradedAnswer {
  id: string;
  type: "mcq" | "long" | "coding" | "fill-blank" | "matching";
  questionText: string;
  maxPoints: number;
  studentAnswer: string;
  correctAnswer?: string;
  autoScore?: number;
  manualScore?: number;
  feedback?: string;
  needsManualGrading?: boolean;
}

export interface StudentRequest {
  id: string;
  name: string;
  /** Student's own ID number, shown next to their name everywhere they appear. */
  studentId: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  currentQuestion?: number;
  tabSwitches?: number;
  isSubmitted?: boolean;
  isForcedSubmit?: boolean;
  isLocked?: boolean;
  isRejectedLive?: boolean;
  lastLockedAt?: string;
  /** Optional message the student wrote explaining their violation, shown to the teacher. */
  violationMessage?: string;
  submittedAt?: string;
  totalMaxPoints?: number;
  answers?: GradedAnswer[];
  /** Teacher-set grading status for this submission. Defaults to "in-progress" once submitted. */
  gradingStatus?: GradingStatus;
}

export interface Exam {
  id: string;
  courseCode: string;
  /** Full department name, e.g. "Computer Science". courseCode is the short badge derived from this. */
  department: string;
  /** Full subject name, e.g. "Data Structures & Algorithms". */
  subject: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  roomCode: string;
  /** True once the teacher clicks "Launch" from the Scheduled tab — moves it to Active,
   * even before the exam is actually started (isStarted) from the lobby page. */
  isLaunched?: boolean;
  isStarted?: boolean;
  isEnded?: boolean;
  isPaused?: boolean;
  /** ISO timestamp for when the exam was created — shown on the exam card instead of the join code. */
  createdAt: string;
  /** Optional auto-launch date. Empty/undefined means the teacher launches manually. */
  startDate?: string;
  requests: StudentRequest[];
  // Full question/section data from the exam builder — kept loosely typed here
  // since the store doesn't need to know question internals, just persist them.
  parts?: unknown[];
}

export interface CreateExamInput {
  title: string;
  department: string;
  subject: string;
  durationMinutes: number;
  parts: unknown[];
  questionCount: number;
  startDate?: string;
}

interface ExamStore {
  exams: Exam[];
  requestToJoin: (
    roomCode: string,
    studentName: string
  ) => { success: boolean; message?: string; requestId?: string };
  getStudentStatus: (
    roomCode: string,
    requestId: string
  ) => "pending" | "approved" | "rejected" | null;
  approveStudent: (roomCode: string, requestId: string) => void;
  rejectStudent: (roomCode: string, requestId: string) => void;
  deleteExam: (id: string) => void;
  startExam: (roomCode: string) => { success: boolean; message?: string };
  launchExam: (id: string) => void;
  endExam: (roomCode: string) => void;
  pauseExam: (roomCode: string) => void;
  resumeExam: (roomCode: string) => void;
  flagTabSwitch: (roomCode: string, requestId: string) => void;
  grantContinue: (roomCode: string, requestId: string) => void;
  rejectLiveStudent: (roomCode: string, requestId: string) => void;
  reinstateLiveStudent: (roomCode: string, requestId: string) => void;
  createExam: (input: CreateExamInput) => { id: string; roomCode: string };
  updateExam: (id: string, input: Partial<CreateExamInput>) => { success: boolean; message?: string };
  saveManualGrades: (
    examId: string,
    requestId: string,
    grades: { questionId: string; score: number }[]
  ) => void;
  setGradingStatus: (examId: string, requestId: string, status: GradingStatus) => void;
}

function generateRoomCode(existingCodes: string[]): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.includes(code));
  return code;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  exams: [
    {
      id: "1",
      courseCode: "CS",
      department: "Computer Science",
      subject: "Orientation Demo Session",
      title: "Demo Exam Session",
      durationMinutes: 60,
      questionCount: 5,
      roomCode: "DEMO123",
      isLaunched: true,
      isStarted: false,
      isEnded: false,
      isPaused: false,
      createdAt: "2026-07-28T09:15:00",
      requests: [
        {
          id: "req-1",
          name: "Alex Johnson",
          studentId: "STU-2026-0001",
          status: "approved",
          timestamp: "10:00 AM",
          currentQuestion: 1,
          tabSwitches: 0,
          isSubmitted: false,
          isLocked: false,
        },
        {
          id: "req-0",
          name: "Nadia Ferreira",
          studentId: "STU-2026-0002",
          status: "approved",
          timestamp: "9:59 AM",
          currentQuestion: 5,
          tabSwitches: 0,
          isSubmitted: true,
          submittedAt: "10:41 AM",
          isLocked: false,
        },
        {
          id: "req-2",
          name: "Priya Patel",
          studentId: "STU-2026-0003",
          status: "approved",
          timestamp: "10:01 AM",
          currentQuestion: 3,
          tabSwitches: 1,
          isSubmitted: false,
          isLocked: true,
          lastLockedAt: "10:14 AM",
          violationMessage:
            "My browser crashed and reopened automatically, I wasn't trying to switch tabs.",
        },
        {
          id: "req-3",
          name: "Daniel Kim",
          studentId: "STU-2026-0004",
          status: "approved",
          timestamp: "10:02 AM",
          currentQuestion: 5,
          tabSwitches: 0,
          isSubmitted: false,
          isLocked: false,
        },
        {
          id: "req-4",
          name: "Chan Sopheak",
          studentId: "STU-2026-0005",
          status: "pending",
          timestamp: "10:05 AM",
        },
        {
          id: "req-5",
          name: "Maria Gonzalez",
          studentId: "STU-2026-0006",
          status: "pending",
          timestamp: "10:07 AM",
        },
        {
          id: "req-6",
          name: "Liam O'Brien",
          studentId: "STU-2026-0007",
          status: "rejected",
          timestamp: "9:58 AM",
        },
      ],
    },
    {
      id: "2",
      courseCode: "CS",
      department: "Computer Science",
      subject: "Data Structures & Algorithms",
      title: "Introduction to Computer Science (Midterm)",
      durationMinutes: 60,
      questionCount: 10,
      roomCode: "X8K29P",
      isStarted: true,
      isEnded: true,
      createdAt: "2026-08-02T14:40:00",
      parts: [
        {
          id: "part-cs101-1",
          title: "Section A: Core Concepts",
          marks: 10,
          description: "Format restricted to Multiple Choice (QCM).",
          allowedType: "mcq",
          questions: [{ id: "q1" }],
        },
        {
          id: "part-cs101-2",
          title: "Section B: Written Response",
          marks: 40,
          description: "Format restricted to Long Question.",
          allowedType: "long_answer",
          questions: [{ id: "q2" }],
        },
      ],
      requests: [
        {
          id: "req-cs101-1",
          name: "Alexander Wright",
          studentId: "STU-2026-0008",
          status: "approved",
          timestamp: "1:58 PM",
          isSubmitted: true,
          submittedAt: "2:15 PM, Aug 9",
          totalMaxPoints: 50,
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Stack",
              correctAnswer: "Stack",
              autoScore: 10,
            },
            {
              id: "q2",
              type: "long",
              questionText:
                "Explain the difference between Object-Oriented and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "OOP organizes code around objects with data and methods. Functional programming treats computation as evaluating functions and avoids mutable state.",
              manualScore: 34,
              feedback: "Clear distinction made regarding state mutability.",
              needsManualGrading: false,
            },
          ],
        },
        {
          id: "req-cs101-2",
          name: "Sarah Jenkins",
          studentId: "STU-2026-0009",
          status: "approved",
          timestamp: "2:02 PM",
          isSubmitted: true,
          submittedAt: "2:20 PM, Aug 9",
          totalMaxPoints: 50,
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Queue",
              correctAnswer: "Stack",
              autoScore: 0,
            },
            {
              id: "q2",
              type: "long",
              questionText:
                "Explain the difference between Object-Oriented and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "OOP uses classes and objects to bundle data and functionality. Functional programming focuses on pure functions and immutability.",
              needsManualGrading: true,
            },
          ],
        },
        {
          id: "req-cs101-3",
          name: "Emily Ross",
          studentId: "STU-2026-0010",
          status: "approved",
          timestamp: "1:50 PM",
          isSubmitted: true,
          isForcedSubmit: true,
          submittedAt: "2:00 PM, Aug 9",
          totalMaxPoints: 50,
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Stack",
              correctAnswer: "Stack",
              autoScore: 10,
            },
            {
              id: "q2",
              type: "long",
              questionText:
                "Explain the difference between Object-Oriented and Functional Programming.",
              maxPoints: 40,
              studentAnswer: "Ran out of time after a tab-switch lock.",
              needsManualGrading: true,
            },
          ],
        },
        {
          id: "req-cs101-4",
          name: "Marcus Lee",
          studentId: "STU-2026-0011",
          status: "approved",
          timestamp: "1:55 PM",
          isSubmitted: true,
          isForcedSubmit: true,
          submittedAt: "2:30 PM, Aug 9",
          totalMaxPoints: 50,
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "",
              correctAnswer: "Stack",
              autoScore: 0,
            },
            {
              id: "q2",
              type: "long",
              questionText:
                "Explain the difference between Object-Oriented and Functional Programming.",
              maxPoints: 40,
              studentAnswer: "",
              needsManualGrading: true,
            },
          ],
        },
        {
          id: "req-cs101-5",
          name: "Nadia Rahman",
          studentId: "STU-2026-0012",
          status: "approved",
          timestamp: "1:52 PM",
          isSubmitted: true,
          submittedAt: "2:10 PM, Aug 9",
          totalMaxPoints: 50,
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Stack",
              correctAnswer: "Stack",
              autoScore: 10,
            },
            {
              id: "q2",
              type: "long",
              questionText:
                "Explain the difference between Object-Oriented and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "OOP models programs as interacting objects that own state. FP composes pure functions and treats data as immutable, which makes reasoning about side effects easier.",
              manualScore: 39,
              feedback: "Excellent, precise answer.",
              needsManualGrading: false,
            },
          ],
        },
        {
          id: "req-cs101-6",
          name: "Tyler Brooks",
          studentId: "STU-2026-0013",
          status: "approved",
          timestamp: "1:59 PM",
          isSubmitted: true,
          submittedAt: "2:18 PM, Aug 9",
          totalMaxPoints: 50,
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Array",
              correctAnswer: "Stack",
              autoScore: 0,
            },
            {
              id: "q2",
              type: "long",
              questionText:
                "Explain the difference between Object-Oriented and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "Not sure, OOP is like classes I think and functional is something else.",
              manualScore: 8,
              feedback: "Needs to revisit both paradigms — see office hours.",
              needsManualGrading: false,
            },
          ],
        },
      ],
    },
    {
      id: "3",
      courseCode: "CHEM",
      department: "Chemistry",
      subject: "Organic Chemistry",
      title: "Organic Chemistry Quiz 3",
      durationMinutes: 45,
      questionCount: 8,
      roomCode: "CHEM3XQ",
      // Scheduled only — no isLaunched/isStarted, so this sits in the Scheduled tab.
      // The lobby already has pending join requests queued up so clicking
      // "Launch Exam" immediately shows students waiting to be accepted.
      createdAt: "2026-08-10T11:00:00",
      requests: [
        { id: "req-chem-1", name: "Priya Chandrasekaran", studentId: "STU-2026-0014", status: "pending", timestamp: "9:41 AM" },
        { id: "req-chem-2", name: "Marcus Webb", studentId: "STU-2026-0015", status: "pending", timestamp: "9:43 AM" },
        { id: "req-chem-3", name: "Isabella Conti", studentId: "STU-2026-0016", status: "pending", timestamp: "9:44 AM" },
        { id: "req-chem-4", name: "Owen Fitzgerald", studentId: "STU-2026-0017", status: "pending", timestamp: "9:47 AM" },
      ],
    },
  ],

  requestToJoin: (roomCode, studentName) => {
    const state = get();
    const examIndex = state.exams.findIndex(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );

    if (examIndex === -1) {
      return { success: false, message: "Invalid Room Code. Please check and try again." };
    }

    const targetExam = state.exams[examIndex];
    if (targetExam.isStarted && !targetExam.isEnded) {
      return { success: false, message: "This exam has already started. New students can no longer join." };
    }
    if (targetExam.isEnded) {
      return { success: false, message: "This exam has already ended." };
    }

    const newRequestId = `req-${Date.now()}`;
    const newRequest: StudentRequest = {
      id: newRequestId,
      name: studentName,
      studentId: `STU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      // DEMO123 auto-approves so the join → waiting-room → exam flow can be
      // tested end-to-end without needing a second "teacher" tab open.
      status: targetExam.roomCode.toUpperCase() === "DEMO123" ? "approved" : "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentQuestion: 1,
      tabSwitches: 0,
      isSubmitted: false,
      isLocked: false,
    };

    const updatedExams = [...state.exams];
    updatedExams[examIndex].requests.push(newRequest);

    set({ exams: updatedExams });
    return { success: true, requestId: newRequestId };
  },

  getStudentStatus: (roomCode, requestId) => {
    const exam = get().exams.find((e) => e.roomCode.toUpperCase() === roomCode.toUpperCase());
    if (!exam) return null;
    const req = exam.requests.find((r) => r.id === requestId);
    return req ? req.status : null;
  },

  approveStudent: (roomCode, requestId) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, status: "approved" as const } : req
          ),
        };
      }),
    }));
  },

  rejectStudent: (roomCode, requestId) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, status: "rejected" as const } : req
          ),
        };
      }),
    }));
  },

  deleteExam: (id) => {
    set((state) => ({
      exams: state.exams.filter((exam) => exam.id !== id),
    }));
  },

  launchExam: (id) => {
    set((state) => ({
      exams: state.exams.map((exam) => (exam.id === id ? { ...exam, isLaunched: true } : exam)),
    }));
  },

  startExam: (roomCode) => {
    const state = get();
    const alreadyLive = state.exams.find(
      (e) => e.isStarted && !e.isEnded && e.roomCode.toUpperCase() !== roomCode.toUpperCase()
    );
    if (alreadyLive) {
      return {
        success: false,
        message: `"${alreadyLive.title}" is already live. End that session before starting another.`,
      };
    }
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.roomCode.toUpperCase() === roomCode.toUpperCase()
          ? { ...exam, isStarted: true, isEnded: false }
          : exam
      ),
    }));
    return { success: true };
  },

  endExam: (roomCode) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        const endedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return {
          ...exam,
          isEnded: true,
          requests: exam.requests.map((req) =>
            req.status === "approved" && !req.isSubmitted
              ? { ...req, isSubmitted: true, isForcedSubmit: true, submittedAt: endedAt }
              : req
          ),
        };
      }),
    }));
  },

  pauseExam: (roomCode) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.roomCode.toUpperCase() === roomCode.toUpperCase()
          ? { ...exam, isPaused: true }
          : exam
      ),
    }));
  },

  resumeExam: (roomCode) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.roomCode.toUpperCase() === roomCode.toUpperCase()
          ? { ...exam, isPaused: false }
          : exam
      ),
    }));
  },

  flagTabSwitch: (roomCode, requestId) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  tabSwitches: (req.tabSwitches ?? 0) + 1,
                  isLocked: true,
                  lastLockedAt: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : req
          ),
        };
      }),
    }));
  },

  grantContinue: (roomCode, requestId) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, isLocked: false } : req
          ),
        };
      }),
    }));
  },

  rejectLiveStudent: (roomCode, requestId) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, isRejectedLive: true, isLocked: false } : req
          ),
        };
      }),
    }));
  },

  reinstateLiveStudent: (roomCode, requestId) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, isRejectedLive: false, isLocked: false } : req
          ),
        };
      }),
    }));
  },

  createExam: (input) => {
    const state = get();
    const existingCodes = state.exams.map((e) => e.roomCode);
    const roomCode = generateRoomCode(existingCodes);
    const id = `exam-${Date.now()}`;

    const newExam: Exam = {
      id,
      courseCode: getDepartmentCode(input.department),
      department: input.department,
      subject: input.subject,
      title: input.title,
      durationMinutes: input.durationMinutes,
      questionCount: input.questionCount,
      roomCode,
      isStarted: false,
      isEnded: false,
      createdAt: new Date().toISOString(),
      startDate: input.startDate,
      requests: [],
      parts: input.parts,
    };

    set({ exams: [newExam, ...state.exams] });
    return { id, roomCode };
  },

  updateExam: (id, input) => {
    const target = get().exams.find((e) => e.id === id);
    if (!target) return { success: false, message: "Exam not found." };
    if (target.isStarted && !target.isEnded) {
      return { success: false, message: "This exam is live and cannot be edited. End the session first." };
    }
    if (target.isEnded) {
      return { success: false, message: "Completed exams cannot be edited." };
    }
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.id === id
          ? {
              ...exam,
              ...(input.title !== undefined && { title: input.title }),
              ...(input.department !== undefined && {
                department: input.department,
                courseCode: getDepartmentCode(input.department),
              }),
              ...(input.subject !== undefined && { subject: input.subject }),
              ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
              ...(input.questionCount !== undefined && { questionCount: input.questionCount }),
              ...(input.parts !== undefined && { parts: input.parts }),
              ...(input.startDate !== undefined && { startDate: input.startDate }),
            }
          : exam
      ),
    }));
    return { success: true };
  },

  saveManualGrades: (examId, requestId, grades) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.id !== examId) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) => {
            if (req.id !== requestId || !req.answers) return req;
            return {
              ...req,
              answers: req.answers.map((a) => {
                const g = grades.find((x) => x.questionId === a.id);
                if (!g) return a;
                return { ...a, manualScore: g.score, needsManualGrading: false };
              }),
            };
          }),
        };
      }),
    }));
  },

  setGradingStatus: (examId, requestId, status) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.id !== examId) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, gradingStatus: status } : req
          ),
        };
      }),
    }));
  },
}));