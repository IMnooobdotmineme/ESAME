"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Card } from "@/components/ui/card";
import { ExamVolumeChart } from "@/components/organization/ExamVolumeChart";
import { ChevronDown, ArrowRight, Check } from "lucide-react";

const DATE_RANGE_OPTIONS = [
  "Last 7 Days",
  "Last 30 Days",
  "Last 90 Days",
  "This Semester",
  "This Year",
  "All Time",
];

type AnalyticsResponse = {
  volume: Array<{ day: string; volume: number; type: string }>;
  topDepartments: Array<{ code: string; name: string; percent: number }>;
  liveActivity: Array<{ studentId: string; module: string; progress: number }>;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("All Time");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [data, setData] = useState<AnalyticsResponse>({
    volume: [],
    topDepartments: [],
    liveActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/org/analytics?range=${encodeURIComponent(dateRange)}`, { cache: "no-store" });
        const payload = await response.json();
        if (response.ok) {
          setData({
            volume: Array.isArray(payload.volume) ? payload.volume : [],
            topDepartments: Array.isArray(payload.topDepartments) ? payload.topDepartments : [],
            liveActivity: Array.isArray(payload.liveActivity) ? payload.liveActivity : [],
          });
        }
      } catch {
        setData({ volume: [], topDepartments: [], liveActivity: [] });
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [dateRange]);

  return (
    <>
      <OrgTopbar
        title="Analytics"
        description="Comprehensive performance overview across all active examination cycles"
      />

      <main className="p-6 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">System Analytics</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setRangeOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 h-9 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {dateRange}
                <ChevronDown size={14} className={rangeOpen ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              {rangeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-20">
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setDateRange(option);
                          setRangeOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-sm text-left text-slate-600 hover:bg-slate-50"
                      >
                        {option}
                        {dateRange === option && <Check size={14} className="text-sky-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Volume chart + Top departments */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-navy-900">Exam Volume Activity</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0d7a8c]" /> Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Projected
                </span>
              </div>
            </div>
            <ExamVolumeChart data={data.volume} />
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Top Departments</h3>
            <div className="space-y-4">
              {data.topDepartments.map((d) => (
                <div key={d.name || d.code}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-navy-900">{d.name || d.code}</span>
                    <span className="text-slate-500">{d.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))}
              {data.topDepartments.length === 0 && (
                <p className="text-sm text-slate-400">{loading ? "Loading departments..." : "No department activity yet."}</p>
              )}
            </div>
            <Link
              href="/academic-structure"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
            >
              View All Departments <ArrowRight size={12} />
            </Link>
          </Card>
        </div>

        {/* Live activity — full width, no leftover multi-column grid */}
        <div>
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy-900">Live Exam Activity</h3>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Updated 2s ago
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-2.5 font-medium">Student ID</th>
                  <th className="px-5 py-2.5 font-medium">Exam / Module</th>
                  <th className="px-5 py-2.5 font-medium text-right">Progress</th>
                </tr>
              </thead>
              <tbody>
                {data.liveActivity.map((row) => (
                  <tr key={row.studentId} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 text-slate-500">{row.studentId}</td>
                    <td className="px-5 py-3 font-medium text-navy-900">{row.module}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.progress === 100 ? "bg-emerald-500" : "bg-sky-400"}`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-9 text-right">{row.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.liveActivity.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-400 text-sm">
                      {loading ? "Loading live activity..." : "No live exam activity right now."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </>
  );
}
