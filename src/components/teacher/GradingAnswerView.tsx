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

// ✅ Extract [n] marker numbers in order of appearance
function extractBlankNumbers(text: string): string[] {
  const nums: string[] = [];
  const re = /\[\s*(\d+)\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (!nums.includes(m[1])) nums.push(m[1]);
  }
  return nums;
}

// ✅ Rebuild the exact question shape the student saw, from the teacher's saved definition
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

    // ✅ FILL_BLANK — blank IDs = marker numbers ("1","2","3") so they match the student's
    //    stored JSON keys; includes choices[] so the numbered hints box renders.
    case "fill_blank": {
      const rawText = String(def.blanksText || "");
      const nums = extractBlankNumbers(rawText);

      // Split the text on every [n] marker, keeping segments between blanks
      const segments: string[] = [];
      const re = /\[\s*\d+\s*\]/g;
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(rawText))) {
        segments.push(rawText.slice(last, m.index));
        last = m.index + m[0].length;
      }
      segments.push(rawText.slice(last));

      // Answer key lookup by marker number
      const keyByNum: Record<string, string> = {};
      (def.answerKey || []).forEach((row: any) => {
        keyByNum[String(row.number)] = String(row.answer ?? "");
      });

      const blanks = nums.map((n) => ({
        id: n,                       // ✅ id = marker number, matches student answer keys
        correctAnswer: keyByNum[n] || "",
      }));

      return {
        ...base,
        type: "fill_blank",
        segments,
        blanks,
        choices: Array.isArray(def.blankChoices) ? def.blankChoices : [],
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

// ✅ View-only replica of the student's answer UI + section title + type badge
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

  // normalize "a, b" → "a,b" so multi-select highlighting matches
  let viewAnswer = answer;
  if (def?.type === "multi_select" && answer) {
    viewAnswer = answer.split(",").map((s) => s.trim()).filter(Boolean).join(",");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {sectionTitle && <Badge>{sectionTitle}</Badge>}
        <Badge variant="info">{TYPE_LABELS[def?.type] ?? def?.type}</Badge>
      </div>

      {/* ✅ Correct answers for fill-blank — show what was expected per marker */}
      {def?.type === "fill_blank" && Array.isArray(def.answerKey) && def.answerKey.length > 0 && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-1.5">
          <p className="text-emerald-700 font-semibold text-[11px] uppercase tracking-wider">
            Correct answers
          </p>
          <div className="flex flex-wrap gap-2">
            {def.answerKey
              .slice()
              .sort((a: any, b: any) => Number(a?.number) - Number(b?.number))
              .map((row: any, i: number) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                >
                  <span className="font-mono">[{row.number}]</span>
                  <span className="font-medium">{row.answer || "—"}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      <div className="relative select-text">
        <ExamQuestionCard
          question={question}
          questionNumber={index}
          answer={viewAnswer}
          onAnswer={() => {}}
        />
        {/* Overlay: absorbs clicks/taps so the teacher can't change answers,
            but doesn't block the parent layout or hover states */}
        <div
          aria-hidden
          className="absolute inset-0 z-10 cursor-default"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}