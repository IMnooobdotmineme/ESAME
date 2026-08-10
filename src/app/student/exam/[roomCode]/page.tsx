"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";

interface StudentSession {
  studentName: string;
  studentId: string;
  roomCode: string;
  requestId: string;
  submittedAt: string;
}

export default function StudentExamPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const exams = useExamStore((state) => state.exams);
  const flagTabSwitch = useExamStore((state) => state.flagTabSwitch);
  const currentExam = exams.find((e) => e.roomCode.toUpperCase() === roomCode);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");

  // Load the student's own session to know which request is theirs
  useEffect(() => {
    const raw = sessionStorage.getItem("esame_student_session");
    if (!raw) {
      setIsAuthorized(false);
      return;
    }
    const session: StudentSession = JSON.parse(raw);
    setRequestId(session.requestId);
  }, []);

  useEffect(() => {
    if (!currentExam || !requestId) {
      if (currentExam && !requestId) return; // still loading session
      setIsAuthorized(false);
      return;
    }

    const myRequest = currentExam.requests.find((r) => r.id === requestId);

    if (myRequest?.status === "approved") {
      setIsAuthorized(true);
      setStudentName(myRequest.name);
    } else {
      setIsAuthorized(false);
    }
  }, [currentExam, requestId]);

  // Tab-switch / focus-loss detection — only active once authorized
  useEffect(() => {
    if (!isAuthorized || !currentExam || !requestId) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        flagTabSwitch(roomCode, requestId);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthorized, currentExam, requestId, roomCode, flagTabSwitch]);

  const myRequest = currentExam?.requests.find((r) => r.id === requestId);
  const isLocked = Boolean(myRequest?.isLocked);

  if (isAuthorized === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0B7A93] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    <div className="relative max-w-4xl mx-auto p-6 space-y-6 text-slate-900">
      {/* Lock overlay — blocks the exam until the teacher grants permission */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v2" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Exam Locked</h2>
            <p className="text-sm text-slate-500">
              We detected you switched away from this tab. Your exam has been
              paused and flagged for your teacher.
            </p>
            <p className="text-xs text-slate-400">
              Stay on this page — you will be able to continue once your teacher
              grants permission.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                Waiting for teacher approval...
              </span>
            </div>
          </div>
        </div>
      )}

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