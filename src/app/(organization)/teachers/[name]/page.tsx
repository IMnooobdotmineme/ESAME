"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTeacherByName } from "@/lib/teachers-data";
import { EXAMS } from "@/lib/exam-data";
import { ChevronLeft, FileText, Mail, Building2, BookOpen, CalendarDays } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Pending: "warning",
  Suspended: "danger",
  Deactivated: "neutral",
};

export default function TeacherProfilePage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const teacherName = decodeURIComponent(params.name);
  const teacher = getTeacherByName(teacherName);

  const teacherExams = useMemo(
    () => EXAMS.filter((e) => e.teacher === teacherName),
    [teacherName]
  );

  const completedCount = teacherExams.filter((e) => e.status === "Completed").length;
  const totalStudentsTaught = teacherExams.reduce((sum, e) => sum + e.totalStudents, 0);

  return (
    <>
      <OrgTopbar
        title={teacher?.name ?? teacherName}
        description={teacher ? `${teacher.subject} · ${teacher.department}` : "Teacher profile"}
      />

      <main className="p-6 space-y-5">
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft size={15} /> Back
        </Button>

        {/* Profile header card */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-lg font-semibold">
                {teacherName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">{teacherName}</h2>
                {teacher && (
                  <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Mail size={13} /> {teacher.email}
                  </p>
                )}
              </div>
            </div>
            {teacher && <Badge variant={STATUS_VARIANT[teacher.status]}>{teacher.status}</Badge>}
          </div>

          {teacher && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
              <InfoTile icon={Building2} label="Department" value={teacher.department} />
              <InfoTile icon={BookOpen} label="Subject" value={teacher.subject} />
              <InfoTile icon={CalendarDays} label="Joined" value={teacher.joined} />
              <InfoTile icon={FileText} label="Exams Created" value={String(teacherExams.length)} />
            </div>
          )}
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatTile label="Total Exams" value={String(teacherExams.length)} />
          <StatTile label="Completed Exams" value={String(completedCount)} />
          <StatTile label="Students Assessed" value={totalStudentsTaught.toLocaleString()} />
        </div>

        {/* Exam history */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-navy-900">Exam History</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Exam</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Students</th>
                <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {teacherExams.map((exam) => (
                <tr key={exam.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-navy-900">{exam.title}</p>
                    <p className="text-xs text-slate-400">{exam.examCode}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{exam.date}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={
                        exam.status === "Completed"
                          ? "success"
                          : exam.status === "In Progress"
                          ? "info"
                          : exam.status === "Scheduled"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {exam.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right text-slate-600">{exam.totalStudents}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/organization/exams/${exam.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                    >
                      <FileText size={13} /> View
                    </Link>
                  </td>
                </tr>
              ))}
              {teacherExams.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No exam history for this teacher yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
        <Icon size={13} /> {label}
      </p>
      <p className="text-sm font-medium text-navy-900">{value}</p>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-navy-900 mt-1">{value}</p>
    </Card>
  );
}