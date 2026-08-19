"use client";

import React, { useEffect, useState } from "react";
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
  Ban,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type UserStatus = "Active" | "Suspended" | "Pending" | "Deleted";
type StatusFilter = "All" | "Active" | "Suspended" | "Deleted";

interface TeacherRecord {
  id: string;
  name: string;
  email: string;
  departments: string[];
  subjects: string[];
  status: UserStatus;
  suspendedBy?: "admin" | "org" | null;
  deletedBy?: "admin" | "org" | null;
  deletedAt?: string | null;
  joinedDate: string;
}

interface OrgMeta {
  id: string;
  name: string;
  liveExaminers: number;
  liveExams: number;
  totalTeachers: number;
}

const STATUS_TABS: StatusFilter[] = ["All", "Active", "Suspended", "Deleted"];

function renderStatusBadge(teacher: TeacherRecord) {
  if (teacher.status === "Active") {
    return <Badge variant="success">Active</Badge>;
  }
  if (teacher.status === "Suspended") {
    if (teacher.suspendedBy === "admin") {
      return <Badge variant="danger">Suspended (Admin)</Badge>;
    }
    if (teacher.suspendedBy === "org") {
      return <Badge variant="warning">Suspended (Org)</Badge>;
    }
    return <Badge variant="danger">Suspended</Badge>;
  }
  if (teacher.status === "Deleted") {
    if (teacher.deletedBy === "admin") {
      return <Badge variant="neutral">Deleted (Admin)</Badge>;
    }
    if (teacher.deletedBy === "org") {
      return <Badge variant="neutral">Deleted (Org)</Badge>;
    }
    return <Badge variant="neutral">Deleted</Badge>;
  }
  return <Badge variant="neutral">Pending</Badge>;
}

/**
 * Shows the first value in a list inline. When there's more than one value,
 * a chevron appears and hovering reveals the rest in a small popover —
 * used for teachers who belong to multiple departments or teach multiple
 * subjects.
 */
