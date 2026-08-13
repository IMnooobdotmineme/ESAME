"use client";

import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** Visual tone. "logout" swaps the icon and uses a neutral navy accent instead of red. */
  variant?: "danger" | "logout";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  variant = "danger",
}: ConfirmDialogProps) {
  const isLogout = variant === "logout";
  const Icon = isLogout ? LogOut : AlertTriangle;

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <div className="px-6 pt-8 pb-6 text-center">
        <div
          className={
            isLogout
              ? "mx-auto h-14 w-14 rounded-full bg-navy-50 text-navy-700 flex items-center justify-center"
              : "mx-auto h-14 w-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center"
          }
        >
          <Icon size={24} strokeWidth={2} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-navy-900">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{description}</p>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant={isLogout ? "primary" : "danger"}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}