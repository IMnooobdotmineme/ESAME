"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import { CollapsibleSidebar } from "@/components/ui/CollapsibleSidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Teachers", href: "/teachers", icon: Users },
  { label: "Academic Structure", href: "/academic-structure", icon: Layers },
  { label: "Exams", href: "/exams", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const ORG_CACHE_KEY = "org-chrome-cache";

function readCachedName(): string | null {
  try {
    const raw = window.localStorage.getItem(ORG_CACHE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as { name?: string })?.name ?? null;
  } catch {
    return null;
  }
}

export function OrgSidebar() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("Organization");

  useLayoutEffect(() => {
    const cachedName = readCachedName();
    if (cachedName) setOrgName(cachedName);
  }, []);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = await res.json();
        if (res.ok && payload?.user?.name) {
          setOrgName(payload.user.name);
        }
      } catch {
        // no-op
      }
    }

    loadOrg();
    window.addEventListener("org-profile-updated", loadOrg);
    return () => window.removeEventListener("org-profile-updated", loadOrg);
  }, []);

   async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } catch {
      // no-op
    } finally {
      try {
        window.localStorage.removeItem(ORG_CACHE_KEY);
        window.localStorage.removeItem("esame-remember-me");
        window.localStorage.removeItem("sidebar-collapsed-org");
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
      roleLabel="Organization"
      name={orgName}
      onLogout={handleLogout}
      storageKey="sidebar-collapsed-org"
      logoutConfirmText="You'll need to sign in again to access the organization dashboard."
    />
  );
}