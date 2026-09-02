"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/organization/StatCard"; 
import type { ExamRecord, ExamStatus } from "@/lib/exam-data";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Arrow,
  X,
  Check,
  ArrowUpDown,
  ClipboardList,
  Users,
} from "lucide-react";

const STATUS_VARIANT: Record<ExamStatus, "info" | "success" | "warning" | "danger"> = {
  "In Progress": "info",
  Completed: "success",
  Scheduled: "warning",
  Locked: "danger",
};

const FILTERS: ("All" | ExamStatus)[] = ["All", "In Progress", "Completed"];

type SortOrder = "default" | "newest" | "oldest" | "title-asc" | "title-desc";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

const PAGE_SIZE = 5;

type Trend = { value: string; direction: "up" | "down" };

type Totals = {
  active: number;
  scheduled: number;
  totalSubmissions: number;
  activeTrend: Trend | null;
  submissionsTrend: Trend | null;
};

const EMPTY_TOTALS: Totals = {
  active: 0,
  scheduled: 0,
  totalSubmissions: 0,
  activeTrend: null,
  submissionsTrend: null,
};

export default function ExamManagementPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [totals, setTotals] = useState<Totals>(EMPTY_TOTALS);
  const [filter, setFilter] = useState<"All" | ExamStatus>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [sortOrder, setSortOrder] = useState<SortOrder>("default");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadExams() {
      try {
        const response = await fetch("/api/org/exams", { cache: "no-store" });
        const payload = await response.json();
        if (response.ok && Array.isArray(payload.exams)) {
          setExams(payload.exams as ExamRecord[]);
          setTotals({
            active: Number(payload.totals?.active ?? 0),
            scheduled: Number(payload.totals?.scheduled ?? 0),
            totalSubmissions: Number(payload.totals?.totalSubmissions ?? 0),
            activeTrend: payload.totals?.activeTrend ?? null,
            submissionsTrend: payload.totals?.submissionsTrend ?? null,
          });
        } else {
          setExams([]);
          setTotals(EMPTY_TOTALS);
        }
      } catch {
        setExams([]);
        setTotals(EMPTY_TOTALS);
      }
    }

    loadExams();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = totals.active;
  const scheduledCount = totals.scheduled;
  const totalSubmissions = totals.totalSubmissions;

  const filtered = useMemo(() => {
    const result = exams.filter((e) => {
      const matchesStatus = filter === "All" || e.status === filter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q || e.title.toLowerCase().includes(q) || e.examCode.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });

    if (sortOrder === "newest" || sortOrder === "oldest") {
      result.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === "newest" ? db - da : da - db;
      });
    } else if (sortOrder === "title-asc" || sortOrder === "title-desc") {
      result.sort((a, b) =>
        sortOrder === "title-asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      );
    }

    return result;
  }, [exams, filter, search, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = sortOrder !== "default" ? 1 : 0;

  function changeFilter(f: "All" | ExamStatus) {
    setFilter(f);
    setPage(1);
  }

  function toggleSort(order: SortOrder) {
    setSortOrder((prev) => (prev === order ? "default" : order));
    setPage(1);
  }

  function clearSort() {
    setSortOrder("default");
    setPage(1);
  }

  return (
    <>
      <OrgTopbar title="Exams" description="View and monitor all organization exams" />

      <main className="p-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Exams"
            value={String(activeCount)}
            icon={ClipboardList}
            trend={totals.activeTrend ?? undefined}
          />
          <StatCard
            label="Scheduled (24h)"
            value={String(scheduledCount)}
            icon={Calendar}
            iconBg="bg-slate-50"
            iconColor="text-slate-400"
          />
          <StatCard
            label="Total Submissions"
            value={totalSubmissions.toLocaleString()}
            icon={Users}
            trend={totals.submissionsTrend ?? undefined}
          />
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

            {/* Sort dropdown */}
            <div className="relative hidden sm:block" ref={filtersRef}>
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className={
                  activeFilterCount > 0
                    ? "flex items-center gap-2 rounded-full border border-navy-900 bg-navy-900 px-4 h-10 text-sm font-medium text-white"
                    : "flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-600 hover:bg-slate-50"
                }
              >
                <ArrowUpDown size={15} />
                Sort{activeFilterCount > 0 ? " (1)" : ""}
              </button>

              {filtersOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="flex items-center justify-between px-3 pb-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sort By</p>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearSort}
                        className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                      >
                        <X size={12} />
                        Clear
                      </button>
                    )}
                  </div>
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortOrder === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => toggleSort(opt.value)}
                        className="flex w-full items-center justify-between px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
                      >
                        {opt.label}
                        {active && <Check size={14} className="text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
                      href={`/exams/${exam.id}`}
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