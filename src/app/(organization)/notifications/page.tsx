"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
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
  ArrowRight,
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
  const [selected, setSelected] = useState<NotificationItem | null>(null);
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

  function openDetail(n: NotificationItem) {
    markRead(n.id);
    setSelected({ ...n, read: true });
  }

  return (
    <>
      <OrgTopbar title="Notifications" description="Stay up to date with organization activity" />

      <main className="p-6 space-y-5">
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

        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-50">
            {filtered.map((n) => (
              <li key={n.id}>
                {(() => {
                  const { icon: Icon, iconColor } = getNotificationIcon(n.type);
                  return (
                <button
                  type="button"
                  onClick={() => openDetail(n)}
                  className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors ${
                    !n.read ? "bg-sky-50/40" : ""
                  }`}
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
                  );
                })()}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={22} className="text-slate-300" />
                {loading ? "Loading notifications..." : filter === "Archived" ? "No archived notifications." : "You're all caught up."}
              </li>
            )}
          </ul>
        </Card>
      </main>

      {/* Detail modal */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} className="max-w-lg">
        {selected && (
          <>
            <DialogHeader title={selected.title} onClose={() => setSelected(null)} />
            <div className="px-6 py-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center ${getNotificationIcon(selected.type).iconColor}`}>
                  {(() => {
                    const Icon = getNotificationIcon(selected.type).icon;
                    return <Icon size={20} />;
                  })()}
                </div>
                <div>
                  <span className="inline-block rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">
                    {selected.category}
                  </span>
                </div>
              </div>

              <p className="text-sm text-navy-900 leading-relaxed">{selected.detail}</p>

              <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Triggered by</dt>
                  <dd className="text-navy-900 font-medium mt-0.5">{selected.actor}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Date &amp; Time</dt>
                  <dd className="text-navy-900 font-medium mt-0.5">{selected.timestamp}</dd>
                </div>
              </dl>
            </div>
            <DialogFooter>
              {!selected.archived ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    toggleArchive(selected.id, true);
                    setSelected(null);
                  }}
                >
                  <Archive size={15} />
                  Archive
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    toggleArchive(selected.id, false);
                    setSelected(null);
                  }}
                >
                  <ArchiveRestore size={15} />
                  Unarchive
                </Button>
              )}
              {selected.href && (
                <Link href={selected.href}>
                  <Button onClick={() => setSelected(null)}>
                    {selected.hrefLabel ?? "View Details"} <ArrowRight size={15} />
                  </Button>
                </Link>
              )}
            </DialogFooter>
          </>
        )}
      </Dialog>
    </>
  );
}
