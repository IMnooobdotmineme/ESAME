"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/lib/academic-structure-data";
import { TeacherAssignment } from "@/lib/teachers-data";
import { Plus, Trash2 } from "lucide-react";

interface Row {
  departmentId: string;
  subjectId: string;
}

interface ManageAssignmentsModalProps {
  open: boolean;
  onClose: () => void;
  teacherName: string;
  initialAssignments: TeacherAssignment[];
  onSave: (assignments: TeacherAssignment[]) => void;
}

function subjectsFor(departmentId: string) {
  return DEPARTMENTS.find((d) => d.id === departmentId)?.subjects ?? [];
}

function toRows(assignments: TeacherAssignment[]): Row[] {
  const rows = assignments
    .map((a) => {
      const dept = DEPARTMENTS.find((d) => d.name === a.department);
      const subject = dept?.subjects.find((s) => s.name === a.subject);
      return dept && subject ? { departmentId: dept.id, subjectId: subject.id } : null;
    })
    .filter((r): r is Row => r !== null);
  return rows.length > 0
    ? rows
    : [{ departmentId: DEPARTMENTS[0]?.id ?? "", subjectId: DEPARTMENTS[0]?.subjects[0]?.id ?? "" }];
}

export function ManageAssignmentsModal({
  open,
  onClose,
  teacherName,
  initialAssignments,
  onSave,
}: ManageAssignmentsModalProps) {
  const [rows, setRows] = useState<Row[]>(() => toRows(initialAssignments));

  // Re-sync whenever a different teacher's assignments are opened.
  useEffect(() => {
    if (open) setRows(toRows(initialAssignments));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, teacherName]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const next = { ...r, ...patch };
        if (patch.departmentId && patch.departmentId !== r.departmentId) {
          next.subjectId = subjectsFor(patch.departmentId)[0]?.id ?? "";
        }
        return next;
      })
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { departmentId: DEPARTMENTS[0]?.id ?? "", subjectId: DEPARTMENTS[0]?.subjects[0]?.id ?? "" },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const assignments: TeacherAssignment[] = rows
      .filter((r) => r.departmentId && r.subjectId)
      .map((r) => {
        const dept = DEPARTMENTS.find((d) => d.id === r.departmentId)!;
        const subject = subjectsFor(r.departmentId).find((s) => s.id === r.subjectId)!;
        return { department: dept.name, subject: subject.name };
      });
    if (assignments.length === 0) return;
    onSave(assignments);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title="Manage Departments & Subjects"
        description={`Add or remove department/subject assignments for ${teacherName}`}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              At least one department and subject is required. <span className="text-rose-500">*</span>
            </p>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
            >
              <Plus size={13} /> Add another
            </button>
          </div>

          {rows.map((r, i) => {
            const subjects = subjectsFor(r.departmentId);
            return (
              <div key={i} className="relative rounded-xl border border-slate-200 p-3">
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
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
                      value={r.departmentId}
                      onChange={(e) => updateRow(i, { departmentId: e.target.value })}
                      className={inputClass}
                      required
                    >
                      {DEPARTMENTS.map((d) => (
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
                      value={r.subjectId}
                      onChange={(e) => updateRow(i, { subjectId: e.target.value })}
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
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";