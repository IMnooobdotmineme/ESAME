"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Activity,
  Lock,
  UserCheck,
  AlertTriangle,
  Radio,
} from "lucide-react";

// Types
interface PendingOrg {
  id: string;
  name: string;
  code: string;
  requestedBy: string;
  contactEmail: string;
  requestedAt: string;
}

interface SystemLogEntry {
  id: string;
  type: "login" | "security" | "system" | "error";
  user: string;
  event: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
}

export default function AdminDashboardPage() {
  // Pending Organization Requests (SRS 3.1.1 Organization Management)[cite: 1]
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrg[]>([
    {
      id: "org-req-01",
      name: "Institute of Technology & Science",
      code: "ITS-MAIN",
      requestedBy: "Dr. James Wilson",
      contactEmail: "admin@its.edu",
      requestedAt: "10 mins ago",
    },
    {
      id: "org-req-02",
      name: "National School of Engineering",
      code: "NSE-CAMPUS",
      requestedBy: "Prof. Maria Santos",
      contactEmail: "contact@nse.edu",
      requestedAt: "2 hours ago",
    },
  ]);

  // Live System Logs Preview (SRS 3.1.1 System Monitoring)[cite: 1]
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

  // Approval Handlers (SRS 3.1.1)[cite: 1]
  const handleApprove = (id: string) => {
    setPendingOrgs((prev) => prev.filter((org) => org.id !== id));
  };

  const handleReject = (id: string) => {
    setPendingOrgs((prev) => prev.filter((org) => org.id !== id));
  };

  return (
    <div className="w-full space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl min-h-screen text-slate-800">
      {/* FLAT PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5DEEF]/60">
        <div>
          <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
            GOVERNANCE OVERVIEW
          </span>
          <h1 className="text-2xl font-black text-[#395886] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Platform-wide metrics, pending organization onboarding, security controls, and audit logs[cite: 1].
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-xl">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            System Status: 99.9% Operational[cite: 1]
          </span>
        </div>
      </div>

      {/* SYSTEM ANALYTICS CARDS (SRS 3.1.1 System Analytics)[cite: 1] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Organizations Metric[cite: 1] */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Total Organizations[cite: 1]
            </p>
            <p className="text-2xl font-black text-[#395886]">12</p>
            <p className="text-[10px] font-bold text-amber-600 font-mono">
              {pendingOrgs.length} Pending Approval[cite: 1]
            </p>
          </div>
          <div className="p-3 bg-[#F0F3FA] text-[#395886] rounded-2xl border border-[#D5DEEF]/60">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* User Accounts Metric[cite: 1] */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Active Instructors[cite: 1]
            </p>
            <p className="text-2xl font-black text-[#395886]">148</p>
            <p className="text-[10px] font-bold text-emerald-600 font-mono">
              Across 8 Departments[cite: 1]
            </p>
          </div>
          <div className="p-3 bg-[#F0F3FA] text-[#395886] rounded-2xl border border-[#D5DEEF]/60">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Exam Sessions Metric[cite: 1] */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Total Examinations[cite: 1]
            </p>
            <p className="text-2xl font-black text-[#395886]">1,420</p>
            <p className="text-[10px] font-bold text-[#638ECB] font-mono">
              Platform-wide Total[cite: 1]
            </p>
          </div>
          <div className="p-3 bg-[#F0F3FA] text-[#395886] rounded-2xl border border-[#D5DEEF]/60">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Security Violations Metric[cite: 1] */}
        <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">
              Security Flags[cite: 1]
            </p>
            <p className="text-2xl font-black text-rose-600">34</p>
            <p className="text-[10px] font-bold text-slate-400 font-mono">
              Auto-prevented Locks[cite: 1]
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 COLS): PENDING ORGANIZATION ONBOARDING QUEUE (SRS 3.1.1)[cite: 1] */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#D5DEEF]/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#395886]" />
              <h2 className="text-sm font-black text-[#395886] uppercase tracking-wider">
                Pending Organization Approvals[cite: 1]
              </h2>
            </div>
            <Link
              href="/admin/organizations"
              className="text-xs font-bold text-[#395886] hover:text-[#638ECB] inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingOrgs.length > 0 ? (
            <div className="space-y-3">
              {pendingOrgs.map((org) => (
                <div
                  key={org.id}
                  className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#638ECB] transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#395886] bg-[#F0F3FA] px-2 py-0.5 rounded border border-[#D5DEEF]">
                        {org.code}
                      </span>
                      <h3 className="text-sm font-black text-[#395886]">
                        {org.name}
                      </h3>
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      Applicant: {org.requestedBy}{" "}
                      <span className="text-slate-400 font-normal font-mono">
                        ({org.contactEmail})
                      </span>
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                      Submitted {org.requestedAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(org.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(org.id)}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-[#D5DEEF] text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                All organization onboarding requests have been reviewed[cite: 1]!
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (1 COL): QUICK NAVIGATION & SECURITY SHORTCUTS[cite: 1] */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#D5DEEF]/60">
            <Lock className="w-4 h-4 text-[#395886]" />
            <h2 className="text-sm font-black text-[#395886] uppercase tracking-wider">
              Governance Control Hub[cite: 1]
            </h2>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-xs space-y-3">
            <Link
              href="/admin/organizations"
              className="w-full p-3 bg-[#F0F3FA]/60 hover:bg-[#F0F3FA] border border-[#D5DEEF] rounded-xl flex items-center justify-between group transition-colors block"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg text-[#395886] border border-[#D5DEEF]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#395886]">
                    Organizations Module[cite: 1]
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Approve, suspend, delete orgs[cite: 1]
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>

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
                    User Roster Directory[cite: 1]
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Force logouts & status controls[cite: 1]
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
                    Security Configuration[cite: 1]
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Fullscreen, tab limits, copy rules[cite: 1]
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* SYSTEM AUDIT LOG PREVIEW STREAM (SRS 3.1.1 System Monitoring)[cite: 1] */}
      <div className="bg-white rounded-2xl border border-[#D5DEEF] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D5DEEF]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#395886]" />
            <h3 className="text-sm font-black text-[#395886]">
              Real-Time System Audit Logs Preview[cite: 1]
            </h3>
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
  );
}