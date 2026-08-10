"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EsameLogo } from "@/components/organization/EsameLogo";
import AdminNotificationDropdown from "@/components/AdminNotificationDropdown";
import AdminNotificationToastContainer from "@/components/AdminNotificationToastContainer";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Manage Organization", href: "/admin/users", icon: Users },
  { label: "Security Settings", href: "/admin/security", icon: Shield },
  { label: "System Logs", href: "/admin/logs", icon: FileText },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setProfileOpen] = useState(false);

  function handleLogout() {
    router.push("/login");
  }

  const currentTitle =
    NAV_ITEMS.find((item) => item.href === pathname)?.label || "Admin Portal";

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* SIDEBAR (EXACT MATCH TO ORGSIDEBAR) */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 h-screen sticky top-0 bg-navy-900 text-white">
        {/* Logo strip */}
        <div className="flex items-center px-6 h-16 bg-white border-b border-slate-100 shrink-0">
          <EsameLogo height={26} />
        </div>

        {/* Context badge */}
        <div className="px-6 pt-5 pb-2">
          <p className="text-xs uppercase tracking-wide text-white/40">
            System Admin
          </p>
          <p className="text-sm font-medium truncate">Super Admin Portal</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/admin" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-400 text-navy-900 font-semibold"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 relative z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {currentTitle}
            </h1>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-sky-400 transition-all text-slate-800"
              />
            </div>

            <AdminNotificationDropdown />

            {/* Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-navy-900 font-bold text-xs focus:outline-none cursor-pointer"
              >
                SA
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-40">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">
                        System Admin
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        admin@esame.com
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-slate-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Canvas */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      <AdminNotificationToastContainer />
    </div>
  );
}