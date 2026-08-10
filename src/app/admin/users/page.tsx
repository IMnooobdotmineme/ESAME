"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  Search,
  ArrowLeft,
  ChevronRight,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserCheck,
  UserX,
  AlertOctagon,
  Radio,
} from "lucide-react";

// Types
type UserStatus = "active" | "deactivated" | "suspended";
type UserRole = "teacher" | "student";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  isOnline: boolean;
  lastActive: string;
}

interface Organization {
  id: string;
  name: string;
  code: string;
  totalTeachers: number;
  totalStudents: number;
  activeSessions: number;
  status: "active" | "suspended";
  users: ManagedUser[];
}

export default function AdminUsersPage() {
  // Mock Organizations & Users Data
  const [organizations, setOrganizations] = useState<Organization[]>([
    {
      id: "org-01",
      name: "Faculty of Computer Science & Engineering",
      code: "FCSE-MAIN",
      totalTeachers: 14,
      totalStudents: 320,
      activeSessions: 3,
      status: "active",
      users: [
        {
          id: "usr-101",
          name: "Dr. Robert Chen",
          email: "r.chen@university.edu",
          role: "teacher",
          status: "active",
          isOnline: true,
          lastActive: "Online now",
        },
        {
          id: "usr-102",
          name: "Prof. Sarah Jenkins",
          email: "s.jenkins@university.edu",
          role: "teacher",
          status: "active",
          isOnline: false,
          lastActive: "15 mins ago",
        },
        {
          id: "usr-103",
          name: "Dr. Marcus Vance",
          email: "m.vance@university.edu",
          role: "teacher",
          status: "suspended",
          isOnline: false,
          lastActive: "3 days ago",
        },
        {
          id: "usr-201",
          name: "Alexander Wright",
          email: "CS-2026-0042",
          role: "student",
          status: "active",
          isOnline: true,
          lastActive: "Online now",
        },
        {
          id: "usr-202",
          name: "Emily Ross",
          email: "CS-2026-0115",
          role: "student",
          status: "deactivated",
          isOnline: false,
          lastActive: "Jul 20, 2026",
        },
      ],
    },
    {
      id: "org-02",
      name: "School of Software Development",
      code: "SSD-CAMPUS",
      totalTeachers: 8,
      totalStudents: 180,
      activeSessions: 1,
      status: "active",
      users: [
        {
          id: "usr-301",
          name: "Dr. Alan Turing",
          email: "a.turing@ssd.edu",
          role: "teacher",
          status: "active",
          isOnline: true,
          lastActive: "Online now",
        },
        {
          id: "usr-401",
          name: "Grace Hopper",
          email: "SE-2026-0088",
          role: "student",
          status: "active",
          isOnline: false,
          lastActive: "1 hour ago",
        },
      ],
    },
  ]);

  // Navigation State
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [userRoleTab, setUserRoleTab] = useState<UserRole>("teacher");
  const [searchQuery, setSearchQuery] = useState("");

  const currentOrg = organizations.find((o) => o.id === selectedOrgId);

  // Status Handlers
  const handleUpdateStatus = (userId: string, newStatus: UserStatus) => {
    if (!selectedOrgId) return;

    setOrganizations((prevOrgs) =>
      prevOrgs.map((org) => {
        if (org.id !== selectedOrgId) return org;
        return {
          ...org,
          users: org.users.map((u) =>
            u.id === userId ? { ...u, status: newStatus } : u
          ),
        };
      })
    );
  };

  // Force Logout Handler
  const handleForceLogout = (userId: string) => {
    if (!selectedOrgId) return;

    setOrganizations((prevOrgs) =>
      prevOrgs.map((org) => {
        if (org.id !== selectedOrgId) return org;
        return {
          ...org,
          users: org.users.map((u) =>
            u.id === userId ? { ...u, isOnline: false, lastActive: "Forced logout" } : u
          ),
        };
      })
    );
  };

  // Filtered Users for Level 2
  const filteredUsers =
    currentOrg?.users.filter(
      (u) =>
        u.role === userRoleTab &&
        (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || [];

  return (
    <div className="w-full space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl min-h-screen text-slate-800">
      {/* LEVEL 1: ORGANIZATION SELECTION VIEW */}
      {!selectedOrgId && (
        <div className="space-y-6">
          {/* FLAT PAGE HEADER */}
          <div className="pb-2 border-b border-[#D5DEEF]/60">
            <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
              SYSTEM GOVERNANCE
            </span>
            <h1 className="text-2xl font-black text-[#395886] tracking-tight">
              Manage Organizations & Users
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Select an educational organization below to manage its teacher and student directory.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search organization by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#D5DEEF] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] transition-all"
            />
          </div>

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {organizations
              .filter(
                (o) =>
                  o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  o.code.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((org) => (
                <div
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgId(org.id);
                    setSearchQuery("");
                  }}
                  className="bg-white p-6 rounded-2xl border border-[#D5DEEF] hover:border-[#638ECB] transition-all shadow-xs hover:shadow-md cursor-pointer group space-y-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold font-mono text-[#395886] bg-[#F0F3FA] px-2.5 py-1 rounded-md tracking-wide uppercase inline-block border border-[#D5DEEF]">
                        {org.code}
                      </span>
                      <h3 className="text-base font-extrabold text-[#395886] group-hover:text-[#2e476d] transition-colors pt-1">
                        {org.name}
                      </h3>
                    </div>

                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wide shrink-0">
                      Active
                    </span>
                  </div>

                  {/* Quick User Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-[#F0F3FA] p-3 rounded-xl text-center border border-[#D5DEEF]/50">
                      <p className="text-[10px] font-bold text-[#8AAEE0] uppercase">Teachers</p>
                      <p className="text-sm font-black text-[#395886] mt-0.5">{org.totalTeachers}</p>
                    </div>
                    <div className="bg-[#F0F3FA] p-3 rounded-xl text-center border border-[#D5DEEF]/50">
                      <p className="text-[10px] font-bold text-[#8AAEE0] uppercase">Students</p>
                      <p className="text-sm font-black text-[#395886] mt-0.5">{org.totalStudents}</p>
                    </div>
                    <div className="bg-[#F0F3FA] p-3 rounded-xl text-center border border-[#D5DEEF]/50">
                      <p className="text-[10px] font-bold text-[#8AAEE0] uppercase">Online Now</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                        <Radio className="w-3 h-3 animate-pulse" />
                        {org.users.filter((u) => u.isOnline).length}
                      </p>
                    </div>
                  </div>

                  {/* Open Link */}
                  <div className="flex items-center justify-end gap-1 text-xs font-bold text-[#395886] group-hover:translate-x-1 transition-transform pt-1">
                    <span>Manage Organization Roster</span>
                    <ChevronRight className="w-4 h-4 text-[#638ECB]" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: ORGANIZATION USER MANAGEMENT ROSTER */}
      {selectedOrgId && currentOrg && (
        <div className="space-y-6">
          {/* FLAT PAGE HEADER WITH BACK BUTTON */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5DEEF]/60">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedOrgId(null);
                  setSearchQuery("");
                }}
                className="text-xs font-bold text-[#395886] hover:text-[#638ECB] flex items-center gap-1 mb-2 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#395886]" />
                <span>Back to All Organizations</span>
              </button>
              <h1 className="text-2xl font-black text-[#395886] tracking-tight">
                {currentOrg.name}
              </h1>
              <p className="text-xs font-medium text-slate-500 font-mono">
                Organization Code: {currentOrg.code}
              </p>
            </div>
          </div>

          {/* USER ROLE SWITCHER & SEARCH BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-[#D5DEEF] w-full sm:w-auto">
              <button
                onClick={() => setUserRoleTab("teacher")}
                className={`pb-3 px-4 text-xs font-bold transition-all cursor-pointer relative ${
                  userRoleTab === "teacher"
                    ? "text-[#395886] border-b-2 border-[#395886]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Teachers ({currentOrg.users.filter((u) => u.role === "teacher").length})
              </button>
              <button
                onClick={() => setUserRoleTab("student")}
                className={`pb-3 px-4 text-xs font-bold transition-all cursor-pointer relative ${
                  userRoleTab === "student"
                    ? "text-[#395886] border-b-2 border-[#395886]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Students ({currentOrg.users.filter((u) => u.role === "student").length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${userRoleTab}s...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#D5DEEF] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] transition-all"
              />
            </div>
          </div>

          {/* USER ROSTER TABLE */}
          <div className="bg-white rounded-2xl border border-[#D5DEEF] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D5DEEF] bg-[#F0F3FA] text-[10px] font-black text-[#8AAEE0] uppercase tracking-wider">
                    <th className="p-4 pl-6">User Identification</th>
                    <th className="p-4">Session State</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Status Control</th>
                    <th className="p-4 pr-6 text-right">Session Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5DEEF]/60 text-xs font-medium text-slate-700">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#F0F3FA]/50 transition-colors">
                        {/* Name & Identifier */}
                        <td className="p-4 pl-6">
                          <p className="font-extrabold text-[#395886]">{user.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{user.email}</p>
                        </td>

                        {/* Session State */}
                        <td className="p-4">
                          {user.isOnline ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active Session
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">
                              {user.lastActive}
                            </span>
                          )}
                        </td>

                        {/* Account Status Badge */}
                        <td className="p-4">
                          {user.status === "active" && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                              Active
                            </span>
                          )}
                          {user.status === "deactivated" && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                              Deactivated
                            </span>
                          )}
                          {user.status === "suspended" && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                              Suspended
                            </span>
                          )}
                        </td>

                        {/* Status Control Actions */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            {user.status !== "active" && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "active")}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Activate Account"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Activate</span>
                              </button>
                            )}

                            {user.status !== "deactivated" && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "deactivated")}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Deactivate Account"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Deactivate</span>
                              </button>
                            )}

                            {user.status !== "suspended" && (
                              <button
                                onClick={() => handleUpdateStatus(user.id, "suspended")}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                                title="Suspend Account"
                              >
                                <AlertOctagon className="w-3 h-3" />
                                <span>Suspend</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Session Control Actions */}
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleForceLogout(user.id)}
                            disabled={!user.isOnline}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                              user.isOnline
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 cursor-pointer active:scale-[0.98]"
                                : "bg-slate-50 text-slate-300 border border-slate-200 cursor-not-allowed"
                            }`}
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Force Logout</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-bold">
                        No {userRoleTab}s found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}