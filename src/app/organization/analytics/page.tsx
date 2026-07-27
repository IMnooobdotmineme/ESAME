"use client";

import { useState } from "react";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ExamVolumeChart } from "@/components/organization/ExamVolumeChart";
import {
  Download,
  ChevronDown,
  ArrowRight,
  MoreVertical,
  FileClock,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

// ---- Mock data ----

const TOP_DEPARTMENTS = [
  { code: "CS", name: "Computer Science", percent: 88 },
  { code: "IOT", name: "Internet of Things", percent: 82 },
  { code: "IT", name: "Information Technology", percent: 76 },
  { code: "SE", name: "Software Engineering", percent: 91 },
];

const LIVE_ACTIVITY = [
  { studentId: "#STU-2934", module: "Data Structures & Algos", progress: 85 },
  { studentId: "#STU-1102", module: "Advanced Physics II", progress: 42 },
  { studentId: "#STU-8941", module: "European History", progress: 100 },
  { studentId: "#STU-5520", module: "Sensor Technology", progress: 63 },
];

const REPORTS = [
  { id: "1", title: "Weekly Faculty Summary", subtitle: "Generates every Monday at 08:00", icon: FileClock },
  { id: "2", title: "Student Performance Ledger", subtitle: "Last generated 2 days ago", icon: ClipboardList },
];

export default function AnalyticsPage() {
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    setTimeout(() => setExporting(false), 1500);
  }

  return (
    <>
      <OrgTopbar title="Analytics" description="Invite, manage, and monitor teacher accounts" />

      <main className="p-6 space-y-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">System Analytics</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Comprehensive performance overview across all active examination cycles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 h-9 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Last 30 Days
              <ChevronDown size={14} />
            </button>
            <Button size="sm" onClick={handleExport} disabled={exporting}>
              <Download size={15} />
              {exporting ? "Exporting..." : "Export Report"}
            </Button>
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
            <ExamVolumeChart />
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Top Departments</h3>
            <div className="space-y-4">
              {TOP_DEPARTMENTS.map((d) => (
                <div key={d.code}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-navy-900">{d.code}</span>
                    <span className="text-slate-500">{d.percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-sky-400" style={{ width: `${d.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline">
              View All Departments <ArrowRight size={12} />
            </button>
          </Card>
        </div>

        {/* Live activity + Automated reports */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                {LIVE_ACTIVITY.map((row) => (
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
              </tbody>
            </table>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Automated Reports</h3>
            <div className="space-y-2">
              {REPORTS.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <r.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                  </div>
                  <DropdownMenu
                    trigger={
                      <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <MoreVertical size={15} />
                      </button>
                    }
                  >
                    <DropdownItem onClick={() => {}}>
                      <Pencil size={14} /> Edit Schedule
                    </DropdownItem>
                    <DropdownItem danger onClick={() => {}}>
                      <Trash2 size={14} /> Remove
                    </DropdownItem>
                  </DropdownMenu>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-3">
              <Plus size={15} />
              Schedule New Report
            </Button>
          </Card>
        </div>
      </main>
    </>
  );
}
