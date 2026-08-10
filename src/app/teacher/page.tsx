"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  Radio, 
  Users, 
  FileCheck, 
  Lock,
  Plus, 
  Play, 
  Key,
  Clock
} from "lucide-react";

export default function TeacherDashboardPage() {
  const router = useRouter();

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
            Overview
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your classes, live examinations, and analytical insights.
          </p>
        </div>

        <button 
          onClick={() => router.push("/teacher/exams/new")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* METRICS SNAPSHOT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Live Exam Sessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Live Exam Sessions
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">3</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Now
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
          </div>
        </div>

        {/* Total Active Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Active Students
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">67</span>
              <span className="text-[11px] font-medium text-slate-400">across streams</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Evaluations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
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

        {/* Locked / Violations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
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

      {/* LIVE ACTIVE STREAM MONITORING */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Live Active Stream Monitoring
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Currently open exam portals running concurrent student connections.
          </p>
        </div>

        <div className="space-y-3">
          {/* Active Stream Card 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                  qqwe
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> 80 mins • 30 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">QWE</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium text-slate-400">ACCESS JOIN CODE:</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-200">
                  qweqwe
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">0 Active</p>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Streams connected
                </p>
              </div>
              <button 
                onClick={() => router.push("/teacher/monitor")}
                className="px-3.5 py-1.5 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Monitor
              </button>
            </div>
          </div>

          {/* Active Stream Card 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                  CS101
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> 60 mins • 30 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Introduction to Computer Science (Midterm)</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-medium text-slate-400">ACCESS JOIN CODE:</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-200">
                  CS101-MID
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">12 Active</p>
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Streams connected
                </p>
              </div>
              <button 
                onClick={() => router.push("/teacher/monitor")}
                className="px-3.5 py-1.5 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Monitor
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}