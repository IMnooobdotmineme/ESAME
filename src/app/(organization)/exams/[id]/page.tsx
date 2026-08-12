"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getExamById, ExamStatus } from "@/lib/exam-data";
import {
  ArrowLeft,
  Search,
  Users,
  FileText,
  Clock,
  Calendar,
  GraduationCap,
} from "lucide-react";

const STATUS_VARIANT: Record<ExamStatus, "info" | "success" | "warning" | "danger"> = {
  "In Progress": "info",
  Completed: "success",
  Scheduled: "warning",
  Locked: "danger",
};

const TABS = ["Overview", "Question Paper", "Student Results"] as const;
type Tab = (typeof TABS)[number];

export default function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const exam = getExamById(params.id);

  const [tab, setTab] = useState<Tab>("Overview");
  const [search, setSearch] = useState("");

  const filteredResults = useMemo(() => {
    if (!exam) return [];
    const q = search.toLowerCase();
    return exam.results.filter(
      (r) => !q || r.studentName.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q)
    );
  }, [exam, search]);

  if (!exam) {
    return (
      <>
        <OrgTopbar title="Exam Not Found" />
        <main className="p-6">
          <Card className="p-10 text-center text-slate-400">
            This exam doesn&apos;t exist or may have been removed.
            <div className="mt-4">
              <button
                onClick={() => router.push("/organization/exams")}
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
            onClick={() => router.push("/organization/exams")}
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
                  ? "rounded-full px-4 py-1.5 text-sm font-medium bg-navy-900 text-white"
                  : "rounded-full px-4 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
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

        {/* QUESTION PAPER (read-only) */}
        {tab === "Question Paper" && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy-900">Question Paper</h3>
              <span className="text-xs text-slate-400">Read-only — organization cannot edit exam content</span>
            </div>
            <ul className="divide-y divide-slate-50">
              {exam.questions.map((q, i) => (
                <li key={q.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-navy-900">
                      <span className="text-slate-400 mr-2">Q{i + 1}.</span>
                      {q.text}
                    </p>
                    <Badge variant="neutral" className="mt-2">{q.type}</Badge>
                  </div>
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{q.points} pts</span>
                </li>
              ))}
            </ul>
          </Card>
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
                  <th className="px-5 py-3 font-medium text-right">Auto Points</th>
                  <th className="px-5 py-3 font-medium text-right">Manual Points</th>
                  <th className="px-5 py-3 font-medium text-right">Total Score</th>
                  <th className="px-5 py-3 font-medium text-right">Percentage</th>
                  <th className="px-5 py-3 font-medium text-right">Result</th>
                  <th className="px-5 py-3 font-medium text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r) => {
                  const total = r.autoPoints + r.manualPoints;
                  const pct = Math.round((total / r.maxPoints) * 100);
                  const passed = pct >= 50;
                  return (
                    <tr key={r.studentId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-navy-900">{r.studentName}</p>
                        <p className="text-xs text-slate-400">{r.studentId}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{r.autoPoints}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{r.manualPoints}</td>
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
                    <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
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
