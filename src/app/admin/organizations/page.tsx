"use client";

import React, { useState } from "react";
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Trash2,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  Building,
  MoreVertical,
} from "lucide-react";

// Types
type OrgStatus = "pending" | "active" | "deactivated" | "suspended";

interface OrganizationRequest {
  id: string;
  name: string;
  code: string;
  contactEmail: string;
  requestedBy: string;
  requestedAt: string;
  status: OrgStatus;
  totalTeachers: number;
  totalExams: number;
}

export default function AdminOrganizationsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock Organizations Data based on SRS 3.1.1 Requirements
  const [organizations, setOrganizations] = useState<OrganizationRequest[]>([
    {
      id: "org-req-01",
      name: "Institute of Technology & Science",
      code: "ITS-MAIN",
      contactEmail: "admin@its.edu",
      requestedBy: "Dr. James Wilson",
      requestedAt: "10 mins ago",
      status: "pending",
      totalTeachers: 0,
      totalExams: 0,
    },
    {
      id: "org-req-02",
      name: "National School of Engineering",
      code: "NSE-CAMPUS",
      contactEmail: "contact@nse.edu",
      requestedBy: "Prof. Maria Santos",
      requestedAt: "2 hours ago",
      status: "pending",
      totalTeachers: 0,
      totalExams: 0,
    },
    {
      id: "org-01",
      name: "Faculty of Computer Science & Engineering",
      code: "FCSE-MAIN",
      contactEmail: "deans.office@fcse.edu",
      requestedBy: "Dr. Robert Chen",
      requestedAt: "Jul 10, 2026",
      status: "active",
      totalTeachers: 14,
      totalExams: 42,
    },
    {
      id: "org-02",
      name: "School of Software Development",
      code: "SSD-CAMPUS",
      contactEmail: "info@ssd.edu",
      requestedBy: "Dr. Alan Turing",
      requestedAt: "Jun 15, 2026",
      status: "suspended",
      totalTeachers: 8,
      totalExams: 18,
    },
  ]);

  // SRS 3.1.1 Action Handlers
  const handleApprove = (id: string) => {
    setOrganizations((prev) =>
      prev.map((org) => (org.id === id ? { ...org, status: "active" } : org))
    );
  };

  const handleReject = (id: string) => {
    setOrganizations((prev) => prev.filter((org) => org.id !== id));
  };

  const handleUpdateStatus = (id: string, status: OrgStatus) => {
    setOrganizations((prev) =>
      prev.map((org) => (org.id === id ? { ...org, status } : org))
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this organization?")) {
      setOrganizations((prev) => prev.filter((org) => org.id !== id));
    }
  };

  const pendingCount = organizations.filter((o) => o.status === "pending").length;
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "pending") return matchesSearch && org.status === "pending";
    return matchesSearch && org.status !== "pending";
  });

  return (
    <div className="w-full space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl min-h-screen text-slate-800">
      {/* FLAT PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5DEEF]/60">
        <div>
          <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
            SYSTEM CONTROL
          </span>
          <h1 className="text-2xl font-black text-[#395886] tracking-tight">
            Organization Management
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Approve onboarding requests, activate, deactivate, suspend, or delete educational institutions[cite: 1].
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-[#D5DEEF] w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-4 text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === "pending"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Pending Approvals ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-4 text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === "all"
                ? "text-[#395886] border-b-2 border-[#395886]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Managed Organizations ({organizations.length - pendingCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#D5DEEF] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] transition-all"
          />
        </div>
      </div>

      {/* ORGANIZATIONS ROSTER TABLE */}
      <div className="bg-white rounded-2xl border border-[#D5DEEF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D5DEEF] bg-[#F0F3FA] text-[10px] font-black text-[#8AAEE0] uppercase tracking-wider">
                <th className="p-4 pl-6">Institution Meta</th>
                <th className="p-4">Applicant / Contact</th>
                <th className="p-4">Metrics</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D5DEEF]/60 text-xs font-medium text-slate-700">
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-[#F0F3FA]/50 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-extrabold text-[#395886]">{org.name}</p>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-[#F0F3FA] px-2 py-0.5 rounded border border-[#D5DEEF] inline-block mt-0.5">
                        {org.code}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-700">{org.requestedBy}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{org.contactEmail}</p>
                    </td>

                    <td className="p-4">
                      {org.status === "pending" ? (
                        <span className="text-slate-400 italic text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Requested {org.requestedAt}
                        </span>
                      ) : (
                        <div className="text-[11px] space-x-3 font-bold text-[#395886]">
                          <span>{org.totalTeachers} Teachers</span>
                          <span>•</span>
                          <span>{org.totalExams} Exams</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {org.status === "pending" && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          Pending Approval
                        </span>
                      )}
                      {org.status === "active" && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          Active
                        </span>
                      )}
                      {org.status === "deactivated" && (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          Deactivated
                        </span>
                      )}
                      {org.status === "suspended" && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      {org.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(org.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(org.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {org.status !== "active" && (
                            <button
                              onClick={() => handleUpdateStatus(org.id, "active")}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Activate</span>
                            </button>
                          )}

                          {org.status !== "deactivated" && (
                            <button
                              onClick={() => handleUpdateStatus(org.id, "deactivated")}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Deactivate</span>
                            </button>
                          )}

                          {org.status !== "suspended" && (
                            <button
                              onClick={() => handleUpdateStatus(org.id, "suspended")}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <AlertOctagon className="w-3 h-3" />
                              <span>Suspend</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(org.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Organization"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs font-bold">
                    No organizations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}