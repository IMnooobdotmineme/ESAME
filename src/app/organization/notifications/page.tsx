"use client";

import { useState } from "react";
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
    icon: UserPlus,
    iconColor: "text-sky-600 bg-sky-50",
    title: "Invitation Accepted",
    description: "Ly Vannak accepted the invitation and joined your organization.",
    detail: "Ly Vannak clicked the invitation link sent to ly.vannak@kit.edu.kh, set a password, and completed account setup. They are now assigned to the Computer Science department and can log in to create and manage exams for Database Systems.",
    category: "Teacher Management",
    actor: "Ly Vannak",
    timestamp: "Jul 27, 2026 · 10:42 AM",
    time: "12 min ago",
    read: false,
    archived: false,
    href: "/organization/teachers",
  },
  {
    id: "2",
    icon: AlertCircle,
    iconColor: "text-red-600 bg-red-50",
    title: "Security Violations Flagged",
    description: "3 students triggered tab-switch warnings during \"Networking Basics Test\".",
    detail: "During the active session, 3 students triggered tab-switch or window-focus warnings while completing \"Networking Basics Test\" (Ros Chenda, Information Technology). Each violation was logged automatically by the anti-cheating system. The supervising teacher has been notified and can review individual violation history from the exam's monitoring view.",
    category: "Exam Security",
    actor: "System — Anti-Cheating Monitor",
    timestamp: "Jul 27, 2026 · 9:58 AM",
    time: "1 hr ago",
    read: false,
    archived: false,
    href: "/organization/exams",
  },
  {
    id: "3",
    icon: CalendarPlus,
    iconColor: "text-emerald-600 bg-emerald-50",
    title: "Exam Scheduled",
    description: "\"Database Systems Final\" was scheduled by Ly Vannak for Jul 25, 2026.",
    detail: "Ly Vannak (Computer Science) scheduled \"Database Systems Final\" to open Jul 25, 2026. The exam is set for a 3-hour duration with 51 students enrolled. Students will receive their access code once the session opens.",
    category: "Exam Management",
    actor: "Ly Vannak",
    timestamp: "Jul 27, 2026 · 7:15 AM",
    time: "3 hrs ago",
    read: true,
    archived: false,
    href: "/organization/exams",
  },
  {
    id: "4",
    icon: ListChecks,
    iconColor: "text-navy-700 bg-navy-50",
    title: "Exam Completed",
    description: "\"IoT Sensor Fundamentals Quiz\" finished with 38 submissions.",
    detail: "\"IoT Sensor Fundamentals Quiz\" (Chan Sopheak, Internet of Things) has closed with 38 of 38 enrolled students submitting. Automatic grading has completed for objective questions; short-answer responses are pending manual review by the teacher.",
    category: "Exam Management",
    actor: "Chan Sopheak",
    timestamp: "Jul 27, 2026 · 5:10 AM",
    time: "5 hrs ago",
    read: true,
    archived: false,
    href: "/organization/exams",
  },
  {
    id: "5",
    icon: Ban,
    iconColor: "text-amber-600 bg-amber-50",
    title: "Teacher Suspended",
    description: "Heng Sreymom's account was suspended pending review.",
    detail: "Heng Sreymom's account (Information Technology — Cloud Computing) was suspended by an organization administrator. The teacher cannot log in or manage exams while suspended. Reactivate from the Teachers page once the review is complete.",
    category: "Teacher Management",
    actor: "Organization Admin",
    timestamp: "Jul 26, 2026 · 4:30 PM",
    time: "Yesterday",
    read: true,
    archived: false,
    href: "/organization/teachers",
  },
  {
    id: "6",
    icon: BookOpen,
    iconColor: "text-sky-600 bg-sky-50",
    title: "New Subject Added",
    description: "\"Cloud Computing\" was added under Information Technology.",
    detail: "A new subject, \"Cloud Computing\", was created under the Information Technology department. It currently has no teachers assigned — assign one from the Academic Structure page to begin scheduling exams for it.",
    category: "Academic Structure",
    actor: "Organization Admin",
    timestamp: "Jul 25, 2026 · 11:00 AM",
    time: "2 days ago",
    read: true,
    archived: false,
    href: "/organization/academic-structure",
  },
];

const FILTERS = ["All", "Unread", "Archived"] as const;

export default function NotificationsPage() {
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