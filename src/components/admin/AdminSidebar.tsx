"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  FileText,
  Lock,
} from "lucide-react";
import { CollapsibleSidebar } from "@/components/ui/CollapsibleSidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "Broadcast", href: "/broadcast", icon: Megaphone },
  { label: "Logs", href: "/logs", icon: FileText },
  { label: "Profile", href: "/profile", icon: Lock },
];

export function AdminSidebar() {
  const router = useRouter();

      async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } catch {
      // ignore — still log out
    } finally {
      try {
        window.localStorage.removeItem("esame-remember-me");
        window.sessionStorage.clear();
      } catch {
        // ignore
      }
      window.location.href = "/login";
    }
  }

  return (
    <CollapsibleSidebar
      items={NAV_ITEMS}
      roleLabel="Administrator"
      name="System Admin"
      onLogout={handleLogout}
      storageKey="sidebar-collapsed-admin"
      logoutConfirmText="You'll need to sign in again to access the admin portal."
    />
  );
}