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
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-slate-50/60">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-[#F0F3FA] text-[#395886] rounded-2xl flex items-center justify-center mx-auto border border-[#B1C9EF]/60">
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
            className="w-full bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            Go to Exams Repository
          </button>
        </div>
      </div>
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
    <div className="space-y-6 p-6 md:p-8 bg-slate-50/60 min-h-screen text-slate-800">
      
      {/* 1. HEADER SECTION (Matches Repository Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-[#395886] text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Proctoring Room
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {activeExam.title || "Active Examination Feed"}
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Real-time candidate monitoring and automated violation tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-2xs">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">JOIN CODE:</span>
            <span className="px-2 py-0.5 bg-[#F0F3FA] text-[#395886] font-mono font-bold rounded text-xs border border-[#B1C9EF]/60">
              {activeExam.roomCode}
            </span>
            <button
              onClick={() => handleCopyCode(activeExam.roomCode)}
              className="text-slate-400 hover:text-[#395886] transition-colors p-0.5 cursor-pointer ml-1"
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
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
            <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F3FA] text-[#395886] border border-[#B1C9EF]/40">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active & Clean */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active & Clean</p>
            <p className="text-2xl font-bold text-slate-900">{counts.clean}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Attention Required */}
        <div
          className={`border rounded-2xl p-5 shadow-2xs flex items-center justify-between transition-all ${
            counts.flagged > 0
              ? "bg-rose-50/60 border-rose-200/80"
              : "bg-white border-slate-200/80"
          }`}
        >
          <div className="space-y-1">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                counts.flagged > 0 ? "text-rose-700" : "text-slate-400"
              }`}
            >
              Attention Required
            </p>
            <p
              className={`text-2xl font-bold ${
                counts.flagged > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {counts.flagged}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl ${
              counts.flagged > 0
                ? "bg-rose-100/80 text-rose-700 border border-rose-200/60"
                : "bg-slate-50 text-slate-400 border border-slate-200/60"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION TABS (Identical to Repository Page) */}
      <div className="border-b border-slate-200/80 flex gap-6">
        {[
          { key: "all", label: "All Participants" },
          { key: "flagged", label: "Requires Attention" },
          { key: "clean", label: "Clean Sessions" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-xs font-bold transition-colors relative cursor-pointer ${
              activeTab === tab.key
                ? "text-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts]})
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#395886] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* 4. STUDENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200/80 shadow-2xs text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-500">
              No participants found in this filter category.
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-2xs ${
                student.isFlagged
                  ? "border-rose-200 bg-rose-50/20 ring-2 ring-rose-500/5"
                  : "border-slate-200/80"
              }`}
            >
              <div className="space-y-3">
                {/* ID & Status Tag */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-[#D5DEEF] text-[#395886] text-[10px] font-bold rounded tracking-wide font-mono uppercase">
                    {student.id}
                  </span>
                  {student.isFlagged ? (
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[9px] uppercase tracking-wider rounded-full">
                      Violation Flagged
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold text-[9px] uppercase tracking-wider rounded-full">
                      Clean Session
                    </span>
                  )}
                </div>

                {/* Candidate Information */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{student.name}</h3>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> Active: {student.timeActive}
                  </p>
                </div>

                {/* Progress Tracking */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress</span>
                    <span>{student.progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F3FA] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        student.isFlagged ? "bg-rose-500" : "bg-[#395886]"
                      }`}
                      style={{ width: `${student.progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Violation Details Box */}
                {student.isFlagged && (
                  <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-rose-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{student.violation}</span>
                    </p>
                    <p className="text-[10px] text-rose-600/80 font-medium pl-5">
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
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Review & Resolve Violation
                  </button>
                ) : (
                  <div className="w-full py-2 bg-[#F0F3FA] border border-[#B1C9EF]/50 text-[#395886] font-bold text-xs rounded-xl text-center">
                    Session Active
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}