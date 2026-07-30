// src/app/student/score/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, FileText, ListChecks } from "lucide-react";
import { EsameLogo } from "@/components/organization/EsameLogo";
import {
  getMockExamContent,
  computeMockScore,
  ScoreResult,
} from "@/lib/student-exam-content";

interface ExamResult {
  answers: Record<string, string>;
  hasEssay: boolean;
  submittedAt: string;
}

export default function ScorePage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [examTitle, setExamTitle] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("esame_exam_result");
    if (!raw) {
      router.replace("/student/join");
      return;
    }
    const parsed: ExamResult = JSON.parse(raw);
    setResult(parsed);

    const examContent = getMockExamContent();
    setExamTitle(examContent.title);
    setScore(computeMockScore(examContent, parsed.answers));
  }, [router]);

  function handleDone() {
    sessionStorage.removeItem("esame_student_session");
    sessionStorage.removeItem("esame_exam_result");
    router.push("/");
  }

  if (!result || !score) return null;

  const isPending = result.hasEssay;
  const incorrectCount = score.autoGradedQuestions - score.correctCount;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <EsameLogo height={24} />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        {/* Summary card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 flex flex-col items-center text-center">
          {isPending ? (
            <div className="w-16 h-16 rounded-full bg-examblue-50 flex items-center justify-center">
              <Clock3 size={30} className="text-examblue-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={30} className="text-emerald-600" />
            </div>
          )}

          <p className="mt-4 text-xs font-bold tracking-widest text-slate-400">
            {examTitle.toUpperCase()}
          </p>

          {isPending ? (
            <>
              <h1 className="mt-2 text-xl font-bold text-navy-900">
                Pending Teacher Review
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
                Your exam has been submitted successfully. This exam includes
                written questions that need to be reviewed by your teacher
                before a final score can be released.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-sm font-semibold text-slate-500">
                Your Score
              </h1>
              <p className="mt-1 text-6xl font-black text-navy-900">
                {score.percentage}%
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {score.correctCount} out of {score.autoGradedQuestions}{" "}
                questions correct
              </p>
            </>
          )}
        </div>

        {/* Breakdown card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">
            RESULT BREAKDOWN
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Correct</p>
              <p className="text-lg font-bold text-emerald-600">
                {score.correctCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Incorrect</p>
              <p className="text-lg font-bold text-red-500">
                {incorrectCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-400 mb-1">Written</p>
              <p className="text-lg font-bold text-examblue-600">
                {score.essayCount}
              </p>
            </div>
          </div>
        </div>

        {/* What happens next (only for pending review) */}
        {isPending && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">
              WHAT HAPPENS NEXT
            </h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                  <ListChecks size={12} />
                </span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your multiple choice and true/false answers have already
                  been graded automatically.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                  <FileText size={12} />
                </span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your written answers will be reviewed by your teacher before
                  a final score is released.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                  <Clock3 size={12} />
                </span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You&apos;ll be notified once your final result is ready.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleDone}
          className="w-full py-3.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
        >
          Done
        </button>
      </main>
    </div>
  );
}