"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  LogIn,
  Server,
  AlertCircle,
  Clock,
} from "lucide-react";

const mockLogs = [
  {
    id: 101,
    type: "Security",
    message:
      "Exam locked for Student ID: 2024-091 due to 3rd tab-switching violation.",
    timestamp: "2026-07-15 09:42:15 AM",
  },
  {
    id: 102,
    type: "Login",
    message: "User sharding@school.org logged in successfully.",
    timestamp: "2026-07-15 09:15:02 AM",
  },
  {
    id: 103,
    type: "System",
    message:
      'New organization "MIT" registration submitted and pending approval.',
    timestamp: "2026-07-14 14:22:10 PM",
  },
  {
    id: 104,
    type: "Error",
    message: "Failed to connect to Cloudinary API during image upload.",
    timestamp: "2026-07-14 10:05:33 AM",
  },
];

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState("All");

  const tabs = ["All", "Login", "Security", "System", "Error"];

  const filteredLogs =
    activeTab === "All"
      ? mockLogs
      : mockLogs.filter((log) => log.type === activeTab);

  const getLogBadge = (type: string) => {
    switch (type) {
      case "Security":
        return {
          style: "bg-amber-50 text-amber-700 border-amber-200",
          icon: ShieldAlert,
        };
      case "Error":
        return {
          style: "bg-rose-50 text-rose-700 border-rose-200",
          icon: AlertCircle,
        };
      case "Login":
        return {
          style: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: LogIn,
        };
      default:
        return {
          style: "bg-[#E6F7FA] text-[#0B7A93] border-[#0B7A93]/20",
          icon: Server,
        };
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-100">
        <span className="text-[11px] font-extrabold tracking-wider text-[#0B7A93] uppercase block mb-1">
          Audit & Compliance
        </span>
        <h2 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">
          System Logs
        </h2>
        <p className="text-slate-400 mt-1 text-[13px] font-medium">
          Monitor system events, admin actions, and security violations across
          the platform.
        </p>
      </div>

      {/* Logs Card */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/50 gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-[12px] font-extrabold transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "text-[#0B7A93] border-[#0B7A93] bg-white rounded-t-xl"
                    : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
              >
                {tab} Logs
              </button>
            );
          })}
        </div>

        {/* Log List */}
        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const { style, icon: Icon } = getLogBadge(log.type);
            return (
              <div
                key={log.id}
                className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${style}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {log.type}
                  </span>
                  <p className="text-[14px] text-slate-800 font-medium leading-relaxed">
                    {log.message}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-[14px] font-medium">
              No logs recorded for the selected category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}