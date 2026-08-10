"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import TeacherApprovalList from "@/components/TeacherApprovalList";
import { ArrowLeft, Play } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";

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
      <>
        <TeacherTopbar title="Exam Not Found" />
        <main className="min-h-[70vh] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Exam Session Not Found</h2>
            <p className="text-xs text-slate-500 font-medium">
              The exam room code you specified could not be located in the system.
            </p>
            <button
              onClick={() => router.push("/teacher/exams")}
              className="w-full bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Back to Exams List
            </button>
          </div>
        </main>
      </>
    );
  }

  const approvedStudents = exam.requests.filter((r) => r.status === "approved");

  const handleStartExam = () => {
    startExam(exam.roomCode);
    router.push("/teacher/monitor");
  };

  return (
    <>
      <TeacherTopbar title={exam.title} description={`Room Code: ${exam.roomCode}`} />

      <main className="w-full max-w-6xl mx-auto p-6 space-y-6 font-sans">
      {/* ACTION BAR */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => router.push("/teacher/exams")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exams List</span>
        </button>

        {exam.isStarted && !exam.isEnded ? (
          <button
            onClick={() => router.push("/teacher/monitor")}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Session Active — Go to Monitor
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase">
            Lobby Phase (Waiting to Start)
          </span>
        )}
      </div>

      {/* MAIN EXAM INFO HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block">
            {exam.courseCode}
          </span>
          <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
          <p className="text-xs text-slate-500 font-medium">
            {exam.questionCount} Questions | {exam.durationMinutes} Minutes Duration
          </p>

          {/* START EXAM BUTTON */}
          {!exam.isStarted && !exam.isEnded && (
            <div className="pt-2">
              <button
                onClick={handleStartExam}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Exam Now ({approvedStudents.length} Approved)</span>
              </button>
            </div>
          )}
        </div>

        {/* ROOM ACCESS CODE BOX */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center min-w-[220px]">
          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Student Access Code
          </p>
          <p className="text-2xl font-mono font-extrabold text-slate-900 tracking-widest mt-1">
            {exam.roomCode}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Share this code for student access
          </p>
        </div>
      </div>

      {/* LOBBY APPROVAL LIST */}
      <TeacherApprovalList roomCode={exam.roomCode} />
      </main>
    </>
  );
}