"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";

interface NotificationItem {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  href?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    icon: UserPlus,
    iconColor: "text-sky-600 bg-sky-50",
    title: "Invitation Accepted",
    description: "Ly Vannak accepted the invitation and joined your organization.",
    time: "12 min ago",
    read: false,
    href: "/organization/teachers",
  },
  {
    id: "2",
    icon: AlertCircle,
    iconColor: "text-red-600 bg-red-50",
    title: "Security Violations Flagged",
    description: "3 students triggered tab-switch warnings during \"Networking Basics Test\".",
    time: "1 hr ago",
    read: false,
    href: "/organization/exams",
  },
  {
    id: "3",
    icon: CalendarPlus,
    iconColor: "text-emerald-600 bg-emerald-50",
    title: "Exam Scheduled",
    description: "\"Database Systems Final\" was scheduled by Ly Vannak for Jul 25, 2026.",
    time: "3 hrs ago",
    read: true,
    href: "/organization/exams",
  },
  {
    id: "4",
    icon: ListChecks,
    iconColor: "text-navy-700 bg-navy-50",
    title: "Exam Completed",
    description: "\"IoT Sensor Fundamentals Quiz\" finished with 38 submissions.",
    time: "5 hrs ago",
    read: true,
    href: "/organization/exams",
  },
  {
    id: "5",
    icon: Ban,
    iconColor: "text-amber-600 bg-amber-50",
    title: "Teacher Suspended",
    description: "Heng Sreymom's account was suspended pending review.",
    time: "Yesterday",
    read: true,
    href: "/organization/teachers",
  },
  {
    id: "6",
    icon: BookOpen,
    iconColor: "text-sky-600 bg-sky-50",
    title: "New Subject Added",
    description: "\"Cloud Computing\" was added under Information Technology.",
    time: "2 days ago",
    read: true,
    href: "/organization/academic-structure",
  },
];

const FILTERS = ["All", "Unread"] as const;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "Unread" ? notifications.filter((n) => !n.read) : notifications;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
                {f} {f === "Unread" && unreadCount > 0 && `(${unreadCount})`}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck size={15} />
            Mark all as read
          </Button>
        </div>

        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-50">
            {filtered.map((n) => {
              const content = (
                <div
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors ${
                    !n.read ? "bg-sky-50/40" : ""
                  }`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center ${n.iconColor}`}>
                    <n.icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{n.description}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                </div>
              );

              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-5 py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 size={22} className="text-slate-300" />
                You&apos;re all caught up.
              </li>
            )}
          </ul>
        </Card>
      </main>
    </>
  );
}