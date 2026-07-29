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
} from "lucide-react";

export default function TeacherLiveMonitorPage() {
  const router = useRouter();
  const exams = useExamStore((state) => state.exams);
  const endExam = useExamStore((state) => state.endExam);

  // Copy state for room/access code
  const [copied, setCopied] = useState(false);

  // Get active exam or default to the first exam
  const activeExam = exams.find((e) => e.isStarted && !e.isEnded) || exams[0];

  // Track resolved violations locally for interactive demo
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeExam) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5DEEF] shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-[#F0F3FA] text-[#395886] rounded-2xl flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-[#395886]">No Active Examination</h2>
            <p className="text-xs font-medium text-slate-400">
              Start an exam from your repository or lobby to monitor students here in real-time.
            </p>
          </div>
          <button
            onClick={() => router.push("/teacher/exams")}
            className="w-full bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Go to Exams List
          </button>
        </div>
      </div>
    );
  }

  // Combined student list (uses live students or realistic mockup cards)
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

  // Stat Calculations
  const totalEnrolled = students.length;
  const flaggedStudents = students.filter(
    (s) => s.violation && !resolvedIds.includes(s.id)
  );
  const attentionCount = flaggedStudents.length;
  const activeCleanCount = totalEnrolled - attentionCount;

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => [...prev, id]);
  };

  const handleStopExam = () => {
    endExam(activeExam.roomCode);
    router.push("/teacher/exams");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. TOP BANNER HEADER */}
      <div className="bg-white border border-[#D5DEEF] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[#638ECB] text-[10px] font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#395886] animate-pulse" />
            Live Monitoring Room
          </div>
          <h1 className="text-2xl font-black text-[#395886] tracking-tight">
            Active Examination Feed
          </h1>
          <p className="text-xs font-medium text-slate-400">
            Real-time proctoring status for {activeExam.title || "Current Examination"}
          </p>
        </div>

        {/* Access Code & Stop Exam Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#1E2A38] text-white px-4 py-2.5 rounded-xl flex items-center gap-3 border border-slate-700">
            <div className="text-right">
              <p className="text-[9px] uppercase font-black text-[#8AAEE0] tracking-wider">Access Code</p>
              <p className="text-sm font-mono font-black text-[#B1C9EF] tracking-widest">{activeExam.roomCode}</p>
            </div>
            <button
              onClick={() => handleCopyCode(activeExam.roomCode)}
              className="text-[#8AAEE0] hover:text-white transition-all p-1 cursor-pointer"
              title="Copy Room Code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#638ECB]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={handleStopExam}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Exam for All</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white border border-[#D5DEEF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Enrolled</p>
            <p className="text-2xl font-black text-[#395886]">{totalEnrolled}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F3FA] text-[#395886]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active & Clean */}
        <div className="bg-white border border-[#D5DEEF] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#395886]">Active & Clean</p>
            <p className="text-2xl font-black text-[#395886]">{activeCleanCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F3FA] text-[#395886]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Attention Required */}
        <div
          className={`border rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all ${
            attentionCount > 0
              ? "bg-rose-50/60 border-rose-200"
              : "bg-white border-[#D5DEEF]"
          }`}
        >
          <div className="space-y-1">
            <p
              className={`text-[10px] font-black uppercase tracking-wider ${
                attentionCount > 0 ? "text-rose-600" : "text-slate-400"
              }`}
            >
              Attention Required
            </p>
            <p
              className={`text-2xl font-black ${
                attentionCount > 0 ? "text-rose-600" : "text-[#395886]"
              }`}
            >
              {attentionCount}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl ${
              attentionCount > 0
                ? "bg-rose-100 text-rose-600"
                : "bg-[#F0F3FA] text-slate-400"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. LIVE STUDENT GRID */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#638ECB] tracking-wider block mb-1">
            PARTICIPANTS
          </span>
          <h2 className="text-base font-black text-[#395886]">Live Student Cards</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const isResolved = resolvedIds.includes(student.id);
            const isFlagged = !isResolved && Boolean(student.violation);

            return (
              <div
                key={student.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                  isFlagged
                    ? "border-rose-300 ring-2 ring-rose-500/10"
                    : "border-[#D5DEEF]"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top Row: ID & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-wider">
                      {student.id}
                    </span>
                    {isFlagged && (
                      <span className="px-2.5 py-0.5 bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider rounded-full">
                        Violation Detected
                      </span>
                    )}
                  </div>

                  {/* Student Name & Time Active */}
                  <div>
                    <h3 className="text-sm font-black text-[#395886]">{student.name}</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Time Active: {student.timeActive}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                      <span>Progress</span>
                      <span>{student.progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F0F3FA] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFlagged ? "bg-rose-500" : "bg-[#395886]"
                        }`}
                        style={{ width: `${student.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Alert Box for Violations */}
                  {isFlagged && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>{student.violation}</span>
                      </p>
                      <p className="text-[10px] text-rose-400 font-medium pl-5">
                        Flagged at {student.flaggedAt}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer Button */}
                <div className="pt-2">
                  {isFlagged ? (
                    <button
                      onClick={() => handleResolve(student.id)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Review & Resolve Violation
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-[#F0F3FA] border border-[#D5DEEF] text-[#638ECB] font-bold text-xs rounded-xl text-center">
                      Session Active
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}