"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

interface OrgTopbarProps {
  title: string;
  description?: string;
}

export function OrgTopbar({ title, description }: OrgTopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 backdrop-blur px-6 h-16">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{title}</h1>
        {description && (
          <p className="text-xs text-slate-500 hidden sm:block">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/organization/notifications"
          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
        </Link>

        <Link
          href="/organization/settings"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 rounded-full hover:bg-slate-50 transition-colors pr-2 -mr-2 py-1"
        >
          <div className="h-9 w-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
            OA
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-navy-900 leading-tight">Org Admin</p>
            <p className="text-xs text-slate-500 leading-tight">Administrator</p>
          </div>
        </Link>
      </div>
    </header>
  );
}