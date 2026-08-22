"use client";

import { useEffect, useState } from "react";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  CalendarPlus,
  ListChecks,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Ban,
  CheckCheck,
  Archive,
  ArchiveRestore,
  Megaphone,
  ChevronDown,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  detail: string;
  category: string;
  actor: string;
  timestamp: string;
  time: string;
  type: string;
  read: boolean;
  archived: boolean;
  href?: string;
  hrefLabel?: string;
}

const FILTERS = ["All", "Unread", "Archived"] as const;

function getNotificationIcon(type: string): { icon: React.ElementType; iconColor: string } {
  if (type.includes("broadcast") || type.includes("announcement")) return { icon: Megaphone, iconColor: "text-sky-600 bg-sky-50" };
  if (type.includes("teacher_invite")) return { icon: UserPlus, iconColor: "text-sky-600 bg-sky-50" };
  if (type.includes("security") || type.includes("violation")) return { icon: AlertCircle, iconColor: "text-red-600 bg-red-50" };
  if (type.includes("scheduled") || type.includes("created")) return { icon: CalendarPlus, iconColor: "text-emerald-600 bg-emerald-50" };
  if (type.includes("suspended") || type.includes("locked")) return { icon: Ban, iconColor: "text-amber-600 bg-amber-50" };
  if (type.includes("subject") || type.includes("department")) return { icon: BookOpen, iconColor: "text-sky-600 bg-sky-50" };
  return { icon: ListChecks, iconColor: "text-navy-700 bg-navy-50" };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    try {
      const response = await fetch("/api/org/notifications", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && Array.isArray(payload.notifications)) {
        setNotifications(payload.notifications);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;
  const archivedCount = notifications.filter((n) => n.archived).length;

  const filtered = notifications.filter((n) => {
    if (filter === "Archived") return n.archived;
    if (n.archived) return false;
    if (filter === "Unread") return !n.read;
    return true;
  });

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => (n.archived ? n : { ...n, read: true })));
    await fetch("/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    window.dispatchEvent(new Event("org-profile-updated"));
  }

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch("/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "mark_read" }),
    });
    window.dispatchEvent(new Event("org-profile-updated"));
  }

  async function toggleArchive(id: string, archived: boolean) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, archived } : n)));
    await fetch("/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: archived ? "archive" : "unarchive" }),
    });
    window.dispatchEvent(new Event("org-profile-updated"));
  }

  async function handleRowClick(n: NotificationItem) {
    if (expandedId === n.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(n.id);
    if (!n.read) markRead(n.id);
  }

  async function handleArchive(n: NotificationItem) {
    await toggleArchive(n.id, !n.archived);
    if (expandedId === n.id) setExpandedId(null);
  }

  return (
    <>
      <OrgTopbar title="Notifications" description="Stay up to date with organization activity" />

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
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCheck size={15} />
              Mark all as read
            </Button>
          )}
        </div>

        {/* NOTIFICATION LIST */}
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filtered.map((n) => {
              const { icon: Icon, iconColor } = getNotificationIcon(n.type);
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
                        <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${iconColor}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-navy-900">{n.title}</p>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{n.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{n.time}</p>
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

                    {/* Inline detail panel (no modal, no View Details button) */}
                    {isExpanded && (
                      <div className="mt-4 ml-13 rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
                        <span className="inline-block rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">
                          {n.category}
                        </span>
                        <p className="text-sm text-navy-900 leading-relaxed">{n.detail}</p>
                        <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-sm">
                          <div>
                            <dt className="text-xs text-slate-400">Triggered by</dt>
                            <dd className="text-navy-900 font-medium mt-0.5">{n.actor}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-slate-400">Date &amp; Time</dt>
                            <dd className="text-navy-900 font-medium mt-0.5">{n.timestamp}</dd>
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
                {loading
                  ? "Loading notifications..."
                  : filter === "Archived"
                  ? "No archived notifications."
                  : "You're all caught up."}
              </li>
            )}
          </ul>
        </Card>
      </main>
    </>
  );
}