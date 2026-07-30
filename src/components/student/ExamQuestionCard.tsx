// src/components/student/ExamQuestionCard.tsx
"use client";

import React from "react";
import { ExamQuestion } from "@/lib/student-exam-content";

interface Props {
  question: ExamQuestion;
  answer: string | undefined;
  onAnswer: (questionId: string, value: string) => void;
}

const TYPE_LABEL: Record<ExamQuestion["type"], string> = {
  multiple_choice: "MULTIPLE CHOICE",
  true_false: "TRUE / FALSE",
  essay: "ESSAY / LONG ANSWER",
};

export function ExamQuestionCard({ question, answer, onAnswer }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <span className="inline-block rounded-full bg-examblue-50 text-examblue-600 px-3 py-1 text-xs font-bold tracking-wide mb-3">
        {TYPE_LABEL[question.type]}
      </span>

      {question.type === "essay" ? (
        <p className="text-sm font-semibold text-navy-900 mb-3">
          {question.prompt} ({question.marks} Marks)
        </p>
      ) : (
        <p className="text-sm font-semibold text-navy-900 mb-3">
          {question.prompt}
        </p>
      )}

      {question.type === "multiple_choice" && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selected = answer === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAnswer(question.id, option.id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-left transition ${
                  selected
                    ? "border-examblue-400 bg-examblue-50 text-navy-900"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="font-semibold text-navy-900">
                  {option.label}
                </span>
                {option.text}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="flex gap-3">
          {(["true", "false"] as const).map((value) => {
            const selected = answer === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onAnswer(question.id, value)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition ${
                  selected
                    ? "border-examblue-400 bg-examblue-50 text-navy-900"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {value === "true" ? "True" : "False"}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "essay" && (
        <textarea
          value={answer ?? ""}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      )}
    </div>
  );
}
