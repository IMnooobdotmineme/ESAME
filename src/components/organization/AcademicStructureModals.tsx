"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AcademicYear, Semester, Department, Subject, Teacher } from "@/lib/academic-types";

// ---------- Academic Year ----------
export function AcademicYearModal({
  open, onClose, onSave, initial,
}: {
  open: boolean; onClose: () => void; onSave: (data: Omit<AcademicYear, "id">) => void;
  initial?: AcademicYear;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");

  useEffect(() => {
    setLabel(initial?.label ?? "");
    setStartDate(initial?.startDate ?? "");
    setEndDate(initial?.endDate ?? "");
  }, [initial, open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label || !startDate || !endDate) return;
    onSave({ label, startDate, endDate, status: initial?.status ?? "Active" });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={initial ? "Edit Academic Year" : "Add Academic Year"} onClose={onClose} />
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Label">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. 2026-2027" className={inputClass} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
            </Field>
            <Field label="End Date">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} required />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save Changes" : "Add Year"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ---------- Semester ----------
export function SemesterModal({
  open, onClose, onSave, initial, academicYears,
}: {
  open: boolean; onClose: () => void; onSave: (data: Omit<Semester, "id">) => void;
  initial?: Semester; academicYears: AcademicYear[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? academicYears[0]?.id ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");

  useEffect(() => {
    setName(initial?.name ?? "");
    setAcademicYearId(initial?.academicYearId ?? academicYears[0]?.id ?? "");
    setStartDate(initial?.startDate ?? "");
    setEndDate(initial?.endDate ?? "");
  }, [initial, open, academicYears]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !academicYearId || !startDate || !endDate) return;
    onSave({ name, academicYearId, startDate, endDate, status: initial?.status ?? "Upcoming" });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={initial ? "Edit Semester" : "Add Semester"} onClose={onClose} />
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Semester 1" className={inputClass} required />
          </Field>
          <Field label="Academic Year">
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className={inputClass} required>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
            </Field>
            <Field label="End Date">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} required />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save Changes" : "Add Semester"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ---------- Department ----------
export function DepartmentModal({
  open, onClose, onSave, initial,
}: {
  open: boolean; onClose: () => void; onSave: (data: Omit<Department, "id">) => void;
  initial?: Department;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");

  useEffect(() => {
    setName(initial?.name ?? "");
    setCode(initial?.code ?? "");
  }, [initial, open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code) return;
    onSave({ name, code });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={initial ? "Edit Department" : "Add Department"} onClose={onClose} />
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Department Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" className={inputClass} required />
          </Field>
          <Field label="Code">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS" className={inputClass} required />
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save Changes" : "Add Department"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ---------- Subject ----------
export function SubjectModal({
  open, onClose, onSave, initial, departments,
}: {
  open: boolean; onClose: () => void; onSave: (data: Omit<Subject, "id" | "teacherIds">) => void;
  initial?: Subject; departments: Department[];
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [departmentId, setDepartmentId] = useState(initial?.departmentId ?? departments[0]?.id ?? "");
  const [credits, setCredits] = useState(initial?.credits ?? 3);

  useEffect(() => {
    setName(initial?.name ?? "");
    setCode(initial?.code ?? "");
    setDepartmentId(initial?.departmentId ?? departments[0]?.id ?? "");
    setCredits(initial?.credits ?? 3);
  }, [initial, open, departments]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !code || !departmentId) return;
    onSave({ name, code, departmentId, credits });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={initial ? "Edit Subject" : "Add Subject"} onClose={onClose} />
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-4">
          <Field label="Subject Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Structures" className={inputClass} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CS201" className={inputClass} required />
            </Field>
            <Field label="Credits">
              <input type="number" min={1} max={6} value={credits} onChange={(e) => setCredits(Number(e.target.value))} className={inputClass} required />
            </Field>
          </div>
          <Field label="Department">
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputClass} required>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save Changes" : "Add Subject"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

// ---------- Assign Teachers ----------
export function AssignTeachersModal({
  open, onClose, onSave, subject, teachers,
}: {
  open: boolean; onClose: () => void; onSave: (teacherIds: string[]) => void;
  subject?: Subject; teachers: Teacher[];
}) {
  const [selected, setSelected] = useState<string[]>(subject?.teacherIds ?? []);

  useEffect(() => {
    setSelected(subject?.teacherIds ?? []);
  }, [subject, open]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(selected);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title="Assign Teachers"
        description={subject ? `Select teachers for ${subject.name}` : undefined}
        onClose={onClose}
      />
      <form onSubmit={submit}>
        <div className="px-6 py-5 space-y-2 max-h-72 overflow-y-auto">
          {teachers.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 cursor-pointer hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(t.id)}
                onChange={() => toggle(t.id)}
                className="h-4 w-4 rounded accent-sky-500"
              />
              <div>
                <p className="text-sm font-medium text-navy-900">{t.name}</p>
                <p className="text-xs text-slate-400">{t.email}</p>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Assignment</Button>
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