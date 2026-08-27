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
  violationMessage?: string;
  submittedAt?: string;
  totalMaxPoints?: number;
  answers?: GradedAnswer[];
  gradingStatus?: GradingStatus;
}

export interface Exam {
  id: string;
  courseCode: string;
  department: string;
  subject: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  roomCode: string;
  isLaunched?: boolean;
  isStarted?: boolean;
  isEnded?: boolean;
  isPaused?: boolean;
  createdAt: string;
  startDate?: string;
  gradingStatus?: GradingStatus;
  requests: StudentRequest[];
  parts?: unknown[];
  endedAt?: string | null;
  endTime?: string | null;
  startedAt?: string;
}

export interface CreateExamInput {
  title: string;
  department: string;
  subject: string;
  description?: string;
  durationMinutes: number;
  parts: unknown[];
  questionCount: number;
  startDate?: string;
}

const CACHE_TTL = 10_000; // 10 seconds — navigating within this window is instant

interface ExamStore {
  exams: Exam[];
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchExams: (force?: boolean) => Promise<void>;
  requestToJoin: (
    roomCode: string,
    studentName: string
  ) => Promise<{ success: boolean; message?: string; requestId?: string }>;
  getStudentStatus: (
    roomCode: string,
    requestId: string
  ) => Promise<"pending" | "approved" | "rejected" | null>;
  approveStudent: (roomCode: string, requestId: string) => Promise<void>;
  rejectStudent: (roomCode: string, requestId: string) => Promise<void>;
  deleteExam: (id: string) => Promise<{ success: boolean; message?: string }>;
  launchExam: (
    id: string
  ) => Promise<{ success: boolean; roomCode?: string; message?: string }>;
  startExam: (roomCode: string) => Promise<{ success: boolean; message?: string }>;
  endExam: (roomCode: string) => Promise<void>;
  pauseExam: (roomCode: string) => Promise<void>;
  resumeExam: (roomCode: string) => Promise<void>;
  flagTabSwitch: (roomCode: string, requestId: string) => void;
  submitViolationMessage: (roomCode: string, requestId: string, message: string) => void;
  grantContinue: (roomCode: string, requestId: string) => Promise<void>;
  rejectLiveStudent: (roomCode: string, requestId: string) => Promise<void>;
  reinstateLiveStudent: (roomCode: string, requestId: string) => void;
  createExam: (
    input: CreateExamInput
  ) => Promise<{ id: string; roomCode: string; message?: string }>;
  updateExam: (
    id: string,
    input: Partial<CreateExamInput>
  ) => Promise<{ success: boolean; message?: string }>;
  saveManualGrades: (
    examId: string,
    requestId: string,
    grades: { questionId: string; score: number }[]
  ) => Promise<void>;
  setGradingStatus: (examId: string, requestId: string, status: GradingStatus) => Promise<void>;
  setExamGradingStatus: (examId: string, status: GradingStatus) => Promise<void>;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  exams: [],
  isLoading: false,
  lastFetchedAt: null,

