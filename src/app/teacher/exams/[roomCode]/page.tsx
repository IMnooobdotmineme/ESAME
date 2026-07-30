"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import TeacherApprovalList from "@/components/TeacherApprovalList";

export default function TeacherExamLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const exam = useExamStore((state) =>
    state.exams.find((e) => e.roomCode.toUpperCase() === roomCode)
  );

  const startExam = useExamStore((state) => state.startExam);

  if (!exam) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#D5DEEF] shadow-xl p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-[#395886]">Exam Session Not Found</h2>
          <button
            onClick={() => router.push("/teacher/exams")}
            className="w-full bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer"
          >
            Back to Exams List
          </button>
        </div>
      </div>
    );
  }

  const approvedStudents = exam.requests.filter((r) => r.status === "approved");

  // Handle starting exam and redirecting to live monitor
  const handleStartExam = () => {
    startExam(exam.roomCode);
    router.push("/teacher/monitor");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans text-slate-900">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#D5DEEF] pb-4">
        <button
          onClick={() => router.push("/teacher/exams")}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#395886] hover:text-[#638ECB] transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Exams List
        </button>

        {exam.isStarted && !exam.isEnded ? (
          <button
            onClick={() => router.push("/teacher/monitor")}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D5DEEF] border border-[#B1C9EF] text-[#395886] text-xs font-bold hover:bg-[#B1C9EF] transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#395886] animate-ping" />
            Live Session Active — Go to Monitor
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
            Lobby Phase (Waiting to Start)
          </span>
        )}
      </div>

      {/* Main Exam Info Header */}
      <div className="bg-white border border-[#D5DEEF] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase text-[#638ECB] tracking-wider">
            {exam.courseCode}
          </span>
          <h1 className="text-2xl font-bold text-[#395886]">{exam.title}</h1>
          <p className="text-xs text-slate-400">
            {exam.questionCount} Questions | {exam.durationMinutes} Minutes Duration
          </p>

          {/* START EXAM BUTTON */}
          {!exam.isStarted && !exam.isEnded && (
            <div className="pt-3">
              <button
                onClick={handleStartExam}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#395886] hover:bg-[#2e476d] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                <span>Start Exam Now ({approvedStudents.length} Approved)</span>
              </button>
            </div>
          )}
        </div>

        {/* Room Access Code Box */}
        <div className="bg-[#F0F3FA] border border-[#D5DEEF] rounded-2xl p-4 text-center min-w-[200px]">
          <p className="text-[10px] font-black uppercase text-[#8AAEE0] tracking-wider">
            Student Access Code
          </p>
          <p className="text-2xl font-mono font-black text-[#395886] tracking-widest mt-0.5">
            {exam.roomCode}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            Share this code for student access
          </p>
        </div>
      </div>

      {/* Lobby Approval List */}
      <TeacherApprovalList roomCode={exam.roomCode} />
    </div>
  );
}