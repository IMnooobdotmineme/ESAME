"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InviteTeacherModal, InviteFormData } from "@/components/organization/InviteTeacherModal";
import { InvitationSentDialog } from "@/components/organization/InvitationSentDialog";
import { ManageAssignmentsModal } from "@/components/organization/ManageAssignmentsModal";
import {
  Teacher,
  TeacherAssignment,
  TeacherStatus as Status,
  uniqueDepartments,
  uniqueSubjects,
} from "@/lib/teachers-data";
import {
  UserPlus,
  Search,
  MoreVertical,
  CheckCircle2,
  Ban,
  Trash2,
  Eye,
  Layers,
  ChevronDown,
} from "lucide-react";

const FILTERS: ("All" | Status)[] = ["All", "Active", "Pending", "Suspended", "Deleted"];

function renderTeacherStatusBadge(teacher: Teacher) {
  if (teacher.status === "Active") {
    return <Badge variant="success">Active</Badge>;
  }
  if (teacher.status === "Pending") {
    return <Badge variant="warning">Pending</Badge>;
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
 * Small "+N" chevron trigger + hover popover shared by the department and
 * subject cells below. `trigger` is the primary value shown inline (plain
 * text, or a Badge for departments); `values` is the full list to reveal.
 */
function MultiValuePopover({
  values,
  label,
  trigger,
}: {
  values: string[];
  label: string;
  trigger: React.ReactNode;
}) {
  const rest = values.slice(1);
  const hasMore = rest.length > 0;

  return (
    <div className="relative inline-flex items-center gap-1.5 group/cell cursor-default">
      {trigger}
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

export default function TeacherManagementPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sentDialog, setSentDialog] = useState<{ open: boolean; name: string; email: string }>({
    open: false,
    name: "",
    email: "",
  });
  const [assignmentsTarget, setAssignmentsTarget] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadTeachers() {
    try {
      const response = await fetch("/api/org/teachers", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && Array.isArray(payload.teachers)) {
        setTeachers(payload.teachers as Teacher[]);
      }
    } catch (error) {
      console.error("Failed to load teachers", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  // Remove is a two-step confirmation: step 1 asks to confirm, step 2 is the
  // final "are you absolutely sure" check before anything is removed.
  const [removeTarget, setRemoveTarget] = useState<Teacher | null>(null);
  const [removeStep, setRemoveStep] = useState<1 | 2>(1);

  const filtered = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = false;
    if (filter === "All") {
      matchesFilter = t.status !== "Deleted";
    } else {
      matchesFilter = t.status === filter;
    }

    return matchesSearch && matchesFilter;
  });

  async function updateStatus(id: string, status: Status) {
    try {
      const response = await fetch("/api/org/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: id, status }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        router.push("/login?error=Please log in as an organization first.");
        return;
      }
      if (!response.ok) {
        alert(payload?.error || "Failed to update teacher status");
        return;
      }
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: payload.teacher.status,
                suspendedBy: payload.teacher.status === "Suspended" ? "org" : null,
              }
            : t
        )
      );
    } catch (error) {
      console.error(error);
      alert("Network error updating teacher status.");
    }
  }

  async function saveAssignments(id: string, assignments: TeacherAssignment[]) {
    try {
      const response = await fetch("/api/org/teachers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: id, assignments }),
      });
      const payload = await response.json();
      if (response.status === 401) {
        router.push("/login?error=Please log in as an organization first.");
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update teacher assignments");
      }
      setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, assignments: payload.teacher.assignments } : t)));
    } catch (error) {
      console.error(error);
    }
  }

  function startRemove(teacher: Teacher) {
    setRemoveTarget(teacher);
    setRemoveStep(1);
  }

  function closeRemove() {
    setRemoveTarget(null);
    setRemoveStep(1);
  }

  function handleFirstConfirm() {
    setRemoveStep(2);
  }

  async function handleFinalConfirm() {
    if (!removeTarget) return;
    const targetId = removeTarget.id;
    try {
      const response = await fetch("/api/org/teachers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: targetId }),
      });
      if (response.status === 401) {
        router.push("/login?error=Please log in as an organization first.");
        return;
      }
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || "Failed to remove teacher");
      }
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === targetId
            ? {
                ...t,
                status: "Deleted",
                deletedBy: "org",
                deletedAt: new Date().toISOString(),
              }
            : t
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      closeRemove();
    }
  }

  async function handleInvite(data: InviteFormData) {
    try {
      const response = await fetch("/api/org/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, assignments: data.assignments }),
      });

      if (response.status === 401) {
        router.push("/login?error=Please log in as an organization first.");
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to invite teacher");
      }

      setTeachers((prev) => [
        {
          id: payload.teacher.id,
          name: payload.teacher.name,
          email: payload.teacher.email,
          assignments: payload.teacher.assignments,
          status: payload.teacher.status,
          joined: payload.teacher.joined,
        },
        ...prev,
      ]);
      setInviteOpen(false);
      setSentDialog({
        open: true,
        name: data.name,
        email: data.email,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  return (
    <>
      <OrgTopbar
        title="Teacher Management"
        description="Invite, organize, and manage teacher permissions and subject assignments."
      />

      <main className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-8 px-4 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  filter === f
                    ? "bg-navy-900 border-navy-900 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-72">
              <Search size={16} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teachers..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
              />
            </div>
            <Button
              onClick={() => setInviteOpen(true)}
              className="gap-2 shrink-0 bg-navy-900 hover:bg-navy-800 text-white"
            >
              <UserPlus size={16} />
              Invite Teacher
            </Button>
          </div>
        </div>

        {/* Table */}
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
              {filtered.map((teacher) => (
                <tr key={teacher.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  {(() => {
                    const departments = uniqueDepartments(teacher);
                    const subjects = uniqueSubjects(teacher);
                    const profileName = teacher.name || teacher.email;
                    return (
                      <>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/teachers/${encodeURIComponent(teacher.id)}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="h-9 w-9 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                        {profileName
                          .split(" ")
                          .map((n) => n[0])
                          .filter(Boolean)
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900 group-hover:underline">{profileName}</p>
                        <p className="text-xs text-slate-400">{teacher.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    {departments.length > 0 ? (
                      <MultiValuePopover
                        values={departments}
                        label="departments"
                        trigger={<Badge variant="info">{departments[0]}</Badge>}
                      />
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {subjects.length > 0 ? (
                      <MultiValuePopover
                        values={subjects}
                        label="subjects"
                        trigger={<span>{subjects[0]}</span>}
                      />
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {renderTeacherStatusBadge(teacher)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{teacher.joined}</td>
                  <td className="px-5 py-3.5 text-right">
                    {teacher.status === "Deleted" ? (
                      <DropdownMenu
                        trigger={
                          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-auto">
                            <MoreVertical size={16} />
                          </button>
                        }
                      >
                        <DropdownItem
                          onClick={() =>
                            router.push(`/teachers/${encodeURIComponent(teacher.id)}`)
                          }
                        >
                          <Eye size={15} /> View Profile
                        </DropdownItem>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenu
                        trigger={
                          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-auto">
                            <MoreVertical size={16} />
                          </button>
                        }
                      >
                        {teacher.status === "Pending" ? (
                          <DropdownItem danger onClick={() => startRemove(teacher)}>
                            <Trash2 size={15} /> Remove
                          </DropdownItem>
                        ) : (
                          <>
                            <DropdownItem
                              onClick={() =>
                                router.push(`/teachers/${encodeURIComponent(teacher.id)}`)
                              }
                            >
                              <Eye size={15} /> View Profile
                            </DropdownItem>
                            <DropdownItem onClick={() => setAssignmentsTarget(teacher)}>
                              <Layers size={15} /> Manage Departments &amp; Subjects
                            </DropdownItem>
                            {teacher.status === "Suspended" && teacher.suspendedBy === "admin" ? (
                              <DropdownItem
                                disabled
                                className="opacity-50 cursor-not-allowed text-xs text-slate-400"
                                title="Suspended by Admin. Only Admin can reactivate."
                              >
                                <Ban size={15} /> Suspended by Admin
                              </DropdownItem>
                            ) : teacher.status !== "Active" ? (
                              <DropdownItem onClick={() => updateStatus(teacher.id, "Active")}>
                                <CheckCircle2 size={15} /> Activate
                              </DropdownItem>
                            ) : null}
                            {teacher.status === "Active" && (
                              <DropdownItem onClick={() => updateStatus(teacher.id, "Suspended")}>
                                <Ban size={15} /> Suspend
                              </DropdownItem>
                            )}
                            <DropdownItem danger onClick={() => startRemove(teacher)}>
                              <Trash2 size={15} /> Remove
                            </DropdownItem>
                          </>
                        )}
                      </DropdownMenu>
                    )}
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    {loading ? "Loading teachers..." : "No teachers match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>

      <InviteTeacherModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
      <InvitationSentDialog
        open={sentDialog.open}
        onClose={() => setSentDialog((prev) => ({ ...prev, open: false }))}
        teacherName={sentDialog.name}
        teacherEmail={sentDialog.email}
      />

      {assignmentsTarget && (
        <ManageAssignmentsModal
          open={!!assignmentsTarget}
          onClose={() => setAssignmentsTarget(null)}
          teacherName={assignmentsTarget.name}
          initialAssignments={assignmentsTarget.assignments}
          onSave={(assignments) => saveAssignments(assignmentsTarget.id, assignments)}
        />
      )}

      {/* Step 1: initial confirmation */}
      <ConfirmDialog
        open={!!removeTarget && removeStep === 1}
        onClose={closeRemove}
        onConfirm={handleFirstConfirm}
        title="Remove this teacher?"
        description={`This will remove ${removeTarget?.name || removeTarget?.email} (${removeTarget?.email}) from your active roster. Past examination questions and results will remain preserved.`}
        confirmLabel="Continue"
      />

      {/* Step 2: final double-check before the removal actually happens */}
      <ConfirmDialog
        open={!!removeTarget && removeStep === 2}
        onClose={closeRemove}
        onConfirm={handleFinalConfirm}
        title="Are you absolutely sure?"
        description={`This is your final confirmation. ${removeTarget?.name || removeTarget?.email}'s account will be removed from your active teacher list.`}
        confirmLabel="Yes, Remove"
      />
    </>
  );
}
