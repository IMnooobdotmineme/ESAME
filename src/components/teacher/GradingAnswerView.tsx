"use client";
import React from "react";
import { ExamQuestionCard } from "@/components/student/ExamQuestionCard";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice",
  multi_select: "Multiple Select",
  true_false: "True / False",
  short_answer: "Short Answer",
  long_answer: "Long Question",
  coding: "Coding Challenge",
  fill_blank: "Fill in the Blank",
  matching: "Matching Pairs",
  ordering: "Sequence / Ordering",
};

// Rebuild the exact question shape the student saw (unchanged from original)
export function buildExamQuestion(def: any): any {
  const base: any = {
    id: def?.id || def?.text,
    prompt: def?.text ?? "",
    marks: def?.marks ?? 5,
    media:
      def?.mediaUrl && def?.mediaType && def.mediaType !== "none"
        ? { type: def.mediaType, url: def.mediaUrl }
        : null,
  };

  switch (def?.type) {
    case "mcq":
      return {
        ...base,
        type: "mcq",
        options: (def.mcqOptions || []).map((text: string, i: number) => ({
          id: String(text),
          label: String.fromCharCode(65 + i),
          text,
        })),
      };
    case "multi_select":
      return {
        ...base,
        type: "multi_select",
        options: (def.multiOptions || []).map((text: string, i: number) => ({
          id: String(text),
          label: String.fromCharCode(65 + i),
          text,
        })),
      };
    case "true_false":
      return { ...base, type: "true_false" };
    case "short_answer":
      return { ...base, type: "short_answer" };
    case "long_answer":
      return { ...base, type: "long_answer" };
    case "coding":
      return { ...base, type: "coding", language: def?.language || "JavaScript" };
    case "fill_blank": {
      const rawText = String(def.blanksText || "");
      const segments: string[] = [];
      const blanks: { id: string; correctAnswer: string }[] = [];
      const keyByNum: Record<string, string> = {};
      (def.answerKey || []).forEach((row: any) => {
        keyByNum[String(row.number)] = String(row.answer ?? "");
      });
      const re = /\[\s*(\d+)\s*\]/g;
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rawText))) {
        segments.push(rawText.slice(last, m.index));
        blanks.push({ id: m[1], correctAnswer: keyByNum[m[1]] || "" });
        last = m.index + m[0].length;
      }
      segments.push(rawText.slice(last));
      return {
        ...base,
        type: "fill_blank",
        segments,
        blanks,
        choices: Array.isArray(def.blankChoices)
          ? def.blankChoices.filter((c: string) => String(c).trim())
          : [],
      };
    }
    case "matching":
      return {
        ...base,
        type: "matching",
        left: (def.matchLeft || []).map((text: string, i: number) => ({
          id: `l${i + 1}`,
          text,
        })),
        right: (def.matchRight || []).map((text: string, i: number) => ({
          id: `r${i + 1}`,
          text,
        })),
      };
    case "ordering":
      return {
        ...base,
        type: "ordering",
        items: (def.orderingItems || []).map((text: string, i: number) => ({
          id: `i${i + 1}`,
          text,
        })),
      };
    default:
      return { ...base, type: "long_answer" };
  }
}

