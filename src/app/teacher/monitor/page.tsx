"use client";

import React, { useState } from "react";
import { useExamStore } from "@/store/useExamStore";
import { useRouter } from "next/navigation";

export default function TeacherLiveMonitorPage() {
  const router = useRouter();
  const exams = useExamStore((state) => state.exams);
  const endExam = useExamStore((state) => state.endExam);

  // Get active exam or default to the first exam
  const activeExam = exams.find((e) => e.isStarted && !e.isEnded) || exams[0];

  // Track resolved violations locally for interactive demo
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  if (!activeExam) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-slate-900">No Active Examination</h2>
          <p className="text-xs text-slate-500">
            Start an exam from your repository or lobby to monitor students here in real-time.
          </p>
          <button
            onClick={() => router.push("/teacher/exams")}
            className="w-full bg-[#0B7A93] hover:bg-[#09667c] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md"
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
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Monitoring Room
          </div>
          <h1 className="text-2xl font-black text-slate-900">Active Examination Feed</h1>
        </div>

        {/* Access Code & Stop Exam Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Access Code</p>
              <p className="text-base font-mono font-black text-sky-400 tracking-widest">{activeExam.roomCode}</p>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(activeExam.roomCode)}
              className="text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Copy Room Code"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleStopExam}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span>Stop Exam for All</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{totalEnrolled}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center text-sm">
            {totalEnrolled}
          </div>
        </div>

        {/* Active & Clean */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active & Clean</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{activeCleanCount}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Attention Required */}
        <div className={`border rounded-2xl p-5 shadow-xs flex items-center justify-between transition-all ${
          attentionCount > 0 ? "bg-rose-50/60 border-rose-200" : "bg-white border-slate-100"
        }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              attentionCount > 0 ? "text-rose-600" : "text-slate-400"
            }`}>
              Attention Required
            </p>
            <p className={`text-3xl font-black mt-1 ${
              attentionCount > 0 ? "text-rose-600" : "text-slate-900"
            }`}>
              {attentionCount}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            attentionCount > 0 ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-400"
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Live Student Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Live Student Cards</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => {
            const isResolved = resolvedIds.includes(student.id);
            const isFlagged = !isResolved && Boolean(student.violation);

            return (
              <div
                key={student.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-xs ${
                  isFlagged ? "border-rose-300 ring-2 ring-rose-500/10" : "border-slate-100"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top Row: ID & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      {student.id}
                    </span>
                    {isFlagged && (
                      <span className="px-2.5 py-0.5 bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-full">
                        Violation Detected
                      </span>
                    )}
                  </div>

                  {/* Student Name & Time Active */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{student.name}</h3>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Time Active: {student.timeActive}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Progress</span>
                      <span>{student.progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFlagged ? "bg-rose-500" : "bg-[#0B7A93]"
                        }`}
                        style={{ width: `${student.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Alert Box for Violations */}
                  {isFlagged && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 text-[10px] space-y-0.5">
                      <p className="font-bold flex items-center gap-1">
                        <span>!</span> {student.violation}
                      </p>
                      <p className="text-[9px] text-rose-400">Flagged at {student.flaggedAt}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer Button */}
                <div className="pt-2">
                  {isFlagged ? (
                    <button
                      onClick={() => handleResolve(student.id)}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      Review & Resolve Violation
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-400 font-bold text-xs rounded-xl text-center">
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