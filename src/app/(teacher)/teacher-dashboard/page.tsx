"use client";
import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  FileCheck,
  Lock,
  UserCheck,
  Plus,
  Play,
  Key,
  ArrowRight,
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  Bell,
  Inbox,
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { StatCard } from "@/components/organization/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExamStore } from "@/store/useExamStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { examStats, formatExamDate } from "@/lib/grading-utils";

const NOTIF_META: Record<string, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  violation: { icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-600" },
  request: { icon: UserCheck, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  info: { icon: Bell, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  teacher_invite: { icon: UserCheck, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  exam_created: { icon: ClipboardList, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
  submission_received: { icon: FileCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  grade_ready: { icon: FileCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  broadcast: { icon: Bell, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  warning: { icon: AlertTriangle, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
};

const DEFAULT_NOTIF_META = { icon: Bell, iconBg: "bg-slate-50", iconColor: "text-slate-600" };

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
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

export default function TeacherDashboardPage() {
  const router = useRouter();
  const exams = useExamStore((state) => state.exams) || [];
  const notifications = useNotificationStore((state) => state.notifications) || [];
  const fetchExams = useExamStore((state) => state.fetchExams);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    fetchExams();
    fetchNotifications();
  }, [fetchExams, fetchNotifications]);

  const liveExams = exams.filter((e) => e.isStarted && !e.isEnded);
  const endedExams = exams.filter((e) => e.isEnded);

  const gradingQueue = useMemo(
    () =>
      endedExams
        .map((exam) => ({ exam, stats: examStats(exam) }))
        .filter((row) => row.stats.pending > 0)
        .sort((a, b) => b.stats.pending - a.stats.pending),
    [endedExams]
  );

  const pendingEvaluations = gradingQueue.reduce((sum, row) => sum + row.stats.pending, 0);

  const pendingJoinRequests = useMemo(
    () =>
      exams.flatMap((exam) =>
        exam.requests
          .filter((r) => r.status === "pending")
          .map((r) => ({ exam, request: r }))
      ),
    [exams]
  );

  const lockedCount = useMemo(
    () => exams.reduce((sum, exam) => sum + exam.requests.filter((r) => r.isLocked).length, 0),
    [exams]
  );

  const upcomingExams = useMemo(
    () =>
      exams
        .filter((e) => e.startDate && !e.isLaunched && !e.isStarted && !e.isEnded)
        .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())
        .slice(0, 4),
    [exams]
  );

  const recentNotifications = notifications.filter((n) => !n.archived).slice(0, 5);

  const STATS = [
    {
      label: "Live Exam Sessions",
      value: String(liveExams.length),
      icon: Radio,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Pending Evaluations",
      value: String(pendingEvaluations),
      icon: FileCheck,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Join Requests Waiting",
      value: String(pendingJoinRequests.length),
      icon: UserCheck,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "Locked / Violations",
      value: String(lockedCount),
      icon: Lock,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  return (
    <>
      <TeacherTopbar
        title="Dashboard"
        description="Manage your classes, live examinations, and analytical insights."
      />
      <main className="p-6 space-y-6">
        {/* PAGE ACTION ROW */}
        <div className="flex justify-end">
          <Button onClick={() => router.push("/teacher-exams/new")}>
            <Plus size={16} />
            Create New Exam
          </Button>
        </div>

        {/* METRICS SNAPSHOT GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* NEEDS GRADING + RECENT ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NEEDS GRADING QUEUE */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-semibold text-navy-900">
                  Needs Grading
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Ended exams with submissions still waiting on manual review.
                </p>
              </div>
              <button
                onClick={() => router.push("/grading")}
                className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                View all <ArrowRight size={14} />
              </button>
            </CardHeader>
            <CardContent className="pt-3">
              {gradingQueue.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400 font-medium">
                    Nothing waiting on you — all submitted exams are fully graded.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {gradingQueue.slice(0, 5).map(({ exam, stats }) => (
                    <div
                      key={exam.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                            {exam.courseCode}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {stats.submitted} submitted
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-navy-900 truncate">
                          {exam.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="warning">{stats.pending} pending</Badge>
                        <Button size="sm" onClick={() => router.push(`/grading/${exam.id}`)}>
                          Grade now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* RECENT ACTIVITY — display only, only "View all" is clickable */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-navy-900">
                Recent Activity
              </CardTitle>
              <button
                onClick={() => router.push("/teacher-notifications")}
                className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                View all
              </button>
            </CardHeader>
            <CardContent className="pt-3">
              {recentNotifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Inbox className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">No activity yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentNotifications.map((notif) => {
                    const meta = NOTIF_META[notif.type] || DEFAULT_NOTIF_META;
                    const Icon = meta.icon;
                    return (
                      <div key={notif.id} className="w-full flex items-start gap-3 text-left">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}
                        >
                          <Icon size={14} className={meta.iconColor} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-navy-900 truncate">
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatTimeAgo(notif.timestamp)}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* LIVE NOW + UPCOMING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LIVE NOW */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-navy-900">Live Now</CardTitle>
              {liveExams.length > 0 && (
                <button
                  onClick={() => router.push("/monitor")}
                  className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  Open monitor <ArrowRight size={14} />
                </button>
              )}
            </CardHeader>
            <CardContent className="pt-3">
              {liveExams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="text-sm text-slate-400 font-medium">
                    No live exam sessions right now.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {liveExams.map((exam) => {
                    const activeCount = exam.requests.filter(
                      (r) => r.status === "approved" && !r.isSubmitted
                    ).length;
                    return (
                      <div
                        key={exam.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                              {exam.courseCode}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {activeCount} active
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-navy-900 truncate">
                            {exam.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Key className="w-3 h-3" />
                            <span className="font-mono font-bold text-slate-600">{exam.roomCode}</span>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => router.push("/monitor")}>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Monitor
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* UPCOMING */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-navy-900">Upcoming</CardTitle>
              <button
                onClick={() => router.push("/teacher-exams")}
                className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                View all <ArrowRight size={14} />
              </button>
            </CardHeader>
            <CardContent className="pt-3">
              {upcomingExams.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <ClipboardList className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-medium">
                    No scheduled exams coming up.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                            {exam.courseCode}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                            <CalendarDays className="w-3 h-3" />
                            {formatExamDate(exam.startDate)}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-navy-900 truncate">
                          {exam.title}
                        </h3>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push("/teacher-exams")}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}