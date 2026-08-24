// src/app/student/score/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { EsameLogo } from "@/components/organization/EsameLogo";
import {
  getMockExamContent,
  computeMockScore,
  computeSectionBreakdown,
  QUESTION_TYPE_LABEL,
  ScoreResult,
  SectionBreakdown,
} from "@/lib/student-exam-content";

interface ExamResult {
  answers: Record<string, string>;
  hasEssay: boolean;
  submittedAt: string;
  reason?: "manual" | "timeout";
}

function ScoreRing({ percentage }: { percentage: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const ringColor =
    percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-sky-500" : "text-rose-500";

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={radius} strokeWidth="10" fill="none" className="stroke-slate-100" />
        <circle
          cx="72"
          cy="72"
          r={radius}
          strokeWidth="10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${ringColor} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-navy-900">{percentage}%</span>
      </div>
    </div>
  );
}

export default function ScorePage() {
  const router = useRouter();
  const [result, setResult] = useState<ExamResult | null>(null);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [sections, setSections] = useState<SectionBreakdown[]>([]);
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
    setSections(computeSectionBreakdown(examContent, parsed.answers));
  }, [router]);

  function handleDone() {
    sessionStorage.removeItem("esame_student_session");
    sessionStorage.removeItem("esame_exam_result");
    router.push("/");
  }

  if (!result || !score) return null;

  const isPending = result.hasEssay;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <EsameLogo height={24} />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        {result.reason === "timeout" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 flex items-center gap-2.5">
            <Clock3 size={16} className="text-amber-600 shrink-0" />
            <p className="text-xs font-medium text-amber-800">
              This exam was automatically submitted when your time ran out.
            </p>
          </div>
        )}

        {/* Summary card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 flex flex-col items-center text-center">
          <p className="text-xs font-bold tracking-widest text-slate-400 mb-5">
            {examTitle.toUpperCase()}
          </p>

          {isPending ? (
            <>
              <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mb-4">
                <Clock3 size={30} className="text-sky-700" />
              </div>
              <h1 className="text-xl font-bold text-navy-900">Pending Teacher Review</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">
                Your exam has been submitted successfully. This exam includes
                written questions that need to be reviewed by your teacher
                before a final score can be released.
              </p>
              <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 inline-flex items-center gap-2">
                <span className="text-sm font-semibold text-navy-900">
                  {score.correctCount}/{score.autoGradedQuestions}
                </span>
                <span className="text-xs text-slate-400">objective questions graded so far</span>
              </div>
            </>
          ) : (
            <>
              <ScoreRing percentage={score.percentage} />
              <h1 className="mt-4 text-sm font-semibold text-slate-500">Your Score</h1>
              <p className="mt-1 text-sm text-slate-500">
                {score.earnedPoints} / {score.autoTotalPoints} points ·{" "}
                {score.correctCount} of {score.autoGradedQuestions} questions correct
              </p>
            </>
          )}
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-4">
          <StatBox
            icon={<CheckCircle2 size={16} />}
            iconClass="text-emerald-600 bg-emerald-50"
            label="Correct"
            value={score.correctCount}
          />
          <StatBox
            icon={<XCircle size={16} />}
            iconClass="text-red-500 bg-red-50"
            label="Incorrect"
            value={score.incorrectCount}
          />
          <StatBox
            icon={<HelpCircle size={16} />}
            iconClass="text-amber-600 bg-amber-50"
            label="Unanswered"
            value={score.unansweredCount}
          />
        </div>

        {/* Section breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">
            SECTION BREAKDOWN
          </h2>
          <div className="divide-y divide-slate-100">
            {sections.map((s) => (
              <div key={s.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900 truncate">{s.title}</p>
                  <p className="text-xs text-slate-400">{QUESTION_TYPE_LABEL[s.type]}</p>
                </div>
                {s.isManual ? (
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold">
                    <Clock3 size={12} />
                    Pending review
                  </span>
                ) : (
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      s.correctCount === s.totalQuestions
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {s.correctCount === s.totalQuestions && <CheckCircle2 size={12} />}
                    {s.correctCount}/{s.totalQuestions} correct
                  </span>
                )}
              </div>
            ))}
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
                  Your objective questions (multiple choice, true/false, matching,
                  and more) have already been graded automatically.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                  <FileText size={12} />
                </span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your written and code answers will be reviewed by your teacher
                  before a final score is released.
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

function StatBox({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-2 ${iconClass}`}>
        {icon}
      </div>
      <p className="text-lg font-bold text-navy-900">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}