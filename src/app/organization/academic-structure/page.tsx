"use client";

import { useState } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DEPARTMENTS as INITIAL_DEPARTMENTS, DepartmentCard, DeptSubject } from "@/lib/academic-structure-data";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users2,
  Plus,
  ArrowRight,
  ChevronLeft,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

function DepartmentModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (dept: DepartmentCard) => void;
  initial?: DepartmentCard;
}) {
  const [name, setName] = useState(initial?.name ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name,
      courses: initial?.courses ?? 0,
      students: initial?.students ?? 0,
      faculty: initial?.faculty ?? 0,
      metricLabel: initial?.metricLabel ?? "Exam Completion Rate",
      metricValue: initial?.metricValue ?? 0,
      subjects: initial?.subjects ?? [],
    });
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title={initial ? "Edit Department" : "Add New Department"}
        description={initial ? "Update department details" : "Create a new department"}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-900 mb-1.5 block">Department Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Science"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              required
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save Changes" : "Add Department"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

type View =
  | { level: "departments" }
  | { level: "subjects"; departmentId: string };

function SubjectModal({
  open,
  onClose,
  onSave,
  departmentName,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (subject: DeptSubject) => void;
  departmentName?: string;
  initial?: DeptSubject;
}) {
  const [name, setName] = useState(initial?.name ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onSave({ id: initial?.id ?? crypto.randomUUID(), name, teacherNames: initial?.teacherNames ?? [] });
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title={initial ? "Edit Subject" : "Add Subject"}
        description={departmentName ? `${initial ? "Update subject under" : "Create a new subject under"} ${departmentName}` : undefined}
        onClose={onClose}
      />
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-5">
          <label className="text-sm font-medium text-navy-900 mb-1.5 block">Subject Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Operating Systems"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            required
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-2">
            You can assign teachers to this subject afterward from the Teachers page.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{initial ? "Save Changes" : "Add Subject"}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function SubjectTeachersModal({
  open,
  onClose,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  subject?: DeptSubject;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title={subject?.name ?? "Teachers"}
        description={
          subject
            ? `${subject.teacherNames.length} teacher${subject.teacherNames.length !== 1 ? "s" : ""} assigned to this subject`
            : undefined
        }
        onClose={onClose}
      />
      <div className="px-6 py-5 space-y-2 max-h-96 overflow-y-auto">
        {subject?.teacherNames.map((t) => (
          <Link
            key={t}
            href={`/organization/teachers/${encodeURIComponent(t)}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:border-sky-200 hover:bg-sky-50/60 transition-colors group"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
              {t.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-navy-900 truncate">{t}</p>
              <p className="text-xs text-slate-400 group-hover:text-sky-600">View exam history</p>
            </div>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-sky-500 shrink-0" />
          </Link>
        ))}
        {subject && subject.teacherNames.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            No teachers assigned to this subject yet.
          </p>
        )}
      </div>
    </Dialog>
  );
}

export default function AcademicStructurePage() {
  const [departments, setDepartments] = useState<DepartmentCard[]>(INITIAL_DEPARTMENTS);
  const [view, setView] = useState<View>({ level: "departments" });
  const [search, setSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectTeachersModal, setSubjectTeachersModal] = useState<{ open: boolean; subject?: DeptSubject }>({ open: false });
  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: DepartmentCard }>({ open: false });
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; edit?: DeptSubject }>({ open: false });
  const [deleteDeptTarget, setDeleteDeptTarget] = useState<DepartmentCard | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<DeptSubject | null>(null);

  const totalDepartments = departments.length;
  const totalStudents = departments.reduce((sum, d) => sum + d.students, 0);
  const totalCourses = departments.reduce((sum, d) => sum + d.courses, 0);
  const totalFaculty = departments.reduce((sum, d) => sum + d.faculty, 0);

  const activeDepartment = view.level !== "departments" ? departments.find((d) => d.id === view.departmentId) : undefined;

  function saveDepartment(dept: DepartmentCard) {
    setDepartments((prev) => {
      const exists = prev.some((d) => d.id === dept.id);
      return exists ? prev.map((d) => (d.id === dept.id ? dept : d)) : [...prev, dept];
    });
  }

  function saveSubject(subject: DeptSubject) {
    if (!activeDepartment) return;
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id !== activeDepartment.id) return d;
        const exists = d.subjects.some((s) => s.id === subject.id);
        return {
          ...d,
          subjects: exists
            ? d.subjects.map((s) => (s.id === subject.id ? subject : s))
            : [...d.subjects, subject],
        };
      })
    );
  }

  function confirmDeleteDepartment() {
    if (!deleteDeptTarget) return;
    setDepartments((prev) => prev.filter((d) => d.id !== deleteDeptTarget.id));
    setDeleteDeptTarget(null);
    if (view.level !== "departments" && view.departmentId === deleteDeptTarget.id) {
      setView({ level: "departments" });
    }
  }

  function confirmDeleteSubject() {
    if (!deleteSubjectTarget || !activeDepartment) return;
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === activeDepartment.id
          ? { ...d, subjects: d.subjects.filter((s) => s.id !== deleteSubjectTarget.id) }
          : d
      )
    );
    setDeleteSubjectTarget(null);
  }

  return (
    <>
      <OrgTopbar title="Academic Structure" description="Manage departments, subjects, and faculty" />

      <main className="p-6 space-y-5">
        {view.level === "departments" && (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatTile icon={Building2} label="Total Departments" value={String(totalDepartments)} badge="Stable" iconColor="text-sky-600" iconBg="bg-sky-50" />
              <StatTile icon={GraduationCap} label="Total Students" value={totalStudents.toLocaleString()} badge="+4.2%" iconColor="text-emerald-600" iconBg="bg-emerald-50" />
              <StatTile icon={BookOpen} label="Course Modules" value={String(totalCourses)} badge="Sem 2" iconColor="text-navy-700" iconBg="bg-navy-50" />
              <StatTile icon={Users2} label="Total Faculty" value={String(totalFaculty)} badge="88% Cap" iconColor="text-amber-600" iconBg="bg-amber-50" />
            </div>

            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Department Inventory</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage and monitor organizational units across the institution.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-9 w-full sm:w-64">
                <Search size={15} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search departments..."
                  className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Department cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {departments
                .filter((d) => d.name.toLowerCase().includes(search.trim().toLowerCase()))
                .map((d) => (
                <Card key={d.id} className="overflow-hidden">
                  <div className="bg-navy-900 p-5 text-white relative">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{d.name}</h3>
                      <DropdownMenu
                        trigger={
                          <button className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white">
                            <MoreVertical size={15} />
                          </button>
                        }
                      >
                        <DropdownItem onClick={() => setDeptModal({ open: true, edit: d })}>
                          <Pencil size={15} /> Edit Department
                        </DropdownItem>
                        <DropdownItem danger onClick={() => setDeleteDeptTarget(d)}>
                          <Trash2 size={15} /> Delete Department
                        </DropdownItem>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 text-center gap-2 mb-4">
                      <MiniMetric label="Courses" value={d.courses} />
                      <MiniMetric label="Students" value={d.students.toLocaleString()} />
                      <MiniMetric label="Faculty" value={d.faculty} />
                    </div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">{d.metricLabel}</span>
                      <span className="font-medium text-navy-900">{d.metricValue}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-4">
                      <div
                        className="h-full rounded-full bg-sky-400"
                        style={{ width: `${d.metricValue}%` }}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => setView({ level: "subjects", departmentId: d.id })}
                    >
                      Manage Structure <ArrowRight size={15} />
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Add new */}
              <button type="button" onClick={() => setDeptModal({ open: true })} className="text-left">
                <Card className="flex flex-col items-center justify-center text-center p-8 border-dashed h-full hover:bg-slate-50 hover:border-sky-300 transition-colors cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Plus size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-navy-900">Add New Department</p>
                  <p className="text-xs text-slate-400 mt-1">Configure a new department</p>
                </Card>
              </button>
            </div>
          </>
        )}

        {view.level === "subjects" && activeDepartment && (
          <>
            <Breadcrumb
              items={[
                { label: "Department Inventory", onClick: () => setView({ level: "departments" }) },
                { label: activeDepartment.name },
              ]}
            />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">{activeDepartment.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeDepartment.subjects.length} subjects · {activeDepartment.faculty} faculty
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setSubjectModal({ open: true })}>
                  <Plus size={15} /> Add Subject
                </Button>
                <Button variant="outline" onClick={() => setView({ level: "departments" })}>
                  <ChevronLeft size={15} /> Back
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 h-10 w-full sm:w-72">
              <Search size={15} className="text-slate-400" />
              <input
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Search subjects..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400 text-navy-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeDepartment.subjects
                .filter((s) => s.name.toLowerCase().includes(subjectSearch.trim().toLowerCase()))
                .map((s) => (
                <Card
                  key={s.id}
                  className="p-5 cursor-pointer hover:border-sky-200 hover:shadow-md transition-all"
                  onClick={() => setSubjectTeachersModal({ open: true, subject: s })}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sky-600">
                      <BookOpen size={16} />
                      <span className="text-xs font-medium uppercase tracking-wide">Subject</span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu
                        trigger={
                          <button className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                            <MoreVertical size={15} />
                          </button>
                        }
                      >
                        <DropdownItem onClick={() => setSubjectModal({ open: true, edit: s })}>
                          <Pencil size={15} /> Edit Subject
                        </DropdownItem>
                        <DropdownItem danger onClick={() => setDeleteSubjectTarget(s)}>
                          <Trash2 size={15} /> Delete Subject
                        </DropdownItem>
                      </DropdownMenu>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-navy-900 mb-4">{s.name}</h3>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Users2 size={14} />
                      {s.teacherNames.length} teacher{s.teacherNames.length !== 1 ? "s" : ""} assigned
                    </div>
                    <ArrowRight size={14} className="text-slate-300" />
                  </div>
                </Card>
              ))}

              {/* Add subject */}
              <button type="button" onClick={() => setSubjectModal({ open: true })} className="text-left">
                <Card className="flex flex-col items-center justify-center text-center p-8 border-dashed h-full hover:bg-slate-50 hover:border-sky-300 transition-colors cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <Plus size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-navy-900">Add Subject</p>
                  <p className="text-xs text-slate-400 mt-1">Create a subject in {activeDepartment.name}</p>
                </Card>
              </button>
            </div>
          </>
        )}
      </main>

      <SubjectTeachersModal
        open={subjectTeachersModal.open}
        subject={subjectTeachersModal.subject}
        onClose={() => setSubjectTeachersModal({ open: false })}
      />
      <DepartmentModal
        open={deptModal.open}
        initial={deptModal.edit}
        onClose={() => setDeptModal({ open: false })}
        onSave={saveDepartment}
      />
      <SubjectModal
        open={subjectModal.open}
        initial={subjectModal.edit}
        departmentName={activeDepartment?.name}
        onClose={() => setSubjectModal({ open: false })}
        onSave={saveSubject}
      />
      <ConfirmDialog
        open={deleteDeptTarget !== null}
        onClose={() => setDeleteDeptTarget(null)}
        onConfirm={confirmDeleteDepartment}
        title="Delete this department?"
        description={
          deleteDeptTarget
            ? `"${deleteDeptTarget.name}" and its ${deleteDeptTarget.subjects.length} subject(s) will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
      />
      <ConfirmDialog
        open={deleteSubjectTarget !== null}
        onClose={() => setDeleteSubjectTarget(null)}
        onConfirm={confirmDeleteSubject}
        title="Delete this subject?"
        description={
          deleteSubjectTarget ? `"${deleteSubjectTarget.name}" will be removed. This can't be undone.` : ""
        }
        confirmLabel="Delete"
      />
    </>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  badge,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badge: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={17} className={iconColor} />
        </div>
        <Badge variant="success">{badge}</Badge>
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-navy-900 mt-0.5">{value}</p>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-navy-900 mt-0.5">{value}</p>
    </div>
  );
}

function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-sky-600 hover:underline">
              {item.label}
            </button>
          ) : (
            <span className="text-navy-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}