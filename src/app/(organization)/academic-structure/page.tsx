"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEPARTMENTS as INITIAL_DEPARTMENTS, DepartmentCard, DeptSubject } from "@/lib/academic-structure-data";
import { EXAMS } from "@/lib/exam-data";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users2,
  Plus,
  ArrowRight,
  ChevronLeft,
  FileText,
  Search,
} from "lucide-react";

const DEFAULT_CATEGORIES: { label: string; color: DepartmentCard["categoryColor"] }[] = [
  { label: "STEM", color: "sky" },
  { label: "ENGINEERING", color: "navy" },
  { label: "BUSINESS", color: "emerald" },
  { label: "HUMANITIES", color: "amber" },
];

const CATEGORY_COLOR_CYCLE: DepartmentCard["categoryColor"][] = ["sky", "navy", "emerald", "amber"];

interface CategoryOption {
  label: string;
  color: DepartmentCard["categoryColor"];
}

function AddDepartmentModal({
  open,
  onClose,
  onAdd,
  categories,
  onAddCategory,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (dept: DepartmentCard) => void;
  categories: CategoryOption[];
  onAddCategory: (cat: CategoryOption) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.label ?? "");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  function handleAddCategory() {
    const trimmed = newCategoryName.trim().toUpperCase();
    if (!trimmed) return;
    if (categories.some((c) => c.label === trimmed)) {
      setCategory(trimmed);
      setNewCategoryName("");
      setShowNewCategory(false);
      return;
    }
    const color = CATEGORY_COLOR_CYCLE[categories.length % CATEGORY_COLOR_CYCLE.length];
    onAddCategory({ label: trimmed, color });
    setCategory(trimmed);
    setNewCategoryName("");
    setShowNewCategory(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !category) return;
    const cat = categories.find((c) => c.label === category) ?? categories[0];
    onAdd({
      id: crypto.randomUUID(),
      name,
      category: cat.label,
      categoryColor: cat.color,
      courses: 0,
      students: 0,
      faculty: 0,
      metricLabel: "Exam Completion Rate",
      metricValue: 0,
      subjects: [],
    });
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Add New Department" description="Create a new department" onClose={onClose} />
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
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-navy-900">Category</label>
              <button
                type="button"
                onClick={() => setShowNewCategory((v) => !v)}
                className="text-xs font-medium text-sky-600 hover:underline"
              >
                {showNewCategory ? "Cancel" : "+ Add new category"}
              </button>
            </div>

            {!showNewCategory ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              >
                {categories.map((c) => (
                  <option key={c.label} value={c.label}>{c.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Medicine"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddCategory}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Department</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

const CATEGORY_BADGE: Record<DepartmentCard["categoryColor"], "info" | "default" | "success" | "warning"> = {
  sky: "info",
  navy: "default",
  emerald: "success",
  amber: "warning",
};

type View =
  | { level: "departments" }
  | { level: "subjects"; departmentId: string }
  | { level: "teacher"; departmentId: string; subjectId: string; teacherName: string };

function AddSubjectModal({
  open,
  onClose,
  onAdd,
  departmentName,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (subject: DeptSubject) => void;
  departmentName?: string;
}) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onAdd({ id: crypto.randomUUID(), name, teacherNames: [] });
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader
        title="Add Subject"
        description={departmentName ? `Create a new subject under ${departmentName}` : undefined}
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
          <Button type="submit">Add Subject</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default function AcademicStructurePage() {
  const [departments, setDepartments] = useState<DepartmentCard[]>(INITIAL_DEPARTMENTS);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [view, setView] = useState<View>({ level: "departments" });
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [subjectAddOpen, setSubjectAddOpen] = useState(false);

  const totalDepartments = departments.length;
  const totalStudents = departments.reduce((sum, d) => sum + d.students, 0);
  const totalCourses = departments.reduce((sum, d) => sum + d.courses, 0);
  const totalFaculty = departments.reduce((sum, d) => sum + d.faculty, 0);

  const activeDepartment = view.level !== "departments" ? departments.find((d) => d.id === view.departmentId) : undefined;
  const activeSubject =
    view.level === "teacher" ? activeDepartment?.subjects.find((s) => s.id === view.subjectId) : undefined;

  const teacherExams = useMemo(() => {
    if (view.level !== "teacher") return [];
    return EXAMS.filter((e) => e.teacher === view.teacherName);
  }, [view]);

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
              {departments.filter((d) => d.name.toLowerCase().includes(search.toLowerCase())).map((d) => (
                <Card key={d.id} className="overflow-hidden">
                  <div className="bg-navy-900 p-5 text-white relative">
                    <Badge variant={CATEGORY_BADGE[d.categoryColor]} className="bg-white/10 text-white border-white/20">
                      {d.category}
                    </Badge>
                    <h3 className="mt-3 text-lg font-semibold">{d.name}</h3>
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
              <button type="button" onClick={() => setAddOpen(true)} className="text-left">
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
                <Button onClick={() => setSubjectAddOpen(true)}>
                  <Plus size={15} /> Add Subject
                </Button>
                <Button variant="outline" onClick={() => setView({ level: "departments" })}>
                  <ChevronLeft size={15} /> Back
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {activeDepartment.subjects.map((s) => (
                <Card key={s.id} className="p-5">
                  <div className="flex items-center gap-2 mb-3 text-sky-600">
                    <BookOpen size={16} />
                    <span className="text-xs font-medium uppercase tracking-wide">Subject</span>
                  </div>
                  <h3 className="text-base font-semibold text-navy-900 mb-3">{s.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    {s.teacherNames.length} teacher{s.teacherNames.length !== 1 ? "s" : ""} assigned
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {s.teacherNames.map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setView({
                            level: "teacher",
                            departmentId: activeDepartment.id,
                            subjectId: s.id,
                            teacherName: t,
                          })
                        }
                      >
                        <Badge variant="info" className="cursor-pointer hover:bg-sky-100">
                          {t}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </Card>
              ))}

              {/* Add subject */}
              <button type="button" onClick={() => setSubjectAddOpen(true)} className="text-left">
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

        {view.level === "teacher" && activeDepartment && activeSubject && (
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
                <h2 className="text-lg font-semibold text-navy-900">{view.teacherName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teaching {activeSubject.name} · {activeDepartment.name}
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
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-navy-900">Exam History</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                    <th className="px-5 py-3 font-medium">Exam</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium text-right">Students</th>
                    <th className="px-5 py-3 font-medium text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherExams.map((exam) => (
                    <tr key={exam.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-navy-900">{exam.title}</p>
                        <p className="text-xs text-slate-400">{exam.examCode}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{exam.date}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            exam.status === "Completed"
                              ? "success"
                              : exam.status === "In Progress"
                              ? "info"
                              : exam.status === "Scheduled"
                              ? "warning"
                              : "danger"
                          }
                        >
                          {exam.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600">{exam.totalStudents}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/organization/exams/${exam.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                        >
                          <FileText size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {teacherExams.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                        No exam history for this teacher yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </main>

      <AddDepartmentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={(dept) => setDepartments((prev) => [...prev, dept])}
        categories={categories}
        onAddCategory={(cat) => setCategories((prev) => [...prev, cat])}
      />
      <AddSubjectModal
        open={subjectAddOpen}
        onClose={() => setSubjectAddOpen(false)}
        departmentName={activeDepartment?.name}
        onAdd={(subject) => {
          if (!activeDepartment) return;
          setDepartments((prev) =>
            prev.map((d) =>
              d.id === activeDepartment.id ? { ...d, subjects: [...d.subjects, subject] } : d
            )
          );
        }}
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