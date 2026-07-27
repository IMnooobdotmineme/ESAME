import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  iconBg = "bg-sky-50",
  iconColor = "text-sky-600",
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-navy-900">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
      {trend && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" ? "text-emerald-600" : "text-red-600"
          )}
        >
          {trend.direction === "up" ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {trend.value}
          <span className="text-slate-400 font-normal">vs last month</span>
        </div>
      )}
    </Card>
  );
}