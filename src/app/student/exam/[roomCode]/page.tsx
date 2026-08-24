"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, AlertTriangle, Check, ShieldAlert, Send } from "lucide-react";
import { useExamStore } from "@/store/useExamStore";
import { ExamQuestionCard } from "@/components/student/ExamQuestionCard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  getMockExamContent,
  examHasManualGrading,
  QUESTION_TYPE_LABEL,
  totalQuestionCount,
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
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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

  function handleSubmit(reason: "manual" | "timeout" = "manual") {
    const hasManualGrading = examHasManualGrading(examContent);
    sessionStorage.setItem(
      "esame_exam_result",
      JSON.stringify({
        answers,
        hasEssay: hasManualGrading,
        submittedAt: new Date().toISOString(),
        reason,
      })
    );
    router.push(reason === "timeout" ? "/student/time-up" : "/student/score");
  }

  // Countdown + auto-submit on timeout
  useEffect(() => {
    if (secondsRemaining === null || isLocked) return;
    if (secondsRemaining <= 0) {
      handleSubmit("timeout");
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

  const totalAnsweredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== undefined && v !== "").length,
    [answers]
  );
  const totalExamQuestions = useMemo(() => totalQuestionCount(examContent), [examContent]);
  const totalUnanswered = totalExamQuestions - totalAnsweredCount;

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handlePrimaryAction() {
    if (isLastSection) {
      setShowSubmitConfirm(true);
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
      <ConfirmDialog
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          handleSubmit();
        }}
        title="Submit your exam?"
        description={
          totalUnanswered > 0
            ? `You still have ${totalUnanswered} unanswered question${
                totalUnanswered !== 1 ? "s" : ""
              }. Once submitted, you cannot make any more changes.`
            : "You've answered every question. Once submitted, you cannot make any more changes."
        }
        confirmLabel="Submit Exam"
        variant="submit"
      />

      {/* Lock overlay — blocks the exam until the teacher grants permission */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            key={myRequest?.lastLockedAt}
            className="alert-shake max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl"
          >
            {/* Icon with pulsing alert ring */}
            <div className="relative w-16 h-16 mx-auto mb-5">
              <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
              <div className="relative w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border-2 border-amber-100">
                <ShieldAlert size={28} />
              </div>
            </div>

            <span className="inline-block text-[10px] font-black tracking-widest text-amber-600 mb-1.5">
              SECURITY ALERT
            </span>
            <h2 className="text-lg font-bold text-slate-900">Exam Locked</h2>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              We detected you switched away from this tab. Your exam has been
              paused and flagged for your teacher.
            </p>

            {(myRequest?.tabSwitches ?? 0) > 1 && (
              <span className="inline-block mt-3 rounded-full bg-red-50 text-red-600 px-3 py-1 text-[11px] font-bold">
                Violation #{myRequest?.tabSwitches}
              </span>
            )}

            <div className="mt-5 border-t border-slate-100 pt-5">
              {violationMessageSent ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-medium text-amber-700">
                    Message sent — waiting for teacher approval...
                  </span>
                </div>
              ) : (
                <div className="text-left space-y-1.5">
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
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 transition-all"
                        style={{
                          width: `${(violationMessage.length / VIOLATION_MESSAGE_MAX_CHARS) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {violationMessage.length}/{VIOLATION_MESSAGE_MAX_CHARS}
                    </span>
                  </div>
                  <button
                    onClick={handleSendViolationMessage}
                    disabled={!violationMessage.trim()}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    Request Permission to Continue
                  </button>
                </div>
              )}
            </div>

            <p className="mt-5 text-xs text-slate-400">
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

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">
            {totalAnsweredCount}/{totalExamQuestions} answered
          </span>
          <div className="relative flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500 ease-out"
              style={{ width: `${(totalAnsweredCount / totalExamQuestions) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-navy-900 shrink-0">
            {Math.round((totalAnsweredCount / totalExamQuestions) * 100)}%
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
                  className={`shrink-0 md:w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300 hover:translate-x-1 hover:shadow-lg ${
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
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="shrink-0 md:w-full px-6 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold transition-all duration-300 hover:bg-navy-800 hover:translate-x-1 hover:shadow-lg"
            >
              Submit Exam
            </button>
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

          {/* Section type label — stated once, not per question */}
          {sectionQuestions.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-bold tracking-wide">
                {QUESTION_TYPE_LABEL[sectionQuestions[0].type]}
              </span>
              <span className="text-xs text-slate-400">
                {sectionQuestions.length} question{sectionQuestions.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Questions — the whole section scrolls down, no per-section pagination */}
          <div className="space-y-5">
            {sectionQuestions.map((q, idx) => (
              <ExamQuestionCard
                key={q.id}
                question={q}
                questionNumber={idx + 1}
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
            {!isLastSection && (
              <button
                onClick={handlePrimaryAction}
                className="px-6 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
              >
                Next Section
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}