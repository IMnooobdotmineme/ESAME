"use client";
import { useTeacherExamRealtime } from "@/hooks/useTeacherExamRealtime";
import React, { useState, useEffect } from "react";
import { Copy, Check, CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useExamStore, type Exam } from "@/store/useExamStore";
import {
  Plus,
  Edit3,
  Play,
  Trash2,
  Clock,
  HelpCircle,
  FileText,
  CalendarDays,
  Search,
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogHeader } from "@/components/ui/dialog"; // ← ADD THIS IMPORT

type ExamCard = Exam & {
  status: "active" | "scheduled" | "completed";
  startDate?: string;
  endDate?: string;
  questions?: unknown[];
};

function getExamStatus(
  exam: Exam & { status?: ExamCard["status"] }
): "active" | "scheduled" | "completed" {
  if (exam.isEnded) return "completed";
  if (
    exam.status === "active" ||
    exam.status === "scheduled" ||
    exam.status === "completed"
  ) {
    return exam.status;
  }
  return exam.isLaunched ? "active" : "scheduled";
}

function formatCreatedDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStartDateTime(iso?: string) {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Not set";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_BADGE: Record<ExamCard["status"], "info" | "warning" | "success"> = {
  active: "info",
  scheduled: "warning",
  completed: "success",
};

const STATUS_LABEL: Record<ExamCard["status"], string> = {
  active: "Live",
  scheduled: "Upcoming",
  completed: "Completed",
};

const TAB_ORDER = ["scheduled", "active", "completed"] as const;

const TAB_LABELS: Record<(typeof TAB_ORDER)[number], string> = {
  scheduled: "Upcoming",
  active: "Active",
  completed: "Completed",
};

