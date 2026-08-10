"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  ShieldAlert,
  ArrowRight,
  Activity,
  Lock,
  UserCheck,
  Radio,
} from "lucide-react";

interface SystemLogEntry {
  id: string;
  type: "login" | "security" | "system" | "error";
  user: string;
  event: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
}

export default function AdminDashboardPage() {
  // Live System Logs Preview
  const [recentLogs] = useState<SystemLogEntry[]>([
    {
      id: "log-01",
      type: "security",
      user: "System Security Engine",
      event: "Global anti-cheating rule policy updated across all nodes",
      timestamp: "12 mins ago",
      severity: "info",
    },
    {
      id: "log-02",
      type: "login",
      user: "r.chen@university.edu",
      event: "Successful administrator authentication from 192.168.1.45",
      timestamp: "28 mins ago",
      severity: "info",
    },
    {
      id: "log-03",
      type: "error",
      user: "System Gateway",
      event: "High frequency API request threshold warning detected",
      timestamp: "1 hour ago",
      severity: "warning",
    },
  ]);

  return (
    <div className="w-full space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl min-h-screen text-slate-800">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5DEEF]/60">
        <div>
          <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
            GOVERNANCE OVERVIEW
          </span>
          <h1 className="text-2xl font-black text-[#395886] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Platform-wide metrics, security controls, and real-time audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-xl">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            System Status: 99.9% Operational
          </span>
        </div>
      </div>

      {/* SYSTEM ANALYTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Organizations Metric */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Total Organizations
            </p>
            <p className="text-2xl font-black text-[#395886]">12</p>
            <p className="text-[10px] font-bold text-emerald-600 font-mono">
              All Systems Operational
            </p>
          </div>
          <div className="p-3 bg-[#F0F3FA] text-[#395886] rounded-2xl border border-[#D5DEEF]/60">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* User Accounts Metric */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Active Instructors
            </p>
            <p className="text-2xl font-black text-[#395886]">148</p>
            <p className="text-[10px] font-bold text-emerald-600 font-mono">
              Across 8 Departments
            </p>
          </div>
          <div className="p-3 bg-[#F0F3FA] text-[#395886] rounded-2xl border border-[#D5DEEF]/60">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Exam Sessions Metric */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Total Examinations
            </p>
            <p className="text-2xl font-black text-[#395886]">1,420</p>
            <p className="text-[10px] font-bold text-[#638ECB] font-mono">
              Platform-wide Total
            </p>
          </div>
          <div className="p-3 bg-[#F0F3FA] text-[#395886] rounded-2xl border border-[#D5DEEF]/60">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Security Violations Metric */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Security Flags
            </p>
            <p className="text-2xl font-black text-rose-600">34</p>
            <p className="text-[10px] font-bold text-slate-400 font-mono">
              Auto-prevented Locks
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 COLS): REAL-TIME AUDIT STREAM */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-[#D5DEEF] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D5DEEF]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#395886]" />
                <h2 className="text-sm font-black text-[#395886] uppercase tracking-wider">
                  Real-Time Audit Stream
                </h2>
              </div>
              <Link
                href="/admin/logs"
                className="text-xs font-bold text-[#395886] hover:text-[#638ECB] flex items-center gap-1 transition-colors"
              >
                <span>View All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/40 flex items-start justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#395886]">
                        {log.user}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-[#D5DEEF] text-[#395886]">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">{log.event}</p>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 COL): QUICK NAVIGATION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#D5DEEF]/60">
            <Lock className="w-4 h-4 text-[#395886]" />
            <h2 className="text-sm font-black text-[#395886] uppercase tracking-wider">
              Governance Control Hub
            </h2>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs space-y-3">
            <Link
              href="/admin/users"
              className="w-full p-3 bg-[#F0F3FA]/60 hover:bg-[#F0F3FA] border border-[#D5DEEF] rounded-xl flex items-center justify-between group transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-[#395886] border border-[#D5DEEF]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#395886]">
                    Manage Organization
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    User roster & status controls
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/security"
              className="w-full p-3 bg-[#F0F3FA]/60 hover:bg-[#F0F3FA] border border-[#D5DEEF] rounded-xl flex items-center justify-between group transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-[#395886] border border-[#D5DEEF]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#395886]">
                    Security Settings
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Fullscreen, warning limits & copy rules
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/logs"
              className="w-full p-3 bg-[#F0F3FA]/60 hover:bg-[#F0F3FA] border border-[#D5DEEF] rounded-xl flex items-center justify-between group transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-[#395886] border border-[#D5DEEF]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#395886]">
                    System Logs
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Platform audit trails & error logs
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}