import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MiniStatProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative";
}

const toneClasses: Record<NonNullable<MiniStatProps["tone"]>, string> = {
  default: "text-navy-900",
  positive: "text-emerald-600",
  negative: "text-red-600",
};

export function MiniStat({ label, value, icon: Icon, tone = "default" }: MiniStatProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">{label}</p>
        {Icon && <Icon size={14} className="text-slate-300" />}
      </div>
      <p className={cn("mt-1.5 text-xl font-semibold", toneClasses[tone])}>{value}</p>
    </Card>
  );
}