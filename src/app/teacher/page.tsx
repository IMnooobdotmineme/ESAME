"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import {
  Radio,
  Users,
  FileCheck,
  Lock,
  Plus,
  Play,
  Key,
  Clock,
} from "lucide-react";

export default function TeacherDashboardPage() {
  const router = useRouter();

  return (
    <>
      <TeacherTopbar
        title="Dashboard"
        description="Manage your classes, live examinations, and analytical insights"
      />

      <main className="p-6 space-y-6">
        {/* Header action */}
        <div className="flex justify-end">
          <button
            onClick={() => router.push("/teacher/exams/new")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create New Exam
          </button>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live Exam Sessions
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-navy-900">3</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Now
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Active Students
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-navy-900">67</span>
                <span className="text-[11px] font-medium text-slate-400">across streams</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Pending Evaluations
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-600">12</span>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
                  Requires Grading
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Locked / Violations
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">3</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                  Resume Pending
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Live active stream monitoring */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Active Stream Monitoring
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Currently open exam portals running concurrent student connections.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { code: "qqwe", title: "QWE", duration: "80 mins • 30 Questions", joinCode: "qweqwe", active: 0 },
              { code: "CS101", title: "Introduction to Computer Science (Midterm)", duration: "60 mins • 30 Questions", joinCode: "CS101-MID", active: 12 },
            ].map((exam) => (
              <div
                key={exam.joinCode}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                      {exam.code}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {exam.duration}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-navy-900">{exam.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-400">ACCESS JOIN CODE:</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-200">
                      {exam.joinCode}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-100">
                  <div className="text-right">
                    <p className="text-xs font-bold text-navy-900">{exam.active} Active</p>
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Streams connected
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/teacher/monitor")}
                    className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Launch Monitor
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}