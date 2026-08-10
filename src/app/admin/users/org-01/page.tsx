"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserCheck,
  GraduationCap,
  School,
  Plus,
  ChevronRight,
  Filter,
  Mail,
  Shield,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  department: string;
  orgCode: string;
  status: "active" | "suspended";
  joinedDate: string;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "student">("all");

  // Mock User Database (Teachers & Students)
  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: "USR-101",
      name: "Professor Julian Vance",
      email: "j.vance@university.edu",
      role: "teacher",
      department: "Computer Science",
      orgCode: "ORG-01",
      status: "active",
      joinedDate: "Sep 2024",
    },
    {
      id: "USR-102",
      name: "Dr. Aris Thorne",
      email: "a.thorne@university.edu",
      role: "teacher",
      department: "Software Engineering",
      orgCode: "ORG-01",
      status: "active",
      joinedDate: "Jan 2025",
    },
    {
      id: "USR-201",
      name: "Marcus Vance",
      email: "m.vance@student.edu",
      role: "student",
      department: "Computer Science",
      orgCode: "ORG-01",
      status: "active",
      joinedDate: "Aug 2025",
    },
    {
      id: "USR-202",
      name: "Sarah Jenkins",
      email: "s.jenkins@student.edu",
      role: "student",
      department: "Computer Science",
      orgCode: "ORG-01",
      status: "active",
      joinedDate: "Aug 2025",
    },
    {
      id: "USR-203",
      name: "David Miller",
      email: "d.miller@student.edu",
      role: "student",
      department: "Cybersecurity",
      orgCode: "ORG-02",
      status: "suspended",
      joinedDate: "Oct 2025",
    },
  ]);

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const teacherCount = users.filter((u) => u.role === "teacher").length;
  const studentCount = users.filter((u) => u.role === "student").length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          {/* BACK BUTTON REDIRECTING TO /admin/users */}
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users Directory</span>
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            User Management Directory
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            View, filter, and manage faculty teachers and enrolled students across organizations.
          </p>
        </div>

        <button
          type="button"
          className="bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{users.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Faculty Teachers</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{teacherCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <School className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Students</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{studentCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEARCH & TAB FILTERS */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Role Tabs */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              roleFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Users ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("teacher")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              roleFilter === "teacher" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Teachers ({teacherCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("student")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              roleFilter === "student" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Students ({studentCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, department or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">User Profile</th>
                <th className="p-4">Role</th>
                <th className="p-4">Department</th>
                <th className="p-4">Org Code</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{user.email}</span>
                      </p>
                    </td>

                    <td className="p-4">
                      {user.role === "teacher" ? (
                        <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                          <School className="w-3 h-3" /> Teacher
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" /> Student
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-medium text-slate-800">{user.department}</td>

                    <td className="p-4">
                      <Link
                        href={`/admin/users/${user.orgCode.toLowerCase()}`}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-[10px] rounded border border-slate-200 transition-colors inline-block"
                      >
                        {user.orgCode}
                      </Link>
                    </td>

                    <td className="p-4">
                      {user.status === "active" ? (
                        <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Suspended
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <Link
                        href={`/admin/users/${user.orgCode.toLowerCase()}`}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <span>View Org</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}