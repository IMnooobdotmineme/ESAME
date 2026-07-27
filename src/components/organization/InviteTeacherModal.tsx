"use client";

import { useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/lib/academic-structure-data";

export interface InviteFormData {
  name: string;
  email: string;
  departmentId: string;
  subjectId: string;
}

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (data: InviteFormData) => void;
}

export function InviteTeacherModal({ open, onClose, onInvite }: InviteTeacherModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentId, setDepartmentId] = useState(DEPARTMENTS[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState(DEPARTMENTS[0]?.subjects[0]?.id ?? "");

  const availableSubjects = DEPARTMENTS.find((d) => d.id === departmentId)?.subjects ?? [];

  function handleDepartmentChange(id: string) {
    setDepartmentId(id);
    const dept = DEPARTMENTS.find((d) => d.id === id);
    setSubjectId(dept?.subjects[0]?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !departmentId || !subjectId) return;
    onInvite({ name, email, departmentId, subjectId });
    setName("");
    setEmail("");
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title="Invite Teacher"
        description="Send an invitation to join your organization"
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sok Dara"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@institution.edu"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Department">
            <select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className={inputClass}
              required
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className={inputClass}
              required
              disabled={availableSubjects.length === 0}
            >
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Send Invitation</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-navy-900 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
