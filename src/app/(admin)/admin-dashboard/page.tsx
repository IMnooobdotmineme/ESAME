"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Radio,
  FileBarChart2,
  ArrowRight,
  Building,
  Megaphone,
  ScrollText,
  LogIn,
  Server,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { StatCard } from "@/components/organization/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentLog {
  id: string;
  category: "user" | "system";
  organization?: string;
  actor: string;
  event: string;
  timestamp: string;
}

interface DashboardData {
  stats: {
    totalOrganizations: number;
    totalTeachers: number;
    liveExams: number;
    totalExaminations: number;
  };
  recentLogs: RecentLog[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const stats = [
    {
      label: "Total Organizations",
      value: loading ? "..." : (data?.stats.totalOrganizations ?? 0).toLocaleString(),
      icon: Building2,
    },
    {
      label: "Total Teachers",
      value: loading ? "..." : (data?.stats.totalTeachers ?? 0).toLocaleString(),
      icon: Users,
    },
    {
      label: "Live Exams",
      value: loading ? "..." : (data?.stats.liveExams ?? 0).toLocaleString(),
      icon: Radio,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Total Examinations",
      value: loading ? "..." : (data?.stats.totalExaminations ?? 0).toLocaleString(),
      icon: FileBarChart2,
    },
  ];

  const recentLogs = data?.recentLogs ?? [];

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
          {stats.map((stat) => (
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
                href="/logs"
                className="text-xs font-medium text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                View all logs <ArrowRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
              ) : recentLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No recent activity found.</div>
              ) : (
                recentLogs.map((log) => (
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
                ))
              )}
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
              <Link href="/organizations">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <Building size={18} className="text-sky-600" />
                  Manage Organizations
                </button>
              </Link>
              <Link href="/broadcast">
                <button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-navy-900 hover:bg-slate-50 transition-colors">
                  <Megaphone size={18} className="text-sky-600" />
                  Send Broadcast
                </button>
              </Link>
              <Link href="/logs">
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
