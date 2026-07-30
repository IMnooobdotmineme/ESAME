"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogFooter } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={title} description={description} onClose={onClose} />
      <div className="px-6 py-4">
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <DialogFooter>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} size="sm">
            {confirmLabel}
          </Button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}