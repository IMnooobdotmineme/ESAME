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
  FileText
} from "lucide-react";

type ExamCard = Exam & {
  accessCode: string;
  duration: number;
};

export default function MyExamsPage() {
  const router = useRouter();

  // Read real-time exams from Zustand Store
  const storeExams = useExamStore((state) => state.exams);
  const deleteExam = useExamStore((state) => state.deleteExam);

  // Modal State & Active Tab State
  const [selectedExam, setSelectedExam] = useState<ExamCard | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed">("active");

  // Map store structure to match UI fields cleanly
  const exams: ExamCard[] = storeExams.map((exam) => ({
    ...exam,
    accessCode: exam.roomCode || "DEMO123",
    duration: exam.durationMinutes ?? 60,
  }));

  // Handle Copying Access Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete Exam Handler (deletes from Zustand store)
  const handleDeleteExam = (id: string) => {
    if (deleteExam) {
      deleteExam(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#638ECB] tracking-wider block mb-1">
            EXAM MANAGEMENT
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Examination Repository
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Review live feeds, coordinate test schedules, or edit existing exam questions.
          </p>
        </div>

        <button
          onClick={() => router.push("/teacher/exams/new")}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="border-b border-slate-200/80 flex gap-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 text-xs font-bold transition-colors relative ${
            activeTab === "active"
              ? "text-[#395886]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Active Exams ({exams.length})
          {activeTab === "active" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#395886] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`pb-3 text-xs font-bold transition-colors relative ${
            activeTab === "scheduled"
              ? "text-[#395886]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Scheduled Exams (0)
          {activeTab === "scheduled" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#395886] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 text-xs font-bold transition-colors relative ${
            activeTab === "completed"
              ? "text-[#395886]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Completed Exams (0)
          {activeTab === "completed" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#395886] rounded-full" />
          )}
        </button>
      </div>

      {/* 3. EXAMS LIST */}
      <div className="space-y-3">
        {activeTab !== "active" ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
            <p className="text-xs font-bold text-slate-400">No {activeTab} exams found.</p>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-[#F0F3FA] text-[#395886] rounded-2xl flex items-center justify-center mx-auto mb-2 border border-[#B1C9EF]/40">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-400">No active exams available.</p>
            <button
              onClick={() => router.push("/teacher/exams/new")}
              className="text-xs text-[#395886] font-black hover:underline inline-block"
            >
              Create your first exam
            </button>
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Exam Information */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                  <span className="bg-[#D5DEEF] text-[#395886] font-black px-2.5 py-0.5 rounded-md text-[10px] tracking-wider uppercase">
                    {exam.courseCode}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {exam.duration} mins
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium text-xs">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {exam.questionCount} Questions
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900">{exam.title}</h3>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => router.push(`/teacher/exams/${exam.accessCode}`)}
                  className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Exam</span>
                </button>

                <button
                  onClick={() => setSelectedExam(exam)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#395886] hover:bg-[#2e476d] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Live Monitor</span>
                </button>

                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#395886]">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Exam Access Session</span>
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
              <h3 className="text-lg font-black text-slate-900">{selectedExam.title}</h3>
              <p className="text-xs font-medium text-slate-400">
                Share this Access Join Code with your students to let them start the examination.
              </p>
            </div>

            {/* Access Code Display */}
            <div className="bg-[#F0F3FA] border-2 border-dashed border-[#B1C9EF] p-6 rounded-2xl text-center space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Student Access Join Code
              </span>
              <div className="text-3xl font-black text-[#395886] tracking-widest font-mono">
                {selectedExam.accessCode}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => handleCopyCode(selectedExam.accessCode)}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
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
                className="w-full py-3.5 px-4 bg-[#395886] hover:bg-[#2e476d] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
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