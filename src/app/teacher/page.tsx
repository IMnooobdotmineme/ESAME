"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  Users,
  FileCheck,
  Lock,
  Plus,
  Play,
  Key,
  Clock,
  ArrowRight,
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { StatCard } from "@/components/organization/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/store/useExamStore";

const STATS = [
  {
    label: "Live Exam Sessions",
    value: "3",
    icon: Radio,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Total Active Students",
    value: "67",
    icon: Users,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    label: "Pending Evaluations",
    value: "12",
    icon: FileCheck,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Locked / Violations",
    value: "3",
    icon: Lock,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
];

export default function TeacherDashboardPage() {
  const router = useRouter();
  const exams = useExamStore((state) => state.exams) || [];

  const liveExams = exams.filter((e) => e.isStarted && !e.isEnded);

  return (
    <>
      <TeacherTopbar
        title="Dashboard"
        description="Manage your classes, live examinations, and analytical insights."
      />

      <main className="p-6 space-y-6">
        {/* PAGE ACTION ROW */}
        <div className="flex justify-end">
          <Button onClick={() => router.push("/teacher/exams/new")}>
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

        {/* LIVE ACTIVE STREAM MONITORING */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold text-navy-900">
                Live Active Stream Monitoring
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Currently open exam portals running concurrent student connections.
              </p>
            </div>
            <button
              onClick={() => router.push("/teacher/monitor")}
              className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
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
                      className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase">
                            {exam.courseCode}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.durationMinutes} mins • {exam.questionCount} Questions
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-navy-900">{exam.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Key className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-medium text-slate-400">ROOM CODE:</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-200">
                            {exam.roomCode}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0 border-slate-100">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-navy-900">{activeCount} Active</p>
                          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Streams connected
                          </p>
                        </div>
                        <Button size="sm" onClick={() => router.push("/teacher/monitor")}>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Launch Monitor
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
