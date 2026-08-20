"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, AlertTriangle, Check } from "lucide-react";
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

// Student may only type a short note explaining the tab switch — enough to
// give context, short enough to keep the teacher's review queue fast.
const VIOLATION_MESSAGE_MAX_CHARS = 200;

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
  const submitViolationMessage = useExamStore((state) => state.submitViolationMessage);
  const currentExam = exams.find((e) => e.roomCode.toUpperCase() === roomCode);

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [requestId, setRequestId] = useState<string>("");

  const [examContent] = useState(() => getMockExamContent());
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [violationMessage, setViolationMessageInput] = useState("");
  const [violationMessageSent, setViolationMessageSent] = useState(false);

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

  // Reset the violation message form each time a fresh lock event happens
  useEffect(() => {
    if (isLocked) {
      setViolationMessageInput("");
      setViolationMessageSent(false);
    }
  }, [isLocked, myRequest?.lastLockedAt]);

  function handleSendViolationMessage() {
    const trimmed = violationMessage.trim();
    if (!trimmed || !requestId) return;
    submitViolationMessage(roomCode, requestId, trimmed);
    setViolationMessageSent(true);
  }

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
  // Each section renders as a single scrollable page — no per-section pagination.
  const sectionQuestions = useMemo(
    () => (section ? section.pages.flatMap((p) => p.questions) : []),
    [section]
  );

  const answeredInSection = sectionQuestions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== ""
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
    }
  }

  function handlePreviousSection() {
    setSectionIndex((i) => Math.max(0, i - 1));
  }

  function isSectionComplete(questions: typeof sectionQuestions) {
    return (
      questions.length > 0 &&
      questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== "")
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

  if (!section || secondsRemaining === null) return null;

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

            {violationMessageSent ? (
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-medium text-amber-700">
                  Message sent — waiting for teacher approval...
                </span>
              </div>
            ) : (
              <div className="text-left space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-600">
                  Explain what happened (optional)
                </label>
                <textarea
                  value={violationMessage}
                  onChange={(e) =>
                    setViolationMessageInput(e.target.value.slice(0, VIOLATION_MESSAGE_MAX_CHARS))
                  }
                  maxLength={VIOLATION_MESSAGE_MAX_CHARS}
                  rows={3}
                  placeholder="e.g. My notification popped up and I clicked it by accident..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {violationMessage.length}/{VIOLATION_MESSAGE_MAX_CHARS} characters
                  </span>
                </div>
                <button
                  onClick={handleSendViolationMessage}
                  disabled={!violationMessage.trim()}
                  className="w-full py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  Request Permission to Continue
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Stay on this page — you will be able to continue once your teacher
              grants permission.
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">
            {currentExam.department}
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

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Section sidebar */}
        <div className="md:w-60 shrink-0">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 md:sticky md:top-6">
            {examContent.sections.map((s, i) => {
              const isCurrent = i === sectionIndex;
              const sQuestions = s.pages.flatMap((p) => p.questions);
              const sectionComplete = isSectionComplete(sQuestions);

              return (
                <button
                  key={s.id}
                  onClick={() => setSectionIndex(i)}
                  className={`shrink-0 md:w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isCurrent
                      ? "bg-navy-900 text-white"
                      : sectionComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                      isCurrent
                        ? "bg-white/15 text-white"
                        : sectionComplete
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {sectionComplete ? (
                      <Check key={`${s.id}-check`} size={14} className="check-pop" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="text-sm font-semibold truncate">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          <h1 className="text-sm font-bold text-navy-900">
            Section {sectionIndex + 1} of {examContent.sections.length} — {section.title}
          </h1>

          {/* Stat boxes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">Answered</p>
              <p className="text-sm font-bold text-navy-900">
                {answeredInSection}/{sectionQuestions.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">Section</p>
              <p className="text-sm font-bold text-navy-900">
                {sectionIndex + 1} of {examContent.sections.length}
              </p>
            </div>
          </div>

          {/* Questions — the whole section scrolls down, no per-section pagination */}
          <div className="space-y-5">
            {sectionQuestions.map((q) => (
              <ExamQuestionCard
                key={q.id}
                question={q}
                answer={answers[q.id]}
                onAnswer={handleAnswer}
              />
            ))}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-end pt-2">
            {sectionIndex > 0 && (
              <button
                onClick={handlePreviousSection}
                className="mr-3 px-6 py-2.5 rounded-full border border-slate-900 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Previous
              </button>
            )}
            <button
              onClick={handlePrimaryAction}
              className="px-6 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
            >
              {isLastSection ? "Submit Exam" : "Next Section"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
