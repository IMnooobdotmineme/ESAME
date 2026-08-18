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
  mcq: "MULTIPLE CHOICE",
  multi_select: "MULTIPLE SELECT",
  true_false: "TRUE / FALSE",
  short_answer: "SHORT ANSWER",
  long_answer: "LONG ANSWER",
  coding: "CODING CHALLENGE",
  fill_blank: "FILL IN THE BLANK",
  matching: "MATCHING PAIRS",
  ordering: "SEQUENCE / ORDERING",
};

const optionButtonClass = (selected: boolean) =>
  `w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-left transition ${
    selected
      ? "border-examblue-400 bg-examblue-50 text-navy-900"
      : "border-slate-200 text-slate-600 hover:bg-slate-50"
  }`;

export function ExamQuestionCard({ question, answer, onAnswer }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      <span className="inline-block rounded-full bg-examblue-50 text-examblue-600 px-3 py-1 text-xs font-bold tracking-wide mb-3">
        {TYPE_LABEL[question.type]}
      </span>

      {"marks" in question ? (
        <p className="text-sm font-semibold text-navy-900 mb-3">
          {question.prompt} ({question.marks} Marks)
        </p>
      ) : (
        <p className="text-sm font-semibold text-navy-900 mb-3">{question.prompt}</p>
      )}

      {question.type === "mcq" && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selected = answer === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onAnswer(question.id, option.id)}
                className={optionButtonClass(selected)}
              >
                <span className="font-semibold text-navy-900">{option.label}</span>
                {option.text}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "multi_select" && (
        <div className="space-y-2">
          {question.options.map((option) => {
            const selectedIds = (answer ?? "").split(",").filter(Boolean);
            const selected = selectedIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  const next = selected
                    ? selectedIds.filter((id) => id !== option.id)
                    : [...selectedIds, option.id];
                  onAnswer(question.id, next.join(","));
                }}
                className={optionButtonClass(selected)}
              >
                <span
                  className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                    selected ? "bg-examblue-500 border-examblue-500" : "border-slate-300"
                  }`}
                >
                  {selected && <span className="w-2 h-2 bg-white rounded-sm" />}
                </span>
                <span className="font-semibold text-navy-900">{option.label}</span>
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

      {question.type === "short_answer" && (
        <input
          type="text"
          value={answer ?? ""}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          placeholder="Type your answer..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      )}

      {question.type === "fill_blank" && (
        <input
          type="text"
          value={answer ?? ""}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          placeholder="Your answer..."
          className="w-full max-w-xs rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      )}

      {(question.type === "long_answer" || question.type === "coding") && (
        <textarea
          value={answer ?? ""}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          rows={question.type === "coding" ? 8 : 5}
          placeholder={question.type === "coding" ? "// Write your code here" : undefined}
          className={`w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 ${
            question.type === "coding" ? "font-mono" : ""
          }`}
        />
      )}

      {question.type === "matching" && (
        <MatchingInput question={question} answer={answer} onAnswer={onAnswer} />
      )}

      {question.type === "ordering" && (
        <OrderingInput question={question} answer={answer} onAnswer={onAnswer} />
      )}
    </div>
  );
}

function MatchingInput({
  question,
  answer,
  onAnswer,
}: {
  question: Extract<ExamQuestion, { type: "matching" }>;
  answer: string | undefined;
  onAnswer: (questionId: string, value: string) => void;
}) {
  let pairs: Record<string, string> = {};
  try {
    pairs = answer ? JSON.parse(answer) : {};
  } catch {
    pairs = {};
  }

  function setPair(leftId: string, rightId: string) {
    const next = { ...pairs, [leftId]: rightId };
    onAnswer(question.id, JSON.stringify(next));
  }

  return (
    <div className="space-y-2">
      {question.left.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <span className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 bg-slate-50">
            {item.text}
          </span>
          <select
            value={pairs[item.id] ?? ""}
            onChange={(e) => setPair(item.id, e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            <option value="" disabled>
              Select a match...
            </option>
            {question.right.map((r) => (
              <option key={r.id} value={r.id}>
                {r.text}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function OrderingInput({
  question,
  answer,
  onAnswer,
}: {
  question: Extract<ExamQuestion, { type: "ordering" }>;
  answer: string | undefined;
  onAnswer: (questionId: string, value: string) => void;
}) {
  const order = answer ? answer.split(",").filter(Boolean) : question.items.map((i) => i.id);

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onAnswer(question.id, next.join(","));
  }

  return (
    <div className="space-y-2">
      {order.map((id, index) => {
        const item = question.items.find((i) => i.id === id);
        if (!item) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5"
          >
            <span className="w-6 h-6 shrink-0 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="flex-1 text-sm text-navy-900">{item.text}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
              >
                ↓
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
