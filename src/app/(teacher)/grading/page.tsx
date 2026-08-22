"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Filter, Search } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GradingStatusDropdown } from "@/components/teacher/GradingStatusDropdown";
import { GradingStatus, useExamStore } from "@/store/useExamStore";
import { examStats, formatExamDate } from "@/lib/grading-utils";

const selectClass =
  "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 cursor-pointer";

export default function GradingPage() {
  const router = useRouter();
  const exams = useExamStore((s) => s.exams);
  const fetchExams = useExamStore((s) => s.fetchExams);
  const setExamGradingStatus = useExamStore((s) => s.setExamGradingStatus);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const gradableExams = exams.filter((e) => e.isEnded);
  const [dateFilter, setDateFilter] = useState("all");
  const [examSearch, setExamSearch] = useState("");

  const visibleExams = gradableExams.filter((e) => {
    if (dateFilter !== "all") {
      const createdAt = new Date(e.createdAt);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const ageInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (dateFilter === "new" && createdAt < startOfToday) return false;
      if (dateFilter === "7-days" && (ageInDays < 0 || ageInDays > 7)) return false;
      if (dateFilter === "30-days" && (ageInDays < 0 || ageInDays > 30)) return false;
    }
    const q = examSearch.trim().toLowerCase();
    if (
      q &&
      ![e.title, e.department, e.subject].some((value) =>
        value.toLowerCase().includes(q)
      )
    ) {
      return false;
    }
    return true;
  });

  const handleExamStatusChange = async (examId: string, status: GradingStatus) => {
    await setExamGradingStatus(examId, status);
  };

  return (
    <>
      <TeacherTopbar
        title="Grading & Results"
        description="Select an exam session to review submissions and score manual questions."
      />
      <main className="p-6 space-y-5">
        {/* EXAM SEARCH */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exams, departments, or subjects..."
            value={examSearch}
            onChange={(e) => setExamSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* DATE FILTER */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          <div className="relative inline-flex">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`${selectClass} appearance-none pr-9`}
            >
              <option value="new">New</option>
              <option value="all">All</option>
              <option value="7-days">Last 7 days</option>
              <option value="30-days">Last 30 days</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400" />
          </div>
          {dateFilter !== "all" && (
            <button
              onClick={() => setDateFilter("all")}
              className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Exam</th>
                <th className="px-5 py-3 font-medium text-center">Department</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium text-center">Date</th>
                <th className="px-5 py-3 font-medium text-center">Examinees</th>
                <th className="px-5 py-3 font-medium text-center">Submitted</th>
                <th className="px-5 py-3 font-medium text-center">Review Status</th>
                <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {visibleExams.map((exam) => {
                const stats = examStats(exam);
                return (
                  <tr
                    key={exam.id}
                    onClick={() => router.push(`/grading/${exam.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-center">
                      <p className="font-medium text-navy-900">{exam.title}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="info" className="whitespace-nowrap">
                        {exam.department || "—"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{exam.subject || "—"}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600 whitespace-nowrap">
                      {formatExamDate(exam.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{stats.examinees}</td>
                    <td className="px-5 py-3.5 text-center text-slate-600">{stats.submitted}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center" onClick={(event) => event.stopPropagation()}>
                        <GradingStatusDropdown
                          status={
                            exam.gradingStatus ??
                            (stats.pending > 0 ? "in-progress" : "complete")
                          }
                          onChange={(status) => handleExamStatusChange(exam.id, status)}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600">
                        Open <ChevronRight size={13} />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {visibleExams.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">
                    {gradableExams.length === 0
                      ? "No completed exams yet. Exams appear here once they've ended."
                      : "No exams match your search or filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}