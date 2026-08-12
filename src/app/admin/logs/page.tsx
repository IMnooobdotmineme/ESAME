"use client";

import React, { useState } from "react";
import { Search, Clock, Building2, Server } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type LogTab = "user" | "system";

interface UserLogEntry {
  id: string;
  actor: string;
  organization: string;
  event: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

interface SystemLogEntry {
  id: string;
  event: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

const USER_LOGS: UserLogEntry[] = [
  {
    id: "ulog-01",
    actor: "admin@its.edu (Org Admin)",
    organization: "Institute of Technology & Science",
    event: "Successful organization portal authentication",
    timestamp: "Aug 09, 2026 - 13:45:02",
    severity: "info",
  },
  {
    id: "ulog-02",
    actor: "Ly Vannak (Teacher)",
    organization: "Institute of Technology & Science",
    event: "Account activated by platform admin",
    timestamp: "Aug 09, 2026 - 10:02:15",
    severity: "info",
  },
  {
    id: "ulog-03",
    actor: "r.chen@university.edu (Teacher)",
    organization: "Faculty of Computer Science & Engineering",
    event: "Failed login attempt (3/5) - Invalid password credential",
    timestamp: "Aug 09, 2026 - 08:22:01",
    severity: "warning",
  },
];

const SYSTEM_LOGS: SystemLogEntry[] = [
  {
    id: "slog-01",
    event: "Scheduled database backup completed successfully",
    timestamp: "Aug 09, 2026 - 14:10:22",
    severity: "info",
  },
  {
    id: "slog-02",
    event: "Rate-limiting triggered on endpoint /api/auth/v1 due to rapid requests",
    timestamp: "Aug 09, 2026 - 12:30:11",
    severity: "warning",
  },
  {
    id: "slog-03",
    event: "Webhook timeout while syncing institution asset assets/logo_66.png",
    timestamp: "Aug 09, 2026 - 11:15:40",
    severity: "critical",
  },
  {
    id: "slog-04",
    event: "Platform maintenance window closed",
    timestamp: "Aug 09, 2026 - 06:00:00",
    severity: "info",
  },
];

function severityBadge(severity: "info" | "warning" | "critical") {
  if (severity === "critical") return <Badge variant="danger">Critical</Badge>;
  if (severity === "warning") return <Badge variant="warning">Warning</Badge>;
  return <Badge variant="neutral">Info</Badge>;
}

export default function AdminLogsPage() {
  const [tab, setTab] = useState<LogTab>("user");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUserLogs = USER_LOGS.filter(
    (log) =>
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSystemLogs = SYSTEM_LOGS.filter((log) =>
    log.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <AdminTopbar
        title="System Logs"
        description="Review teacher and organization activity, and platform system events."
      />

      <main className="p-6 space-y-6">
        {/* Tabs & search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200 w-fit">
            <button
              onClick={() => setTab("user")}
              className={
                tab === "user"
                  ? "px-4 py-1.5 text-sm font-medium rounded-full bg-white text-navy-900 shadow-sm inline-flex items-center gap-1.5"
                  : "px-4 py-1.5 text-sm font-medium rounded-full text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5"
              }
            >
              <Building2 size={14} /> User Logs
            </button>
            <button
              onClick={() => setTab("system")}
              className={
                tab === "system"
                  ? "px-4 py-1.5 text-sm font-medium rounded-full bg-white text-navy-900 shadow-sm inline-flex items-center gap-1.5"
                  : "px-4 py-1.5 text-sm font-medium rounded-full text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5"
              }
            >
              <Server size={14} /> System Logs
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full md:w-80">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tab === "user" ? "Search user, organization, event..." : "Search system events..."}
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* User Logs */}
        {tab === "user" && (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Organization</th>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium text-right">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserLogs.length > 0 ? (
                  filteredUserLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-medium text-navy-900">{log.actor}</td>
                      <td className="px-5 py-3.5 text-slate-600">{log.organization}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-sm">{log.event}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {log.timestamp}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">{severityBadge(log.severity)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                      No user log entries matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}

        {/* System Logs */}
        {tab === "system" && (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium text-right">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredSystemLogs.length > 0 ? (
                  filteredSystemLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 text-slate-700 max-w-lg">{log.event}</td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} /> {log.timestamp}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">{severityBadge(log.severity)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-400 text-sm">
                      No system log entries matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </>
  );
}
