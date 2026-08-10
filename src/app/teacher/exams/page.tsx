"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore, type Exam } from "@/store/useExamStore";
import {
  Plus,
  Edit3,
  Play,
  Trash2,
  Copy,
  Check,
  X,
  ShieldCheck,
  Clock,
  HelpCircle,
  FileText,
  Key
} from "lucide-react";

type ExamCard = Exam & {
  accessCode: string;
  duration: number;
  status: "active" | "scheduled" | "completed";
  startDate?: string;
  endDate?: string;
};

// ----------------------------------------------------------------------
// 1. DEMO MOCK DATA (Demonstrates both Explicit Status & Date Logic)
// ----------------------------------------------------------------------
const DEMO_MOCK_EXAMS: Partial<ExamCard>[] = [
  // --- ACTIVE EXAMS ---
  {
    id: "demo-1",
    title: "Introduction to Computer Science (Midterm)",
    courseCode: "CS101",
    roomCode: "CS101-MID",
    durationMinutes: 60,
    questionCount: 30,
    status: "active", // Explicit status
  },
  {
    id: "demo-2",
    title: "Software Engineering & Architecture Principles",
    courseCode: "SE302",
    roomCode: "ARCH-2026",
    durationMinutes: 90,
    questionCount: 25,
    status: "active",
  },

  // --- SCHEDULED EXAMS ---
  {
    id: "demo-3",
    title: "Database Systems & SQL Optimization Final",
    courseCode: "DB201",
    roomCode: "DBSQL-88",
    durationMinutes: 120,
    questionCount: 40,
    startDate: "2026-12-01T09:00:00", // Future date -> Automatically evaluated as 'scheduled'
  },
  {
    id: "demo-4",
    title: "Cybersecurity Essentials Quiz 2",
    courseCode: "CYB11",
    roomCode: "SEC-QUIZ",
    durationMinutes: 45,
    questionCount: 15,
    status: "scheduled", // Explicit status
  },

  // --- COMPLETED EXAMS ---
  {
    id: "demo-5",
    title: "Web Development Fundamentals - HTML/CSS",
    courseCode: "WEB10",
    roomCode: "WEB-POP1",
    durationMinutes: 30,
    questionCount: 20,
    endDate: "2026-05-15T18:00:00", // Past date -> Automatically evaluated as 'completed'
  },
  {
    id: "demo-6",
    title: "Algorithms & Data Structures Pop Quiz",
    courseCode: "CS201",
    roomCode: "ALGO-PASSED",
    durationMinutes: 40,
    questionCount: 10,
    status: "completed", // Explicit status
  },
];

// ----------------------------------------------------------------------
// 2. DYNAMIC STATUS RESOLVER
// ----------------------------------------------------------------------
function getExamStatus(exam: any): "active" | "scheduled" | "completed" {
  // Method A: Check explicit status field first
  if (exam.status === "active" || exam.status === "scheduled" || exam.status === "completed") {
    return exam.status;
  }

  const now = new Date();

  // Method B: Future Start Date -> Scheduled
  if (exam.startDate || exam.startTime) {
    const start = new Date(exam.startDate || exam.startTime);
    if (start > now) return "scheduled";
  }

  // Method C: Past End Date -> Completed
  if (exam.endDate || exam.endTime) {
    const end = new Date(exam.endDate || exam.endTime);
    if (end < now) return "completed";
  }

  // Default fallback
  return "active";
}

export default function MyExamsPage() {
  const router = useRouter();

  // Read real-time exams from store, or fallback to DEMO_MOCK_EXAMS if store is empty
  const storeExams = useExamStore((state) => state.exams) || [];
  const deleteExam = useExamStore((state) => state.deleteExam);

  const rawExams = storeExams.length > 0 ? storeExams : (DEMO_MOCK_EXAMS as Exam[]);

  // Modal State & Active Tab State
  const [selectedExam, setSelectedExam] = useState<ExamCard | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed">("active");

  // Map store structure & resolve status dynamically
  const mappedExams: ExamCard[] = rawExams.map((exam) => ({
    ...exam,
    accessCode: exam.roomCode || "DEMO123",
    duration: exam.durationMinutes ?? 60,
    status: getExamStatus(exam),
  }));

  // Filter exams dynamically based on active tab
  const filteredExams = mappedExams.filter((exam) => exam.status === activeTab);

  // Calculate dynamic counts for tab headers
  const counts = {
    active: mappedExams.filter((e) => e.status === "active").length,
    scheduled: mappedExams.filter((e) => e.status === "scheduled").length,
    completed: mappedExams.filter((e) => e.status === "completed").length,
  };

  // Handle Copying Access Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete Exam Handler
  const handleDeleteExam = (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      deleteExam?.(id);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 bg-slate-50/60 min-h-screen text-slate-800">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Exams Repository
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage your created examinations, launch live proctoring, or create new assessments.
          </p>
        </div>

        <button
          onClick={() => router.push("/teacher/exams/new")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-semibold rounded-full shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* 2. NAVIGATION TABS WITH LIVE COUNTS */}
      <div className="border-b border-slate-200/80 flex gap-6">
        {(["active", "scheduled", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold capitalize transition-colors relative ${
              activeTab === tab
                ? "text-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab} Exams ({counts[tab]})
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#395886] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 3. EXAMS LIST */}
      <div className="space-y-3">
        {filteredExams.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-3">
            <div className="w-12 h-12 bg-[#F0F3FA] text-[#395886] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-[#B1C9EF]/60">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400">
              No {activeTab} exams available in repository.
            </p>
            {activeTab === "active" && (
              <button
                onClick={() => router.push("/teacher/exams/new")}
                className="text-xs text-[#395886] font-bold hover:underline inline-block"
              >
                Create your first exam
              </button>
            )}
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Exam Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="px-2 py-0.5 bg-[#D5DEEF] text-[#395886] text-[10px] font-bold rounded tracking-wide uppercase">
                    {exam.courseCode || "EXAM"}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {exam.duration} mins
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium text-xs">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {exam.questions?.length ?? exam.questionCount ?? 0} Questions
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{exam.title}</h3>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px]">ACCESS JOIN CODE:</span>
                  <span className="px-2 py-0.5 bg-[#F0F3FA] text-[#395886] font-mono font-bold rounded border border-[#B1C9EF]/60">
                    {exam.accessCode}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => router.push(`/teacher/exams/${exam.accessCode}`)}
                  className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Exam</span>
                </button>

                {exam.status !== "completed" && (
                  <button
                    onClick={() => setSelectedExam(exam)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-[#395886] hover:bg-[#2e476d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Live Monitor</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. POPUP MODAL: ACCESS JOIN CODE & LIVE MONITOR LAUNCH */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#395886]">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Exam Access Session</span>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Details */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{selectedExam.title}</h3>
              <p className="text-xs font-medium text-slate-500">
                Share this Access Join Code with your students to let them start the examination.
              </p>
            </div>

            {/* Access Code Display */}
            <div className="bg-[#F0F3FA] border-2 border-dashed border-[#B1C9EF] p-6 rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Student Access Join Code
              </span>
              <div className="text-3xl font-extrabold text-[#395886] tracking-widest font-mono">
                {selectedExam.accessCode}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleCopyCode(selectedExam.accessCode)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Access Code</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const code = selectedExam.accessCode;
                  setSelectedExam(null);
                  router.push(`/teacher/exams/${code}`);
                }}
                className="w-full py-3 px-4 bg-[#395886] hover:bg-[#2e476d] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Enter Live Monitoring Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}