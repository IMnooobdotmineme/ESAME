// src/components/student/ExamQuestionCard.tsx
"use client";

import React, { useLayoutEffect, useRef, useState, useMemo } from "react";
import { ExamQuestion } from "@/lib/student-exam-content";
import { Sun, Moon } from "lucide-react";

interface Props {
  question: ExamQuestion;
  questionNumber: number;
  answer: string | undefined;
  onAnswer: (questionId: string, value: string) => void;
}

const optionButtonClass = (selected: boolean) =>
  `w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm text-left transition ${
    selected
      ? "border-sky-400 bg-sky-50 text-navy-900"
      : "border-slate-200 text-slate-600 hover:bg-slate-50"
  }`;

export function ExamQuestionCard({ question, questionNumber, answer, onAnswer }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
      {"marks" in question ? (
        <p className="text-sm font-semibold text-navy-900 mb-3">
          <span className="text-black mr-1.5">{questionNumber}.</span>
          {question.prompt} ({question.marks} Marks)
        </p>
      ) : (
        <p className="text-sm font-semibold text-navy-900 mb-3">
          <span className="text-black mr-1.5">{questionNumber}.</span>
          {question.prompt}
        </p>
      )}

      {/* 📎 Attached media (image / video / audio) uploaded by the teacher */}
      {question.media?.url && (
        <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
          {question.media.type === "image" && (
            <img src={question.media.url} alt="Question media" className="max-h-64 w-full object-contain" />
          )}
          {question.media.type === "video" && (
            <video src={question.media.url} controls className="max-h-64 w-full bg-black" />
          )}
          {question.media.type === "audio" && (
            <audio src={question.media.url} controls className="w-full" />
          )}
        </div>
      )}

      {question.type === "mcq" && (
  <div className="space-y-2">
    {question.options.map((option: any, i: number) => {
  const selected = Array.isArray(answer)
    ? answer.includes(option.id ?? option.text)
    : answer === (option.id ?? option.text);
  return (
    <button
      key={`${option.id ?? "opt"}-${i}`}
      type="button"
      onClick={() => onAnswer(question.id, option.id ?? option.text)}
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
            // ✅ Handle both string (from student taking exam) and array (from grading view)
            const selectedIds = Array.isArray(answer)
              ? answer
              : (answer ?? "").split(",").filter(Boolean);
            const selected = selectedIds.includes(option.id) || selectedIds.includes(option.text);
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
                    selected ? "bg-sky-500 border-sky-500" : "border-slate-300"
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
                    ? "border-sky-400 bg-sky-50 text-navy-900"
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
        <FillBlankInput question={question} answer={answer} onAnswer={onAnswer} />
      )}

      {question.type === "long_answer" && (
        <textarea
          value={answer ?? ""}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      )}

      {question.type === "coding" && (
        <CodeEditorInput question={question} answer={answer} onAnswer={onAnswer} />
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

function FillBlankInput({
  question,
  answer,
  onAnswer,
}: {
  question: Extract<ExamQuestion, { type: "fill_blank" }>;
  answer: string | undefined;
  onAnswer: (questionId: string, value: string) => void;
}) {
  let values: Record<string, string> = {};
  try {
    values = answer ? JSON.parse(answer) : {};
  } catch {
    values = {};
  }
  const choices: string[] = (question as any).choices || [];

  function setBlank(blankId: string, value: string) {
    const next = { ...values, [blankId]: value };
    onAnswer(question.id, JSON.stringify(next));
  }

  // ✅ Accept both "1" and "b1" stored keys (old + new submissions)
  const getVal = (blankId: string) => values[blankId] ?? values[`b${blankId}`] ?? "";

  return (
    <div className="space-y-3">
      {/* ✅ Choices / Hints box shown to the student */}
      {choices.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Choices — type the number or the word
          </p>
          <div className="flex flex-wrap gap-2">
            {choices.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700"
              >
                <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="text-sm text-navy-900 leading-loose">
        {question.segments.map((segment, i) => (
          <React.Fragment key={i}>
            {segment}
            {i < question.blanks.length && (
              <input
                type="text"
                value={getVal(question.blanks[i].id)}
                onChange={(e) => setBlank(question.blanks[i].id, e.target.value)}
                className="inline-block w-28 mx-2 my-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-navy-900 text-center outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 align-middle"
              />
            )}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

// ✅ Built-in multi-language highlighter (no dependencies)
const KEYWORDS = new Set(
  (
    "const let var function return if else for while do class import from export default def print " +
    "public private protected static void int float double char bool boolean string new try catch finally throw " +
    "switch case break continue default in of type interface extends implements package struct enum fn impl pub use mod match loop " +
    "async await yield lambda pass raise with as elif except global assert del not or and " +
    "null undefined true false nil None True False self this super typeof instanceof delete " +
    "SELECT FROM WHERE INSERT UPDATE DELETE CREATE TABLE JOIN LEFT RIGHT INNER OUTER ON AND OR NOT ORDER BY GROUP HAVING LIMIT VALUES SET INTO AS DISTINCT COUNT SUM AVG MIN MAX PRIMARY KEY FOREIGN REFERENCES"
  ).split(/\s+/)
);

const BOOLEANS = new Set(["true", "false", "True", "False", "nil", "null", "undefined", "None"]);

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TOKEN_REGEX =
  /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|([A-Za-z_][A-Za-z0-9_]*)/g;

function highlightCode(code: string): string {
  let html = "";
  let last = 0;
  for (const m of code.matchAll(TOKEN_REGEX)) {
    const idx = m.index ?? 0;
    html += escapeHtml(code.slice(last, idx));
    const [full, comment, str, num, fn, word] = m;
    let cls = "";
    if (comment) cls = "tok-comment";
    else if (str) cls = "tok-string";
    else if (num) cls = "tok-number";
    else if (fn) cls = KEYWORDS.has(fn) ? "tok-keyword" : "tok-function";
    else if (word) {
      if (BOOLEANS.has(word)) cls = "tok-boolean";
      else if (KEYWORDS.has(word)) cls = "tok-keyword";
    }
    html += cls ? `<span class="${cls}">${escapeHtml(full)}</span>` : escapeHtml(full);
    last = idx + full.length;
  }
  html += escapeHtml(code.slice(last));
  return html;
}

const CODE_EDITOR_CSS = `
.code-editor pre, .code-editor textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  tab-size: 2;
}
/* DARK (VS Code Dark+) */
.code-editor .tok-comment { color: #6A9955; }
.code-editor .tok-string  { color: #CE9178; }
.code-editor .tok-number  { color: #B5CEA8; }
.code-editor .tok-keyword { color: #569CD6; }
.code-editor .tok-boolean { color: #569CD6; }
.code-editor .tok-function{ color: #DCDCAA; }
/* LIGHT (VS Code Light+) */
.code-editor.light .tok-comment { color: #008000; }
.code-editor.light .tok-string  { color: #A31515; }
.code-editor.light .tok-number  { color: #098658; }
.code-editor.light .tok-keyword { color: #0000FF; }
.code-editor.light .tok-boolean { color: #0000FF; }
.code-editor.light .tok-function{ color: #795E26; }
`;

function CodeEditorInput({
  question,
  answer,
  onAnswer,
}: {
  question: Extract<ExamQuestion, { type: "coding" }>;
  answer: string | undefined;
  onAnswer: (questionId: string, value: string) => void;
}) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const value = answer ?? "";
  

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const next = `${value.slice(0, start)}  ${value.slice(end)}`;
    onAnswer(question.id, next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + 2;
    });
  }

  const highlighted = useMemo(() => highlightCode(value), [value]);

  const dark = theme === "dark";
  const sharedText = "p-4 text-[13px] leading-6 whitespace-pre-wrap break-words";

  return (
    <div
      className={`code-editor ${dark ? "" : "light"} rounded-xl overflow-hidden border ${
        dark ? "border-[#333333]" : "border-slate-200"
      }`}
    >
      {/* ✅ Theme CSS lives INSIDE the component — always applied */}
      <style>{CODE_EDITOR_CSS}</style>

      {/* Header: language left, theme toggle right */}
      <div
        className={`flex items-center justify-between px-4 py-2 ${
          dark ? "bg-[#252526]" : "bg-slate-100"
        }`}
      >
        <span className={`text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {question.language || "JavaScript"}
        </span>
        <button
          type="button"
          onClick={() => setTheme(dark ? "light" : "dark")}
          title={dark ? "Switch to light theme" : "Switch to dark theme"}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
            dark
              ? "bg-[#333333] text-slate-300 hover:bg-[#3c3c3c]"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-200"
          }`}
        >
          {dark ? <Sun size={12} /> : <Moon size={12} />}
          {dark ? "Light" : "Dark"}
        </button>
      </div>

      {/* Editor: colored code behind a transparent textarea */}
      <div className="relative">
        <pre
          aria-hidden
          className={`m-0 min-h-[260px] ${sharedText} ${
            dark ? "bg-[#1e1e1e] text-[#d4d4d4]" : "bg-white text-[#393a34]"
          }`}
          dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
        />
        <textarea
          value={value}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder="// Write your code here..."
          style={{
            color: "transparent",
            backgroundColor: "transparent",
            caretColor: dark ? "#ffffff" : "#0f172a",
          }}
          className={`absolute inset-0 h-full w-full resize-none overflow-hidden outline-none selection:bg-sky-500/40 ${sharedText} ${
            dark ? "placeholder:text-slate-500" : "placeholder:text-slate-400"
          }`}
        />
      </div>
    </div>
  );
}

interface Line {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lines, setLines] = useState<Line[]>([]);

  function commit(next: Record<string, string>) {
    onAnswer(question.id, JSON.stringify(next));
  }

  function handleLeftClick(leftId: string) {
    setSelectedLeft((prev) => (prev === leftId ? null : leftId));
  }

  function handleRightClick(rightId: string) {
    if (!selectedLeft) return;
    const next = { ...pairs };
    for (const key of Object.keys(next)) {
      if (next[key] === rightId) delete next[key];
    }
    next[selectedLeft] = rightId;
    commit(next);
    setSelectedLeft(null);
  }

  function removePair(leftId: string) {
    const next = { ...pairs };
    delete next[leftId];
    commit(next);
  }

  useLayoutEffect(() => {
    function recalc() {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const next: Line[] = Object.entries(pairs)
        .map(([leftId, rightId]) => {
          const leftEl = leftRefs.current[leftId];
          const rightEl = rightRefs.current[rightId];
          if (!leftEl || !rightEl) return null;
          const lr = leftEl.getBoundingClientRect();
          const rr = rightEl.getBoundingClientRect();
          return {
            key: `${leftId}-${rightId}`,
            x1: lr.right - containerRect.left,
            y1: lr.top + lr.height / 2 - containerRect.top,
            x2: rr.left - containerRect.left,
            y2: rr.top + rr.height / 2 - containerRect.top,
          };
        })
        .filter((l): l is Line => l !== null);
      setLines(next);
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [answer]);

  return (
    <div>
      <div ref={containerRef} className="relative flex gap-10 sm:gap-16">
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <marker
              id={`arrow-${question.id}`}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" className="fill-sky-500" />
            </marker>
          </defs>
          {lines.map((l) => (
            <line
              key={l.key}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              strokeWidth={2}
              className="stroke-sky-500"
              markerEnd={`url(#arrow-${question.id})`}
            />
          ))}
        </svg>

        <div className="flex-1 space-y-2">
          {question.left.map((item, i) => {
            const matched = Boolean(pairs[item.id]);
            const isSelected = selectedLeft === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  leftRefs.current[item.id] = el;
                }}
                type="button"
                onClick={() => handleLeftClick(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm text-left transition ${
                  isSelected
                    ? "border-sky-400 bg-sky-50"
                    : matched
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="w-6 h-6 shrink-0 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                  {i + 1}
                </span>
                <span className="flex-1 text-navy-900">{item.text}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-2">
          {question.right.map((item, i) => {
            const letter = String.fromCharCode(65 + i);
            const isMatched = Object.values(pairs).includes(item.id);
            return (
              <button
                key={item.id}
                ref={(el) => {
                  rightRefs.current[item.id] = el;
                }}
                type="button"
                onClick={() => handleRightClick(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm text-left transition ${
                  isMatched
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className="w-6 h-6 shrink-0 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center font-mono">
                  {letter}
                </span>
                <span className="flex-1 text-navy-900">{item.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedLeft && (
        <p className="mt-3 text-xs font-medium text-sky-600">
          Now click a lettered box on the right to connect it.
        </p>
      )}

      {Object.keys(pairs).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {question.left.map((item, i) => {
            const rightId = pairs[item.id];
            if (!rightId) return null;
            const rIndex = question.right.findIndex((r) => r.id === rightId);
            if (rIndex === -1) return null;
            const letter = String.fromCharCode(65 + rIndex);
            return (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-navy-900 font-mono"
              >
                {i + 1} → {letter}
                <button
                  type="button"
                  onClick={() => removePair(item.id)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
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
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousTops = useRef<Record<string, number>>({});

  useLayoutEffect(() => {
    const currentOrder = answer
      ? answer.split(",").filter(Boolean)
      : question.items.map((item) => item.id);
    const nextTops: Record<string, number> = {};
    const animations: number[] = [];

    currentOrder.forEach((id) => {
      const element = itemRefs.current[id];
      if (!element) return;

      const top = element.getBoundingClientRect().top;
      nextTops[id] = top;
      const previousTop = previousTops.current[id];
      if (previousTop === undefined || previousTop === top) return;

      element.style.willChange = "transform";
      element.style.transition = "none";
      element.style.transform = `translateY(${previousTop - top}px)`;
      animations.push(
        requestAnimationFrame(() => {
          element.style.transition = "transform 260ms ease";
          element.style.transform = "translateY(0)";
          element.addEventListener(
            "transitionend",
            () => {
              element.style.transition = "";
              element.style.transform = "";
              element.style.willChange = "";
            },
            { once: true }
          );
        })
      );
    });

    previousTops.current = nextTops;
    return () => animations.forEach((animation) => cancelAnimationFrame(animation));
  }, [answer, question.items]);

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
            ref={(element) => {
              itemRefs.current[id] = element;
            }}
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