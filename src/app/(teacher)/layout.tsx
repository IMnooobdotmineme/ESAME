"use client";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";
import { usePathname } from "next/navigation";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = pathname.startsWith("/ai");

  return (
    <div className="flex min-h-screen bg-slate-50">
      {!hideSidebar && <TeacherSidebar />}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}