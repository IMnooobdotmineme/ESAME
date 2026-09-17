"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Eye,
  CheckSquare,
  Settings,
} from "lucide-react";
import { CollapsibleSidebar } from "@/components/ui/CollapsibleSidebar";
import { useTeacherStore } from "@/store/useTeacherStore";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/teacher-dashboard", icon: LayoutDashboard },
  { label: "My Exams", href: "/teacher-exams", icon: FileText },
  { label: "Live Monitoring", href: "/monitor", icon: Eye },
  { label: "Grading & Results", href: "/grading", icon: CheckSquare },
  { label: "Settings", href: "/teacher-settings", icon: Settings },
];

export function TeacherSidebar() {
  const router = useRouter();
  const profile = useTeacherStore((s) => s.profile);
  const fetchProfile = useTeacherStore((s) => s.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

    async function handleLogout() {
    try {
      // cache: "no-store" bypasses any browser caching of the POST
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear client-side state, even if the request failed — prevents "stuck logged in"
      try {
        window.localStorage.removeItem("esame-remember-me");
        window.sessionStorage.clear();
      } catch {
        // ignore
      }
      // Hard redirect (not push) — forces a fresh page load so expired cookies are re-checked
      window.location.href = "/login";
    }
  }

  return (
    <CollapsibleSidebar
      items={NAV_ITEMS}
      roleLabel="Instructor"
      name={profile?.name || "Teacher"}
      onLogout={handleLogout}
      storageKey="sidebar-collapsed-teacher"
      logoutConfirmText="You'll need to sign in again to access the teacher portal."
    />
  );
}