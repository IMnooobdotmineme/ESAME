"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  FileText,
  ShieldAlert,
  Activity,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  Search,
  Bell,
  ShieldCheck,
  Server,
  Key,
  Clock
} from "lucide-react";

export default function AdminDashboardPage() {
  const [timeframe, setTimeframe] = useState("7d");

  // Mock stats aligned with your screenshot
  const stats = [
    {
      title: "TOTAL ORGANIZATIONS",
      value: "142",
      change: "+12%",
      isPositive: true,
      icon: Building2,
    },
    {
      title: "TOTAL TEACHERS",
      value: "1,204",
      change: "+5%",
      isPositive: true,
      icon: Users,
    },
    {
      title: "TOTAL EXAMS",
      value: "8,439",
      change: "+24%",
      isPositive: true,
      icon: FileText,
    },
    {
      title: "SECURITY ALERTS",
      value: "312",
      change: "-2%",
      isPositive: true, // fewer alerts is good
      icon: ShieldAlert,
    },
  ];

  // Recent security activity log items
  const securityLogs = [
    {
      id: "LOG-9921",
      event: "Multiple IP Switch Detected",
      user: "stu_marcus_v@univ.edu",
      time: "2 mins ago",
      severity: "high",
    },
    {
      id: "LOG-9920",
      event: "Proctor Stream Interrupted",
      user: "stu_david_m@univ.edu",
      time: "14 mins ago",
      severity: "medium",
    },
    {
      id: "LOG-9919",
      event: "New Admin Credentials Issued",
      user: "prof_vance@univ.edu",
      time: "1 hour ago",
      severity: "low",
    },
    {
      id: "LOG-9918",
      event: "Bulk Exam Export Triggered",
      user: "admin_super@esame.io",
      time: "3 hours ago",
      severity: "low",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* EXECUTIVE WELCOME BANNER */}
      <div className="bg-white border border-[#D5DEEF] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block">
            SYSTEM EXECUTIVE OVERVIEW
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#395886] tracking-tight">
            Welcome back, Super Admin
          </h1>
          <p className="text-xs font-medium text-slate-400">
            Here is what is happening across the ESAME platform today.
          </p>
        </div>

        {/* System Health Status Badge */}
        <div className="inline-flex items-center gap-2.5 bg-[#F0F3FA] border border-[#D5DEEF] px-4 py-2.5 rounded-2xl self-start md:self-center">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#638ECB] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#395886]"></span>
          </span>
          <span className="text-xs font-bold text-[#395886]">
            All Core System Services Operational
          </span>
        </div>
      </div>

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white border border-[#D5DEEF] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#8AAEE0] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {stat.title}
                </span>
                <div className="p-2.5 rounded-xl bg-[#F0F3FA] text-[#395886]">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-black text-[#395886] tracking-tight">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center text-[11px] font-bold text-[#395886] bg-[#F0F3FA] px-2 py-0.5 rounded-md">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.change}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    vs last month
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* METRICS & RECENT SECURITY FEED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SYSTEM USAGE METRICS */}
        <div className="lg:col-span-7 bg-white border border-[#D5DEEF] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-[#638ECB] tracking-wider block mb-0.5">
                REAL-TIME ANALYTICS
              </span>
              <h2 className="text-base font-black text-[#395886]">
                System Usage Metrics
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#638ECB] bg-[#F0F3FA] px-3 py-1.5 rounded-xl border border-[#D5DEEF]">
                <Activity className="w-3 h-3" /> Live Telemetry
              </span>
            </div>
          </div>

          {/* Visual Graph Mockup Container */}
          <div className="bg-[#F0F3FA]/60 border border-[#D5DEEF] rounded-2xl p-6 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-baseline justify-between text-xs font-bold text-slate-500 z-10">
              <span>Concurrent Active Sessions</span>
              <span className="text-[#395886] font-mono font-black text-sm">4,812 Peak</span>
            </div>

            {/* Visual Waveform Bar Mockup */}
            <div className="flex items-end justify-between gap-2 h-32 pt-6">
              {[35, 45, 30, 65, 85, 55, 75, 90, 60, 80, 95, 70, 85, 60].map((height, idx) => (
                <div
                  key={idx}
                  className="w-full bg-[#B1C9EF] hover:bg-[#395886] transition-all rounded-t-md"
                  style={{ height: `${height}%` }}
                  title={`Hour ${idx + 1}: ${height * 50} users`}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-3 border-t border-[#D5DEEF] z-10">
              <span>00:00 AM</span>
              <span>06:00 AM</span>
              <span>12:00 PM</span>
              <span>06:00 PM</span>
              <span>NOW</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#F0F3FA] border border-[#D5DEEF]">
              <p className="text-[9px] font-black text-slate-400 uppercase">Avg Response</p>
              <p className="text-sm font-black text-[#395886] mt-0.5">24ms</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F0F3FA] border border-[#D5DEEF]">
              <p className="text-[9px] font-black text-slate-400 uppercase">Active Nodes</p>
              <p className="text-sm font-black text-[#395886] mt-0.5">18 Clusters</p>
            </div>
            <div className="p-3 rounded-2xl bg-[#F0F3FA] border border-[#D5DEEF]">
              <p className="text-[9px] font-black text-slate-400 uppercase">Uptime Rate</p>
              <p className="text-sm font-black text-[#395886] mt-0.5">99.98%</p>
            </div>
          </div>
        </div>

        {/* RECENT SECURITY ACTIVITY */}
        <div className="lg:col-span-5 bg-white border border-[#D5DEEF] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between border-b border-[#D5DEEF] pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-[#638ECB] tracking-wider block mb-0.5">
                LIVE AUDIT TRAIL
              </span>
              <h2 className="text-base font-black text-[#395886]">
                Recent Security Activity
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#638ECB] bg-[#F0F3FA] px-2.5 py-1 rounded-lg border border-[#D5DEEF]">
              Live Feed
            </span>
          </div>

          <div className="space-y-3">
            {securityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-[#F0F3FA]/50 border border-[#D5DEEF] hover:bg-[#F0F3FA] transition-all flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black font-mono text-[#638ECB]">
                      {log.id}
                    </span>
                    {log.severity === "high" && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase rounded-md">
                        Flagged
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#395886]">{log.event}</p>
                  <p className="text-[10px] font-medium text-slate-400 font-mono">
                    {log.user}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3 text-[#638ECB]" /> {log.time}
                </span>
              </div>
            ))}
          </div>

          <button className="w-full py-3 bg-[#395886] hover:bg-[#2e476d] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
            <span>View Complete System Audit Logs</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}