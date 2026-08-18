"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TeacherAssignment } from "@/lib/teachers-data";
import { Plus, Trash2 } from "lucide-react";

interface DepartmentOption {
  id: string;
  name: string;
  subjects: Array<{ id: string; name: string; teacherNames?: string[] }>;
}

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

function toRows(assignments: TeacherAssignment[], departmentOptions: DepartmentOption[]): Row[] {
  const rows = assignments
    .map((a) => {
      const dept = departmentOptions.find((d) => d.name === a.department);
      const subject = dept?.subjects.find((s) => s.name === a.subject);
      return dept && subject ? { departmentId: dept.id, subjectId: subject.id } : null;
    })
    .filter((r): r is Row => r !== null);

  const fallbackDepartment = departmentOptions[0];
  return rows.length > 0
    ? rows
    : fallbackDepartment
      ? [{ departmentId: fallbackDepartment.id, subjectId: fallbackDepartment.subjects[0]?.id ?? "" }]
      : [];
}

export function ManageAssignmentsModal({
  open,
  onClose,
  teacherName,
  initialAssignments,
  onSave,
}: ManageAssignmentsModalProps) {
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

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
          if (open) setRows(toRows(initialAssignments, mapped));
          return;
        }
      } catch (error) {
        console.error("Failed to load departments", error);
      }

      setDepartmentOptions([]);
      if (open) setRows([]);
    }

    if (open) {
      loadDepartments();
    }
  }, [open, initialAssignments]);

  const departments = departmentOptions;
  const hasAssignableSubject = departments.some((department) => department.subjects.length > 0);

  function subjectsFor(departmentId: string) {
    return departments.find((d) => d.id === departmentId)?.subjects ?? [];
  }

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
    const fallbackDepartment = departments.find((department) => department.subjects.length > 0) ?? departments[0];
    if (!fallbackDepartment) return;
    setRows((prev) => [
      ...prev,
      {
        departmentId: fallbackDepartment.id,
        subjectId: fallbackDepartment?.subjects[0]?.id ?? "",
      },
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
        const dept = departments.find((d) => d.id === r.departmentId)!;
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
              disabled={!hasAssignableSubject}
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
            >
              <Plus size={13} /> Add another
            </button>
          </div>

          {!hasAssignableSubject && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Create at least one department and subject before assigning teachers.
            </p>
          )}

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
          <Button type="submit" disabled={!hasAssignableSubject || rows.length === 0}>
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
