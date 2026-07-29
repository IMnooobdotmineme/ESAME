"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Radio, 
  Users, 
  FileCheck, 
  FolderKanban, 
  Plus, 
  Play, 
  ArrowRight,
  Key,
  Clock,
  ExternalLink
} from "lucide-react";

export default function TeacherDashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 p-6 md:p-8 bg-slate-50/60 min-h-screen">
      
      {/* 1. HEADER SECTION (Clean, single unified header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage your classes, live examinations, and analytical insights.
          </p>
        </div>

        <button 
          onClick={() => router.push("/teacher/exams/new")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* 2. METRICS SNAPSHOT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Live Exam Sessions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Live Exam Sessions
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">3</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Now
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F3FA] text-[#395886] border border-[#B1C9EF]/40">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Total Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Total Active Students
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">67</span>
              <span className="text-xs font-medium text-slate-400">across streams</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F3FA] text-[#395886] border border-[#B1C9EF]/40">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Evaluations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Pending Evaluations
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">12</span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Requires Grading
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Question Bank Sheets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Question Bank Sheets
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">148</span>
              <span className="text-xs font-medium text-slate-400">indexed entries</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#F0F3FA] text-[#395886] border border-[#B1C9EF]/40">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. QUICK NAVIGATION LINKS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/teacher/exams"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#395886]/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#395886] transition-colors">
              Manage Full Repository
            </h3>
            <p className="text-[11px] text-slate-500">View all past and upcoming tests</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#395886] transition-all" />
        </Link>

        <Link 
          href="/teacher/exams"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#395886]/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#395886] transition-colors">
              Open Question Bank
            </h3>
            <p className="text-[11px] text-slate-500">Configure reused section forms</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#395886] transition-all" />
        </Link>

        <Link 
          href="/teacher/grading"
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#395886]/50 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#395886] transition-colors">
              Review Student Submissions
            </h3>
            <p className="text-[11px] text-slate-500">12 items pending automated check</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#395886] transition-all" />
        </Link>
      </div>

      {/* 4. LIVE ACTIVE STREAM MONITORING */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-5">
        <div>
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Live Active Stream Monitoring
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Currently open exam portals running concurrent student connections.
          </p>
        </div>

        <div className="space-y-3">
          {/* Active Stream Card 1 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#D5DEEF] text-[#395886] text-[10px] font-bold rounded tracking-wide">
                  qqwe
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" /> 80 mins • 30 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">QWE</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">ACCESS JOIN CODE:</span>
                <span className="px-2 py-0.5 bg-[#F0F3FA] text-[#395886] font-mono font-bold rounded border border-[#B1C9EF]/60">
                  qweqwe
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-200/80">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">0 Active</p>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Streams connected
                </p>
              </div>
              <button 
                onClick={() => router.push("/teacher/monitor")}
                className="px-3.5 py-2 bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Monitor
              </button>
            </div>
          </div>

          {/* Active Stream Card 2 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#D5DEEF] text-[#395886] text-[10px] font-bold rounded tracking-wide">
                  CS101
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" /> 60 mins • 30 Questions
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Introduction to Computer Science (Midterm)</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">ACCESS JOIN CODE:</span>
                <span className="px-2 py-0.5 bg-[#F0F3FA] text-[#395886] font-mono font-bold rounded border border-[#B1C9EF]/60">
                  CS101-MID
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-200/80">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">12 Active</p>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Streams connected
                </p>
              </div>
              <button 
                onClick={() => router.push("/teacher/monitor")}
                className="px-3.5 py-2 bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all active:scale-[0.98]"
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