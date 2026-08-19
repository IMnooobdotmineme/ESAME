"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Radio,
  MoreVertical,
  CheckCircle2,
  Ban,
  Trash2,
  Eye,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type OrgStatus = "Active" | "Suspended";
type StatusFilter = "All" | OrgStatus;

interface OrganizationSummary {
  id: string;
  name: string;
  email: string;
  status: OrgStatus;
  teachersCount: number;
  liveExaminers: number;
  liveExams: number;
}

const STATUS_VARIANT: Record<OrgStatus, "success" | "warning" | "danger" | "neutral"> = {
  Active: "success",
  Suspended: "danger",
};

const STATUS_TABS: StatusFilter[] = ["All", "Active", "Suspended"];

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  // Delete is a two-step confirmation: step 1 asks to confirm, step 2 is the
  // final "are you absolutely sure" check before anything is removed.
  const [deleteTarget, setDeleteTarget] = useState<OrganizationSummary | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadOrganizations() {
    try {
      const res = await fetch("/api/admin/organizations");
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.organizations || []);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      org.name.toLowerCase().includes(query) ||
      (org.email && org.email.toLowerCase().includes(query));
    const matchesStatus = statusFilter === "All" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function updateStatus(id: string, nextStatus: OrgStatus) {
    const previous = [...organizations];
    // Optimistic update
    setOrganizations((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    );

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrganizations(previous);
        alert(data?.error || "Failed to update organization status. Please try again.");
      }
    } catch (err) {
      console.error("Error updating organization status:", err);
      setOrganizations(previous);
      alert("Network error updating status.");
    }
  }

  function startDelete(org: OrganizationSummary) {
    setDeleteTarget(org);
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
      const res = await fetch("/api/admin/organizations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: targetId }),
      });
      const data = await res.json();

      if (res.ok) {
        setOrganizations((prev) => prev.filter((o) => o.id !== targetId));
        closeDelete();
      } else {
        alert(data?.error || "Failed to delete organization.");
      }
    } catch (err) {
      console.error("Error deleting organization:", err);
      alert("Network error deleting organization.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <>
      <AdminTopbar
        title="Organizations"
        description="View organizations and control their access to the platform."
      />

      <main className="p-6 space-y-6">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organization by name or email..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Organization cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-400">Loading organizations...</p>
            </div>
          ) : filteredOrgs.length > 0 ? (
            filteredOrgs.map((org) => (
              <Card key={org.id} className="p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={STATUS_VARIANT[org.status]}>{org.status}</Badge>
                    <DropdownMenu
                      trigger={
                        <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                          <MoreVertical size={16} />
                        </button>
                      }
                    >
                      {org.status === "Suspended" && (
                        <DropdownItem onClick={() => updateStatus(org.id, "Active")}>
                          <CheckCircle2 size={15} /> Activate
                        </DropdownItem>
                      )}
                      {org.status === "Active" && (
                        <DropdownItem onClick={() => updateStatus(org.id, "Suspended")}>
                          <Ban size={15} /> Suspend
                        </DropdownItem>
                      )}
                      <DropdownItem danger onClick={() => startDelete(org)}>
                        <Trash2 size={15} /> Delete Organization
                      </DropdownItem>
                    </DropdownMenu>
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-navy-900 leading-snug">
                      {org.name}
                    </h2>
                    {org.email && (
                      <p className="text-xs text-slate-400 mt-0.5">{org.email}</p>
                    )}
                  </div>

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

      {/* Step 1: initial confirmation */}
      <ConfirmDialog
        open={!!deleteTarget && deleteStep === 1}
        onClose={closeDelete}
        onConfirm={handleFirstConfirm}
        title="Delete organization?"
        description={`This will permanently remove "${deleteTarget?.name}" and all of its teacher accounts. This action cannot be undone.`}
        confirmLabel="Continue"
      />

      {/* Step 2: final double-check before the delete actually happens */}
      <ConfirmDialog
        open={!!deleteTarget && deleteStep === 2}
        onClose={closeDelete}
        onConfirm={handleFinalConfirm}
        title="Are you absolutely sure?"
        description={`This is your final confirmation. "${deleteTarget?.name}" and all associated teacher accounts will be permanently deleted right now.`}
        confirmLabel={actionLoading ? "Deleting..." : "Delete Permanently"}
      />
    </>
  );
}