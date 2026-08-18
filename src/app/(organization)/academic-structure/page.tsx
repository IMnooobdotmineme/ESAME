"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownItem } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AcademicTeacher, DepartmentCard, DeptSubject } from "@/lib/academic-structure-data";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users2,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
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

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onSave({
      id: initial?.id ?? "",
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
  | { level: "subjects"; departmentId: string }
  | { level: "teachers"; departmentId: string; subjectId: string };

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

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onSave({
      id: initial?.id ?? "",
      name,
      teacherNames: initial?.teacherNames ?? [],
      teachers: initial?.teachers ?? [],
    });
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

const TEACHER_ROW_GRID = "grid grid-cols-[1fr_200px_150px_140px_100px_70px] items-center gap-4";

type AcademicStructureResponse = {
  departments?: DepartmentCard[];
};

export default function AcademicStructurePage() {
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [view, setView] = useState<View>({ level: "departments" });
  const [search, setSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: DepartmentCard }>({ open: false });
  const [subjectModal, setSubjectModal] = useState<{ open: boolean; edit?: DeptSubject }>({ open: false });
  const [deleteDeptTarget, setDeleteDeptTarget] = useState<DepartmentCard | null>(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState<DeptSubject | null>(null);

  const loadDepartments = useCallback(async () => {
    try {
      const response = await fetch("/api/org/academic-structure", { cache: "no-store" });
      const payload = (await response.json()) as AcademicStructureResponse;
      if (!response.ok || !Array.isArray(payload.departments)) {
        setDepartments([]);
        return;
      }

      const mapped = payload.departments.map((department) => ({
        id: department.id,
        name: department.name,
        courses: Number(department.courses ?? 0),
        students: Number(department.students ?? 0),
        faculty: Number(department.faculty ?? 0),
        metricLabel: typeof department.metricLabel === "string" ? department.metricLabel : "Exam Completion Rate",
        metricValue: Number(department.metricValue ?? 0),
        subjects: Array.isArray(department.subjects)
          ? department.subjects.map((subject) => ({
              id: subject.id,
              name: subject.name,
              teacherNames: Array.isArray(subject.teacherNames) ? subject.teacherNames : [],
              teachers: Array.isArray(subject.teachers) ? subject.teachers : [],
            }))
          : [],
      }));

      setDepartments(mapped);
      setView((currentView) => {
        if (currentView.level === "departments") return currentView;
        const nextActiveDepartment = mapped.find((department: { id: string }) => department.id === currentView.departmentId);
        if (!nextActiveDepartment) {
          return { level: "departments" };
        }
        if (
          currentView.level === "teachers" &&
          !nextActiveDepartment.subjects.some((subject) => subject.id === currentView.subjectId)
        ) {
          return { level: "subjects", departmentId: currentView.departmentId };
        }
        return currentView;
      });
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const totalDepartments = departments.length;
  const totalStudents = departments.reduce((sum, d) => sum + d.students, 0);
  const totalCourses = departments.reduce((sum, d) => sum + d.courses, 0);
  const totalFaculty = departments.reduce((sum, d) => sum + d.faculty, 0);

  const activeDepartment = view.level !== "departments" ? departments.find((d) => d.id === view.departmentId) : undefined;
  const activeSubject =
    view.level === "teachers" ? activeDepartment?.subjects.find((s) => s.id === view.subjectId) : undefined;

  async function saveDepartment(dept: DepartmentCard) {
    try {
      const method = dept.id ? "PATCH" : "POST";
      const response = await fetch("/api/org/academic-structure", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(method === "PATCH" ? { id: dept.id } : {}),
          type: "department",
          name: dept.name,
          courses: dept.courses,
          students: dept.students,
          faculty: dept.faculty,
          metricLabel: dept.metricLabel,
          metricValue: dept.metricValue,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        window.alert(payload?.error || "Failed to save department.");
        return;
      }
      setView({ level: "departments" });
      await loadDepartments();
    } catch {
      window.alert("Failed to save department.");
    }
  }

  async function saveSubject(subject: DeptSubject) {
    if (!activeDepartment) return;

    try {
      const method = subject.id ? "PATCH" : "POST";
      const response = await fetch("/api/org/academic-structure", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(method === "PATCH" ? { id: subject.id } : { departmentId: activeDepartment.id }),
          type: "subject",
          name: subject.name,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        window.alert(payload?.error || "Failed to save subject.");
        return;
      }
      setView({ level: "subjects", departmentId: activeDepartment.id });
      await loadDepartments();
    } catch {
      window.alert("Failed to save subject.");
    }
  }

  async function confirmDeleteDepartment() {
    if (!deleteDeptTarget) return;
    try {
      const response = await fetch("/api/org/academic-structure", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "department", id: deleteDeptTarget.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        window.alert(payload?.error || "Failed to delete department.");
        return;
      }
      setDeleteDeptTarget(null);
      if (view.level !== "departments" && view.departmentId === deleteDeptTarget.id) {
        setView({ level: "departments" });
      }
      await loadDepartments();
    } catch {
      window.alert("Failed to delete department.");
    }
  }

  async function confirmDeleteSubject() {
    if (!deleteSubjectTarget || !activeDepartment) return;
    try {
      const response = await fetch("/api/org/academic-structure", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "subject", id: deleteSubjectTarget.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        window.alert(payload?.error || "Failed to delete subject.");
        return;
      }
      setDeleteSubjectTarget(null);
      if (view.level === "teachers" && view.subjectId === deleteSubjectTarget.id) {
        setView({ level: "subjects", departmentId: activeDepartment.id });
      }
      await loadDepartments();
    } catch {
      window.alert("Failed to delete subject.");
    }
  }

  function handleAddDepartment() {
    setDeptModal({ open: true });
  }

  function handleAddSubject() {
    setSubjectModal({ open: true });
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
              <button type="button" onClick={handleAddDepartment} className="text-left">
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
                <Button onClick={handleAddSubject}>
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
                  onClick={() => setView({ level: "teachers", departmentId: activeDepartment.id, subjectId: s.id })}
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
              <button type="button" onClick={handleAddSubject} className="text-left">
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

        {/* New level: replaces the old modal. Same breadcrumb pattern as
            departments -> subjects, extended one step further. */}
        {view.level === "teachers" && activeDepartment && activeSubject && (
          <>
            <Breadcrumb
              items={[
                { label: "Department Inventory", onClick: () => setView({ level: "departments" }) },
                { label: activeDepartment.name, onClick: () => setView({ level: "subjects", departmentId: activeDepartment.id }) },
                { label: activeSubject.name },
              ]}
            />
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-navy-900">{activeSubject.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeSubject.teacherNames.length} teacher{activeSubject.teacherNames.length !== 1 ? "s" : ""} assigned to this subject
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setView({ level: "subjects", departmentId: activeDepartment.id })}
              >
                <ChevronLeft size={15} /> Back
              </Button>
            </div>

            <Card className="overflow-hidden">
              {(activeSubject.teachers ?? []).length > 0 ? (
                <div>
                  <div className={`${TEACHER_ROW_GRID} px-6 py-3 bg-slate-50/60 border-b border-slate-100`}>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Teacher</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Joined</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Subject</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</span>
                    <span />
                  </div>

                  {(activeSubject.teachers ?? []).map((teacher: AcademicTeacher, i: number) => (
                    <Link
                      key={teacher.id}
                      href={`/teachers/${encodeURIComponent(teacher.id)}`}
                      className={`${TEACHER_ROW_GRID} px-6 py-3.5 hover:bg-sky-50/40 transition-colors group ${
                        i !== (activeSubject.teachers ?? []).length - 1 ? "border-b border-slate-50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-semibold">
                          {teacher.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-navy-900 truncate">{teacher.name}</p>
                          <p className="text-xs text-slate-400 truncate">{teacher.email}</p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm text-slate-600 truncate">{teacher.email}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600">{teacher.joined || "-"}</p>
                      </div>

                      <div>
                        <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 text-xs font-medium px-2.5 py-1">
                          {activeSubject.name}
                        </span>
                      </div>

                      <div>
                        <span className={statusClass(teacher.status)}>
                          {teacher.status}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 justify-self-end">
                        View
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">
                  No teachers assigned to this subject yet.
                </p>
              )}
            </Card>
          </>
        )}
      </main>

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

function statusClass(status: AcademicTeacher["status"]) {
  const base =
    "inline-flex items-center rounded-full text-xs font-semibold uppercase tracking-wide px-2.5 py-1";
  if (status === "Active") return `${base} bg-emerald-50 text-emerald-700`;
  if (status === "Suspended") return `${base} bg-rose-50 text-rose-700`;
  return `${base} bg-amber-50 text-amber-700`;
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
