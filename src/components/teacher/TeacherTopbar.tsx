"use client";
import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTeacherStore } from "@/store/useTeacherStore";

interface TeacherTopbarProps {
  title: string;
  description?: string;
}

export function TeacherTopbar({ title, description }: TeacherTopbarProps) {
  const pathname = usePathname();
  const profile = useTeacherStore((state) => state.profile);
  const fetchProfile = useTeacherStore((state) => state.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const teacherName = profile?.name || "Teacher";
  const avatarUrl = profile?.avatarUrl || null;

  const initials = teacherName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onAI = pathname === "/ai";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/80 backdrop-blur px-6 h-16">
      <div>
        <h1 className="text-lg font-semibold text-navy-900">{title}</h1>
        {description && (
          <p className="text-xs text-slate-500 hidden sm:block">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
                {/* AI Assistant */}
        <Link
          href="/ai"
          title="AI Assistant"
          className="flex h-9 items-center gap-1.5 rounded-full px-2.5 hover:bg-slate-100 transition-colors"
        >
          <Sparkles size={17} className={onAI ? "text-sky-600" : "text-slate-600"} />
          <span className={`text-sm font-medium ${onAI ? "text-sky-600" : "text-slate-600"}`}>
            AI
          </span>
        </Link>

        <Link
          href="/teacher-notifications"
          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
        >
          <Bell size={18} className="text-slate-600" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
        </Link>
        <Link
          href="/teacher-settings"
          className="flex items-center gap-2 pl-2 border-l border-slate-200 rounded-full hover:bg-slate-50 transition-colors pr-2 -mr-2 py-1"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={teacherName}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
              {initials}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-navy-900 leading-tight">
              {teacherName}
            </p>
            <p className="text-xs text-slate-500 leading-tight">Teacher</p>
          </div>
        </Link>
      </div>
    </header>
  );
}