"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LogOut, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** Visual tone. "logout" and "submit" swap the icon and use a neutral navy
   * accent instead of red; "danger" (default) is for destructive actions.
   * "submit" also plays a checkmark-tick animation before calling onConfirm. */
  variant?: "danger" | "logout" | "submit";
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
  const isDanger = variant === "danger";
  const isSubmit = variant === "submit";
  const Icon = variant === "logout" ? LogOut : variant === "submit" ? CheckCircle2 : AlertTriangle;

  const [confirming, setConfirming] = useState(false);

  // Reset the tick animation each time the dialog is (re)opened
  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  function handleConfirmClick() {
    if (!isSubmit) {
      onConfirm();
      return;
    }
    setConfirming(true);
    setTimeout(() => onConfirm(), 650);
  }

  return (
    <Dialog open={open} onClose={confirming ? () => {} : onClose} className="max-w-sm">
      <div className="px-6 pt-8 pb-6 text-center">
        <div
          className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center transition-colors duration-500 ${
            isDanger
              ? "bg-red-50 text-red-600"
              : confirming
              ? "bg-emerald-500 text-white"
              : "bg-navy-50 text-navy-700"
          }`}
        >
          {isSubmit ? (
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path
                d="M5.5 13.5L10.5 18.5L20.5 7"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={confirming ? 0 : 1}
                style={{ transition: "stroke-dashoffset 0.45s ease-out" }}
              />
            </svg>
          ) : (
            <Icon size={24} strokeWidth={2} />
          )}
        </div>

        <h2 className="mt-4 text-lg font-semibold text-navy-900">{title}</h2>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{description}</p>

        <div className="mt-6 flex items-center gap-3">
          {confirming ? (
            <div className="flex-1 flex items-center justify-center py-2.5">
              <span className="text-sm font-semibold text-emerald-600">Submitting...</span>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant={isDanger ? "danger" : "primary"}
                onClick={handleConfirmClick}
                className="flex-1"
              >
                {confirmLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}