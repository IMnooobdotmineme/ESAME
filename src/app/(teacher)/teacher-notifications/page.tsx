"use client";
import { useState, useEffect } from "react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotificationStore, type NotificationItem } from "@/store/useNotificationStore";
import {
  AlertTriangle,
  UserCheck,
  FileCheck2,
  CheckCircle2,
  CheckCheck,
  Archive,
  ArchiveRestore,
  ChevronDown,
} from "lucide-react";

const NOTIF_ICON_MAP: Record<string, { icon: React.ElementType; iconColor: string }> = {
  violation: { icon: AlertTriangle, iconColor: "text-red-600 bg-red-50" },
  request: { icon: UserCheck, iconColor: "text-sky-600 bg-sky-50" },
  info: { icon: FileCheck2, iconColor: "text-emerald-600 bg-emerald-50" },
};

const NOTIF_CATEGORY_MAP: Record<string, string> = {
  violation: "Exam Security",
  request: "Exam Access",
  info: "General",
};

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString();
}

function formatFullDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const FILTERS = ["All", "Unread", "Archived"] as const;

export default function TeacherNotificationsPage() {
  const {
    notifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
  } = useNotificationStore();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;
  const archivedCount = notifications.filter((n) => n.archived).length;

  const filtered = notifications.filter((n) => {
    if (filter === "Archived") return n.archived;
    if (n.archived) return false;
    if (filter === "Unread") return !n.read;
    return true;
  });

  async function handleRowClick(n: NotificationItem) {
    if (expandedId === n.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(n.id);
    if (!n.read) await markAsRead(n.id);
  }

  async function handleArchive(n: NotificationItem) {
    await archiveNotification(n.id, !n.archived);
    if (expandedId === n.id) setExpandedId(null);
  }

  return (
    <>
      <TeacherTopbar title="Notifications" description="Stay up to date with your exams and classes" />
      <main className="p-6 space-y-5">
        {/* FILTERS + MARK ALL READ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  filter === f
                    ? "rounded-full px-4 py-1.5 text-sm font-medium bg-navy-900 text-white"
                    : "rounded-full px-4 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              >
                {f}
                {f === "Unread" && unreadCount > 0 && ` (${unreadCount})`}
                {f === "Archived" && archivedCount > 0 && ` (${archivedCount})`}
              </button>
            ))}
          </div>
          {filter !== "Archived" && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck size={15} />
              Mark all as read
            </Button>
          )}
        </div>

        {/* NOTIFICATION LIST */}
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filtered.map((n) => {
              const iconData = NOTIF_ICON_MAP[n.type] || NOTIF_ICON_MAP.info;
              const Icon = iconData.icon;
              const isExpanded = expandedId === n.id;
              return (
                <li
                  key={n.id}
                  className={`transition-colors ${
                    isExpanded ? "bg-slate-50/70" : !n.read ? "bg-sky-50/40" : "hover:bg-slate-50/50"
                  }`}
                >
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Main clickable area */}
                      <button
                        type="button"
                        onClick={() => handleRowClick(n)}
                        className="flex-1 min-w-0 text-left flex items-start gap-4"
                      >
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${iconData.iconColor}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-navy-900">{n.title}</p>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(n.timestamp)}</p>
                        </div>
                      </button>

                      {/* Right side: archive icon + chevron */}
                      <div className="flex items-center gap-1 shrink-0 pt-1">
                        <button
                          type="button"
                          onClick={() => handleArchive(n)}
                          title={n.archived ? "Unarchive" : "Archive"}
                          className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-navy-900 hover:bg-slate-200/70 transition-colors"
                        >
                          {n.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                        </button>
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {/* NEW inline detail panel (no modal, no View Details button) */}
                    {isExpanded && (
                      <div className="mt-4 ml-12 rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                        <span className="inline-block rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">
                          {NOTIF_CATEGORY_MAP[n.type] || "General"}
                        </span>
                        <p className="text-sm text-navy-900 leading-relaxed">{n.message}</p>
                        <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-sm">
                          <div>
                            <dt className="text-xs text-slate-400">Triggered by</dt>
                            <dd className="text-navy-900 font-medium mt-0.5">System</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-400">Date &amp; Time</dt>
                            <dd className="text-navy-900 font-medium mt-0.5">{formatFullDate(n.timestamp)}</dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={22} className="text-slate-300" />
                {filter === "Archived" ? "No archived notifications." : "You're all caught up."}
              </li>
            )}
          </ul>
        </Card>
      </main>
    </>
  );
}