  // ✅ Cached fetch: instant navigation, fresh data only when forced or stale
  fetchExams: async (force = false) => {
    const { lastFetchedAt, exams } = get();
    if (!force && lastFetchedAt && Date.now() - lastFetchedAt < CACHE_TTL) {
      return; // use cache — page renders immediately
    }
    if (exams.length === 0) set({ isLoading: true });
    try {
      const res = await fetch("/api/teacher/exams");
      if (!res.ok) throw new Error("Failed to fetch exams");
      const data = await res.json();
      set({
        exams: (data.exams || []).map((e: any) => ({
          ...e,
          courseCode: e.courseCode || getDepartmentCode(e.department || ""),
        })),
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      console.error("fetchExams error:", error);
      set({ isLoading: false });
    }
  },

  requestToJoin: async (roomCode, studentName) => {
    return { success: false, message: "Student side not yet implemented" };
  },

  getStudentStatus: async (roomCode, requestId) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return null;
    const req = exam.requests.find((r) => r.id === requestId);
    return req ? req.status : null;
  },

  approveStudent: async (roomCode, requestId) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/approve/${requestId}`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("approveStudent error:", error);
    }
  },

  rejectStudent: async (roomCode, requestId) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/reject/${requestId}`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("rejectStudent error:", error);
    }
  },

  deleteExam: async (id) => {
    try {
      const res = await fetch(`/api/teacher/exams/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, message: data.error || "Failed to delete" };
      await get().fetchExams(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  },

  launchExam: async (id) => {
    try {
      const res = await fetch(`/api/teacher/exams/${id}/launch`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, message: data.error || "Failed to launch exam." };
      await get().fetchExams(true);
      return { success: true, roomCode: data.roomCode };
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  },

  startExam: async (roomCode) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return { success: false, message: "Exam not found." };
    try {
      const res = await fetch(`/api/teacher/exams/${exam.id}/start`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || "Failed to start exam." };
      }
      await get().fetchExams(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: "Failed to start exam." };
    }
  },

  endExam: async (roomCode) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/end`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("endExam error:", error);
    }
  },

  pauseExam: async (roomCode) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/pause`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("pauseExam error:", error);
    }
  },

  resumeExam: async (roomCode) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/resume`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("resumeExam error:", error);
    }
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

  submitViolationMessage: (roomCode, requestId, message) => {
    set((state) => ({
      exams: state.exams.map((exam) => {
        if (exam.roomCode.toUpperCase() !== roomCode.toUpperCase()) return exam;
        return {
          ...exam,
          requests: exam.requests.map((req) =>
            req.id === requestId ? { ...req, violationMessage: message } : req
          ),
        };
      }),
    }));
  },

  grantContinue: async (roomCode, requestId) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/grant-continue/${requestId}`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("grantContinue error:", error);
    }
  },

  rejectLiveStudent: async (roomCode, requestId) => {
    const exam = get().exams.find(
      (e) => e.roomCode.toUpperCase() === roomCode.toUpperCase()
    );
    if (!exam) return;
    try {
      await fetch(`/api/teacher/exams/${exam.id}/reject-live/${requestId}`, { method: "POST" });
      await get().fetchExams(true);
    } catch (error) {
      console.error("rejectLiveStudent error:", error);
    }
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

  createExam: async (input) => {
    try {
      const res = await fetch("/api/teacher/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }
      if (!res.ok) return { id: "", roomCode: "", message: data.error || "Failed" };
      await get().fetchExams(true);
      return { id: data.id, roomCode: "" };
    } catch (error) {
      return { id: "", roomCode: "", message: "Network error" };
    }
  },

  updateExam: async (id, input) => {
    try {
      const res = await fetch(`/api/teacher/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }
      if (!res.ok || data.success === false) {
        return { success: false, message: data.message || data.error || "Failed" };
      }
      await get().fetchExams(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  },

    saveManualGrades: async (
    examId: string,
    requestId: string,
    grades: { questionId: string; score: number }[]
  ) => {
    // ✅ 1. Persist to the database
    try {
      const res = await fetch(`/api/teacher/grading/${examId}/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grades }),
      });
      if (!res.ok) console.error("Server save failed");
    } catch (error) {
      console.error("Save grades error:", error);
    }

    // ✅ 2. Optimistic local update (roster flips immediately)
    set((state) => ({
      exams: state.exams.map((e) =>
        e.id !== examId
          ? e
          : {
              ...e,
              requests: e.requests.map((r) =>
                r.id !== requestId
                  ? r
                  : {
                      ...r,
                      gradingStatus: "complete" as const,
                      answers: (r.answers || []).map((a) => {
                        const g = grades.find((x) => x.questionId === a.id);
                        return g ? { ...a, manualScore: g.score } : a;
                      }),
                    }
              ),
            }
      ),
    }));

    // ✅ 3. Re-sync from server so everything agrees
    await get().fetchExams();
  },

  setGradingStatus: async (examId, requestId, status) => {
    try {
      await fetch(`/api/teacher/grading/${examId}/set-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, requestId }),
      });
      await get().fetchExams(true);
    } catch (error) {
      console.error("setGradingStatus error:", error);
    }
  },

    setExamGradingStatus: async (examId: string, status: GradingStatus) => {
    // ✅ DB uses underscore ("in_progress" | "complete")
    // ✅ Store uses hyphen ("in-progress" | "complete")
    const dbStatus = status === "complete" ? "complete" : "in_progress";
    const storeStatus: GradingStatus = status === "complete" ? "complete" : "in-progress";

    try {
      await fetch(`/api/teacher/exams/${examId}/grading-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: dbStatus }),
      });
    } catch {
      // network error — still update locally so the UI doesn't feel broken
    }

    set((state) => ({
      exams: state.exams.map((e) =>
        e.id === examId ? { ...e, gradingStatus: storeStatus } : e
      ),
    }));
  },
}));