"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, AlertTriangle } from "lucide-react";
import { useExamStore } from "@/store/useExamStore";
import { ExamQuestionCard } from "@/components/student/ExamQuestionCard";
import {
  getMockExamContent,
  examHasManualGrading,
} from "@/lib/student-exam-content";

interface StudentSession {
  studentName: string;
  studentId: string;
  roomCode: string;
  requestId: string;
  submittedAt: string;
}

function formatTime(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
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

  const [examContent] = useState(() => getMockExamContent());
  const [sectionIndex, setSectionIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  // Start the countdown once authorized
  useEffect(() => {
    if (isAuthorized && currentExam && secondsRemaining === null) {
      setSecondsRemaining((currentExam.durationMinutes || 45) * 60);
    }
  }, [isAuthorized, currentExam, secondsRemaining]);

  function handleSubmit() {
    const hasManualGrading = examHasManualGrading(examContent);
    sessionStorage.setItem(
      "esame_exam_result",
      JSON.stringify({
        answers,
        hasEssay: hasManualGrading,
        submittedAt: new Date().toISOString(),
      })
    );
    router.push("/student/score");
  }

  // Countdown + auto-submit on timeout
  useEffect(() => {
    if (secondsRemaining === null || isLocked) return;
    if (secondsRemaining <= 0) {
      handleSubmit();
      return;
    }
    const interval = setInterval(() => {
      setSecondsRemaining((s) => (s !== null ? s - 1 : s));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, isLocked]);

  // Fake autosave indicator
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    setIsSaving(true);
    const timeout = setTimeout(() => setIsSaving(false), 700);
    return () => clearTimeout(timeout);
  }, [answers]);

  const section = examContent.sections[sectionIndex];
  const page = section?.pages[pageIndex];

  const sectionQuestionIds = useMemo(
    () => (section ? section.pages.flatMap((p) => p.questions.map((q) => q.id)) : []),
    [section]
  );
  const answeredInSection = sectionQuestionIds.filter(
    (id) => answers[id] !== undefined && answers[id] !== ""
  ).length;

  const isLastSection = sectionIndex === examContent.sections.length - 1;

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handlePrimaryAction() {
    if (isLastSection) {
      const confirmed = window.confirm(
        "Are you sure you want to submit the exam? This cannot be undone."
      );
      if (confirmed) handleSubmit();
    } else {
      setSectionIndex((i) => i + 1);
      setPageIndex(0);
    }
  }

  function isPageComplete(pageQuestionIds: string[]) {
    return pageQuestionIds.every(
      (id) => answers[id] !== undefined && answers[id] !== ""
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized || !currentExam) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not have permission to view this exam. You must request entry and be approved by the teacher first.
          </p>
          <button
            onClick={() => router.push("/student/join")}
            className="w-full bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md"
          >
            Go to Join Page
          </button>
        </div>
      </div>
    );
  }

  if (!page || secondsRemaining === null) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Lock overlay — blocks the exam until the teacher grants permission */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle size={26} />
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

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">
            {currentExam.courseCode}
          </span>
          <h1 className="text-base font-bold text-navy-900">{currentExam.title}</h1>
          <p className="text-xs text-slate-400">
            Student: <span className="font-semibold text-slate-600">{studentName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSaving ? "bg-amber-400" : "bg-emerald-500"
              }`}
            />
            {isSaving ? "Saving..." : "All changes saved"}
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-navy-900">
            <Clock size={14} className="text-slate-400" />
            {formatTime(secondsRemaining)}
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Section tabs — free navigation between sections */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {examContent.sections.map((s, i) => {
            const isCurrent = i === sectionIndex;
            const sectionIds = s.pages.flatMap((p) => p.questions.map((q) => q.id));
            const sectionComplete =
              sectionIds.length > 0 &&
              sectionIds.every((id) => answers[id] !== undefined && answers[id] !== "");
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSectionIndex(i);
                  setPageIndex(0);
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${
                  isCurrent
                    ? "bg-navy-900 text-white border-navy-900"
                    : sectionComplete
                    ? "border-emerald-300 text-emerald-600 bg-white"
                    : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                }`}
              >
                {i + 1}. {s.title}
              </button>
            );
          })}
        </div>

        <h1 className="text-sm font-bold text-navy-900">
          Section {sectionIndex + 1} of {examContent.sections.length} — {section.title}
        </h1>

        {/* Stat boxes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">Answered</p>
            <p className="text-sm font-bold text-navy-900">
              {answeredInSection}/{sectionQuestionIds.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">Page</p>
            <p className="text-sm font-bold text-navy-900">
              {pageIndex + 1} of {section.pages.length}
            </p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-5">
          {page.questions.map((q) => (
            <ExamQuestionCard
              key={q.id}
              question={q}
              answer={answers[q.id]}
              onAnswer={handleAnswer}
            />
          ))}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            {section.pages.map((p, i) => {
              const complete = isPageComplete(p.questions.map((q) => q.id));
              const isCurrent = i === pageIndex;
              return (
                <button
                  key={p.id}
                  onClick={() => setPageIndex(i)}
                  className={`w-9 h-9 rounded-lg border text-sm font-semibold transition ${
                    isCurrent
                      ? "bg-navy-900 text-white border-navy-900"
                      : complete
                      ? "border-emerald-400 text-emerald-600 bg-white"
                      : "border-slate-200 text-slate-400 bg-white"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={handlePrimaryAction}
            className="px-6 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
          >
            {isLastSection ? "Submit Exam" : "Next Section"}
          </button>
        </div>
      </main>
    </div>
  );
}
