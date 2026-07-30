import { create } from "zustand";

export interface StudentRequest {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  timestamp: string;
  currentQuestion?: number;
  tabSwitches?: number;
  isSubmitted?: boolean;
}

export interface Exam {
  id: string;
  courseCode: string;
  title: string;
  durationMinutes: number;
  questionCount: number;
  roomCode: string;
  isStarted?: boolean;
  isEnded?: boolean;
  requests: StudentRequest[];
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
  startExam: (roomCode: string) => void;
  endExam: (roomCode: string) => void;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  exams: [
    {
      id: "1",
      courseCode: "DEMO",
      title: "Demo Exam Session",
      durationMinutes: 60,
      questionCount: 5,
      roomCode: "DEMO123",
      isStarted: false,
      isEnded: false,
      requests: [
        {
          id: "req-1",
          name: "Alex Johnson",
          status: "approved",
          timestamp: "10:00 AM",
          currentQuestion: 1,
          tabSwitches: 0,
          isSubmitted: false,
        },
      ],
    },
    {
      id: "2",
      courseCode: "CS101",
      title: "Introduction to Computer Science (Midterm)",
      durationMinutes: 60,
      questionCount: 10,
      roomCode: "X8K29P",
      isStarted: false,
      isEnded: false,
      requests: [],
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

    const newRequestId = `req-${Date.now()}`;
    const newRequest: StudentRequest = {
      id: newRequestId,
      name: studentName,
      status: "pending",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentQuestion: 1,
      tabSwitches: 0,
      isSubmitted: false,
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

  startExam: (roomCode) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.roomCode.toUpperCase() === roomCode.toUpperCase()
          ? { ...exam, isStarted: true, isEnded: false }
          : exam
      ),
    }));
  },

  endExam: (roomCode) => {
    set((state) => ({
      exams: state.exams.map((exam) =>
        exam.roomCode.toUpperCase() === roomCode.toUpperCase()
          ? { ...exam, isEnded: true }
          : exam
      ),
    }));
  },
}));