// ========== ANSWER KEY (teacher's expected answer) ==========
// Rendered above the student's answer for comparison. Quiet, minimal style.
function AnswerKeyBlock({ def }: { def: any }) {
  const type = def?.type;
  if (!def) return null;

  const KeyLabel = () => (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2">
      Answer Key
    </p>
  );

  switch (type) {
    case "mcq":
    case "true_false": {
      const correct = def.correctAnswer ?? def.answerKey ?? def.correctValue;
      if (correct === undefined || correct === "") return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          <p className="text-sm font-medium text-emerald-900">{String(correct)}</p>
        </div>
      );
    }

    case "multi_select": {
      const correct = def.correctAnswer ?? [];
      if (!Array.isArray(correct) || !correct.length) return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          <p className="text-sm font-medium text-emerald-900 leading-relaxed">
            {correct.join(" · ")}
          </p>
        </div>
      );
    }

    case "short_answer": {
      const variants = Array.isArray(def.acceptedVariants) && def.acceptedVariants.length
        ? def.acceptedVariants
        : [def.correctAnswer ?? def.answerKey].filter((v: any) => v !== undefined && v !== "");
      if (!variants.length) return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          {variants.length === 1 ? (
            <p className="text-sm font-medium text-emerald-900">{String(variants[0])}</p>
          ) : (
            <>
              <p className="text-xs text-emerald-700/70 mb-1">Accept any of:</p>
              <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                {variants.map((v: any) => String(v)).join(" · ")}
              </p>
            </>
          )}
        </div>
      );
    }

    case "fill_blank": {
      if (!Array.isArray(def.answerKey) || !def.answerKey.length) return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {def.answerKey
              .slice()
              .sort((a: any, b: any) => Number(a?.number) - Number(b?.number))
              .map((row: any, i: number) => (
                <div key={i} className="text-sm">
                  <span className="font-mono text-emerald-700/70">[{row.number}]</span>{" "}
                  <span className="font-medium text-emerald-900">{row.answer || "—"}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }

    case "matching": {
      const pairs = def.correctPairs ?? {};
      const keys = Object.keys(pairs);
      if (!keys.length) return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          <div className="space-y-1">
            {keys.map((term, i) => (
              <div key={i} className="text-sm leading-relaxed">
                <span className="font-medium text-emerald-900">{term}</span>
                <span className="text-emerald-700/60 mx-1.5">→</span>
                <span className="text-emerald-800">{pairs[term]}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "ordering": {
      const correctOrder = (def.correctOrder ?? def.orderingItems ?? []) as string[];
      if (!correctOrder.length) return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          <ol className="list-decimal list-inside space-y-0.5 text-sm text-emerald-900">
            {correctOrder.map((item, i) => (
              <li key={i} className="leading-relaxed">{item}</li>
            ))}
          </ol>
        </div>
      );
    }

    case "long_answer":
    case "coding": {
      const rubric = def.rubric ?? def.expectedOutput ?? def.modelAnswer ?? def.sampleAnswer;
      if (!rubric) return null;
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <KeyLabel />
          <pre className="whitespace-pre-wrap text-sm text-emerald-900 font-sans leading-relaxed">
            {String(rubric)}
          </pre>
        </div>
      );
    }

    default:
      return null;
  }
}

// ========== MAIN COMPONENT ==========
export function GradingAnswerView({
  def,
  answer,
  sectionTitle,
  index,
}: {
  def: any;
  answer?: string;
  sectionTitle?: string;
  index: number;
}) {
  const question = buildExamQuestion(def);

  // For multi-select, pass answer as array of texts so ExamQuestionCard can match them
  let viewAnswer: any = answer;
  if (def?.type === "multi_select" && typeof answer === "string") {
    viewAnswer = answer.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const hasAnswer = answer !== undefined && answer !== "" && answer !== null;

  return (
    <div className="space-y-4">
      {/* Section + type badges */}
      <div className="flex flex-wrap items-center gap-2">
        {sectionTitle && <Badge>{sectionTitle}</Badge>}
        <Badge variant="info">{TYPE_LABELS[def?.type] ?? def?.type}</Badge>
      </div>

      {/* 1. TEACHER'S ANSWER KEY — above everything, for comparison */}
      <AnswerKeyBlock def={def} />

      {/* 2. STUDENT'S ANSWER — existing ExamQuestionCard, wrapped with a clean label */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 mb-2">
          Student's Answer
        </p>
                <div className="relative">
          <ExamQuestionCard
            question={question}
            questionNumber={index}
            answer={viewAnswer}
            onAnswer={() => {}}
          />
          {/* Read-only overlay — prevents the teacher from accidentally changing answers */}
          <div
            aria-hidden
            className="absolute inset-0 z-10 cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          {!hasAnswer && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <span className="rounded-full bg-slate-900/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-white">
                No answer submitted
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}