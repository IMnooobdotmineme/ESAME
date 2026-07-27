"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface StudentSession {
  id: string;
  name: string;
  studentId: string;
  status: "active" | "flagged" | "submitted" | "terminated";
  progress: number; // percentage
  timeSpent: string;
  violations: {
    type: string;
    timestamp: string;
    severity: "high" | "medium";
  }[];
}

function LiveMonitorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessCode = searchParams.get("code") || "SEN79Z";

  // Global Session State
  const [isExamEnded, setIsExamEnded] = useState(false);
  const [showEndExamModal, setShowEndExamModal] = useState(false);

  // Mock Live Student Sessions
  const [students, setStudents] = useState<StudentSession[]>([
    {
      id: "s1",
      name: "Alex Johnson",
      studentId: "STU-8821",
      status: "active",
      progress: 65,
      timeSpent: "32 mins",
      violations: [],
    },
    {
      id: "s2",
      name: "Marcus Vance",
      studentId: "STU-4019",
      status: "flagged",
      progress: 40,
      timeSpent: "18 mins",
      violations: [
        { type: "Tab Switch Detected (3x)", timestamp: "1:22 PM", severity: "high" },
        { type: "Secondary Monitor Detected", timestamp: "1:20 PM", severity: "high" },
      ],
    },
    {
      id: "s3",
      name: "Sophia Chen",
      studentId: "STU-9102",
      status: "active",
      progress: 85,
      timeSpent: "41 mins",
      violations: [],
    },
    {
      id: "s4",
      name: "David Miller",
      studentId: "STU-3321",
      status: "flagged",
      progress: 25,
      timeSpent: "12 mins",
      violations: [
        { type: "Multiple Faces in Camera Feed", timestamp: "1:23 PM", severity: "high" },
      ],
    },
    {
      id: "s5",
      name: "Emma Watson",
      studentId: "STU-1044",
      status: "active",
      progress: 90,
      timeSpent: "45 mins",
      violations: [],
    },
  ]);

  // Selected student for the decision modal
  const [selectedStudent, setSelectedStudent] = useState<StudentSession | null>(null);

  // AUTO-SORT: Flagged students automatically move to the VERY TOP
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      // Priority 1: Flagged students first
      if (a.status === "flagged" && b.status !== "flagged") return -1;
      if (a.status !== "flagged" && b.status === "flagged") return 1;
      // Priority 2: Terminated / Submitted last
      if (a.status === "terminated" || a.status === "submitted") return 1;
      return 0;
    });
  }, [students]);

  // Action: Single Student Allow to Continue
  const handleAllowContinue = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: "active", violations: [] } : s
      )
    );
    setSelectedStudent(null);
  };

  // Action: Single Student Force Submit
  const handleForceSubmit = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: "terminated", progress: s.progress } : s
      )
    );
    setSelectedStudent(null);
  };

  // Action: Global End Exam for All
  const handleEndExamForEveryone = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.status === "terminated" ? "terminated" : "submitted",
      }))
    );
    setIsExamEnded(true);
    setShowEndExamModal(false);
  };

  const flaggedCount = students.filter((s) => s.status === "flagged").length;
  const activeCount = students.filter((s) => s.status === "active").length;
  const submittedCount = students.filter((s) => s.status === "submitted").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* TOP MONITOR HEADER & SESSION DETAILS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {!isExamEnded ? (
              <>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black tracking-widest text-emerald-600 uppercase">
                  Live Monitoring Room
                </span>
              </>
            ) : (
              <>
                <span className="h-3 w-3 rounded-full bg-slate-400"></span>
                <span className="text-xs font-black tracking-widest text-slate-500 uppercase">
                  Session Closed / Exam Stopped
                </span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            Active Examination Feed
          </h2>
        </div>

        {/* CONTROLS: ACCESS CODE & STOP EXAM BUTTON */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {/* ACCESS JOIN CODE CARD */}
          <div className="flex items-center gap-4 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-sm">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Access Code
              </p>
              <p className="text-xl font-black tracking-widest font-mono text-[#0B7A93]">
                {accessCode}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(accessCode)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              title="Copy Code"
            >
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v9.25c0 .621-.504 1.125-1.125 1.125z" />
              </svg>
            </button>
          </div>

          {/* STOP EXAM BUTTON */}
          {!isExamEnded ? (
            <button
              onClick={() => setShowEndExamModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
              <span>Stop Exam for All</span>
            </button>
          ) : (
            <span className="bg-slate-100 text-slate-500 font-extrabold px-5 py-3 rounded-2xl border border-slate-200">
              Exam Stopped
            </span>
          )}
        </div>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Enrolled</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{students.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            {students.length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active & Clean</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{isExamEnded ? 0 : activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
          flaggedCount > 0 && !isExamEnded ? "bg-rose-50 border-rose-200" : "bg-white border-gray-200"
        }`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${flaggedCount > 0 && !isExamEnded ? "text-rose-600" : "text-gray-400"}`}>
              Attention Required
            </p>
            <p className={`text-2xl font-black mt-1 ${flaggedCount > 0 && !isExamEnded ? "text-rose-600" : "text-gray-900"}`}>
              {isExamEnded ? 0 : flaggedCount}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            flaggedCount > 0 && !isExamEnded ? "bg-rose-500 text-white animate-pulse" : "bg-slate-100 text-slate-400"
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        </div>
      </div>

      {/* STUDENT MONITORING GRID */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Live Student Cards</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedStudents.map((student) => {
            const isFlagged = student.status === "flagged";
            const isTerminated = student.status === "terminated";
            const isSubmitted = student.status === "submitted";

            return (
              <div
                key={student.id}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm ${
                  isFlagged
                    ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
                    : isTerminated
                    ? "border-gray-200 opacity-60 bg-gray-50"
                    : isSubmitted
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-gray-200 hover:border-slate-300"
                }`}
              >
                {/* Student Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400 font-mono">
                      {student.studentId}
                    </span>
                    {isFlagged && (
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-bounce uppercase tracking-wider">
                        Violation Detected
                      </span>
                    )}
                    {isTerminated && (
                      <span className="bg-gray-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Terminated
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Submitted
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-gray-900">{student.name}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Time Active: {student.timeSpent}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Progress</span>
                      <span>{student.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFlagged
                            ? "bg-rose-500"
                            : isSubmitted
                            ? "bg-emerald-500"
                            : "bg-[#0B7A93]"
                        }`}
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Violation Alert Snippet */}
                  {isFlagged && student.violations.length > 0 && (
                    <div className="bg-rose-100/70 border border-rose-200 p-3 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008z" />
                        </svg>
                        <span>{student.violations[0].type}</span>
                      </p>
                      <p className="text-[10px] text-rose-600 font-medium pl-5">
                        Flagged at {student.violations[0].timestamp}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div>
                  {isFlagged ? (
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <span>Review & Resolve Violation</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold text-center"
                    >
                      {isTerminated
                        ? "Exam Terminated"
                        : isSubmitted
                        ? "Exam Submitted"
                        : "Session Active"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: CONFIRM END EXAM FOR EVERYONE */}
      {showEndExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Stop Examination?</h3>
                <p className="text-xs text-gray-500 font-medium">This affects all active students</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to end the exam now? All ongoing student sessions will be immediately locked and force-submitted with their current progress.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowEndExamModal(false)}
                className="w-1/2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndExamForEveryone}
                className="w-1/2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all"
              >
                Yes, Stop Exam Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECISION POP-UP FOR INDIVIDUAL RULE VIOLATIONS */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Rule Violation Alert</h3>
                  <p className="text-xs text-gray-500">Teacher Decision Required</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Student & Violation Breakdown */}
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedStudent.studentId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500">Exam Progress</p>
                  <p className="text-sm font-black text-[#0B7A93]">{selectedStudent.progress}%</p>
                </div>
              </div>

              {/* Logged Violations */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Detected Infractions
                </p>
                <div className="space-y-2">
                  {selectedStudent.violations.map((v, idx) => (
                    <div key={idx} className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900">{v.type}</span>
                      <span className="text-[11px] font-semibold text-rose-600 font-mono">{v.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TEACHER DECISION BUTTONS */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-center text-gray-500">
                Choose an action to resolve this student's exam session:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* ALLOW TO CONTINUE */}
                <button
                  onClick={() => handleAllowContinue(selectedStudent.id)}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Allow Student to Continue</span>
                </button>

                {/* FORCE SUBMIT */}
                <button
                  onClick={() => handleForceSubmit(selectedStudent.id)}
                  className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Force Submit Exam Immediately</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveMonitorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500 font-medium">Loading Live Feed...</div>}>
      <LiveMonitorContent />
    </Suspense>
  );
}