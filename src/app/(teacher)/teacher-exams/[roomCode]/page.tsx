"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import TeacherApprovalList from "@/components/TeacherApprovalList";
import { ArrowLeft, Play, Clock, HelpCircle } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <main className="min-h-[70vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <h2 className="text-lg font-semibold text-navy-900">Exam Session Not Found</h2>
            <p className="text-sm text-slate-500">
              The exam room code you specified could not be located in the system.
            </p>
            <Button className="w-full" onClick={() => router.push("/teacher-exams")}>
              Back to Exams List
            </Button>
          </Card>
        </main>
      </>
    );
  }

  const approvedStudents = exam.requests.filter((r) => r.status === "approved");

  const handleStartExam = () => {
    const result = startExam(exam.roomCode);
    if (!result.success) {
      alert(result.message || "Could not start this exam.");
      return;
    }
    router.push("/monitor");
  };

  return (
    <>
      <TeacherTopbar title={exam.title} description={`Room Code: ${exam.roomCode}`} />

      <main className="p-6 space-y-6">
        {/* ACTION BAR */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            onClick={() => router.push("/teacher-exams")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-navy-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Exams List
          </button>

          {exam.isStarted && !exam.isEnded ? (
            <button
              onClick={() => router.push("/monitor")}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Session Active — Go to Monitor
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{exam.requests.length} Total Requests</Badge>
              <Badge variant="warning">Lobby Phase (Waiting to Start)</Badge>
            </div>
          )}
        </div>

        {/* MAIN EXAM INFO HEADER */}
        <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 inline-block">
              {exam.courseCode}
            </span>
            <h1 className="text-xl font-semibold text-navy-900">{exam.title}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                {exam.questionCount} Questions
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {exam.durationMinutes} Minutes Duration
              </span>
            </div>

            {/* START EXAM BUTTON */}
            {!exam.isStarted && !exam.isEnded && (
              <div className="pt-2">
                <Button onClick={handleStartExam}>
                  <Play className="w-4 h-4 fill-current" />
                  Start Exam Now ({approvedStudents.length} Approved)
                </Button>
              </div>
            )}
          </div>

          {/* ROOM ACCESS CODE BOX */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center min-w-[220px]">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Student Access Code
            </p>
            <p className="text-2xl font-mono font-extrabold text-navy-900 tracking-widest mt-1">
              {exam.roomCode}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              Share this code for student access
            </p>
          </div>
        </Card>

        {/* LOBBY APPROVAL LIST */}
        <TeacherApprovalList roomCode={exam.roomCode} />
      </main>
    </>
  );
}