export default function MyExamsPage() {
  useTeacherExamRealtime(true, 2000); 
  const router = useRouter();
  const storeExams = useExamStore((state) => state.exams) || [];
  const deleteExam = useExamStore((state) => state.deleteExam);
  const launchExam = useExamStore((state) => state.launchExam);
  const fetchExams = useExamStore((state) => state.fetchExams);
  
  const [launchedRoomCode, setLaunchedRoomCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const [examPendingDelete, setExamPendingDelete] = useState<ExamCard | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "completed">("scheduled");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "active" || tab === "scheduled" || tab === "completed") {
      setActiveTab(tab);
    } else {
      setActiveTab("scheduled");
    }
  }, []);

  const [examSearch, setExamSearch] = useState("");

  const mappedExams: ExamCard[] = storeExams.map((exam) => ({
    ...exam,
    status: getExamStatus(exam),
  }));

  const filteredExams = mappedExams.filter((exam) => {
    if (exam.status !== activeTab) return false;
    const q = examSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      exam.title.toLowerCase().includes(q) ||
      exam.department?.toLowerCase().includes(q) ||
      exam.subject?.toLowerCase().includes(q) ||
      exam.courseCode?.toLowerCase().includes(q)
    );
  });

  const counts = {
    active: mappedExams.filter((e) => e.status === "active").length,
    scheduled: mappedExams.filter((e) => e.status === "scheduled").length,
    completed: mappedExams.filter((e) => e.status === "completed").length,
  };

  const handleConfirmDelete = async () => {
    if (examPendingDelete) await deleteExam?.(examPendingDelete.id);
    setExamPendingDelete(null);
  };

  return (
    <>
      <TeacherTopbar
        title="Exams Repository"
        description="Manage your created examinations, launch live proctoring, or create new assessments."
      />
      <main className="p-6 space-y-6">
        {/* PAGE ACTION ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exams by title, department, or subject..."
              value={examSearch}
              onChange={(e) => setExamSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
            />
          </div>
          <Button onClick={() => router.push("/teacher-exams/new")}>
            <Plus size={16} />
            Create New Exam
          </Button>
        </div>

        {/* NAVIGATION TABS WITH LIVE COUNTS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold capitalize transition-all cursor-pointer rounded-full whitespace-nowrap ${
                activeTab === tab
                  ? "bg-navy-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {TAB_LABELS[tab]} Exams ({counts[tab]})
            </button>
          ))}
        </div>

        {/* EXAMS LIST */}
        <div className="space-y-3">
          {filteredExams.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-200">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-400">
                {examSearch.trim()
                  ? `No ${TAB_LABELS[activeTab]} exams match "${examSearch}".`
                  : `No ${TAB_LABELS[activeTab]} exams available in repository.`}
              </p>
              {activeTab === "active" && !examSearch.trim() && (
                <button
                  onClick={() => router.push("/teacher-exams/new")}
                  className="text-xs text-sky-600 font-semibold hover:text-sky-700 transition-colors inline-block cursor-pointer"
                >
                  Create your first exam
                </button>
              )}
            </Card>
          ) : (
            filteredExams.map((exam) => (
              <Card
                key={exam.id}
                className="p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Exam Information */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      title={exam.courseCode || undefined}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase cursor-default"
                    >
                      {exam.department || "EXAM"}
                    </span>
                    <Badge
                      variant={
                        exam.status === "active" && !exam.isStarted
                          ? "warning"
                          : STATUS_BADGE[exam.status]
                      }
                    >
                      {exam.status === "active"
                        ? exam.isStarted
                          ? "Live"
                          : "Launched"
                        : STATUS_LABEL[exam.status]}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-navy-900">{exam.title}</h3>
                  {exam.subject && (
                    <p className="text-xs text-slate-500 font-medium">{exam.subject}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.durationMinutes} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      {exam.questions?.length ?? exam.questionCount ?? 0} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Created {formatCreatedDate(exam.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Start: {exam.startDate ? formatStartDateTime(exam.startDate) : "Not set"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {exam.status === "scheduled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/teacher-exams/new?edit=${exam.id}&tab=parameters`)
                      }
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Exam
                    </Button>
                  )}
                  {exam.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/grading/${exam.id}`)}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Details
                    </Button>
                  )}
                  {exam.status === "scheduled" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        const result = await launchExam(exam.id);
                        if (result.success && result.roomCode) {
                          setLaunchedRoomCode(result.roomCode);
                        } else {
                          alert(result.message || "Failed to launch exam.");
                        }
                      }}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Launch Exam
                    </Button>
                  )}
                  {exam.status === "active" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(
                          exam.isStarted ? "/monitor" : `/teacher-exams/${exam.roomCode}`
                        )
                      }
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {exam.isStarted ? "Manage Live Exam" : "Resume Setup"}
                    </Button>
                  )}
                  <button
                    onClick={() => setExamPendingDelete(exam)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* DELETE CONFIRMATION */}
        <ConfirmDialog
          open={!!examPendingDelete}
          onClose={() => setExamPendingDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete this exam?"
          description={
            examPendingDelete
              ? `"${examPendingDelete.title}" and all of its questions and student data will be permanently removed. This cannot be undone.`
              : undefined
          }
          confirmLabel="Delete Exam"
        />
      </main>

      {/* LAUNCH SUCCESS MODAL — shows room code */}
      <Dialog open={!!launchedRoomCode} onClose={() => setLaunchedRoomCode(null)}>
        <DialogHeader title="Exam Launched!" onClose={() => setLaunchedRoomCode(null)} />
        <div className="px-6 py-5 text-center space-y-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 -mt-2 font-medium">
            Share this access code with your students to let them join the exam.
          </p>
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Room Code
            </span>
            <span className="text-3xl font-extrabold font-mono tracking-widest text-navy-900">
              {launchedRoomCode}
            </span>
            <button
              type="button"
              onClick={() => {
                if (launchedRoomCode) {
                  navigator.clipboard.writeText(launchedRoomCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className={`mt-1 text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-200 text-navy-900 hover:bg-slate-100"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const code = launchedRoomCode;
              setLaunchedRoomCode(null);
              if (code) {
                router.push(`/teacher-exams/${code}`);
              }
            }}
          >
            Go to Exam Lobby
          </Button>
        </div>
      </Dialog>
    </>
  );
}