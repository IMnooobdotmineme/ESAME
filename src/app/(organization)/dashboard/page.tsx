"use client";

import { useEffect, useMemo, useState } from "react";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { StatCard } from "@/components/organization/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamParticipationChart } from "@/components/organization/ExamParticipationChart";
import {
  Users,
  FileText,
  GraduationCap,
  TrendingUp,
  UserPlus,
  CalendarPlus,
  BookOpen,
  ListChecks,
  AlertCircle,
  ArrowRight,
  Building2,
} from "lucide-react";
import Link from "next/link";

type DashboardStats = {
  totalTeachers: number;
  activeExams: number;
  studentsParticipated: number;
  averagePassRate: number;
  totalDepartments: number;
  totalSubjects: number;
  pendingTeachers: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  chart: { month: string; participants: number; passRate: number }[];
  recentExams: Array<{ name: string; subject: string; teacher: string; status: string; participants: number; avgScore: string }>;
  recentActivity: Array<{ text: string; time: string; icon: string; color: string }>;
  subjectPerformance: Array<{ subject: string; teachers: number; exams: number; avgScore: string; passRate: string }>;
};

const defaultStats: DashboardStats = {
  totalTeachers: 0,
  activeExams: 0,
  studentsParticipated: 0,
  averagePassRate: 0,
  totalDepartments: 0,
  totalSubjects: 0,
  pendingTeachers: 0,
};

const iconMap = {
  userPlus: UserPlus,
  calendarPlus: CalendarPlus,
  listChecks: ListChecks,
  alertCircle: AlertCircle,
  bookOpen: BookOpen,
};

export default function OrganizationDashboardPage() {
  const [data, setData] = useState<DashboardResponse>({
    stats: defaultStats,
    chart: [],
    recentExams: [],
    recentActivity: [],
    subjectPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/org/dashboard", { cache: "no-store" });
        const json = await response.json();
        if (response.ok && json?.stats) {
          setData(json);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total Teachers", value: String(data.stats.totalTeachers), icon: Users },
      { label: "Active Exams", value: String(data.stats.activeExams), icon: FileText },
      { label: "Students Participated", value: data.stats.studentsParticipated.toLocaleString(), icon: GraduationCap },
      { label: "Average Pass Rate", value: `${data.stats.averagePassRate}%`, icon: TrendingUp },
      { label: "Total Departments", value: String(data.stats.totalDepartments), icon: Building2 },
      { label: "Total Subjects", value: String(data.stats.totalSubjects), icon: BookOpen },
    ],
    [data.stats]
  );

  return (
    <>
      <OrgTopbar title="Dashboard" description="Overview of your organization's activity" />

      <main className="p-6 space-y-6">
        {!loading && data.stats.pendingTeachers > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400 text-white">
                <UserPlus size={16} />
              </div>
              <p className="text-sm text-navy-900">
                <span className="font-semibold">{data.stats.pendingTeachers} teacher accounts</span> are waiting for activation.
              </p>
            </div>
            <Link href="/teachers">
              <Button size="sm" variant="secondary">
                Review <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-semibold text-navy-900">
                  Exam Participation &amp; Pass Rate
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">Last 6 months</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ExamParticipationChart data={data.chart} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-navy-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <Link href="/teachers">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <UserPlus size={18} className="text-sky-600" />
                  Invite Teacher
                </button>
              </Link>
              <Link href="/academic-structure">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <Building2 size={18} className="text-sky-600" />
                  Add Department
                </button>
              </Link>
              <Link href="/exams">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <ListChecks size={18} className="text-sky-600" />
                  View All Exams
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-navy-900">Recent Exams</CardTitle>
              <Link href="/exams" className="text-xs font-medium text-sky-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Exam</th>
                      <th className="pb-2 font-medium">Teacher</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Participants</th>
                      <th className="pb-2 font-medium text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentExams.map((exam) => (
                      <tr key={exam.name} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-2">
                          <p className="font-medium text-navy-900">{exam.name}</p>
                          <p className="text-xs text-slate-400">{exam.subject}</p>
                        </td>
                        <td className="py-3 text-slate-600">{exam.teacher}</td>
                        <td className="py-3">
                          <Badge variant={EXAM_STATUS_VARIANT[exam.status] ?? "info"}>{exam.status}</Badge>
                        </td>
                        <td className="py-3 text-right text-slate-600">{exam.participants}</td>
                        <td className="py-3 text-right font-medium text-navy-900">{exam.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-navy-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="space-y-4">
                {data.recentActivity.map((item, i) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap] ?? UserPlus;
                  return (
                    <li key={`${item.text}-${i}`} className="flex items-start gap-3">
                      <div className={cnIcon(item.color)}>
                        <Icon size={14} />
                      </div>
                      <div>
                        <p className="text-sm text-navy-900 leading-snug">{item.text}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-navy-900">Subject Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-medium">Subject</th>
                    <th className="pb-2 font-medium text-right">Teachers</th>
                    <th className="pb-2 font-medium text-right">Exams</th>
                    <th className="pb-2 font-medium text-right">Avg Score</th>
                    <th className="pb-2 font-medium text-right">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjectPerformance.map((subject) => (
                    <tr key={subject.subject} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 font-medium text-navy-900">{subject.subject}</td>
                      <td className="py-3 text-right text-slate-600">{subject.teachers}</td>
                      <td className="py-3 text-right text-slate-600">{subject.exams}</td>
                      <td className="py-3 text-right text-slate-600">{subject.avgScore}</td>
                      <td className="py-3 text-right font-medium text-emerald-600">{subject.passRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

const EXAM_STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "danger"> = {
  Ongoing: "info",
  Completed: "success",
  Scheduled: "warning",
  Locked: "danger",
};

function cnIcon(colorClasses: string) {
  return `flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClasses}`;
}
