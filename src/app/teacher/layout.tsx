import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <TeacherSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
