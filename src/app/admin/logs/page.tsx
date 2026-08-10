"use client";

import React, { useState } from "react";
import {
  Search,
  LogIn,
  ShieldAlert,
  AlertTriangle,
  Server,
  Download,
  Clock,
  Globe,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

type LogCategory = "all" | "login" | "system" | "security" | "error";
type Severity = "all" | "info" | "warning" | "critical";

interface LogEntry {
  id: string;
  category: "login" | "system" | "security" | "error";
  actor: string;
  description: string;
  ipAddress: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

export default function AdminLogsPage() {
  const [selectedCategory, setSelectedCategory] = useState<LogCategory>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [logs] = useState<LogEntry[]>([
    {
      id: "log-101",
      category: "system",
      actor: "Super Admin",
      description: "Updated global anti-cheating warning threshold policy to 3 warnings",
      ipAddress: "192.168.1.45",
      timestamp: "Aug 09, 2026 - 14:10:22",
      severity: "info",
    },
    {
      id: "log-102",
      category: "login",
      actor: "admin@its.edu (Org Admin)",
      description: "Successful organization portal authentication",
      ipAddress: "10.0.4.18",
      timestamp: "Aug 09, 2026 - 13:45:02",
      severity: "info",
    },
    {
      id: "log-103",
      category: "security",
      actor: "System Firewall Engine",
      description: "Triggered rate-limiting on endpoint /api/auth/v1 due to rapid requests",
      ipAddress: "203.0.113.195",
      timestamp: "Aug 09, 2026 - 12:30:11",
      severity: "warning",
    },
    {
      id: "log-104",
      category: "error",
      actor: "Cloudinary Gateway",
      description: "Webhook timeout while syncing institution asset assets/logo_66.png",
      ipAddress: "198.51.100.8",
      timestamp: "Aug 09, 2026 - 11:15:40",
      severity: "critical",
    },
    {
      id: "log-105",
      category: "system",
      actor: "Super Admin",
      description: "Approved pending onboarding request for Institute of Technology & Science",
      ipAddress: "192.168.1.45",
      timestamp: "Aug 09, 2026 - 10:02:15",
      severity: "info",
    },
    {
      id: "log-106",
      category: "login",
      actor: "r.chen@university.edu",
      description: "Failed login attempt (3/5) - Invalid password credential",
      ipAddress: "192.168.1.88",
      timestamp: "Aug 09, 2026 - 08:22:01",
      severity: "warning",
    },
  ]);

  const filteredLogs = logs.filter((log) => {
    const matchesCategory =
      selectedCategory === "all" || log.category === selectedCategory;
    const matchesSeverity =
      selectedSeverity === "all" || log.severity === selectedSeverity;
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSeverity && matchesSearch;
  });

  const getCategoryBadge = (category: LogEntry["category"]) => {
    switch (category) {
      case "login":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <LogIn className="w-3 h-3" /> Login Log
          </span>
        );
      case "system":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Server className="w-3 h-3" /> System Event
          </span>
        );
      case "security":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3" /> Security Alert
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> System Error
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: LogEntry["severity"]) => {
    switch (severity) {
      case "info":
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-slate-100 text-slate-600 border border-slate-200">
            INFO
          </span>
        );
      case "warning":
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-50 text-amber-700 border border-amber-200">
            WARNING
          </span>
        );
      case "critical":
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-rose-50 text-rose-700 border border-rose-200">
            CRITICAL
          </span>
        );
    }
  };

  return (
    <>
      <AdminTopbar
        title="System Audit Logs"
        description="Monitor real-time system events, administrative logins, security alerts, and error traces."
      />

      <main className="p-6 space-y-6 font-sans">

      {/* PAGE ACTION ROW */}
      <div className="flex justify-end">
        <button
          onClick={() => alert("Exporting system logs to CSV...")}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Log CSV</span>
        </button>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`pb-3 px-4 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setSelectedCategory("login")}
            className={`pb-3 px-4 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "login"
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Login Logs
          </button>
          <button
            onClick={() => setSelectedCategory("system")}
            className={`pb-3 px-4 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "system"
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            System Events
          </button>
          <button
            onClick={() => setSelectedCategory("security")}
            className={`pb-3 px-4 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "security"
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Security Logs
          </button>
          <button
            onClick={() => setSelectedCategory("error")}
            className={`pb-3 px-4 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "error"
                ? "text-slate-900 border-b-2 border-sky-400"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Error Logs
          </button>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, action, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as Severity)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-400 transition-all cursor-pointer shadow-2xs"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-5">Category & Actor</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-5 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <div>{getCategoryBadge(log.category)}</div>
                        <p className="font-bold text-slate-900">{log.actor}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800 max-w-md">{log.description}</p>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {log.ipAddress}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.timestamp}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right">
                      {getSeverityBadge(log.severity)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No system log entries matching your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </>
  );
}