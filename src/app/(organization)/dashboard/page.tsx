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
  FileBarChart2,
  ScrollText,
} from "lucide-react";
import Link from "next/link";

// ---- Mock data (swap for API later) ----

const STATS = [
  { label: "Total Teachers", value: "24", icon: Users, trend: { value: "+3", direction: "up" as const } },
  { label: "Active Exams", value: "12", icon: FileText, trend: { value: "+5", direction: "up" as const } },
  { label: "Students Participated", value: "1,284", icon: GraduationCap, trend: { value: "+18%", direction: "up" as const } },
  { label: "Average Pass Rate", value: "78%", icon: TrendingUp, trend: { value: "-2%", direction: "down" as const } },
  { label: "Total Departments", value: "3", icon: Building2 },
  { label: "Total Subjects", value: "18", icon: BookOpen },
];

const RECENT_EXAMS = [
  { name: "Data Structures Midterm", subject: "Computer Science", teacher: "Sok Dara", status: "Ongoing", participants: 42, avgScore: "—" },
  { name: "IoT Sensor Fundamentals Quiz", subject: "Internet of Things", teacher: "Chan Sopheak", status: "Completed", participants: 38, avgScore: "82%" },
  { name: "Database Systems Final", subject: "Computer Science", teacher: "Ly Vannak", status: "Scheduled", participants: 0, avgScore: "—" },
  { name: "Networking Basics Test", subject: "Information Technology", teacher: "Ros Chenda", status: "Completed", participants: 51, avgScore: "74%" },
  { name: "Software Engineering Essay", subject: "Software Engineering", teacher: "Sok Dara", status: "Locked", participants: 12, avgScore: "—" },
];

const EXAM_STATUS_VARIANT: Record<string, "success" | "info" | "warning" | "danger"> = {
  Ongoing: "info",
  Completed: "success",
  Scheduled: "warning",
  Locked: "danger",
};

const RECENT_ACTIVITY = [
  { text: "Teacher Ly Vannak joined the organization", time: "12 min ago", icon: UserPlus, color: "text-sky-600 bg-sky-50" },
  { text: "Exam \"Database Systems Final\" was scheduled", time: "1 hr ago", icon: CalendarPlus, color: "text-emerald-600 bg-emerald-50" },
  { text: "Exam \"IoT Sensor Fundamentals Quiz\" completed", time: "3 hrs ago", icon: ListChecks, color: "text-navy-600 bg-navy-50" },
  { text: "3 security violations flagged in \"Networking Basics Test\"", time: "5 hrs ago", icon: AlertCircle, color: "text-red-600 bg-red-50" },
  { text: "New subject \"Cloud Computing\" added", time: "Yesterday", icon: BookOpen, color: "text-sky-600 bg-sky-50" },
];

const TOP_SUBJECTS = [
  { subject: "Internet of Things", teachers: 3, exams: 8, avgScore: "82%", passRate: "88%" },
  { subject: "Computer Science", teachers: 6, exams: 15, avgScore: "76%", passRate: "80%" },
  { subject: "Information Technology", teachers: 4, exams: 10, avgScore: "74%", passRate: "71%" },
  { subject: "Software Engineering", teachers: 3, exams: 6, avgScore: "69%", passRate: "63%" },
];

const PENDING_TEACHERS = 2;

export default function OrganizationDashboardPage() {
  return (
    <>
      <OrgTopbar
        title="Dashboard"
        description="Overview of your organization's activity"
      />

      <main className="p-6 space-y-6">
        {/* Pending approvals banner */}
        {PENDING_TEACHERS > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400 text-white">
                <UserPlus size={16} />
              </div>
              <p className="text-sm text-navy-900">
                <span className="font-semibold">{PENDING_TEACHERS} teacher accounts</span> are
                waiting for activation.
              </p>
            </div>
            <Link href="/organization/teachers">
              <Button size="sm" variant="secondary">
                Review <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Chart + Quick actions */}
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
              <ExamParticipationChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-navy-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <Link href="/organization/teachers">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <UserPlus size={18} className="text-sky-600" />
                  Invite Teacher
                </button>
              </Link>
              <Link href="/organization/academic-structure">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <CalendarPlus size={18} className="text-sky-600" />
                  Add Academic Year
                </button>
              </Link>
              <Link href="/organization/academic-structure">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <BookOpen size={18} className="text-sky-600" />
                  Add Subject
                </button>
              </Link>
              <Link href="/organization/exams">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <ListChecks size={18} className="text-sky-600" />
                  View All Exams
                </button>
              </Link>
              <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                <FileBarChart2 size={18} className="text-sky-600" />
                Generate Report
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                <ScrollText size={18} className="text-sky-600" />
                View Activity Logs
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Recent exams + Recent activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-navy-900">
                Recent Exams
              </CardTitle>
              <Link href="/organization/exams" className="text-xs font-medium text-sky-600 hover:underline">
                View all
              </Link>
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
                    {RECENT_EXAMS.map((exam) => (
                      <tr key={exam.name} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-2">
                          <p className="font-medium text-navy-900">{exam.name}</p>
                          <p className="text-xs text-slate-400">{exam.subject}</p>
                        </td>
                        <td className="py-3 text-slate-600">{exam.teacher}</td>
                        <td className="py-3">
                          <Badge variant={EXAM_STATUS_VARIANT[exam.status]}>{exam.status}</Badge>
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
              <CardTitle className="text-base font-semibold text-navy-900">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="space-y-4">
                {RECENT_ACTIVITY.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={cnIcon(item.color)}>
                      <item.icon size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-navy-900 leading-snug">{item.text}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Top performing subjects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-navy-900">
              Subject Performance
            </CardTitle>
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
                  {TOP_SUBJECTS.map((s) => (
                    <tr key={s.subject} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 font-medium text-navy-900">{s.subject}</td>
                      <td className="py-3 text-right text-slate-600">{s.teachers}</td>
                      <td className="py-3 text-right text-slate-600">{s.exams}</td>
                      <td className="py-3 text-right text-slate-600">{s.avgScore}</td>
                      <td className="py-3 text-right font-medium text-emerald-600">{s.passRate}</td>
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

function cnIcon(colorClasses: string) {
  return `flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClasses}`;
}