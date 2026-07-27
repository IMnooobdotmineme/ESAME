"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Mail } from "lucide-react";

interface InvitationLinkModalProps {
  open: boolean;
  onClose: () => void;
  teacherName: string;
  teacherEmail: string;
  link: string;
}

export function InvitationLinkModal({ open, onClose, teacherName, teacherEmail, link }: InvitationLinkModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — user can still select the text manually
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title="Invitation Sent"
        description={`An invitation was created for ${teacherName}`}
        onClose={onClose}
      />
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-sky-50 border border-sky-100 px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-sky-400 text-white flex items-center justify-center shrink-0">
            <Mail size={16} />
          </div>
          <p className="text-sm text-navy-900">
            Share this link with <span className="font-medium">{teacherEmail}</span> so they can
            accept the invitation and set up their account.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-navy-900 mb-1.5 block">Invitation Link</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 bg-slate-50 outline-none"
            />
            <Button type="button" variant={copied ? "secondary" : "outline"} onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          This link expires in 7 days. The teacher status will update automatically once they accept.
        </p>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </Dialog>
  );
}