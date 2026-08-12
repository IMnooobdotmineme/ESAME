"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Eye,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { label: "My Exams", href: "/teacher/exams", icon: FileText },
  { label: "Live Monitoring", href: "/teacher/monitor", icon: Eye },
  { label: "Grading & Results", href: "/teacher/grading", icon: CheckSquare },
  { label: "Settings", href: "/teacher/settings", icon: Settings },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  function handleLogout() {
    // TODO: clear real auth session/token here once backend auth is wired up
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-navy-900 text-white">
      <div className="flex items-center px-6 h-16 bg-white border-b border-slate-100">
        <EsameLogo height={26} />
      </div>

      <div className="px-6 pt-5 pb-2">
        <p className="text-xs uppercase tracking-wide text-white/40">Instructor</p>
        <p className="text-sm font-medium truncate">Dr. Alan Grant</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/teacher" && pathname?.startsWith(href + "/"));
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
        description="You'll need to sign in again to access the teacher portal."
        confirmLabel="Log out"
        variant="logout"
      />
    </aside>
  );
}