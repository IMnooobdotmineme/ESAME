"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore, type Exam } from "@/store/useExamStore";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Settings2,
  Play,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  HelpCircle,
  FileText,
  Key,
} from "lucide-react";

type ExamCard = Exam & {
  accessCode: string;
  duration: number;
  status: "active" | "scheduled" | "completed";
  startDate?: string;
  endDate?: string;
  questions?: unknown[];
};

const DEMO_MOCK_EXAMS: Partial<ExamCard>[] = [
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

function getExamStatus(exam: Partial<ExamCard>): "active" | "scheduled" | "completed" {
  if (exam.status === "active" || exam.status === "scheduled" || exam.status === "completed") {
    return exam.status;
  }

  const now = new Date();

  if (exam.startDate) {
    const start = new Date(exam.startDate);
    if (start > now) return "scheduled";
  }

  if (exam.endDate) {
    const end = new Date(exam.endDate);
    if (end < now) return "completed";
  }

  return "active";
}

const TABS = ["active", "scheduled", "completed"] as const;

export default function MyExamsPage() {
  const router = useRouter();

  const storeExams = useExamStore((state) => state.exams) || [];
  const deleteExam = useExamStore((state) => state.deleteExam);

  const rawExams = storeExams.length > 0 ? storeExams : (DEMO_MOCK_EXAMS as Exam[]);

  const [selectedExam, setSelectedExam] = useState<ExamCard | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("active");

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

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function confirmDelete() {
    if (pendingDeleteId) {
      deleteExam?.(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }

  return (
    <>
      <TeacherTopbar
        title="My Exams"
        description="Manage your created examinations, launch live proctoring, or create new assessments"
      />

      <main className="p-6 space-y-6">
        {/* Header action */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/teacher/exams/new")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create New Exam
          </button>
        </div>

        {/* Filter tabs — pill style, matching design system convention */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "rounded-full px-4 py-1.5 text-sm font-medium bg-navy-900 text-white capitalize"
                  : "rounded-full px-4 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 capitalize"
              }
            >
              {tab} Exams ({counts[tab]})
            </button>
          ))}
        </div>

        {/* Exams list */}
        <div className="space-y-3">
          {filteredExams.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-200">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-400">
                No {activeTab} exams available in repository.
              </p>
              {activeTab === "active" && (
                <button
                  onClick={() => router.push("/teacher/exams/new")}
                  className="text-xs text-sky-600 font-semibold hover:text-sky-700 transition-colors"
                >
                  Create your first exam
                </button>
              )}
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
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

                  <h3 className="text-sm font-bold text-navy-900">{exam.title}</h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-400">ACCESS JOIN CODE:</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-200">
                      {exam.accessCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => router.push(`/teacher/exams/${exam.accessCode}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-all"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                    Manage Exam
                  </button>

                  {exam.status !== "completed" && (
                    <button
                      onClick={() => setSelectedExam(exam)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-navy-900 hover:bg-navy-800 text-white rounded-full text-xs font-semibold transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Launch Live Monitor
                    </button>
                  )}

                  <button
                    onClick={() => setPendingDeleteId(exam.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Access join code + launch monitor modal */}
      <Dialog open={!!selectedExam} onClose={() => setSelectedExam(null)} className="max-w-md">
        {selectedExam && (
          <>
            <DialogHeader title="Exam Access Session" onClose={() => setSelectedExam(null)} />
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-2 text-navy-900">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Share this code with students
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-navy-900">{selectedExam.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Share this Access Join Code with your students to let them start the examination.
                </p>
              </div>

              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-xl text-center space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Student Access Join Code
                </span>
                <div className="text-2xl font-extrabold text-navy-900 tracking-widest font-mono">
                  {selectedExam.accessCode}
                </div>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => handleCopyCode(selectedExam.accessCode)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Code Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    Copy Access Code
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  const code = selectedExam.accessCode;
                  setSelectedExam(null);
                  router.push(`/teacher/exams/${code}`);
                }}
                className="flex-1 py-2.5 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                Enter Live Monitoring
              </button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete this exam?"
        description="This will permanently remove the exam and its data. This action cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
}