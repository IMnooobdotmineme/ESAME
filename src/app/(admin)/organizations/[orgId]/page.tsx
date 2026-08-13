"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Users,
  Search,
  School,
  GraduationCap,
  Radio,
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type UserStatus = "Active" | "Suspended" | "Deactivated";

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  department: string;
  status: UserStatus;
  joinedDate: string;
}

interface OrgMeta {
  name: string;
  /** Guest examiners currently inside a live exam session for this org.
   *  Examiners have no account (guest mode) — this is a live headcount
   *  only, and returns to 0 once the exam ends. */
  liveExaminers: number;
  liveExams: number;
}

const ORG_META: Record<string, OrgMeta> = {
  "org-01": { name: "Faculty of Computer Science & Engineering", liveExaminers: 42, liveExams: 2 },
  "org-02": { name: "School of Software Development", liveExaminers: 0, liveExams: 0 },
  "org-03": { name: "Institute of Technology & Science", liveExaminers: 51, liveExams: 1 },
  "org-04": { name: "National School of Engineering", liveExaminers: 0, liveExams: 0 },
};

const INITIAL_TEACHERS: TeacherRecord[] = [
  { id: "USR-101", name: "Professor Julian Vance", email: "j.vance@university.edu", department: "Computer Science", status: "Active", joinedDate: "Sep 2024" },
  { id: "USR-102", name: "Dr. Aris Thorne", email: "a.thorne@university.edu", department: "Software Engineering", status: "Active", joinedDate: "Jan 2025" },
];

const STATUS_VARIANT: Record<UserStatus, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Suspended: "danger",
  Deactivated: "neutral",
};

export default function AdminOrgRosterPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params?.orgId ?? "org-01";
  const orgMeta = ORG_META[orgId] ?? { name: "Organization", liveExaminers: 0, liveExams: 0 };

  const [teachers, setTeachers] = useState<TeacherRecord[]>(INITIAL_TEACHERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TeacherRecord | null>(null);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function updateStatus(id: string, status: UserStatus) {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setTeachers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <>
      <AdminTopbar title={orgMeta.name} description="View and manage teacher accounts for this organization." />

      <main className="p-6 space-y-6">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Organizations
        </Link>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Teachers</p>
              <p className="mt-1 text-2xl font-semibold text-navy-900">{teachers.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <School size={20} className="text-sky-600" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Live Examiners</p>
              <p className="mt-1 text-2xl font-semibold text-navy-900">{orgMeta.liveExaminers}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Guest accounts, active session only</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <GraduationCap size={20} className="text-emerald-600" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Exam Activity</p>
              <p
                className={`mt-1 text-xl font-semibold inline-flex items-center gap-1.5 ${
                  orgMeta.liveExams > 0 ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {orgMeta.liveExams > 0 ? (
                  <Radio size={16} className="animate-pulse text-emerald-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
                {orgMeta.liveExams > 0 ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <Users size={20} className="text-slate-600" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-96">
          <Search size={16} className="text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search teachers by name, email, or department..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
          />
        </div>

        {/* Teacher roster table */}
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Teacher</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No matching teacher accounts found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                          {teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">{teacher.name}</p>
                          <p className="text-xs text-slate-400">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{teacher.department}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[teacher.status]}>{teacher.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{teacher.joinedDate}</td>
                    <td className="px-5 py-3.5 text-right">
                      <DropdownMenu
                        trigger={
                          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-auto">
                            <MoreVertical size={16} />
                          </button>
                        }
                      >
                        {teacher.status !== "Active" && (
                          <DropdownItem onClick={() => updateStatus(teacher.id, "Active")}>
                            <CheckCircle2 size={15} /> Activate
                          </DropdownItem>
                        )}
                        {teacher.status === "Active" && (
                          <DropdownItem onClick={() => updateStatus(teacher.id, "Deactivated")}>
                            <XCircle size={15} /> Deactivate
                          </DropdownItem>
                        )}
                        {teacher.status !== "Suspended" && (
                          <DropdownItem onClick={() => updateStatus(teacher.id, "Suspended")}>
                            <Ban size={15} /> Suspend
                          </DropdownItem>
                        )}
                        <DropdownItem danger onClick={() => setDeleteTarget(teacher)}>
                          <Trash2 size={15} /> Delete Teacher
                        </DropdownItem>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete teacher account?"
        description={`This will permanently remove ${deleteTarget?.name} (${deleteTarget?.email}) from the platform. This action cannot be undone.`}
        confirmLabel="Delete Teacher"
      />
    </>
  );
}