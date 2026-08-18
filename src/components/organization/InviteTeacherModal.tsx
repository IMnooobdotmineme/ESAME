"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface DepartmentOption {
  id: string;
  name: string;
  subjects: Array<{ id: string; name: string; teacherNames?: string[] }>;
}

export interface InviteAssignment {
  departmentId: string;
  subjectId: string;
}

export interface InviteFormData {
  name: string;
  email: string;
  assignments: InviteAssignment[];
}

interface InviteTeacherModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (data: InviteFormData) => void;
}

export function InviteTeacherModal({ open, onClose, onInvite }: InviteTeacherModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [assignments, setAssignments] = useState<InviteAssignment[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const response = await fetch("/api/org/academic-structure", { cache: "no-store" });
        const payload = (await response.json()) as { departments?: DepartmentOption[] };
        if (response.ok && Array.isArray(payload.departments)) {
          const mapped = payload.departments.map((department) => ({
            id: department.id,
            name: department.name,
            subjects: Array.isArray(department.subjects) ? department.subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
              teacherNames: subject.teacherNames ?? [],
            })) : [],
          }));
          setDepartmentOptions(mapped);
          const firstAssignable = mapped.find((department) => department.subjects.length > 0) ?? mapped[0];
          if (firstAssignable) {
            setAssignments((prev) =>
              prev.length
                ? prev
                : [{ departmentId: firstAssignable.id, subjectId: firstAssignable.subjects[0]?.id ?? "" }]
            );
          }
        }
      } catch (error) {
        console.error("Failed to load departments:", error);
        setDepartmentOptions([]);
      }
    }

    if (open) {
      loadDepartments();
    }
  }, [open]);

  const departments = departmentOptions;
  const hasAssignableSubject = departments.some((department) => department.subjects.length > 0);

  function emptyAssignment(): InviteAssignment {
    const firstDepartment = departments.find((department) => department.subjects.length > 0) ?? departments[0];
    return {
      departmentId: firstDepartment?.id ?? "",
      subjectId: firstDepartment?.subjects[0]?.id ?? "",
    };
  }

  function subjectsFor(departmentId: string) {
    return departments.find((d) => d.id === departmentId)?.subjects ?? [];
  }

  function updateAssignment(index: number, patch: Partial<InviteAssignment>) {
    setAssignments((prev) =>
      prev.map((a, i) => {
        if (i !== index) return a;
        const next = { ...a, ...patch };
        if (patch.departmentId && patch.departmentId !== a.departmentId) {
          next.subjectId = subjectsFor(patch.departmentId)[0]?.id ?? "";
        }
        return next;
      })
    );
  }

  function addAssignment() {
    setAssignments((prev) => [...prev, emptyAssignment()]);
  }

  function removeAssignment(index: number) {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName("");
    setEmail("");
    const first = emptyAssignment();
    setAssignments(first.departmentId ? [first] : []);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validAssignments = assignments.filter((a) => a.departmentId && a.subjectId);
    if (!name || !email || validAssignments.length === 0) return;
    onInvite({ name, email, assignments: validAssignments });
    resetForm();
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader
        title="Invite Teacher"
        description="Send an invitation to join your organization"
        onClose={handleClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <Field label="Full Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sok Dara"
              className={inputClass}
              required
            />
          </Field>
          <Field label="Email Address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@institution.edu"
              className={inputClass}
              required
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-navy-900">
                Departments &amp; Subjects <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={addAssignment}
                disabled={!hasAssignableSubject}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
              >
                <Plus size={13} /> Add another
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              A teacher can be assigned to more than one department and subject. At least one is required.
            </p>

            {!hasAssignableSubject && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Create at least one department and subject in Academic Structure before sending invitations.
              </p>
            )}

            <div className="space-y-3">
              {assignments.map((a, i) => {
                const subjects = subjectsFor(a.departmentId);
                return (
                  <div key={i} className="relative rounded-xl border border-slate-200 p-3">
                    {assignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAssignment(i)}
                        className="absolute top-2.5 right-2.5 h-6 w-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div className="grid grid-cols-2 gap-3 pr-6">
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Department <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={a.departmentId}
                          onChange={(e) => updateAssignment(i, { departmentId: e.target.value })}
                          className={inputClass}
                          required
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={a.subjectId}
                          onChange={(e) => updateAssignment(i, { subjectId: e.target.value })}
                          className={inputClass}
                          required
                          disabled={subjects.length === 0}
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!hasAssignableSubject}>
            Send Invitation
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-navy-900 mb-1.5 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
