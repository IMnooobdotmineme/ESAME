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
// 1. DEMO MOCK DATA
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
    status: "active",
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
    startDate: "2026-12-01T09:00:00",
  },
  {
    id: "demo-4",
    title: "Cybersecurity Essentials Quiz 2",
    courseCode: "CYB11",
    roomCode: "SEC-QUIZ",
    durationMinutes: 45,
    questionCount: 15,
    status: "scheduled",
  },

  // --- COMPLETED EXAMS ---
  {
    id: "demo-5",
    title: "Web Development Fundamentals - HTML/CSS",
    courseCode: "WEB10",
    roomCode: "WEB-POP1",
    durationMinutes: 30,
    questionCount: 20,
    endDate: "2026-05-15T18:00:00",
  },
  {
    id: "demo-6",
    title: "Algorithms & Data Structures Pop Quiz",
    courseCode: "CS201",
    roomCode: "ALGO-PASSED",
    durationMinutes: 40,
    questionCount: 10,
    status: "completed",
  },
];

// ----------------------------------------------------------------------
// 2. DYNAMIC STATUS RESOLVER
// ----------------------------------------------------------------------
function getExamStatus(exam: any): "active" | "scheduled" | "completed" {
  if (exam.status === "active" || exam.status === "scheduled" || exam.status === "completed") {
    return exam.status;
  }

  const now = new Date();

  if (exam.startDate || exam.startTime) {
    const start = new Date(exam.startDate || exam.startTime);
    if (start > now) return "scheduled";
  }

  if (exam.endDate || exam.endTime) {
    const end = new Date(exam.endDate || exam.endTime);
    if (end < now) return "completed";
  }

  return "active";
}

export default function MyExamsPage() {
  const router = useRouter();

  const storeExams = useExamStore((state) => state.exams) || [];
  const deleteExam = useExamStore((state) => state.deleteExam);

  const rawExams = storeExams.length > 0 ? storeExams : (DEMO_MOCK_EXAMS as Exam[]);

  const [selectedExam, setSelectedExam] = useState<ExamCard | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed">("active");

  const mappedExams: ExamCard[] = rawExams.map((exam) => ({
    ...exam,
    accessCode: exam.roomCode || "DEMO123",
    duration: exam.durationMinutes ?? 60,
    status: getExamStatus(exam),
  }));

  const filteredExams = mappedExams.filter((exam) => exam.status === activeTab);

  const counts = {
    active: mappedExams.filter((e) => e.status === "active").length,
    scheduled: mappedExams.filter((e) => e.status === "scheduled").length,
    completed: mappedExams.filter((e) => e.status === "completed").length,
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteExam = (id: string) => {
    if (confirm("Are you sure you want to delete this exam?")) {
      deleteExam?.(id);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
            Assessment Management
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Exams Repository
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your created examinations, launch live proctoring, or create new assessments.
          </p>
        </div>

        <button
          onClick={() => router.push("/teacher/exams/new")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* NAVIGATION TABS WITH LIVE COUNTS */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
        {(["active", "scheduled", "completed"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-xs font-semibold capitalize transition-all cursor-pointer relative ${
              activeTab === tab
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab} Exams ({counts[tab]})
          </button>
        ))}
      </div>

      {/* EXAMS LIST */}
      <div className="space-y-3">
        {filteredExams.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-200">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-400">
              No {activeTab} exams available in repository.
            </p>
            {activeTab === "active" && (
              <button
                onClick={() => router.push("/teacher/exams/new")}
                className="text-xs text-sky-600 font-semibold hover:text-sky-700 transition-colors inline-block cursor-pointer"
              >
                Create your first exam
              </button>
            )}
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Exam Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
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
                  <span className="text-[11px] font-medium text-slate-400">ACCESS JOIN CODE:</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-200">
                    {exam.accessCode}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => router.push(`/teacher/exams/${exam.accessCode}`)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Exam</span>
                </button>

                {exam.status !== "completed" && (
                  <button
                    onClick={() => setSelectedExam(exam)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-navy-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Live Monitor</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete Exam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* POPUP MODAL: ACCESS JOIN CODE & LIVE MONITOR LAUNCH */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Exam Access Session</span>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Details */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">{selectedExam.title}</h3>
              <p className="text-xs font-medium text-slate-500">
                Share this Access Join Code with your students to let them start the examination.
              </p>
            </div>

            {/* Access Code Display */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-xl text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Student Access Join Code
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tracking-widest font-mono">
                {selectedExam.accessCode}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCopyCode(selectedExam.accessCode)}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                className="w-full py-2.5 px-4 bg-navy-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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