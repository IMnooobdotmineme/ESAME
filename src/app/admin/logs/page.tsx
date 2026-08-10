"use client";

import React, { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  LogIn,
  ShieldAlert,
  AlertTriangle,
  Server,
  Download,
  RefreshCw,
  Clock,
  Globe,
} from "lucide-react";

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

  // Mock Platform Audit Logs (SRS 3.1.1 System Monitoring)
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
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <LogIn className="w-3 h-3" /> Login Log
          </span>
        );
      case "system":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            <Server className="w-3 h-3" /> System Event
          </span>
        );
      case "security":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3" /> Security Alert
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> System Error
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: LogEntry["severity"]) => {
    switch (severity) {
      case "info":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-600">
            INFO
          </span>
        );
      case "warning":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-amber-100 text-amber-800">
            WARNING
          </span>
        );
      case "critical":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-rose-100 text-rose-800">
            CRITICAL
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl min-h-screen text-slate-800">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5DEEF]/60">
        <div>
          <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
            AUDIT & MONITORING
          </span>
          <h1 className="text-2xl font-black text-[#395886] tracking-tight">
            System Audit Logs
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Monitor real-time system events, administrative logins, security alerts, and error traces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Exporting system logs to CSV...")}
            className="px-3.5 py-2 bg-white border border-[#D5DEEF] hover:bg-[#F0F3FA] text-[#395886] rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#638ECB]" />
            <span>Export Log CSV</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 border-b border-[#D5DEEF] overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "all"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setSelectedCategory("login")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "login"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Login Logs[cite: 1]
          </button>
          <button
            onClick={() => setSelectedCategory("system")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "system"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            System Events[cite: 1]
          </button>
          <button
            onClick={() => setSelectedCategory("security")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "security"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Security Logs[cite: 1]
          </button>
          <button
            onClick={() => setSelectedCategory("error")}
            className={`pb-2.5 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "error"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Error Logs[cite: 1]
          </button>
        </div>

        {/* Inputs */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, action, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#D5DEEF] rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886]"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as Severity)}
            className="bg-white border border-[#D5DEEF] rounded-xl px-3 py-1.5 text-xs font-bold text-[#395886] focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white rounded-2xl border border-[#D5DEEF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D5DEEF] bg-[#F0F3FA] text-[10px] font-black text-[#8AAEE0] uppercase tracking-wider">
                <th className="p-4 pl-6">Category & Actor</th>
                <th className="p-4">Event Details</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 pr-6 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DEEF]/60 text-xs font-medium text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F0F3FA]/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="space-y-1">
                        <div>{getCategoryBadge(log.category)}</div>
                        <p className="font-extrabold text-[#395886]">{log.actor}</p>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-700 max-w-md">{log.description}</p>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {log.ipAddress}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.timestamp}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      {getSeverityBadge(log.severity)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-bold">
                    No system log entries matching your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}