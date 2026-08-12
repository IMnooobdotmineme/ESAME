"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Radio,
  FileBarChart2,
  ArrowRight,
  Building,
  ScrollText,
  LogIn,
  Server,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { StatCard } from "@/components/organization/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---- Mock data (swap for API later) ----

const STATS = [
  { label: "Total Organizations", value: "12", icon: Building2 },
  { label: "Total Teachers", value: "148", icon: Users },
  { label: "Live Exams", value: "7", icon: Radio, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { label: "Total Examinations", value: "1,420", icon: FileBarChart2 },
];

interface RecentLog {
  id: string;
  category: "user" | "system";
  organization?: string;
  actor: string;
  event: string;
  timestamp: string;
}

const RECENT_LOGS: RecentLog[] = [
  {
    id: "log-01",
    category: "user",
    organization: "Institute of Technology & Science",
    actor: "Ly Vannak",
    event: "Teacher account activated by admin",
    timestamp: "12 min ago",
  },
  {
    id: "log-02",
    category: "user",
    organization: "School of Software Development",
    actor: "admin@ssd.edu (Org Admin)",
    event: "Teacher account suspended by admin",
    timestamp: "28 min ago",
  },
  {
    id: "log-03",
    category: "system",
    actor: "System",
    event: "Scheduled database backup completed successfully",
    timestamp: "1 hour ago",
  },
  {
    id: "log-04",
    category: "system",
    actor: "System",
    event: "Platform maintenance window closed",
    timestamp: "3 hours ago",
  },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminTopbar
        title="Admin Dashboard"
        description="Platform-wide overview of organizations, teachers, and live activity."
      />

      <main className="p-6 space-y-6">
        {/* Status banner */}
        <div className="flex justify-end">
          <Badge variant="success">
            <Radio size={12} className="animate-pulse" />
            System Status: 99.9% Operational
          </Badge>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent activity */}
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold text-navy-900">
                Recent Activity
              </CardTitle>
              <Link
                href="/admin/logs"
                className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                View all logs <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {RECENT_LOGS.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        log.category === "user" ? "bg-sky-50 text-sky-600" : "bg-navy-50 text-navy-700"
                      }`}
                    >
                      {log.category === "user" ? <LogIn size={14} /> : <Server size={14} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-navy-900">{log.actor}</span>
                        <Badge variant={log.category === "user" ? "info" : "neutral"} className="px-2 py-0.5 text-[10px]">
                          {log.category === "user" ? "User Log" : "System Log"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{log.event}</p>
                      {log.organization && (
                        <p className="text-xs text-slate-400 mt-0.5">{log.organization}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{log.timestamp}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-navy-900">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-3">
              <Link href="/admin/organizations">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <Building size={18} className="text-sky-600" />
                  Manage Organizations
                </button>
              </Link>
              <Link href="/admin/logs">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <ScrollText size={18} className="text-sky-600" />
                  View System Logs
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
