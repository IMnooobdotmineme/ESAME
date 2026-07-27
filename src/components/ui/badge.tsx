import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-navy-50 text-navy-700 border border-navy-100",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  danger: "bg-red-50 text-red-700 border border-red-100",
  info: "bg-sky-50 text-sky-700 border border-sky-100",
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}