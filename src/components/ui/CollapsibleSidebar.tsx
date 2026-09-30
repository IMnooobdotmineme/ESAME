"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
};

type Props = {
  items: NavItem[];
  roleLabel: string;
  name: string;
  onLogout: () => void;
  storageKey: string;
  logoutConfirmText: string;
};

export function CollapsibleSidebar({
  items,
  roleLabel,
  name,
  onLogout,
  storageKey,
  logoutConfirmText,
}: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate from localStorage without SSR flash
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setMounted(true);
  }, [storageKey]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    } catch {
      // ignore
    }
  };

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href + "/"));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile navigation keeps the same links and logout behavior as desktop. */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <Menu size={19} />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-navy-900/45"
            />
            <aside className="sidebar-in relative flex h-full w-[min(86vw,20rem)] flex-col bg-navy-900 text-white shadow-2xl">
              <div className="flex h-16 shrink-0 items-center justify-between bg-white px-5">
                <EsameLogo height={26} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-navy-900 transition-colors hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="shrink-0 px-5 pb-3 pt-5">
                <p className="text-xs uppercase tracking-wide text-white/40">{roleLabel}</p>
                <p className="truncate text-sm font-medium">{name}</p>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                <div className="space-y-1">
                  {items.map(({ label, href, icon: Icon }) => {
                    const active = isItemActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                          active ? "bg-sky-400 text-navy-900" : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon size={18} strokeWidth={2} className="shrink-0" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </nav>
              <div className="shrink-0 border-t border-white/10 px-3 py-4">
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); setLogoutOpen(true); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  <LogOut size={18} strokeWidth={2} />
                  <span>Log out</span>
                </button>
              </div>
            </aside>
          </div>
        )}
      </div>

      <div className="relative hidden shrink-0 lg:block">
        <aside
          className={cn(
            "flex flex-col h-screen sticky top-0 bg-navy-900 text-white",
            "transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            collapsed ? "w-[76px]" : "w-64"
          )}
        >
                    {/* Logo header — full logo expanded, centered monogram collapsed */}
          <div
            className={cn(
              "relative flex items-center h-16 bg-white border-b border-slate-100 overflow-hidden",
              "transition-[padding] duration-300",
              collapsed ? "justify-center px-2" : "px-6"
            )}
          >
            <div
              className={cn(
                "transition-opacity duration-200",
                collapsed ? "opacity-0" : "opacity-100"
              )}
            >
              <EsameLogo height={26} />
            </div>
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                collapsed ? "opacity-100" : "opacity-0"
              )}
            >
                            <EsameLogo height={27} iconOnly />
            </div>
          </div>

                    {/* Role + name, with toggle pinned top-right (expanded only) */}
          <div
            className={cn(
              "flex items-start justify-between gap-2 transition-[max-height,opacity,padding] duration-300 overflow-hidden",
              collapsed
                ? "max-h-0 opacity-0 px-0 py-0"
                : "max-h-24 opacity-100 px-6 pt-5 pb-2"
            )}
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-white/40">{roleLabel}</p>
              <p className="text-sm font-medium truncate">{name}</p>
            </div>
                        <button
              onClick={toggle}
              aria-label="Collapse sidebar"
                            className="shrink-0 h-8 w-8 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
            >
                            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="10" y1="12" x2="20" y2="12" />
                <line x1="14" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>

                    {/* Collapsed: toggle at top-center only */}
          <div
            className={cn(
              "flex flex-col items-center transition-[max-height,opacity,padding] duration-300 overflow-hidden",
              collapsed ? "max-h-20 opacity-100 pt-4 pb-2" : "max-h-0 opacity-0 py-0"
            )}
          >
            <button
              onClick={toggle}
              aria-label="Expand sidebar"
                            className="h-8 w-8 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
            >
                            <Menu size={17} strokeWidth={2.2} />
            </button>
          </div>

          

          {/* Nav items */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
            {items.map(({ label, href, icon: Icon }) => {
              const active = isItemActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-sky-400 text-navy-900"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon size={18} strokeWidth={2} className="shrink-0" />
                  <span
                    className={cn(
                      "transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap",
                      collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
                    )}
                  >
                    {label}
                  </span>
                  {/* Tooltip on hover when collapsed */}
                  {collapsed && mounted && (
                    <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-navy-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                      {label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div
            className={cn(
              "py-4 border-t border-white/10",
              "transition-[padding] duration-300",
              collapsed ? "px-0 flex justify-center" : "px-3"
            )}
          >
            <button
              onClick={() => setLogoutOpen(true)}
              className={cn(
                "group relative flex items-center rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200",
                collapsed ? "justify-center p-2.5" : "w-full gap-3 px-3 py-2.5"
              )}
            >
              <LogOut size={18} strokeWidth={2} className="shrink-0" />
              <span
                className={cn(
                  "transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap",
                  collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
                )}
              >
                Log out
              </span>
              {collapsed && mounted && (
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-navy-800 text-white text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  Log out
                </span>
              )}
            </button>
          </div>
        </aside>

        
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={onLogout}
        title="Log out?"
        description={logoutConfirmText}
        confirmLabel="Log out"
      />
    </>
  );
}
