"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ExamStatus } from "@/lib/exam-data";
import {
  ArrowLeft,
  Search,
  Users,
  FileText,
  Clock,
  GraduationCap,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const STATUS_VARIANT: Record<ExamStatus, "info" | "success" | "warning" | "danger"> = {
  "In Progress": "info",
  Completed: "success",
  Scheduled: "warning",
  Locked: "danger",
};

const TABS = ["Overview", "Question Paper", "Student Results"] as const;
type Tab = (typeof TABS)[number];

type ExamQuestionItem = {
  id: string;
  text: string;
  type: string;
  points: number;
};

type ExamResultItem = {
  studentName: string;
  studentId: string;
  autoPoints: number;
  manualPoints: number;
  maxPoints: number;
  status: string;
};

type ExamDetailData = {
  id: string;
  examCode: string;
  title: string;
  department: string;
  subject: string;
  teacher: string;
  academicYear: string;
  semester: string;
  date: string;
  time: string;
  duration: string;
  status: ExamStatus;
  totalQuestions: number;
  totalStudents: number;
  results: ExamResultItem[];
  questions: ExamQuestionItem[];
};

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<ExamDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExam() {
      try {
        const response = await fetch(`/api/org/exams?id=${encodeURIComponent(params.id)}`, { cache: "no-store" });
        const payload = await response.json();
        setExam(response.ok && payload.exam ? payload.exam : null);
      } catch {
        setExam(null);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadExam();
    }
  }, [params.id]);

  const [tab, setTab] = useState<Tab>("Overview");
  const [search, setSearch] = useState("");

  const filteredResults = useMemo(() => {
    if (!exam) return [] as ExamResultItem[];
    const q = search.toLowerCase();
    return exam.results.filter(
      (r: ExamResultItem) => !q || r.studentName.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q)
    );
  }, [exam, search]);

  if (loading) {
    return (
      <>
        <OrgTopbar title="Loading Exam" />
        <main className="p-6">
          <Card className="p-10 text-center text-slate-400">Loading exam details...</Card>
        </main>
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <OrgTopbar title="Exam Not Found" />
        <main className="p-6">
          <Card className="p-10 text-center text-slate-400">
            This exam doesn&apos;t exist or may have been removed.
            <div className="mt-4">
              <button
                onClick={() => router.push("/exams")}
                className="text-sm font-medium text-sky-600 hover:underline"
              >
                Back to Exams
              </button>
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <OrgTopbar title={exam.title} description={`ID: ${exam.examCode}`} />

      <main className="p-6 space-y-5">
        {/* Back link + status */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/exams")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900"
          >
            <ArrowLeft size={15} />
            Back to Exams
          </button>
          <Badge variant={STATUS_VARIANT[exam.status]}>{exam.status.toUpperCase()}</Badge>
        </div>

        {/* Info summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoCard icon={GraduationCap} label="Teacher" value={exam.teacher} />
          <InfoCard icon={FileText} label="Subject" value={exam.subject} />
          <InfoCard icon={Clock} label="Duration" value={exam.duration} />
          <InfoCard icon={Users} label="Students" value={String(exam.totalStudents)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                                    ? "rounded-full px-5 py-2 text-sm font-semibold bg-navy-900 text-white shadow-sm"
                  : "rounded-full px-5 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "Overview" && (
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Exam Information</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Detail label="Exam Title" value={exam.title} />
              <Detail label="Exam ID" value={exam.examCode} />
              <Detail label="Department" value={exam.department} />
              <Detail label="Subject" value={exam.subject} />
              <Detail label="Teacher" value={exam.teacher} />
              <Detail label="Academic Year" value={exam.academicYear} />
              <Detail label="Semester" value={exam.semester} />
              <Detail label="Date" value={`${exam.date} · ${exam.time}`} />
              <Detail label="Duration" value={exam.duration} />
              <Detail label="Total Questions" value={String(exam.totalQuestions)} />
              <Detail label="Total Students" value={String(exam.totalStudents)} />
              <Detail label="Submissions" value={String(exam.results.length)} />
            </dl>
          </Card>
        )}
        {/* QUESTION PAPER — exact grading-page design, teacher answer hints only */}
        {tab === "Question Paper" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-semibold text-navy-900">Question Paper</h3>
              <span className="text-xs text-slate-400">Read-only — organization cannot edit exam content</span>
            </div>

            {(exam as any).sections?.length ? (
              (exam as any).sections.map((s: any) => (
                <div key={s.id} className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-lg bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white">{s.title}</span>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">{s.type}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{s.marks} marks</span>
                  </div>

                  {s.questions.map((q: any, i: number) => {
                    const p = q.payload || {};

                    // ── Normalize True/False answer ──
                    let tfAnswer = "";
                    const tfRaw = p.tfCorrect ?? p.correctValue;
                    if (tfRaw === true || String(tfRaw).toLowerCase() === "true") tfAnswer = "True";
                    else if (tfRaw === false || String(tfRaw).toLowerCase() === "false") tfAnswer = "False";

                    // ── Fill-in-blank (blanks / segments / media) ──
                    const blankList: { number: string; answer: string }[] = Array.isArray(p.blanks)
                      ? p.blanks.map((b: any, bi: number) => ({ number: String(bi + 1), answer: b?.correctAnswer ?? b?.answer ?? "" }))
                      : Array.isArray(p.answerKey)
                        ? p.answerKey.map((r: any) => ({ number: String(r.number), answer: r.answer }))
                        : [];
                    const segmentsArr: string[] = Array.isArray(p.segments) ? p.segments : [];
                    const mediaUrl: string | null = p.media?.url || null;
                    const choices: string[] = Array.isArray(p.blankChoices) ? p.blankChoices.filter((c: string) => String(c).trim()) : [];

                    // ── Matching (left / right / correctPairs) ──
                    const leftItems: { id: string; text: string }[] = (Array.isArray(p.left) ? p.left : Array.isArray(p.matchLeft) ? p.matchLeft : []).map((x: any, li: number) =>
                      typeof x === "string" ? { id: `l${li + 1}`, text: x } : { id: x?.id || `l${li + 1}`, text: x?.text || "" }
                    );
                    const rightItems: { id: string; text: string }[] = (Array.isArray(p.right) ? p.right : Array.isArray(p.matchRight) ? p.matchRight : []).map((x: any, ri: number) =>
                      typeof x === "string" ? { id: `r${ri + 1}`, text: x } : { id: x?.id || `r${ri + 1}`, text: x?.text || "" }
                    );
                    const pairList: { li: number; ri: number }[] = (() => {
                      if (p.correctPairs && typeof p.correctPairs === "object") {
                        return Object.entries(p.correctPairs as Record<string, string>)
                          .map(([lid, rid]) => ({
                            li: leftItems.findIndex((l) => l.id === lid),
                            ri: rightItems.findIndex((r) => r.id === rid),
                          }))
                          .filter((x: { li: number; ri: number }) => x.li >= 0 && x.ri >= 0);
                      }
                      if (Array.isArray(p.matchAnswers)) {
                        return p.matchAnswers
                          .map((pr: any) => ({
                            li: leftItems.findIndex((l) => l.text === pr.left),
                            ri: rightItems.findIndex((r) => r.text === pr.right),
                          }))
                          .filter((x: { li: number; ri: number }) => x.li >= 0 && x.ri >= 0);
                      }
                      return [];
                    })();

                    // ── Ordering (items / correctOrder) ──
                    const orderItemsRaw: { id: string; text: string }[] = (Array.isArray(p.items) ? p.items : Array.isArray(p.orderingItems) ? p.orderingItems : []).map((x: any, oi2: number) =>
                      typeof x === "string" ? { id: `i${oi2 + 1}`, text: x } : { id: x?.id || `i${oi2 + 1}`, text: x?.text || "" }
                    );
                    let orderedTexts: string[] = [];
                    if (Array.isArray(p.correctOrder) && p.correctOrder.length) {
                      orderedTexts = p.correctOrder.map((id: string) => orderItemsRaw.find((it) => it.id === id)?.text).filter(Boolean);
                    } else {
                      orderedTexts = orderItemsRaw.map((it) => it.text);
                    }

                    // ── Correct answer text ──
                    let correctText = "";
                    if (q.rawType === "mcq" || q.rawType === "multiple_select") {
                      correctText = (q.options || [])
                        .map((o: any, idx: number) => ({ ...o, idx }))
                        .filter((o: any) => o.isCorrect)
                        .map((o: any) => `${String.fromCharCode(65 + o.idx)}. ${o.text}`)
                        .join(", ");
                    } else if (q.rawType === "true_false") {
                      correctText = tfAnswer;
                    } else if (q.rawType === "fill_in_blank") {
                      correctText = blankList.map((b) => `[${b.number}] ${b.answer}`).join("   ");
                    } else if (q.rawType === "matching") {
                      correctText = pairList.map((pr) => `${pr.li + 1} → ${String.fromCharCode(65 + pr.ri)}`).join(", ");
                    } else if (q.rawType === "ordering") {
                      correctText = orderedTexts.join(" → ");
                    } else {
                      correctText = q.explanation || "";
                    }

                    // ── Options (with correct flag for True/False built in) ──
                    let opts: any[] = q.options || [];
                    if (q.rawType === "true_false") {
                      opts = opts.length
                        ? opts.map((o: any) => ({ ...o, isCorrect: o.isCorrect || o.text === tfAnswer }))
                        : [
                            { text: "True", isCorrect: tfAnswer === "True" },
                            { text: "False", isCorrect: tfAnswer === "False" },
                          ];
                    }

                    return (
                      <Card key={q.id} className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-navy-900 leading-relaxed flex-1">
                            {i + 1}. {q.text}
                          </p>
                          <span className="shrink-0 rounded-full bg-sky-50 border border-sky-200 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                            {q.points} pts
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{q.type}</p>

                        {q.rawType === "true_false" ? (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            {["True", "False"].map((v) => {
                              const isCorrect = correctText === v;
                              return (
                                <div
                                  key={v}
                                  className={`rounded-xl border-2 px-4 py-2.5 text-center text-sm font-semibold ${
                                    isCorrect
                                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 bg-white text-slate-500"
                                  }`}
                                >
                                  {v}
                                </div>
                              );
                            })}
                          </div>
                        ) : q.rawType === "fill_in_blank" ? (
                          <div className="mt-3 space-y-3">
                            {blankList.length > 0 && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 mb-2">Correct Answers</p>
                                <div className="flex flex-wrap gap-2">
                                  {blankList.map((b, idx) => (
                                    <span key={idx} className="rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                      [{b.number}] {b.answer}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {mediaUrl && (
                              <img src={mediaUrl} alt="Question media" className="max-h-64 rounded border border-slate-200 object-contain" />
                            )}
                            {choices.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {choices.map((c, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">{idx + 1}</span>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                            {segmentsArr.length > 0 ? (
                              <p className="text-sm leading-[2.4] text-navy-900">
                                {segmentsArr.map((seg, idx) => (
                                  <span key={idx}>
                                    {seg}
                                    {idx < blankList.length && (
                                      <span className="inline-block min-w-[90px] rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 mx-1.5 text-center text-sm font-medium text-emerald-700">
                                        {blankList[idx].answer || "—"}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-500">Fill in the blank(s) with the correct answer(s).</p>
                            )}
                          </div>
                        ) : q.rawType === "matching" ? (
                          leftItems.length > 0 ? (
                            <div className="mt-3">
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  {leftItems.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2.5">
                                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{idx + 1}</span>
                                      <span className="flex-1 text-sm text-navy-900">{item.text}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  {rightItems.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2.5">
                                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{String.fromCharCode(65 + idx)}</span>
                                      <span className="flex-1 text-sm text-navy-900">{item.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {pairList.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {pairList.map((pr, idx) => (
                                    <span key={idx} className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                      {pr.li + 1} → {String.fromCharCode(65 + pr.ri)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs italic text-slate-400">No pair data available.</p>
                          )
                        ) : q.rawType === "ordering" ? (
                          orderedTexts.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {orderedTexts.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">{idx + 1}</span>
                                  <span className="flex-1 text-sm text-navy-900">{item}</span>
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <ArrowUp size={14} />
                                    <ArrowDown size={14} />
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-xs italic text-slate-400">No sequence data available.</p>
                          )
                        ) : q.rawType === "coding" ? (
                          <div className="mt-3 overflow-hidden rounded-xl border-2 border-slate-800">
                            <div className="bg-[#252526] px-4 py-2">
                              <span className="text-xs font-semibold text-slate-400">{String(p.language || "JavaScript")}</span>
                            </div>
                            <pre className="min-h-[140px] whitespace-pre-wrap bg-[#1E1E1E] px-4 py-3 font-mono text-[13px] leading-relaxed text-slate-300">
                              {String(p.starterCode || "// write your code here")}
                            </pre>
                          </div>
                        ) : opts.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {opts.map((opt: any, oi: number) => (
                              <div
                                key={oi}
                                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 ${
                                  opt.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
                                }`}
                              >
                                {q.rawType === "multiple_select" ? (
                                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${opt.isCorrect ? "border-sky-500 bg-sky-500" : "border-slate-300 bg-white"}`}>
                                    {opt.isCorrect && <Check className="h-3 w-3 text-white" />}
                                  </span>
                                ) : null}
                                <span className={`text-sm font-bold ${opt.isCorrect ? "text-emerald-700" : "text-slate-600"}`}>
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                <p className={`flex-1 text-sm ${opt.isCorrect ? "font-medium text-emerald-800" : "text-slate-600"}`}>{opt.text}</p>
                                {opt.isCorrect && q.rawType !== "multiple_select" && <Check className="h-4 w-4 text-emerald-600" />}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <p className="text-sm italic text-slate-400">Written response — graded by the teacher.</p>
                          </div>
                        )}

                        {correctText && (
                          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800 mb-0.5">Correct Answer</p>
                            <p className="text-sm font-semibold text-emerald-800">{correctText}</p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ))
            ) : (
              <Card className="p-10 text-center text-slate-400 text-sm">No questions available.</Card>
            )}
          </div>
        )}

        {/* STUDENT RESULTS */}
        {tab === "Student Results" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-navy-900">Student Results</h3>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-9 w-full sm:w-72">
                <Search size={15} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name or ID..."
                  className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
                />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium text-right">Total Score</th>
                  <th className="px-5 py-3 font-medium text-right">Percentage</th>
                  <th className="px-5 py-3 font-medium text-right">Result</th>
                  <th className="px-5 py-3 font-medium text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r: ExamResultItem) => {
                  const total = r.autoPoints + r.manualPoints;
                  const pct = Math.round((total / r.maxPoints) * 100);
                  const passed = pct >= 50;
                  return (
                    <tr key={r.studentId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-navy-900">{r.studentName}</p>
                        <p className="text-xs text-slate-400">{r.studentId}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-navy-900">
                        {total}/{r.maxPoints}
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{pct}%</td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge variant={passed ? "success" : "danger"}>{passed ? "Pass" : "Fail"}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge variant={r.status === "Reviewed" ? "success" : "warning"}>{r.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                      {exam.results.length === 0
                        ? "No submissions yet for this exam."
                        : "No students match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-1.5">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-semibold text-navy-900 truncate">{value}</p>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-navy-900 font-medium mt-0.5">{value}</dd>
    </div>
  );
}
