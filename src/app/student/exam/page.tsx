// src/app/student/exam/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { ExamQuestionCard } from "@/components/student/ExamQuestionCard";
import {
  getMockExamContent,
  examHasEssayQuestions,
} from "@/lib/student-exam-content";
import { getMockExamSession } from "@/lib/student-exam-data";

function formatTime(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function ExamPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const [examContent] = useState(() => getMockExamContent());
  const [examSession] = useState(() => getMockExamSession());

  const [sectionIndex, setSectionIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(
    examSession.durationMinutes * 60
  );
  const [isSaving, setIsSaving] = useState(false);

  // Guard: must have joined a room first
  useEffect(() => {
    const session = sessionStorage.getItem("esame_student_session");
    if (!session) {
      router.replace("/student/join");
      return;
    }
    setReady(true);
  }, [router]);

  // Countdown + auto-submit on timeout
  useEffect(() => {
    if (!ready) return;
    if (secondsRemaining <= 0) {
      handleSubmit();
      return;
    }
    const interval = setInterval(() => {
      setSecondsRemaining((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, secondsRemaining]);

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
    () => section.pages.flatMap((p) => p.questions.map((q) => q.id)),
    [section]
  );
  const answeredInSection = sectionQuestionIds.filter(
    (id) => answers[id] !== undefined && answers[id] !== ""
  ).length;

  const isLastSection = sectionIndex === examContent.sections.length - 1;

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleSubmit() {
    const hasEssay = examHasEssayQuestions(examContent);
    sessionStorage.setItem(
      "esame_exam_result",
      JSON.stringify({
        answers,
        hasEssay,
        submittedAt: new Date().toISOString(),
      })
    );
    router.push("/student/score");
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

  if (!ready || !page) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <EsameLogo height={24} />
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
            Timer: {formatTime(secondsRemaining)}
            <Clock size={14} className="text-slate-400" />
          </span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <h1 className="text-sm font-bold text-navy-900">
          {section.title} of {examContent.sections.length}
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