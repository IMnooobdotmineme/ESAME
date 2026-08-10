"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";

export default function TeacherLiveMonitorPage() {
  const router = useRouter();
  const exams = useExamStore((state) => state.exams);
  const endExam = useExamStore((state) => state.endExam);

  // Copy state & tab state
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "flagged" | "clean">("all");

  // Get active exam or default to the first exam
  const activeExam = exams.find((e) => e.isStarted && !e.isEnded) || exams[0];

  // Track resolved violations locally
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

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
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                No Active Examination
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Start an exam from your repository to monitor students here in real-time.
              </p>
            </div>
            <button
              onClick={() => router.push("/teacher/exams")}
              className="w-full bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Go to Exams Repository
            </button>
          </div>
        </main>
      </>
    );
  }

  // Live student dataset
  const students = [
    {
      id: "STU-4019",
      name: "Marcus Vance",
      timeActive: "18 mins",
      progressPct: 40,
      violation: "Tab Switch Detected (3x)",
      flaggedAt: "1:22 PM",
    },
    {
      id: "STU-3321",
      name: "David Miller",
      timeActive: "12 mins",
      progressPct: 25,
      violation: "Multiple Faces in Camera Feed",
      flaggedAt: "1:23 PM",
    },
    {
      id: "STU-8821",
      name: "Alex Johnson",
      timeActive: "32 mins",
      progressPct: 65,
      violation: null,
    },
    {
      id: "STU-9102",
      name: "Sophia Chen",
      timeActive: "41 mins",
      progressPct: 85,
      violation: null,
    },
    {
      id: "STU-1044",
      name: "Emma Watson",
      timeActive: "45 mins",
      progressPct: 90,
      violation: null,
    },
  ];

  // Dynamic status evaluation
  const mappedStudents = students.map((s) => {
    const isResolved = resolvedIds.includes(s.id);
    const isFlagged = !isResolved && Boolean(s.violation);
    return { ...s, isFlagged };
  });

  // Calculate live tab counts
  const counts = {
    all: mappedStudents.length,
    flagged: mappedStudents.filter((s) => s.isFlagged).length,
    clean: mappedStudents.filter((s) => !s.isFlagged).length,
  };

  // Filter students based on active tab
  const filteredStudents = mappedStudents.filter((student) => {
    if (activeTab === "flagged") return student.isFlagged;
    if (activeTab === "clean") return !student.isFlagged;
    return true;
  });

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => [...prev, id]);
  };

  const handleStopExam = () => {
    endExam(activeExam.roomCode);
    router.push("/teacher/exams");
  };

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
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Proctoring Room
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
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

          <button
            onClick={handleStopExam}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
            <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active & Clean */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active & Clean</p>
            <p className="text-2xl font-bold text-slate-900">{counts.clean}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Attention Required */}
        <div
          className={`border rounded-xl p-5 shadow-xs flex items-center justify-between transition-all ${
            counts.flagged > 0
              ? "bg-rose-50/50 border-rose-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="space-y-1">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                counts.flagged > 0 ? "text-rose-800" : "text-slate-400"
              }`}
            >
              Attention Required
            </p>
            <p
              className={`text-2xl font-bold ${
                counts.flagged > 0 ? "text-rose-800" : "text-slate-900"
              }`}
            >
              {counts.flagged}
            </p>
          </div>
          <div
            className={`p-2.5 rounded-xl ${
              counts.flagged > 0
                ? "bg-rose-100 text-rose-800 border border-rose-200"
                : "bg-slate-50 text-slate-400 border border-slate-200"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: "all", label: "All Participants" },
          { key: "flagged", label: "Requires Attention" },
          { key: "clean", label: "Clean Sessions" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 px-4 text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === tab.key
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* 4. STUDENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-slate-200 shadow-xs text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">
              No participants found in this filter category.
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className={`bg-white rounded-xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                student.isFlagged
                  ? "border-rose-300 bg-rose-50/20"
                  : "border-slate-200"
              }`}
            >
              <div className="space-y-3">
                {/* ID & Status Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded tracking-wide font-mono uppercase border border-slate-200">
                    {student.id}
                  </span>
                  {student.isFlagged ? (
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[9px] uppercase tracking-wider rounded-full">
                      Violation Flagged
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] uppercase tracking-wider rounded-full">
                      Clean Session
                    </span>
                  )}
                </div>

                {/* Candidate Information */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{student.name}</h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Active: {student.timeActive}
                  </p>
                </div>

                {/* Progress Tracking */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Progress</span>
                    <span>{student.progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div
                      className={`h-full transition-all duration-300 ${
                        student.isFlagged ? "bg-rose-700" : "bg-navy-900"
                      }`}
                      style={{ width: `${student.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Violation Details Box */}
                {student.isFlagged && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-700" />
                      <span>{student.violation}</span>
                    </p>
                    <p className="text-[10px] text-rose-700/80 font-medium pl-5">
                      Flagged at {student.flaggedAt}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {student.isFlagged ? (
                  <button
                    onClick={() => handleResolve(student.id)}
                    className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Review & Resolve Violation
                  </button>
                ) : (
                  <div className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl text-center">
                    Session Active
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      </main>
    </>
  );
}