"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Teacher } from "@/lib/teachers-data";
import { ChevronDown, ChevronLeft, FileText, Mail, Building2, BookOpen, CalendarDays } from "lucide-react";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Pending: "warning",
  Suspended: "danger",
};

type TeacherExamSummary = {
  id: string;
  examCode: string;
  title: string;
  date: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Locked";
  totalStudents: number;
};

/** First value shown inline; hovering the chevron reveals the rest. */
function MultiValueList({ values }: { values: string[] }) {
  const [primary, ...rest] = values;
  const hasMore = rest.length > 0;

  return (
    <div className="relative inline-flex items-center gap-1 group/cell cursor-default">
      <span className="text-sm font-medium text-navy-900">{primary || "—"}</span>
      {hasMore && (
        <span className="inline-flex items-center gap-0.5 text-slate-400">
          <ChevronDown size={12} className="transition-transform group-hover/cell:rotate-180" />
          <span className="text-[10px] font-medium">+{rest.length}</span>
        </span>
      )}
      {hasMore && (
        <div
          className="invisible opacity-0 translate-y-1 group-hover/cell:visible group-hover/cell:opacity-100 group-hover/cell:translate-y-0
                     transition-all duration-150 absolute left-0 top-full mt-1.5 z-20 min-w-45
                     rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {values.map((v) => (
            <p key={v} className="px-2 py-1 text-xs text-slate-600 rounded-lg hover:bg-slate-50">
              {v}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeacherProfilePage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const profileKey = decodeURIComponent(params.name);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherExams, setTeacherExams] = useState<TeacherExamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacher() {
      try {
        const looksLikeId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileKey);
        const teacherQuery = looksLikeId
          ? `id=${encodeURIComponent(profileKey)}`
          : `name=${encodeURIComponent(profileKey)}`;
        const teacherResponse = await fetch(`/api/org/teachers?${teacherQuery}`, { cache: "no-store" });

        const teacherPayload = await teacherResponse.json();
        if (teacherResponse.ok && teacherPayload.teacher) {
          setTeacher(teacherPayload.teacher);

          const examsResponse = await fetch(`/api/org/exams?teacherId=${encodeURIComponent(teacherPayload.teacher.id)}`, {
            cache: "no-store",
          });
          const examsPayload = await examsResponse.json();
          if (examsResponse.ok && Array.isArray(examsPayload.exams)) {
            setTeacherExams(examsPayload.exams);
          } else {
            setTeacherExams([]);
          }
        } else {
          setTeacher(null);
          setTeacherExams([]);
        }
      } catch (error) {
        console.error("Failed to load teacher profile", error);
        setTeacher(null);
        setTeacherExams([]);
      } finally {
        setLoading(false);
      }
    }

    loadTeacher();
  }, [profileKey]);

  const departments = teacher ? Array.from(new Set(teacher.assignments.map((a) => a.department))) : [];
  const subjects = teacher ? Array.from(new Set(teacher.assignments.map((a) => a.subject))) : [];

  const completedCount = teacherExams.filter((e) => e.status === "Completed").length;
  const totalStudentsTaught = teacherExams.reduce((sum, e) => sum + e.totalStudents, 0);

  const description = teacher
    ? `${subjects[0] || "No subjects"}${subjects.length > 1 ? ` +${subjects.length - 1} more` : ""} · ${departments[0] || "No departments"}${
        departments.length > 1 ? ` +${departments.length - 1} more` : ""
      }`
    : "Teacher profile";
  const displayName = teacher?.name || teacher?.email || profileKey;

  return (
    <>
      <OrgTopbar title={displayName} description={description} />

      <main className="p-6 space-y-5">
        {loading && <Card className="p-10 text-center text-slate-400">Loading teacher profile...</Card>}

        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft size={15} /> Back
        </Button>

        {/* Profile header card */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-lg font-semibold">
                {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">{displayName}</h2>
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
              <InfoTile icon={Building2} label="Department">
                <MultiValueList values={departments} />
              </InfoTile>
              <InfoTile icon={BookOpen} label="Subject">
                <MultiValueList values={subjects} />
              </InfoTile>
              <InfoTile icon={CalendarDays} label="Joined">
                <p className="text-sm font-medium text-navy-900">{teacher.joined}</p>
              </InfoTile>
              <InfoTile icon={FileText} label="Exams Created">
                <p className="text-sm font-medium text-navy-900">{String(teacherExams.length)}</p>
              </InfoTile>
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
                      href={`/exams/${exam.id}`}
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
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
        <Icon size={13} /> {label}
      </p>
      {children}
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
