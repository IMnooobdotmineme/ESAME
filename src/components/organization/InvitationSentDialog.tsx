"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { MailCheck } from "lucide-react";

interface InvitationSentDialogProps {
  open: boolean;
  onClose: () => void;
  teacherName: string;
  teacherEmail: string;
}

export function InvitationSentDialog({
  open,
  onClose,
  teacherName,
  teacherEmail,
}: InvitationSentDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <div className="px-6 pt-8 pb-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <MailCheck size={24} strokeWidth={2} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-navy-900">Invitation Sent</h2>
        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
          An invitation has been sent to <span className="font-medium text-navy-900">{teacherName}</span> at{" "}
          <span className="font-medium text-navy-900">{teacherEmail}</span>. They'll receive an email
          with instructions to set up their account.
        </p>

        <Button onClick={onClose} className="mt-6 w-full">
          Done
        </Button>
      </div>
    </Dialog>
  );
}
