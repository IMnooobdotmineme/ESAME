"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Radio,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Ban,
  Trash2,
  Eye,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type OrgStatus = "Active" | "Suspended" | "Deactivated";

interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
  status: OrgStatus;
  teachersCount: number;
  /** Guest examiners currently inside a live exam session. Examiners have no
   *  account (guest mode), so this is a live headcount, not a registry —
   *  it drops back to 0 once the exam ends. */
  liveExaminers: number;
  liveExams: number;
}

const STATUS_VARIANT: Record<OrgStatus, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Suspended: "danger",
  Deactivated: "neutral",
};

const INITIAL_ORGS: OrganizationSummary[] = [
  {
    id: "org-01",
    name: "Faculty of Computer Science & Engineering",
    code: "FCSE-MAIN",
    status: "Active",
    teachersCount: 14,
    liveExaminers: 42,
    liveExams: 2,
  },
  {
    id: "org-02",
    name: "School of Software Development",
    code: "SSD-CAMPUS",
    status: "Active",
    teachersCount: 8,
    liveExaminers: 0,
    liveExams: 0,
  },
  {
    id: "org-03",
    name: "Institute of Technology & Science",
    code: "ITS-MAIN",
    status: "Active",
    teachersCount: 24,
    liveExaminers: 51,
    liveExams: 1,
  },
  {
    id: "org-04",
    name: "National School of Engineering",
    code: "NSE-CAMPUS",
    status: "Suspended",
    teachersCount: 18,
    liveExaminers: 0,
    liveExams: 0,
  },
];

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(INITIAL_ORGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OrganizationSummary | null>(null);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function updateStatus(id: string, status: OrgStatus) {
    setOrganizations((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    setOrganizations((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <>
      <AdminTopbar
        title="Organizations"
        description="View organizations and control their access to the platform."
      />

      <main className="p-6 space-y-6">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-96">
          <Search size={16} className="text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organization by name or code..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
          />
        </div>

        {/* Organization cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOrgs.length > 0 ? (
            filteredOrgs.map((org) => (
              <Card key={org.id} className="p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      {org.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[org.status]}>{org.status}</Badge>
                      <DropdownMenu
                        trigger={
                          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                            <MoreVertical size={16} />
                          </button>
                        }
                      >
                        {org.status !== "Active" && (
                          <DropdownItem onClick={() => updateStatus(org.id, "Active")}>
                            <CheckCircle2 size={15} /> Activate
                          </DropdownItem>
                        )}
                        {org.status === "Active" && (
                          <DropdownItem onClick={() => updateStatus(org.id, "Deactivated")}>
                            <XCircle size={15} /> Deactivate
                          </DropdownItem>
                        )}
                        {org.status !== "Suspended" && (
                          <DropdownItem onClick={() => updateStatus(org.id, "Suspended")}>
                            <Ban size={15} /> Suspend
                          </DropdownItem>
                        )}
                        <DropdownItem danger onClick={() => setDeleteTarget(org)}>
                          <Trash2 size={15} /> Delete Organization
                        </DropdownItem>
                      </DropdownMenu>
                    </div>
                  </div>

                  <h2 className="text-base font-semibold text-navy-900 leading-snug">
                    {org.name}
                  </h2>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Teachers
                      </p>
                      <p className="text-base font-semibold text-navy-900 mt-0.5">
                        {org.teachersCount}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Live Examiners
                      </p>
                      <p className="text-base font-semibold text-navy-900 mt-0.5">
                        {org.liveExaminers}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 text-center">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                        Exam Activity
                      </p>
                      <p
                        className={`text-sm font-semibold mt-0.5 inline-flex items-center gap-1 justify-center ${
                          org.liveExams > 0 ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {org.liveExams > 0 ? (
                          <Radio size={12} className="animate-pulse text-emerald-500" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        )}
                        {org.liveExams > 0 ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Link
                    href={`/organizations/${org.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 group"
                  >
                    <Eye size={13} />
                    <span>View Roster</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-400">
                No organizations found matching "{searchQuery}".
              </p>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete organization?"
        description={`This will permanently remove "${deleteTarget?.name}" and all of its teacher and examiner accounts. This action cannot be undone.`}
        confirmLabel="Delete Organization"
      />
    </>
  );
}
