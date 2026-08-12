"use client";

import { useState } from "react";
import Link from "next/link";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  AlertTriangle,
  UserCheck,
  FileCheck2,
  Clock,
  CheckCircle2,
  Radio,
  CheckCheck,
  Archive,
  ArchiveRestore,
  ArrowRight,
} from "lucide-react";

interface NotificationItem {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  detail: string;
  category: string;
  actor: string;
  timestamp: string;
  time: string;
  read: boolean;
  archived: boolean;
  href?: string;
  hrefLabel?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    icon: AlertTriangle,
    iconColor: "text-red-600 bg-red-50",
    title: "Tab Switch Detected",
    description: "Marcus Vance triggered a tab-switch warning during \"CS101 Midterm\".",
    detail: "Marcus Vance switched away from the exam tab during \"Introduction to Computer Science (Midterm)\". Their session has been automatically locked and is awaiting your permission to continue. Review the incident and grant permission from the Live Monitoring page if appropriate.",
    category: "Exam Security",
    actor: "System — Anti-Cheating Monitor",
    timestamp: "Aug 10, 2026 · 9:41 AM",
    time: "8 min ago",
    read: false,
    archived: false,
    href: "/teacher/monitor",
    hrefLabel: "Go to Monitoring",
  },
  {
    id: "2",
    icon: UserCheck,
    iconColor: "text-sky-600 bg-sky-50",
    title: "New Join Request",
    description: "Sophia Chen requested to join \"CS101 Midterm\" using room code CS101-MID.",
    detail: "Sophia Chen submitted her name and student ID to join the exam session using room code CS101-MID. Approve or reject her request from the exam's approval list before the session begins.",
    category: "Exam Access",
    actor: "Sophia Chen",
    timestamp: "Aug 10, 2026 · 9:22 AM",
    time: "27 min ago",
    read: false,
    archived: false,
    href: "/teacher/exams",
  },
  {
    id: "3",
    icon: FileCheck2,
    iconColor: "text-emerald-600 bg-emerald-50",
    title: "Submissions Ready for Grading",
    description: "12 essay responses from \"European History Final\" are awaiting review.",
    detail: "\"European History Final\" has closed with all enrolled students submitting. Multiple-choice and true/false questions were graded automatically. 12 written responses require manual review before final scores can be released to students.",
    category: "Grading",
    actor: "System",
    timestamp: "Aug 10, 2026 · 8:05 AM",
    time: "1 hr ago",
    read: true,
    archived: false,
    href: "/teacher/grading",
  },
  {
    id: "4",
    icon: Radio,
    iconColor: "text-navy-700 bg-navy-50",
    title: "Exam Session Started",
    description: "\"Sensor Technology Quiz\" is now live with 24 students connected.",
    detail: "\"Sensor Technology Quiz\" opened as scheduled and is now accepting student submissions. 24 students have joined so far. Monitor live activity, tab-switch flags, and progress from the Live Monitoring page.",
    category: "Exam Management",
    actor: "System",
    timestamp: "Aug 10, 2026 · 7:30 AM",
    time: "2 hrs ago",
    read: true,
    archived: false,
    href: "/teacher/monitor",
  },
  {
    id: "5",
    icon: Clock,
    iconColor: "text-amber-600 bg-amber-50",
    title: "Exam Closing Soon",
    description: "\"Advanced Physics II\" closes in 15 minutes — 6 students still in progress.",
    detail: "\"Advanced Physics II\" is scheduled to close in 15 minutes. 6 of 30 enrolled students have not yet submitted. Unanswered questions will be automatically scored as zero once the timer ends.",
    category: "Exam Management",
    actor: "System",
    timestamp: "Aug 9, 2026 · 4:50 PM",
    time: "Yesterday",
    read: true,
    archived: false,
    href: "/teacher/monitor",
  },
];

const FILTERS = ["All", "Unread", "Archived"] as const;

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;
  const archivedCount = notifications.filter((n) => n.archived).length;

  const filtered = notifications.filter((n) => {
    if (filter === "Archived") return n.archived;
    if (n.archived) return false;
    if (filter === "Unread") return !n.read;
    return true;
  });

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => (n.archived ? n : { ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function toggleArchive(id: string, archived: boolean) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, archived } : n)));
  }

  function openDetail(n: NotificationItem) {
    markRead(n.id);
    setSelected({ ...n, read: true });
  }

  return (
    <>
      <TeacherTopbar title="Notifications" description="Stay up to date with your exams and classes" />

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
                <button
                  type="button"
                  onClick={() => openDetail(n)}
                  className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors ${
                    !n.read ? "bg-sky-50/40" : ""
                  }`}
                >
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${n.iconColor}`}>
                    <n.icon size={16} />
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
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={22} className="text-slate-300" />
                {filter === "Archived" ? "No archived notifications." : "You're all caught up."}
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
                <div className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center ${selected.iconColor}`}>
                  <selected.icon size={20} />
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