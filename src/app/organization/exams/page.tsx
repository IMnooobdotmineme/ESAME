"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EXAMS, ExamStatus } from "@/lib/exam-data";
import { Search, ListFilter, Calendar, ChevronLeft, ChevronRight, ChevronRight as Arrow } from "lucide-react";

const STATUS_VARIANT: Record<ExamStatus, "info" | "success" | "warning" | "danger"> = {
  "In Progress": "info",
  Completed: "success",
  Scheduled: "warning",
  Locked: "danger",
};

const FILTERS: ("All" | ExamStatus)[] = ["All", "Scheduled", "In Progress", "Completed", "Locked"];

const PAGE_SIZE = 5;

export default function ExamManagementPage() {
  const [filter, setFilter] = useState<"All" | ExamStatus>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const activeCount = EXAMS.filter((e) => e.status === "In Progress").length;
  const scheduledCount = EXAMS.filter((e) => e.status === "Scheduled").length;
  const totalSubmissions = EXAMS.reduce((sum, e) => sum + e.results.length, 0);

  const filtered = useMemo(() => {
    return EXAMS.filter((e) => {
      const matchesStatus = filter === "All" || e.status === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q || e.title.toLowerCase().includes(q) || e.examCode.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [filter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeFilter(f: "All" | ExamStatus) {
    setFilter(f);
    setPage(1);
  }

  return (
    <>
      <OrgTopbar title="Exams" description="View and monitor all organization exams" />

      <main className="p-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-sm text-slate-500">Active Exams</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold text-navy-900">{activeCount}</p>
              <Badge variant="success">+2 Today</Badge>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Scheduled (24h)</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold text-navy-900">{scheduledCount}</p>
              <Calendar size={16} className="text-slate-300" />
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-slate-500">Total Submissions</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-2xl font-semibold text-navy-900">{totalSubmissions.toLocaleString()}</p>
              <Badge variant="info">89% Avg</Badge>
            </div>
          </Card>
        </div>

        {/* Filter row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => changeFilter(f)}
                className={
                  filter === f
                    ? "rounded-full px-4 py-1.5 text-sm font-medium bg-navy-900 text-white"
                    : "rounded-full px-4 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by exam name or ID..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
              />
            </div>
            <button className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <ListFilter size={15} />
              Filters
            </button>
            <button className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Calendar size={15} />
              Date Range
            </button>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Exam Title</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Date/Time</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((exam) => (
                <tr key={exam.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-navy-900">{exam.title}</p>
                    <p className="text-xs text-slate-400">ID: {exam.examCode}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="info">{exam.department}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {exam.date}
                    <br />
                    <span className="text-xs text-slate-400">{exam.time}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{exam.duration}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={STATUS_VARIANT[exam.status]}>{exam.status.toUpperCase()}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/organization/exams/${exam.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                    >
                      View <Arrow size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No exams match your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} exams
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={
                    p === page
                      ? "h-7 w-7 flex items-center justify-center rounded-full bg-navy-900 text-white text-xs font-medium"
                      : "h-7 w-7 flex items-center justify-center rounded-full text-slate-500 text-xs font-medium hover:bg-slate-50"
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Card>
      </main>
    </>
  );
}
