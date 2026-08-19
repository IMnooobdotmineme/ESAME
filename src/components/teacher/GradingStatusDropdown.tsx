"use client";

import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { GradingStatus } from "@/store/useExamStore";
import { gradingStatusMeta } from "@/lib/grading-utils";

const OPTIONS: GradingStatus[] = ["in-progress", "complete"];

export function GradingStatusDropdown({
  status,
  onChange,
}: {
  status: GradingStatus;
  onChange: (status: GradingStatus) => void;
}) {
  const current = gradingStatusMeta(status);

  return (
    <DropdownMenu
      align="left"
      trigger={
        <button className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white pl-1 pr-3 py-1 hover:bg-slate-50 transition-colors">
          <Badge variant={current.variant}>{current.label}</Badge>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      }
    >
      {OPTIONS.map((opt) => {
        const meta = gradingStatusMeta(opt);
        return (
          <DropdownItem key={opt} selected={opt === status} onClick={() => onChange(opt)}>
            {meta.label}
          </DropdownItem>
        );
      })}
    </DropdownMenu>
  );
}