function MultiValueCell({ values, label }: { values: string[]; label: string }) {
  const [primary, ...rest] = values;
  const hasMore = rest.length > 0;

  return (
    <div className="relative inline-block group/cell">
      <div className="inline-flex items-center gap-1 cursor-default">
        <span>{primary || "—"}</span>
        {hasMore && (
          <span className="inline-flex items-center gap-0.5 text-slate-400">
            <ChevronDown
              size={12}
              className="transition-transform group-hover/cell:rotate-180"
            />
            <span className="text-[10px] font-medium">+{rest.length}</span>
          </span>
        )}
      </div>

      {hasMore && (
        <div
          className="invisible opacity-0 translate-y-1 group-hover/cell:visible group-hover/cell:opacity-100 group-hover/cell:translate-y-0
                     transition-all duration-150 absolute left-0 top-full mt-1.5 z-20 min-w-[180px]
                     rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            All {label}
          </p>
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

export default function AdminOrgRosterPage() {
  const params = useParams<{ orgId: string }>();
  const orgId = params?.orgId ?? "";

  const [orgMeta, setOrgMeta] = useState<OrgMeta | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  // Delete is a two-step confirmation: step 1 asks to confirm, step 2 is the
  // final "are you absolutely sure" check before anything is removed.
  const [deleteTarget, setDeleteTarget] = useState<TeacherRecord | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData() {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/teachers`);
      if (res.ok) {
        const json = await res.json();
        setOrgMeta(json.org);
        setTeachers(json.teachers || []);
      }
    } catch (err) {
      console.error("Failed to load org roster:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [orgId]);

  const filteredTeachers = teachers.filter((t) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      t.departments.some((d) => d.toLowerCase().includes(query)) ||
      t.subjects.some((s) => s.toLowerCase().includes(query));

    let matchesStatus = false;
    if (statusFilter === "All") {
      matchesStatus = t.status !== "Deleted";
    } else {
      matchesStatus = t.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  async function updateStatus(id: string, nextStatus: "Active" | "Suspended") {
    const previous = [...teachers];
    setTeachers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: nextStatus,
              suspendedBy: nextStatus === "Suspended" ? "admin" : null,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/teachers`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTeachers(previous);
        alert(data?.error || "Failed to update teacher status.");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setTeachers(previous);
      alert("Network error.");
    }
  }

  function startDelete(teacher: TeacherRecord) {
    setDeleteTarget(teacher);
    setDeleteStep(1);
  }

  function closeDelete() {
    setDeleteTarget(null);
    setDeleteStep(1);
  }

  function handleFirstConfirm() {
    setDeleteStep(2);
  }

  async function handleFinalConfirm() {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/teachers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: targetId }),
      });
      const data = await res.json();

      if (res.ok) {
        setTeachers((prev) =>
          prev.map((t) =>
            t.id === targetId
              ? {
                  ...t,
                  status: "Deleted",
                  deletedBy: "admin",
                  deletedAt: new Date().toISOString(),
                }
              : t
          )
        );
        closeDelete();
      } else {
        alert(data?.error || "Failed to delete teacher account.");
      }
    } catch (err) {
      console.error("Error deleting teacher:", err);
      alert("Network error deleting teacher account.");
    } finally {
      setActionLoading(false);
    }
  }

  const activeTeachersCount = teachers.filter((t) => t.status !== "Deleted").length;

  return (
    <>
      <AdminTopbar
        title={orgMeta?.name || "Organization Roster"}
        description="View and manage teacher accounts for this organization."
      />

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
              <p className="mt-1 text-2xl font-semibold text-navy-900">
                {loading ? "..." : activeTeachersCount}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <School size={20} className="text-sky-600" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Live Examiners</p>
              <p className="mt-1 text-2xl font-semibold text-navy-900">
                {loading ? "..." : orgMeta?.liveExaminers ?? 0}
              </p>
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
                  (orgMeta?.liveExams ?? 0) > 0 ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {(orgMeta?.liveExams ?? 0) > 0 ? (
                  <Radio size={16} className="animate-pulse text-emerald-500" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
                {(orgMeta?.liveExams ?? 0) > 0 ? "Active" : "Inactive"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <Users size={20} className="text-slate-600" />
            </div>
          </Card>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`h-8 px-4 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === tab
                    ? "bg-navy-900 border-navy-900 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-96">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search teachers by name, email, department, or subject..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Teacher roster table */}
        <Card className="overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Teacher</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Loading teacher roster...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No matching teacher accounts found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                          {teacher.name
                            .split(" ")
                            .map((n) => n[0])
                            .filter(Boolean)
                            .join("")
                            .slice(0, 2) || teacher.email.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">{teacher.name}</p>
                          <p className="text-xs text-slate-400">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <MultiValueCell values={teacher.departments} label="departments" />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <MultiValueCell values={teacher.subjects} label="subjects" />
                    </td>
                    <td className="px-5 py-3.5">
                      {renderStatusBadge(teacher)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{teacher.joinedDate}</td>
                    <td className="px-5 py-3.5 text-right">
                      {teacher.status === "Deleted" ? (
                        <span className="text-xs text-slate-400 italic">Deleted</span>
                      ) : (
                        <DropdownMenu
                          trigger={
                            <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-auto">
                              <MoreVertical size={16} />
                            </button>
                          }
                        >
                          {teacher.status === "Suspended" && (
                            <DropdownItem onClick={() => updateStatus(teacher.id, "Active")}>
                              <CheckCircle2 size={15} /> Activate
                            </DropdownItem>
                          )}
                          {teacher.status === "Active" && (
                            <DropdownItem onClick={() => updateStatus(teacher.id, "Suspended")}>
                              <Ban size={15} /> Suspend
                            </DropdownItem>
                          )}
                          <DropdownItem danger onClick={() => startDelete(teacher)}>
                            <Trash2 size={15} /> Delete Teacher
                          </DropdownItem>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </main>

      {/* Step 1: initial confirmation */}
      <ConfirmDialog
        open={!!deleteTarget && deleteStep === 1}
        onClose={closeDelete}
        onConfirm={handleFirstConfirm}
        title="Delete teacher account?"
        description={`This will remove ${deleteTarget?.name} (${deleteTarget?.email}) from active rosters while safely preserving past examination records.`}
        confirmLabel="Continue"
      />

      {/* Step 2: final double-check before the delete actually happens */}
      <ConfirmDialog
        open={!!deleteTarget && deleteStep === 2}
        onClose={closeDelete}
        onConfirm={handleFinalConfirm}
        title="Are you absolutely sure?"
        description={`This is your final confirmation. ${deleteTarget?.name}'s teacher account will be deactivated and marked as deleted.`}
        confirmLabel={actionLoading ? "Deleting..." : "Delete Account"}
      />
    </>
  );
}