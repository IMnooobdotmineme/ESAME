"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  // Must match the server-rendered default exactly — no localStorage read here.
  const [orgName, setOrgName] = useState("Organization");

  // Runs on the client only, before paint — updates from cache without a
  // visible flash and without touching what the server rendered.
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
      // no-op: still redirect to login even if the request fails
    }
    try {
      window.localStorage.removeItem(ORG_CACHE_KEY);
    } catch {
      // ignore
    }
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-navy-900 text-white">
      <div className="flex items-center px-6 h-16 bg-white border-b border-slate-100">
        <EsameLogo height={26} />
      </div>

      <div className="px-6 pt-5 pb-2">
        <p className="text-xs uppercase tracking-wide text-white/40">Organization</p>
        <p className="text-sm font-medium truncate">{orgName}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sky-400 text-navy-900"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => setLogoutOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} strokeWidth={2} />
          Log out
        </button>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Log out?"
        description="You'll need to sign in again to access the organization dashboard."
        confirmLabel="Log out"
        variant="logout"
      />
    </aside>
  );
}