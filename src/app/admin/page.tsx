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
    <div className="w-full space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
            Governance Overview
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Platform-wide metrics, security controls, and real-time audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            System Status: 99.9% Operational
          </span>
        </div>
      </div>

      {/* SYSTEM ANALYTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Organizations
            </p>
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-[11px] font-semibold text-emerald-600">
              All Systems Operational
            </p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Active Instructors */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Instructors
            </p>
            <p className="text-2xl font-bold text-slate-900">148</p>
            <p className="text-[11px] font-semibold text-emerald-600">
              Across 8 Departments
            </p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Examinations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Examinations
            </p>
            <p className="text-2xl font-bold text-slate-900">1,420</p>
            <p className="text-[11px] font-medium text-slate-400">
              Platform-wide Total
            </p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Security Flags */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Security Flags
            </p>
            <p className="text-2xl font-bold text-rose-600">34</p>
            <p className="text-[11px] font-medium text-slate-400">
              Auto-prevented Locks
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 COLS): REAL-TIME AUDIT STREAM */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-700" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Real-Time Audit Stream
                </h2>
              </div>
              <Link
                href="/admin/logs"
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
              >
                <span>View All Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {log.user}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-200 text-slate-700">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{log.event}</p>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1 COL): GOVERNANCE CONTROL HUB */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Governance Control Hub
              </h2>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/admin/users"
                className="w-full p-3 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between group transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-700 border border-slate-200 shadow-2xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Manage Organization
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      User roster & status controls
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/admin/security"
                className="w-full p-3 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between group transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-700 border border-slate-200 shadow-2xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Security Settings
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
                      Fullscreen, warning limits & copy rules
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/admin/logs"
                className="w-full p-3 bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between group transition-colors block"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg text-slate-700 border border-slate-200 shadow-2xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      System Logs
                    </p>
                    <p className="text-[10px] font-medium text-slate-500">
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
    </div>
  );
}