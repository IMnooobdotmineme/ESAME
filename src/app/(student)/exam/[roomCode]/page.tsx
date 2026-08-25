"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, AlertTriangle, Check, ShieldAlert, Send, PauseCircle } from "lucide-react";
import { ExamQuestionCard } from "@/components/student/ExamQuestionCard";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUESTION_TYPE_LABEL } from "@/lib/student-exam-content";
import { startProctor } from "@/lib/proctor";

interface StudentSession {
  studentName: string; studentId: string; roomCode: string; requestId: string; submittedAt: string;
}
interface ServerSection { id: string; title: string; questions: any[]; }

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

  // State
  const [session, setSession] = useState<StudentSession | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [examMeta, setExamMeta] = useState<{ title: string; department: string; subject: string } | null>(null);
  const [sections, setSections] = useState<ServerSection[]>([]);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [serverPaused, setServerPaused] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [violationMessage, setViolationMessageInput] = useState("");
  const [violationMessageSent, setViolationMessageSent] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [inFullscreen, setInFullscreen] = useState(false);

  // Refs
  const isLockedRef = useRef(false);
  const pendingLockRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const questionStartedAtRef = useRef<number | null>(null);
  const currentQuestionIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const wasFsRef = useRef(false);

  // ✅ Single entry point for locking — marks lock as "pending" until server confirms
  const applyLock = () => {
    pendingLockRef.current = true;
    setIsLocked(true);
  };

  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Activity tracking (for idle detection)
  useEffect(() => {
    const mark = () => { lastActivityRef.current = Date.now(); };
    const evs = ["mousemove", "keydown", "mousedown", "touchstart"];
    evs.forEach((ev) => window.addEventListener(ev, mark));
    return () => evs.forEach((ev) => window.removeEventListener(ev, mark));
  }, []);

  // Load session from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("esame_student_session");
    if (!raw) { setIsAuthorized(false); return; }
    setSession(JSON.parse(raw));
  }, []);

  // ✅ Load the REAL exam paper from the server
  useEffect(() => {
    if (!session?.requestId) return;
    (async () => {
      const res = await fetch(
        `/api/student/exam?roomCode=${encodeURIComponent(roomCode)}&requestId=${encodeURIComponent(session.requestId)}`
      );
      if (res.status === 409) { router.replace("/waiting-room"); return; }
      if (!res.ok) { setIsAuthorized(false); return; }
      const data = await res.json();
      setExamMeta(data.exam);
      setSections(data.sections);
      setSecondsRemaining(data.secondsRemaining);
      setAnswers(data.progress && typeof data.progress === "object" ? data.progress : {});
      setServerPaused(!!data.isPaused);
      setIsAuthorized(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.requestId]);

  // ✅ Fullscreen monitor — poll every 1.5s; catch exit / shrink / windowed
  useEffect(() => {
    if (!isAuthorized) return;
    const poll = setInterval(() => {
      const fs = !!document.fullscreenElement;
      if (wasFsRef.current && !fs) applyLock();
      wasFsRef.current = fs;
      setInFullscreen(fs);
    }, 1500);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  const enterFullscreen = () => {
    document.documentElement
      .requestFullscreen?.()
      .then(() => {
        wasFsRef.current = true;
        setInFullscreen(true);
      })
      .catch(() => {});
  };

  // Any click enters fullscreen if not already in it
  useEffect(() => {
    if (!isAuthorized) return;
    const handleClick = () => {
      if (!document.fullscreenElement) enterFullscreen();
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  // ✅ SINGLE proctor engine — uses applyLock so every lock goes through pendingLockRef
  useEffect(() => {
    if (!isAuthorized || !session?.requestId) return;
    const stop = startProctor({
      requestId: session.requestId,
      onLock: applyLock,
      getLocked: () => isLockedRef.current,
      getQuestion: () => ({
        questionId: currentQuestionIdRef.current,
        startedAt: questionStartedAtRef.current,
      }),
      getIdle: () => Math.floor((Date.now() - lastActivityRef.current) / 1000),
    });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized, session?.requestId]);

  // ✅ Poll lock / pause / end / submitted
  useEffect(() => {
    if (!isAuthorized || !session?.requestId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/student/status?roomCode=${encodeURIComponent(roomCode)}&requestId=${encodeURIComponent(session.requestId)}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.isLocked) {
          // Server confirms the lock — clear pending, stay locked
          pendingLockRef.current = false;
          setIsLocked(true);
        } else if (pendingLockRef.current) {
          // We locked locally but server hasn't saved yet — STAY locked (no auto-unlock)
          setIsLocked(true);
        } else {
          // Only unlock when the teacher has genuinely cleared it
          setIsLocked(false);
        }

        setServerPaused(!!data.examPaused);
        if (typeof data.secondsRemaining === "number") setSecondsRemaining(data.secondsRemaining);
        if (typeof data.tabSwitches === "number") setTabSwitches(data.tabSwitches);
        if (data.examEnded || data.submitted || data.isRejectedLive) router.replace("/score");
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthorized, session?.requestId, roomCode, router]);

  useEffect(() => {
    if (isLocked) { setViolationMessageInput(""); setViolationMessageSent(false); }
  }, [isLocked]);

  function handleSendViolationMessage() {
    const trimmed = violationMessage.trim();
    if (!trimmed) return;
    let rid = "";
    try {
      const raw = sessionStorage.getItem("esame_student_session");
      if (raw) rid = JSON.parse(raw).requestId || "";
    } catch { /* ignore */ }
    if (!rid) return;
    fetch("/api/student/violation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: rid, message: trimmed }),
    }).catch(() => {});
    setViolationMessageSent(true);
  }

  async function handleSubmit(reason: "manual" | "timeout" = "manual") {
    if (!session?.requestId) return;
    const res = await fetch("/api/student/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: session.requestId, answers, reason }),
    });
    if (!res.ok) return;
    router.push(reason === "timeout" ? "/time-up" : "/score");
  }

  // Countdown + auto-submit
  useEffect(() => {
    if (secondsRemaining === null || isLocked || serverPaused) return;
    if (secondsRemaining <= 0) { handleSubmit("timeout"); return; }
    const interval = setInterval(() => {
      setSecondsRemaining((s) => (s !== null && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, isLocked, serverPaused]);

  // REAL autosave
  useEffect(() => {
    if (!isAuthorized || !session?.requestId) return;
    if (Object.keys(answers).length === 0) return;
    setIsSaving(true);
    const t = setTimeout(async () => {
      try {
        await fetch("/api/student/save-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: session.requestId, answers }),
        });
      } catch { /* retry on next change */ }
      setIsSaving(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [answers, isAuthorized, session?.requestId]);

  // Crash-save on tab close
  useEffect(() => {
    function handleHide() {
      if (!document.hidden || !session?.requestId) return;
      const payload = JSON.stringify({
        requestId: session.requestId,
        answers: answersRef.current,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/student/save-progress",
          new Blob([payload], { type: "application/json" })
        );
      }
    }
    document.addEventListener("visibilitychange", handleHide);
    return () => document.removeEventListener("visibilitychange", handleHide);
  }, [session?.requestId]);

  const section = sections[sectionIndex];
  const sectionQuestions = useMemo(() => (section ? section.questions : []), [section]);

  // Per-question timer resets when section changes
  useEffect(() => {
    questionStartedAtRef.current = Date.now();
    currentQuestionIdRef.current = sectionQuestions[0]?.id ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIndex]);

  const answeredInSection = sectionQuestions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
  const isLastSection = sectionIndex === sections.length - 1;
  const totalAnsweredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== undefined && v !== "").length,
    [answers]
  );
  const totalExamQuestions = useMemo(() => sections.reduce((s, sec) => s + sec.questions.length, 0), [sections]);
  const totalUnanswered = totalExamQuestions - totalAnsweredCount;

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }
  function handlePrimaryAction() {
    if (isLastSection) setShowSubmitConfirm(true);
    else setSectionIndex((i) => i + 1);
  }
  function handlePreviousSection() {
    setSectionIndex((i) => Math.max(0, i - 1));
  }
  function isSectionComplete(questions: any[]) {
    return questions.length > 0 && questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== "");
  }

  if (isAuthorized === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthorized) {
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
            onClick={() => router.push("/join")}
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
        onConfirm={() => { setShowSubmitConfirm(false); handleSubmit(); }}
        title="Submit your exam?"
        description={
          totalUnanswered > 0
            ? `You still have ${totalUnanswered} unanswered question${totalUnanswered !== 1 ? "s" : ""}. Once submitted, you cannot make any more changes.`
            : "You've answered every question. Once submitted, you cannot make any more changes."
        }
        confirmLabel="Submit Exam"
        variant="submit"
      />

      {/* Teacher-paused overlay */}
      {serverPaused && !isLocked && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <PauseCircle size={28} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Exam Paused</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Your teacher has paused this session. The timer is stopped — wait here until it resumes.
            </p>
          </div>
        </div>
      )}

      {/* Lock overlay */}
      {isLocked && (
        <div data-lock-overlay className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="alert-shake max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
              <div className="relative w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border-2 border-amber-100">
                <ShieldAlert size={28} />
              </div>
            </div>
            <span className="inline-block text-[10px] font-black tracking-widest text-amber-600 mb-1.5">SECURITY ALERT</span>
            <h2 className="text-lg font-bold text-slate-900">Exam Locked</h2>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              We detected suspicious activity. Your exam has been paused and flagged for your teacher.
            </p>
            {tabSwitches > 1 && (
              <span className="inline-block mt-3 rounded-full bg-red-50 text-red-600 px-3 py-1 text-[11px] font-bold">
                Violation #{tabSwitches}
              </span>
            )}
            <div className="mt-5 border-t border-slate-100 pt-5">
              {violationMessageSent ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-medium text-amber-700">Message sent — waiting for teacher approval...</span>
                </div>
              ) : (
                <div className="text-left space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Explain what happened (optional)</label>
                  <textarea
                    value={violationMessage}
                    onChange={(e) => setViolationMessageInput(e.target.value.slice(0, VIOLATION_MESSAGE_MAX_CHARS))}
                    maxLength={VIOLATION_MESSAGE_MAX_CHARS}
                    rows={3}
                    placeholder="e.g. My notification popped up and I clicked it by accident..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none"
                  />
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-sky-400 transition-all" style={{ width: `${(violationMessage.length / VIOLATION_MESSAGE_MAX_CHARS) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{violationMessage.length}/{VIOLATION_MESSAGE_MAX_CHARS}</span>
                  </div>
                  <button
                    onClick={handleSendViolationMessage}
                    disabled={!violationMessage.trim()}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    <Send size={14} /> Request Permission to Continue
                  </button>
                </div>
              )}
            </div>
            <p className="mt-5 text-xs text-slate-400">Stay on this page — you will be able to continue once your teacher grants permission.</p>
          </div>
        </div>
      )}

      {/* Fullscreen required overlay */}
      {!inFullscreen && !isLocked && !serverPaused && (
        <div className="fixed inset-0 z-50 bg-navy-900/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Fullscreen Required</h2>
            <p className="text-sm text-slate-500 mb-5">
              This exam must be taken in fullscreen. Click the button below (or anywhere) to enter fullscreen and continue.
            </p>
            <button
              onClick={enterFullscreen}
              className="w-full bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="text-[10px] font-black uppercase text-sky-600 tracking-wider">{examMeta?.department}</span>
          <h1 className="text-base font-bold text-navy-900">{examMeta?.title}</h1>
          <p className="text-xs text-slate-400">
            Student: <span className="font-semibold text-slate-600">{session?.studentName}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex flex-col items-start sm:items-end">
            <span className="flex items-center gap-1.5 font-mono font-bold text-navy-900 text-sm">
              <Clock size={13} className="text-slate-400" />
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <span className="flex items-center gap-1.5 text-slate-500 text-xs">
            <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? "bg-amber-400" : "bg-emerald-500"}`} />
            {isSaving ? "Saving..." : "All changes saved"}
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1">
            <Clock size={13} className="text-sky-300" />
            <span className="font-mono font-bold text-sm">{formatTime(secondsRemaining)}</span>
            <span className="text-[10px] text-slate-400 font-medium">left</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0">{totalAnsweredCount}/{totalExamQuestions} answered</span>
          <div className="relative flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500 ease-out"
              style={{ width: `${totalExamQuestions ? (totalAnsweredCount / totalExamQuestions) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-navy-900 shrink-0">
            {totalExamQuestions ? Math.round((totalAnsweredCount / totalExamQuestions) * 100) : 0}%
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Section sidebar */}
        <div className="md:w-60 shrink-0">
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 md:sticky md:top-6">
            {sections.map((s, i) => {
              const isCurrent = i === sectionIndex;
              const sectionComplete = isSectionComplete(s.questions);
              return (
                <button
                  key={s.id}
                  onClick={() => setSectionIndex(i)}
                  className={`shrink-0 md:w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300 hover:translate-x-1 hover:shadow-lg ${
                    isCurrent ? "bg-navy-900 text-white" : sectionComplete ? "bg-emerald-50 text-emerald-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    isCurrent ? "bg-white/15 text-white" : sectionComplete ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {sectionComplete ? <Check size={14} className="check-pop" /> : i + 1}
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
            Section {sectionIndex + 1} of {sections.length} — {section.title}
          </h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">Answered</p>
              <p className="text-sm font-bold text-navy-900">{answeredInSection}/{sectionQuestions.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
              <p className="text-xs text-slate-400 mb-1">Section</p>
              <p className="text-sm font-bold text-navy-900">{sectionIndex + 1} of {sections.length}</p>
            </div>
          </div>
          {sectionQuestions.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="inline-block rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-bold tracking-wide">
                {QUESTION_TYPE_LABEL[sectionQuestions[0].type as keyof typeof QUESTION_TYPE_LABEL]}
              </span>
              <span className="text-xs text-slate-400">
                {sectionQuestions.length} question{sectionQuestions.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="space-y-5">
            {sectionQuestions.map((q, idx) => (
              <ExamQuestionCard key={q.id} question={q} questionNumber={idx + 1} answer={answers[q.id]} onAnswer={handleAnswer} />
            ))}
          </div>
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