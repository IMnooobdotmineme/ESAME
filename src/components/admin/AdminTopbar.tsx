"use client";

import Link from "next/link";

interface AdminTopbarProps {
  title: string;
  description?: string;
}

export function AdminTopbar({ title, description }: AdminTopbarProps) {
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
          href="/admin/profile"
          className="flex items-center gap-2 pl-2 rounded-full hover:bg-slate-50 transition-colors pr-2 -mr-2 py-1"
        >
          <div className="h-9 w-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
            AD
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-navy-900 leading-tight">System Admin</p>
            <p className="text-xs text-slate-500 leading-tight">Platform Access</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

