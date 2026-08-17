"use client";

import React, { useState } from "react";
import {
  Search,
  Clock,
  Building2,
  Server,
  Archive,
  ArchiveRestore,
  ArchiveX,
  Trash2,
  Inbox,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type LogTab = "user" | "system";

interface UserLogEntry {
  id: string;
  actor: string;
  organization: string;
  event: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  archived?: boolean;
}

interface SystemLogEntry {
  id: string;
  event: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  archived?: boolean;
}

const INITIAL_USER_LOGS: UserLogEntry[] = [
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

const INITIAL_SYSTEM_LOGS: SystemLogEntry[] = [
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

function severityDot(severity: "info" | "warning" | "critical") {
  const color =
    severity === "critical"
      ? "bg-red-500"
      : severity === "warning"
      ? "bg-amber-500"
      : "bg-slate-300";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${color}`} />;
}

// Splits "Aug 09, 2026 - 13:45:02" into a date part and a time part
// so the two can be laid out deliberately instead of wrapping mid-string.
function splitTimestamp(timestamp: string) {
  const [date, time] = timestamp.split(" - ");
  return { date: date ?? timestamp, time: time ?? "" };
}

function TimestampCell({ timestamp }: { timestamp: string }) {
  const { date, time } = splitTimestamp(timestamp);
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400 whitespace-nowrap">
      <Clock size={12} className="shrink-0" />
      <span className="text-xs">
        <span className="text-slate-500">{date}</span>
        <span className="mx-1 text-slate-300">·</span>
        <span className="tabular-nums">{time}</span>
      </span>
    </span>
  );
}

function ActionButtons({
  archived,
  onToggleArchive,
  onDelete,
}: {
  archived?: boolean;
  onToggleArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={onToggleArchive}
        title={archived ? "Unarchive" : "Archive"}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
      </button>
      {archived && (
        <button
          onClick={onDelete}
          title="Delete permanently"
          className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-slate-400 py-16">
      <Inbox size={28} strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function AdminLogsPage() {
  const [tab, setTab] = useState<LogTab>("user");
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [userLogs, setUserLogs] = useState<UserLogEntry[]>(INITIAL_USER_LOGS);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>(INITIAL_SYSTEM_LOGS);
  const [archiveAllConfirm, setArchiveAllConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ tab: LogTab; id: string; label: string } | null>(null);

  function toggleUserArchive(id: string) {
    setUserLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, archived: !l.archived } : l))
    );
  }

  function toggleSystemArchive(id: string) {
    setSystemLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, archived: !l.archived } : l))
    );
  }

  const filteredUserLogs = userLogs.filter(
    (log) =>
      !!log.archived === showArchived &&
      (log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.event.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSystemLogs = systemLogs.filter(
    (log) =>
      !!log.archived === showArchived &&
      log.event.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const archivedCount =
    tab === "user"
      ? userLogs.filter((l) => l.archived).length
      : systemLogs.filter((l) => l.archived).length;

  function confirmArchiveAll() {
    if (tab === "user") {
      const visibleIds = new Set(filteredUserLogs.map((l) => l.id));
      setUserLogs((prev) =>
        prev.map((l) => (visibleIds.has(l.id) ? { ...l, archived: true } : l))
      );
    } else {
      const visibleIds = new Set(filteredSystemLogs.map((l) => l.id));
      setSystemLogs((prev) =>
        prev.map((l) => (visibleIds.has(l.id) ? { ...l, archived: true } : l))
      );
    }
    setArchiveAllConfirm(false);
  }

  function confirmDeleteLog() {
    if (!deleteTarget) return;
    if (deleteTarget.tab === "user") {
      setUserLogs((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    } else {
      setSystemLogs((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  }

  const visibleCountForTab = tab === "user" ? filteredUserLogs.length : filteredSystemLogs.length;

  return (
    <>
      <AdminTopbar
        title="System Logs"
        description="Review teacher and organization activity, and platform system events."
      />

      <main className="p-4 md:p-6 space-y-5">
        {/* Tabs & search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80 w-fit">
              <button
                onClick={() => setTab("user")}
                className={
                  tab === "user"
                    ? "px-4 py-1.5 text-sm font-medium rounded-full bg-white text-navy-900 shadow-sm ring-1 ring-slate-200/60 inline-flex items-center gap-1.5 transition-all"
                    : "px-4 py-1.5 text-sm font-medium rounded-full text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
                }
              >
                <Building2 size={14} /> User Logs
              </button>
              <button
                onClick={() => setTab("system")}
                className={
                  tab === "system"
                    ? "px-4 py-1.5 text-sm font-medium rounded-full bg-white text-navy-900 shadow-sm ring-1 ring-slate-200/60 inline-flex items-center gap-1.5 transition-all"
                    : "px-4 py-1.5 text-sm font-medium rounded-full text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition-colors"
                }
              >
                <Server size={14} /> System Logs
              </button>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden md:block" />

            <button
              onClick={() => setShowArchived((v) => !v)}
              className={
                showArchived
                  ? "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-navy-900 bg-navy-900 text-white transition-colors"
                  : "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
              }
            >
              <Archive size={13} />
              {showArchived ? "Viewing Archived" : "View Archived"}
              {archivedCount > 0 && !showArchived && (
                <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold">
                  {archivedCount}
                </span>
              )}
            </button>

            {!showArchived && (
              <button
                onClick={() => setArchiveAllConfirm(true)}
                disabled={visibleCountForTab === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ArchiveX size={13} />
                Archive All
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full md:w-80 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-sky-100 transition-shadow">
            <Search size={16} className="text-slate-400 shrink-0" />
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
          <>
            {/* Desktop / tablet table */}
            <Card className="overflow-hidden border-slate-200/80 shadow-sm hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 font-medium">User</th>
                    <th className="px-5 py-3 font-medium">Organization</th>
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium text-right">Severity</th>
                    <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserLogs.length > 0 ? (
                    filteredUserLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5 font-medium text-navy-900">
                          <span className="inline-flex items-center gap-2">
                            {severityDot(log.severity)}
                            {log.actor}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{log.organization}</td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-sm">{log.event}</td>
                        <td className="px-5 py-3.5">
                          <TimestampCell timestamp={log.timestamp} />
                        </td>
                        <td className="px-5 py-3.5 text-right">{severityBadge(log.severity)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                            <ActionButtons
                              archived={log.archived}
                              onToggleArchive={() => toggleUserArchive(log.id)}
                              onDelete={() =>
                                setDeleteTarget({ tab: "user", id: log.id, label: log.event })
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          message={
                            showArchived
                              ? "No archived user logs."
                              : "No user log entries matching your search."
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2.5">
              {filteredUserLogs.length > 0 ? (
                filteredUserLogs.map((log) => (
                  <Card key={log.id} className="border-slate-200/80 shadow-sm p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-2 font-medium text-navy-900 text-sm">
                        {severityDot(log.severity)}
                        {log.actor}
                      </span>
                      {severityBadge(log.severity)}
                    </div>
                    <p className="text-xs text-slate-500">{log.organization}</p>
                    <p className="text-sm text-slate-600">{log.event}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <TimestampCell timestamp={log.timestamp} />
                      <ActionButtons
                        archived={log.archived}
                        onToggleArchive={() => toggleUserArchive(log.id)}
                        onDelete={() =>
                          setDeleteTarget({ tab: "user", id: log.id, label: log.event })
                        }
                      />
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="border-slate-200/80 shadow-sm">
                  <EmptyState
                    message={
                      showArchived
                        ? "No archived user logs."
                        : "No user log entries matching your search."
                    }
                  />
                </Card>
              )}
            </div>
          </>
        )}

        {/* System Logs */}
        {tab === "system" && (
          <>
            {/* Desktop / tablet table */}
            <Card className="overflow-hidden border-slate-200/80 shadow-sm hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium text-right">Severity</th>
                    <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystemLogs.length > 0 ? (
                    filteredSystemLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group">
                        <td className="px-5 py-3.5 text-slate-700 max-w-lg">
                          <span className="inline-flex items-center gap-2">
                            {severityDot(log.severity)}
                            {log.event}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <TimestampCell timestamp={log.timestamp} />
                        </td>
                        <td className="px-5 py-3.5 text-right">{severityBadge(log.severity)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                            <ActionButtons
                              archived={log.archived}
                              onToggleArchive={() => toggleSystemArchive(log.id)}
                              onDelete={() =>
                                setDeleteTarget({ tab: "system", id: log.id, label: log.event })
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          message={
                            showArchived
                              ? "No archived system logs."
                              : "No system log entries matching your search."
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2.5">
              {filteredSystemLogs.length > 0 ? (
                filteredSystemLogs.map((log) => (
                  <Card key={log.id} className="border-slate-200/80 shadow-sm p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                        {severityDot(log.severity)}
                        {log.event}
                      </span>
                      {severityBadge(log.severity)}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <TimestampCell timestamp={log.timestamp} />
                      <ActionButtons
                        archived={log.archived}
                        onToggleArchive={() => toggleSystemArchive(log.id)}
                        onDelete={() =>
                          setDeleteTarget({ tab: "system", id: log.id, label: log.event })
                        }
                      />
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="border-slate-200/80 shadow-sm">
                  <EmptyState
                    message={
                      showArchived
                        ? "No archived system logs."
                        : "No system log entries matching your search."
                    }
                  />
                </Card>
              )}
            </div>
          </>
        )}
      </main>

      <ConfirmDialog
        open={archiveAllConfirm}
        onClose={() => setArchiveAllConfirm(false)}
        onConfirm={confirmArchiveAll}
        title="Archive all visible logs?"
        description={`This will archive ${visibleCountForTab} ${tab === "user" ? "user" : "system"} log${
          visibleCountForTab !== 1 ? "s" : ""
        } currently shown. You can unarchive them later.`}
        confirmLabel="Archive All"
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteLog}
        title="Delete log entry?"
        description={`This will permanently delete this log entry. This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}