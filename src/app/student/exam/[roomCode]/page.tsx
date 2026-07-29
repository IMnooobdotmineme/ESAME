"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";

export default function StudentExamPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const exams = useExamStore((state) => state.exams);
  const currentExam = exams.find((e) => e.roomCode.toUpperCase() === roomCode);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [studentName, setStudentName] = useState<string>("");

  useEffect(() => {
    if (!currentExam) {
      setIsAuthorized(false);
      return;
    }

    // Check if there is an approved request for this session
    const approvedRequest = currentExam.requests.find((r) => r.status === "approved");

    if (approvedRequest) {
      setIsAuthorized(true);
      setStudentName(approvedRequest.name);
    } else {
      setIsAuthorized(false);
    }
  }, [currentExam]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0B7A93] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Guard for Unapproved Students
  if (!isAuthorized || !currentExam) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not have permission to view this exam. You must request entry and be approved by the teacher first.
          </p>
          <button
            onClick={() => router.push("/student/join")}
            className="w-full bg-[#0B7A93] hover:bg-[#09667c] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md"
          >
            Go to Join Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-slate-900">
      {/* Top Banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#0B7A93] tracking-wider">
            {currentExam.courseCode}
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {currentExam.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Student: <span className="font-bold text-slate-700">{studentName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Time Allowed</p>
            <p className="text-sm font-bold text-[#0B7A93]">{currentExam.durationMinutes} Mins</p>
          </div>
        </div>
      </div>

      {/* Assessment Body */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-800">Assessment Workspace</h2>
          <p className="text-xs text-slate-400">
            Follow instructions carefully and submit before the timer expires.
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
          <strong>Note:</strong> Exam session is live and actively monitored.
        </div>

        {/* Workspace Placeholder */}
        <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
          <p className="text-xs text-slate-400 font-bold">
            {currentExam.questionCount} Questions loaded for this session.
          </p>
        </div>
      </div>
    </div>
  );
}