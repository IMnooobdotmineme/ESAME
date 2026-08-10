"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Radio } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

interface OrganizationSummary {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  teachersCount: number;
  studentsCount: number;
  onlineCount: number;
}

export default function AdminManageOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [organizations] = useState<OrganizationSummary[]>([
    {
      id: "org-01",
      name: "Faculty of Computer Science & Engineering",
      code: "FCSE-MAIN",
      status: "active",
      teachersCount: 14,
      studentsCount: 320,
      onlineCount: 2,
    },
    {
      id: "org-02",
      name: "School of Software Development",
      code: "SSD-CAMPUS",
      status: "active",
      teachersCount: 8,
      studentsCount: 180,
      onlineCount: 1,
    },
    {
      id: "org-03",
      name: "Institute of Technology & Science",
      code: "ITS-MAIN",
      status: "active",
      teachersCount: 24,
      studentsCount: 520,
      onlineCount: 5,
    },
    {
      id: "org-04",
      name: "National School of Engineering",
      code: "NSE-CAMPUS",
      status: "active",
      teachersCount: 18,
      studentsCount: 340,
      onlineCount: 3,
    },
  ]);

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <AdminTopbar
        title="Manage Organizations & Users"
        description="Select an educational organization below to manage its teacher and student directory."
      />

      <main className="p-6 space-y-6 font-sans">
      {/* SEARCH BAR */}
      <div className="relative w-full sm:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search organization by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 shadow-2xs"
        />
      </div>

      {/* ORGANIZATION CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrgs.length > 0 ? (
          filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* CARD TOP META */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase">
                    {org.code}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                </div>

                {/* CARD TITLE */}
                <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {org.name}
                </h2>

                {/* METRICS SUB-BOXES */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Teachers
                    </p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {org.teachersCount}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Students
                    </p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {org.studentsCount}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Online Now
                    </p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5 inline-flex items-center gap-1 justify-center">
                      <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                      {org.onlineCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION FOOTER LINK */}
              <div className="pt-2 flex justify-end">
                <Link
                  href={`/admin/users/${org.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors group cursor-pointer"
                >
                  <span>Manage Organization Roster</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-xs font-medium text-slate-400">
              No organizations found matching "{searchQuery}".
            </p>
          </div>
        )}
      </div>
      </main>
    </>
  );
}