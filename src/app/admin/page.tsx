"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  School,
  GraduationCap,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
  LogOut,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type UserStatus = "Active" | "Suspended" | "Deactivated";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "examiner";
  organization: string;
  orgId: string;
  status: UserStatus;
  joinedDate: string;
}

const STATUS_VARIANT: Record<UserStatus, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Suspended: "danger",
  Deactivated: "neutral",
};

const INITIAL_USERS: UserRecord[] = [
  { id: "USR-101", name: "Professor Julian Vance", email: "j.vance@university.edu", role: "teacher", organization: "Faculty of Computer Science & Engineering", orgId: "org-01", status: "Active", joinedDate: "Sep 2024" },
  { id: "USR-102", name: "Dr. Aris Thorne", email: "a.thorne@university.edu", role: "teacher", organization: "Faculty of Computer Science & Engineering", orgId: "org-01", status: "Active", joinedDate: "Jan 2025" },
  { id: "USR-103", name: "Chan Sopheak", email: "chan.sopheak@ssd.edu", role: "teacher", organization: "School of Software Development", orgId: "org-02", status: "Active", joinedDate: "Feb 2025" },
  { id: "USR-104", name: "Ly Vannak", email: "ly.vannak@its.edu", role: "teacher", organization: "Institute of Technology & Science", orgId: "org-03", status: "Active", joinedDate: "Jul 2025" },
  { id: "USR-201", name: "Marcus Vance", email: "m.vance@student.edu", role: "examiner", organization: "Faculty of Computer Science & Engineering", orgId: "org-01", status: "Active", joinedDate: "Aug 2025" },
  { id: "USR-202", name: "Sarah Jenkins", email: "s.jenkins@student.edu", role: "examiner", organization: "Faculty of Computer Science & Engineering", orgId: "org-01", status: "Active", joinedDate: "Aug 2025" },
  { id: "USR-203", name: "David Miller", email: "d.miller@student.edu", role: "examiner", organization: "School of Software Development", orgId: "org-02", status: "Suspended", joinedDate: "Oct 2025" },
  { id: "USR-204", name: "Ros Chenda", email: "r.chenda@student.edu", role: "examiner", organization: "National School of Engineering", orgId: "org-04", status: "Active", joinedDate: "Nov 2025" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "examiner">("all");
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [logoutTarget, setLogoutTarget] = useState<UserRecord | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.organization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const teacherCount = users.filter((u) => u.role === "teacher").length;
  const examinerCount = users.filter((u) => u.role === "examiner").length;

  function updateStatus(id: string, status: UserStatus) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function confirmLogout() {
    // TODO: wire to real session-invalidation endpoint once backend auth is available
    setLogoutTarget(null);
  }

  return (
    <>
      <AdminTopbar
        title="Users"
        description="View teachers and examiners across all organizations."
      />

      <main className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "teacher", "examiner"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={
                  roleFilter === f
                    ? "rounded-full px-4 py-1.5 text-sm font-medium bg-navy-900 text-white"
                    : "rounded-full px-4 py-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              >
                {f === "all" ? `All (${users.length})` : f === "teacher" ? `Teachers (${teacherCount})` : `Examiners (${examinerCount})`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-80">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or organization..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Organization</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-navy-900">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.role === "teacher" ? (
                        <Badge variant="info">
                          <School size={12} /> Teacher
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <GraduationCap size={12} /> Examiner
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/organizations/${user.orgId}`}
                        className="text-slate-600 hover:text-sky-600 transition-colors"
                      >
                        {user.organization}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{user.joinedDate}</td>
                    <td className="px-5 py-3.5 text-right">
                      <DropdownMenu
                        trigger={
                          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 ml-auto">
                            <MoreVertical size={16} />
                          </button>
                        }
                      >
                        {user.status !== "Active" && (
                          <DropdownItem onClick={() => updateStatus(user.id, "Active")}>
                            <CheckCircle2 size={15} /> Activate
                          </DropdownItem>
                        )}
                        {user.status === "Active" && (
                          <DropdownItem onClick={() => updateStatus(user.id, "Deactivated")}>
                            <XCircle size={15} /> Deactivate
                          </DropdownItem>
                        )}
                        {user.status !== "Suspended" && (
                          <DropdownItem onClick={() => updateStatus(user.id, "Suspended")}>
                            <Ban size={15} /> Suspend
                          </DropdownItem>
                        )}
                        <DropdownItem onClick={() => setLogoutTarget(user)}>
                          <LogOut size={15} /> Force Logout
                        </DropdownItem>
                        <DropdownItem danger onClick={() => setDeleteTarget(user)}>
                          <Trash2 size={15} /> Delete User
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
        title="Delete user account?"
        description={`This will permanently remove ${deleteTarget?.name} (${deleteTarget?.email}) from the platform. This action cannot be undone.`}
        confirmLabel="Delete User"
      />

      <ConfirmDialog
        open={!!logoutTarget}
        onClose={() => setLogoutTarget(null)}
        onConfirm={confirmLogout}
        title="Force logout this user?"
        description={`${logoutTarget?.name} will be immediately signed out of all active sessions and must log in again.`}
        confirmLabel="Force Logout"
      />
    </>
  );
}
