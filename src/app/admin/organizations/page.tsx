"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
} from "lucide-react";

export default function AdminOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const organizations = [
    {
      id: "ORG-101",
      name: "Stanford University",
      domain: "stanford.edu",
      teachersCount: 340,
      examsCount: 2150,
      tier: "Enterprise",
      status: "active",
      createdDate: "Jan 10, 2024",
    },
    {
      id: "ORG-102",
      name: "MIT School of Science",
      domain: "mit.edu",
      teachersCount: 280,
      examsCount: 1890,
      tier: "Enterprise",
      status: "active",
      createdDate: "Feb 15, 2024",
    },
    {
      id: "ORG-103",
      name: "Oxford Academic Network",
      domain: "oxford.ac.uk",
      teachersCount: 195,
      examsCount: 1120,
      tier: "Pro Institution",
      status: "active",
      createdDate: "May 22, 2024",
    },
    {
      id: "ORG-104",
      name: "UC Berkeley Engineering",
      domain: "berkeley.edu",
      teachersCount: 150,
      examsCount: 840,
      tier: "Pro Institution",
      status: "pending",
      createdDate: "Jul 01, 2026",
    },
  ];

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      
      {/* HEADER CARD */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-extrabold tracking-wider text-[#0B7A93] uppercase block mb-1">
            INSTITUTIONAL NODES
          </span>
          <h1 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">
            Organizations
          </h1>
          <p className="text-[13px] font-medium text-slate-400 mt-1">
            Manage institutional tenants, domain routing, tier limits, and onboarding pipelines.
          </p>
        </div>

        <button className="bg-[#0B7A93] hover:bg-[#086175] text-white px-5 py-3 rounded-2xl text-[13px] font-extrabold transition-all shadow-xs flex items-center gap-2 self-start md:self-center cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Tenants</p>
            <p className="text-2xl font-extrabold text-[#0F172A] mt-1">142</p>
          </div>
          <div className="p-3 bg-[#E6F7FA] rounded-xl text-[#0B7A93]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Licenses</p>
            <p className="text-2xl font-extrabold text-[#0F172A] mt-1">138</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Setup</p>
            <p className="text-2xl font-extrabold text-[#0F172A] mt-1">4</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizations or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-[14px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B7A93] focus:border-[#0B7A93] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ORGANIZATIONS TABLE */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Organization</th>
                <th className="py-4 px-6">Plan Tier</th>
                <th className="py-4 px-6">Teachers</th>
                <th className="py-4 px-6">Total Exams</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px] font-medium">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0B7A93] text-white flex items-center justify-center font-extrabold text-[13px] shadow-xs shrink-0">
                        {org.name[0]}
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0F172A]">{org.name}</p>
                        <p className="text-[12px] text-slate-400 font-mono mt-0.5">
                          {org.domain} ({org.id})
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-[#E6F7FA] text-[#0B7A93] border border-[#0B7A93]/20">
                      {org.tier}
                    </span>
                  </td>

                  <td className="py-4 px-6 font-bold text-slate-700">
                    {org.teachersCount}
                  </td>

                  <td className="py-4 px-6 font-bold text-slate-700">
                    {org.examsCount.toLocaleString()}
                  </td>

                  <td className="py-4 px-6">
                    {org.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 rounded-xl hover:bg-[#E6F7FA] text-slate-400 hover:text-[#0B7A93] transition-colors cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}