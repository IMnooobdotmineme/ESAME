"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Filter, Search } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExamStore } from "@/store/useExamStore";
import { examStats, formatExamDate } from "@/lib/grading-utils";

const selectClass =
  "rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 cursor-pointer";

export default function GradingPage() {
  const router = useRouter();
  const exams = useExamStore((s) => s.exams);
  const gradableExams = exams.filter((e) => e.isEnded);

  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [examSearch, setExamSearch] = useState("");

  const departments = useMemo(
    () => Array.from(new Set(gradableExams.map((e) => e.courseCode).filter(Boolean))),
    [gradableExams]
  );

  const subjectsInDepartment = useMemo(
    () => {
      const dept = gradableExams.find((e) => e.courseCode === departmentFilter)?.courseCode;
      if (!dept || departmentFilter === "all") return [];
      return [];
    },
    [gradableExams, departmentFilter]
  );

  const handleDepartmentFilterChange = (value: string) => {
    setDepartmentFilter(value);
    setSubjectFilter("all");
  };

  const visibleExams = gradableExams.filter((e) => {
    if (departmentFilter !== "all" && e.courseCode !== departmentFilter) return false;
    const q = examSearch.trim().toLowerCase();
    if (q && !e.title.toLowerCase().includes(q)) return false;
    return true;
  });

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
            placeholder="Search exams by name..."
            value={examSearch}
            onChange={(e) => setExamSearch(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* DEPARTMENT / SUBJECT FILTERS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>

          <select
            value={departmentFilter}
            onChange={(e) => handleDepartmentFilterChange(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            disabled={subjectsInDepartment.length === 0}
            className={`${selectClass} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
          >
            <option value="all">All Subjects</option>
            {subjectsInDepartment.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          {(departmentFilter !== "all" || subjectFilter !== "all") && (
            <button
              onClick={() => handleDepartmentFilterChange("all")}
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
                <th className="px-5 py-3 font-medium">Department / Subject</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Sections</th>
                <th className="px-5 py-3 font-medium">Examinees</th>
                <th className="px-5 py-3 font-medium">Total Submitted</th>
                <th className="px-5 py-3 font-medium">Force Submitted</th>
                <th className="px-5 py-3 font-medium">Review Status</th>
                <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {visibleExams.map((exam) => {
                const stats = examStats(exam);
                return (
                  <tr
                    key={exam.id}
                    onClick={() => router.push(`/teacher/grading/${exam.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-navy-900">{exam.title}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                          {exam.courseCode || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{formatExamDate(exam.createdAt)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{exam.parts?.length ?? 0}</td>
                    <td className="px-5 py-3.5 text-slate-600">{stats.examinees}</td>
                    <td className="px-5 py-3.5 text-slate-600">{stats.submitted}</td>
                    <td className="px-5 py-3.5 text-slate-600">{stats.forced}</td>
                    <td className="px-5 py-3.5">
                      {stats.pending > 0 ? (
                        <Badge variant="warning" className="whitespace-nowrap">{stats.pending} Needs Review</Badge>
                      ) : (
                        <Badge variant="success">All Graded</Badge>
                      )}
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
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-sm">
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