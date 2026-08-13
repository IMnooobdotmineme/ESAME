"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { InviteTeacherModal, InviteFormData } from "@/components/organization/InviteTeacherModal";
import { InvitationSentDialog } from "@/components/organization/InvitationSentDialog";
import { DEPARTMENTS } from "@/lib/academic-structure-data";
import { INITIAL_TEACHERS, Teacher, TeacherStatus as Status } from "@/lib/teachers-data";
import {
  UserPlus,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
  Eye,
} from "lucide-react";

const STATUS_VARIANT: Record<Status, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Pending: "warning",
  Suspended: "danger",
  Deactivated: "neutral",
};

const FILTERS: ("All" | Status)[] = ["All", "Active", "Pending", "Suspended", "Deactivated"];

export default function TeacherManagementPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sentDialog, setSentDialog] = useState<{ open: boolean; name: string; email: string }>({
    open: false,
    name: "",
    email: "",
  });

  const filtered = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  function updateStatus(id: string, status: Status) {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function removeTeacher(id: string) {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  }

  function handleInvite(data: InviteFormData) {
    const department = DEPARTMENTS.find((d) => d.id === data.departmentId);
    const subject = department?.subjects.find((s) => s.id === data.subjectId);

    setTeachers((prev) => [
      {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        department: department?.name ?? "—",
        subject: subject?.name ?? "—",
        status: "Pending",
        joined: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
      ...prev,
    ]);

    setInviteOpen(false);
    setSentDialog({
      open: true,
      name: data.name,
      email: data.email,
    });
  }

  const counts = {
    All: teachers.length,
    Active: teachers.filter((t) => t.status === "Active").length,
    Pending: teachers.filter((t) => t.status === "Pending").length,
    Suspended: teachers.filter((t) => t.status === "Suspended").length,
    Deactivated: teachers.filter((t) => t.status === "Deactivated").length,
  };

  return (
    <>
      <OrgTopbar title="Teacher Management" description="Invite, manage, and monitor teacher accounts" />

      <main className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-80">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} />
            Invite Teacher
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
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
              {f} <span className="opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
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
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/teachers/${encodeURIComponent(teacher.name)}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="h-9 w-9 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                        {teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-navy-900 group-hover:underline">{teacher.name}</p>
                        <p className="text-xs text-slate-400">{teacher.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant="info">{teacher.department}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{teacher.subject}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={STATUS_VARIANT[teacher.status]}>{teacher.status}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{teacher.joined}</td>
                  <td className="px-5 py-3.5 text-right">
                    <DropdownMenu
                      trigger={
                        <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-auto">
                          <MoreVertical size={16} />
                        </button>
                      }
                    >
                      {teacher.status === "Pending" ? (
                        <DropdownItem danger onClick={() => removeTeacher(teacher.id)}>
                          <Trash2 size={15} /> Remove
                        </DropdownItem>
                      ) : (
                        <>
                          <DropdownItem
                            onClick={() =>
                              router.push(`/teachers/${encodeURIComponent(teacher.name)}`)
                            }
                          >
                            <Eye size={15} /> View Profile
                          </DropdownItem>
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
                          <DropdownItem danger onClick={() => removeTeacher(teacher.id)}>
                            <Trash2 size={15} /> Remove
                          </DropdownItem>
                        </>
                      )}
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No teachers match your search.
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
    </>
  );
}