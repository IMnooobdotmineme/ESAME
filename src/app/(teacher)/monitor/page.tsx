"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import {
  Radio,
  Users,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Square,
  Clock,
  ShieldAlert,
  Key,
  Pause,
  Play,
  FileCheck2,
  ClipboardList,
  UserX,
  MessageSquare,
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { StudentRequest } from "@/store/useExamStore";

type Tab = "all" | "attention" | "rejected" | "finished";

export default function TeacherLiveMonitorPage() {
  const router = useRouter();
  const exams = useExamStore((state) => state.exams);
  const endExam = useExamStore((state) => state.endExam);
  const pauseExam = useExamStore((state) => state.pauseExam);
  const resumeExam = useExamStore((state) => state.resumeExam);
  const grantContinue = useExamStore((state) => state.grantContinue);
  const rejectLiveStudent = useExamStore((state) => state.rejectLiveStudent);

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [viewingMessageOf, setViewingMessageOf] = useState<StudentRequest | null>(null);

  // Prefer the exam that's actively running; once it's ended, keep showing
  // that same exam's ended state rather than falling back to a different one.
  const [pinnedExamId, setPinnedExamId] = useState<string | null>(null);
  const liveExam = exams.find((e) => e.isStarted && !e.isEnded);
  const launchedNotStarted = exams.find((e) => e.isLaunched && !e.isStarted && !e.isEnded);
  const activeExam =
    exams.find((e) => e.id === pinnedExamId) || liveExam || launchedNotStarted;

  useEffect(() => {
    if (liveExam && liveExam.id !== pinnedExamId) {
      setPinnedExamId(liveExam.id);
    }
  }, [liveExam, pinnedExamId]);

  // ---- Countdown timer (local to this view; pauses with the exam) ----
  const [secondsLeft, setSecondsLeft] = useState(
    activeExam ? activeExam.durationMinutes * 60 : 0
  );

  useEffect(() => {
    if (activeExam) setSecondsLeft(activeExam.durationMinutes * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExam?.id]);

  useEffect(() => {
    if (!activeExam || activeExam.isEnded || activeExam.isPaused) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExam?.isEnded, activeExam?.isPaused, activeExam?.id]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeExam) {
    return (
      <>
        <TeacherTopbar
          title="Live Monitoring"
          description="Real-time candidate monitoring and automated violation tracking."
        />
        <main className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-navy-900 tracking-tight">
                No Active Examination
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Start an exam from your repository to monitor students here in real-time.
              </p>
            </div>
            <Button className="w-full" onClick={() => router.push("/teacher-exams")}>
              Go to Exams Repository
            </Button>
          </Card>
        </main>
      </>
    );
  }

  if (!activeExam.isStarted && !activeExam.isEnded) {
    return (
      <>
        <TeacherTopbar
          title={activeExam.title}
          description="Real-time candidate monitoring and automated violation tracking."
        />
        <main className="min-h-[60vh] flex items-center justify-center p-6 font-sans">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto border border-amber-200">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-navy-900 tracking-tight">
                Exam Not Started Yet
              </h2>
              <p className="text-xs font-medium text-slate-500">
                This exam has been launched but the session hasn&apos;t started. Go to the
                lobby and click &ldquo;Start Exam Now&rdquo; once your students are ready.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => router.push(`/teacher-exams/${activeExam.roomCode}`)}
            >
              Go to Lobby
            </Button>
          </Card>
        </main>
      </>
    );
  }

  const approvedStudents = activeExam.requests.filter((r) => r.status === "approved");
  const activeStudents = approvedStudents.filter((r) => !r.isRejectedLive);
  const attentionStudents = activeStudents.filter((r) => r.isLocked);
  const rejectedStudents = approvedStudents.filter((r) => r.isRejectedLive);
  const finishedStudents = activeStudents.filter((r) => r.isSubmitted || r.isForcedSubmit);

  const counts = {
    all: activeStudents.length,
    attention: attentionStudents.length,
    rejected: rejectedStudents.length,
    finished: finishedStudents.length,
  };

  const visibleStudents =
    activeTab === "attention"
      ? attentionStudents
      : activeTab === "rejected"
      ? rejectedStudents
      : activeTab === "finished"
      ? finishedStudents
      : activeStudents;

  const handleStopExam = () => {
    endExam(activeExam.roomCode);
  };

  const timeDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  // ---- Ended state: same page, different view ----
  if (activeExam.isEnded) {
    return (
      <>
        <TeacherTopbar
          title={activeExam.title}
          description="This session has ended."
        />
        <main className="w-full max-w-4xl mx-auto p-6 space-y-6 font-sans">
          <Card className="p-8 text-center space-y-5">
            <div className="w-14 h-14 bg-slate-100 text-navy-900 rounded-2xl flex items-center justify-center mx-auto">
              <FileCheck2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-navy-900">Exam Session Ended</h2>
              <p className="text-sm text-slate-500">
                {activeExam.title} · Room Code {activeExam.roomCode}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 max-w-md mx-auto">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-bold text-navy-900">{counts.all}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Participants
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-bold text-emerald-700">{counts.finished}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Finished
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-bold text-rose-700">
                  {approvedStudents.filter((r) => (r.tabSwitches ?? 0) > 0).length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Flagged
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push("/teacher-exams")}>
                Back to My Exams
              </Button>
              <Button onClick={() => router.push("/grading")}>
                <ClipboardList className="w-4 h-4" />
                Go to Grading
              </Button>
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <TeacherTopbar
        title={activeExam.title || "Live Monitoring"}
        description="Real-time candidate monitoring and automated violation tracking."
      />

      <main className="w-full max-w-6xl mx-auto p-6 space-y-6 font-sans">
        {/* 1. ACTION ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span
              className={`w-2 h-2 rounded-full ${
                activeExam.isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {activeExam.isPaused ? "Session Paused" : "Live Proctoring Room"}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Join code */}
            <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-400">JOIN CODE:</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold rounded text-xs border border-slate-200">
                {activeExam.roomCode}
              </span>
              <button
                onClick={() => handleCopyCode(activeExam.roomCode)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer ml-0.5"
                title="Copy Access Code"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Timer */}
            <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono font-bold text-sm text-navy-900">{timeDisplay}</span>
              <span className="text-[10px] text-slate-400 font-medium">left</span>
            </div>

            {/* Pause / Resume */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                activeExam.isPaused
                  ? resumeExam(activeExam.roomCode)
                  : pauseExam(activeExam.roomCode)
              }
            >
              {activeExam.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {activeExam.isPaused ? "Resume Exam" : "Pause Exam"}
            </Button>

            <Button variant="danger" size="sm" onClick={handleStopExam}>
              <Square className="w-3.5 h-3.5 fill-current" />
              End Session
            </Button>
          </div>
        </div>

        {/* 2. SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Participants
              </p>
              <p className="text-2xl font-bold text-navy-900">{counts.all}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
              <Users className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Finished
              </p>
              <p className="text-2xl font-bold text-navy-900">{counts.finished}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </Card>

          <Card
            className={`p-5 flex items-center justify-between ${
              counts.attention > 0 ? "border-rose-200 bg-rose-50/50" : ""
            }`}
          >
            <div className="space-y-1">
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  counts.attention > 0 ? "text-rose-800" : "text-slate-400"
                }`}
              >
                Requires Attention
              </p>
              <p
                className={`text-2xl font-bold ${
                  counts.attention > 0 ? "text-rose-800" : "text-navy-900"
                }`}
              >
                {counts.attention}
              </p>
            </div>
            <div
              className={`p-2.5 rounded-xl ${
                counts.attention > 0
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-slate-50 text-slate-400 border border-slate-200"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </Card>
        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all", label: "All Students" },
            { key: "attention", label: "Requires Attention" },
            { key: "rejected", label: "Rejected" },
            { key: "finished", label: "Finished" },
          ] as { key: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={
                activeTab === tab.key
                  ? "rounded-full px-4 py-1.5 text-sm font-medium bg-navy-900 text-white"
                  : "rounded-full px-4 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        {/* 4. STUDENT ROWS */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Violations</th>
                <th className="px-5 py-3 font-medium">Joined At</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No students in this category right now.
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student) => (
                  <tr
                    key={student.id}
                    className={`border-b border-slate-50 last:border-0 ${
                      student.isLocked ? "bg-rose-50/40" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-navy-900">
                      {student.name}
                      <span className="ml-1.5 text-xs font-mono font-normal text-slate-400">
                        ({student.studentId})
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {student.isRejectedLive ? (
                        <Badge variant="neutral">Rejected</Badge>
                      ) : student.isLocked ? (
                        <Badge variant="danger">Needs Review</Badge>
                      ) : student.isSubmitted || student.isForcedSubmit ? (
                        <Badge variant="success">
                          {student.isForcedSubmit ? "Force Submitted" : "Finished"}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">In Progress</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {(student.tabSwitches ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                          <ShieldAlert size={13} />
                          {student.tabSwitches}
                        </span>
                      ) : (
                        <span className="text-slate-300">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{student.timestamp}</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {student.isRejectedLive ? (
                        <span className="text-slate-300">—</span>
                      ) : student.isLocked ? (
                        <>
                          <button
                            onClick={() => setViewingMessageOf(student)}
                            title="View student's message"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-navy-900 hover:bg-slate-50 transition-colors align-middle"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => rejectLiveStudent(activeExam.roomCode, student.id)}
                          >
                            <UserX size={13} />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => grantContinue(activeExam.roomCode, student.id)}
                          >
                            Approve to Continue
                          </Button>
                        </>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </main>

      {/* VIOLATION MESSAGE DETAIL */}
      <Dialog open={!!viewingMessageOf} onClose={() => setViewingMessageOf(null)}>
        {viewingMessageOf && (
          <>
            <DialogHeader
              title={`${viewingMessageOf.name} (${viewingMessageOf.studentId})`}
              onClose={() => setViewingMessageOf(null)}
            />
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldAlert size={14} className="text-rose-500" />
                <span>
                  {viewingMessageOf.tabSwitches ?? 0} violation
                  {(viewingMessageOf.tabSwitches ?? 0) === 1 ? "" : "s"} · flagged at{" "}
                  {viewingMessageOf.lastLockedAt || "-"}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Student&apos;s message
                </p>
                {viewingMessageOf.violationMessage ? (
                  <p className="text-sm text-navy-900 bg-slate-50 border border-slate-200 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                    {viewingMessageOf.violationMessage}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic bg-slate-50 border border-slate-200 rounded-xl p-4">
                    This student didn&apos;t leave a message.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}