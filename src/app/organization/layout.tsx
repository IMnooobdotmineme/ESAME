import { OrgSidebar } from "@/components/organization/OrgSidebar";

export default function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <OrgSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}