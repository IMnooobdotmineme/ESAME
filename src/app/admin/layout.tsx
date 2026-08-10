import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminNotificationToastContainer from "@/components/AdminNotificationToastContainer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0">{children}</div>
      <AdminNotificationToastContainer />
    </div>
  );
}
