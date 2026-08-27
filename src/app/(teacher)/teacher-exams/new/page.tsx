"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Layers,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  AlertTriangle,
  Paperclip,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  FileText,
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Dialog, DialogHeader } from "@/components/ui/dialog";

// --- TYPE DEFINITIONS ---
type QuestionType =
  | "mcq"
  | "multi_select"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "coding"
  | "fill_blank"
  | "matching"
  | "ordering";

interface AnswerKeyRow {
  number: string;
  answer: string;
}

interface MatchRow {
  left: string;
  right: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  autoGrade?: boolean;
  mediaType: "none" | "image" | "audio" | "video";
  mediaUrl?: string;
  mcqOptions?: string[];
  mcqCorrect?: number;
  multiOptions?: string[];
  multiCorrect?: boolean[];
  tfCorrect?: boolean;
  blanksText?: string;
  answerKey?: AnswerKeyRow[];
  blankChoices?: string[];
  matchLeft?: string[];
  matchRight?: string[];
  matchAnswers?: MatchRow[];
  orderingItems?: string[];
}

interface ExamPart {
  id: string;
  title: string;
  marks: number;
  description: string;
  allowedType: QuestionType;
  questions: Question[];
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice (QCM)",
  multi_select: "Multiple Select",
  true_false: "True / False",
  short_answer: "Short Answer",
  long_answer: "Long Question",
  coding: "Coding Challenge",
  fill_blank: "Fill in the Blank",
  matching: "Matching Pairs",
  ordering: "Sequence / Ordering",
};

const AUTO_GRADABLE: QuestionType[] = ["mcq", "multi_select", "true_false", "fill_blank"];

// ✅ Extract unique [n] marker numbers from template text
function extractBlankNumbers(text: string): string[] {
  const nums: string[] = [];
  const re = /\[\s*(\d+)\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (!nums.includes(m[1])) nums.push(m[1]);
  }
  return nums.sort((a, b) => Number(a) - Number(b));
}

function blankQuestion(type: QuestionType): Question {
  return {
    id: "",
    type,
    text: "",
    marks: 5,
    autoGrade: true,
    mediaType: "none",
    mcqOptions: ["", ""],
    mcqCorrect: 0,
    multiOptions: ["", ""],
    multiCorrect: [false, false],
    tfCorrect: true,
    blanksText: "The capital of France is [1].",
    answerKey: [{ number: "1", answer: "" }],
    blankChoices: [],
    matchLeft: ["", ""],
    matchRight: ["", ""],
    matchAnswers: [{ left: "1", right: "A" }],
    orderingItems: ["Step 1", "Step 2", "Step 3"],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
      <AlertTriangle size={12} className="shrink-0" />
      {message}
    </p>
  );
}

function ExamBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createExam = useExamStore((state) => state.createExam);
  const updateExam = useExamStore((state) => state.updateExam);
  const exams = useExamStore((state) => state.exams);
  const fetchExams = useExamStore((state) => state.fetchExams);

  const editId = searchParams.get("edit");
  const tabParam = searchParams.get("tab");
  const editingExam = editId ? exams.find((e) => e.id === editId) : undefined;

  const [step, setStep] = useState<1 | 2>(1);
  const [teacherAssignments, setTeacherAssignments] = useState<
    Array<{ department: string; subjects: string[] }>
  >([]);

  // ✅ Inline error states
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    department?: string;
    subject?: string;
    duration?: string;
  }>({});
  const [questionError, setQuestionError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const res = await fetch("/api/teacher/assignments");
        if (res.ok) {
          const data = await res.json();
          const assignments = data.assignments || [];
          setTeacherAssignments(assignments);
          if (assignments.length > 0) {
            setExamData((prev) => ({
              ...prev,
              department: prev.department || assignments[0].department,
              subject: prev.subject || assignments[0].subjects[0] || "",
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
      }
    }
    fetchAssignments();
  }, []);

  const [examData, setExamData] = useState({
    title: "",
    description: "",
    department: "",
    subject: "",
    duration: 60,
    startDate: "",
  });

  const [parts, setParts] = useState<ExamPart[]>([]);
  const [activePartId, setActivePartId] = useState<string>("");
  const [stagedQuestions, setStagedQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<"staged" | "part" | null>(null);
  const [newPartTitle, setNewPartTitle] = useState("");
  const [newPartMarks, setNewPartMarks] = useState<string>("");
  const [newPartType, setNewPartType] = useState<QuestionType>("mcq");
  const [form, setForm] = useState<Question>(blankQuestion("mcq"));
  const [cancelConfirm, setCancelConfirm] = useState<{
    open: boolean;
    target: "question" | "exam";
  }>({ open: false, target: "question" });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    source: "staged" | "part";
    questionId: string;
    partId?: string;
  } | null>(null);

  const formSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const activePart = parts.find((p) => p.id === activePartId);
  const currentFormat = activePart?.allowedType || "mcq";
  const savedParts = parts.filter((p) => p.questions.length > 0);

  async function handleMediaFile(file: File) {
    setUploading(true);
    setMediaError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/teacher/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setMediaError(data.error || "Upload failed. Please try another file.");
        return;
      }
      const kind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("video/")
        ? "video"
        : "none";
      setForm((f) => ({ ...f, mediaType: kind as Question["mediaType"], mediaUrl: data.url }));
    } catch {
      setMediaError("Upload failed. Please try a smaller file.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (editingExam) {
      if (editingExam.isEnded || (editingExam.isStarted && !editingExam.isEnded)) {
        console.warn("Exam cannot be edited in its current state.");
        router.push("/teacher-exams");
        return;
      }
      setExamData({
        title: editingExam.title,
        description: "",
        department: editingExam.department,
        subject: editingExam.subject,
        duration: editingExam.durationMinutes,
        startDate: editingExam.startDate || "",
      });
      if (Array.isArray(editingExam.parts)) {
        setParts(editingExam.parts as ExamPart[]);
      }
    }
  }, [editingExam, router]);

  useEffect(() => {
    if (editId) {
      setStep(1);
      return;
    }
    if (tabParam === "questions") {
      setStep(2);
    }
  }, [editId, tabParam]);

  const isSettingsFormComplete = () =>
    examData.title.trim() !== "" &&
    examData.department.trim() !== "" &&
    examData.subject.trim() !== "" &&
    examData.duration > 0;

  const subjectsInSelectedDepartment =
    teacherAssignments.find((a) => a.department === examData.department)?.subjects || [];

  const handleDepartmentChange = (department: string) => {
    const match = teacherAssignments.find((a) => a.department === department);
    setExamData({ ...examData, department, subject: match?.subjects[0] || "" });
    setFieldErrors((p) => ({ ...p, department: undefined, subject: undefined }));
  };

  function validateParameters(): boolean {
    const errs: typeof fieldErrors = {};
    if (!examData.title.trim()) errs.title = "Exam title is required.";
    if (!examData.department.trim()) errs.department = "Please select a department.";
    if (!examData.subject.trim()) errs.subject = "Please select a subject.";
    if (!examData.duration || examData.duration <= 0)
      errs.duration = "Duration must be at least 1 minute.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ✅ Fill-blank helpers
  function addBlankRow() {
    const nums = extractBlankNumbers(form.blanksText || "");
    const next = nums.length ? Math.max(...nums.map(Number)) + 1 : 1;
    const base = (form.blanksText || "").trimEnd();
    setForm({
      ...form,
      blanksText: base ? `${base} [${next}]` : `[${next}]`,
      answerKey: [...(form.answerKey || []), { number: String(next), answer: "" }],
    });
  }

  function deleteBlankRow(number: string) {
    const newText = (form.blanksText || "")
      .replace(new RegExp(`\\[\\s*${number}\\s*\\]`, "g"), "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([.,;:!?])/g, "$1")
      .trim();
    setForm({
      ...form,
      blanksText: newText,
      answerKey: (form.answerKey || []).filter((r) => String(r.number) !== number),
    });
  }

  // ✅ Validation: question text always; answers for types that need them
  function validateQuestionForm(): string | null {
    if (!form.text.trim()) return "Question text prompt is required.";
    switch (currentFormat) {
      case "mcq": {
        const opts = form.mcqOptions || [];
        if (opts.filter((o) => o.trim()).length < 2) return "Please provide at least two answer choices.";
        if (opts.some((o) => !o.trim())) return "Please fill in every answer choice (or delete the empty ones).";
        return null;
      }
      case "multi_select": {
        const opts = form.multiOptions || [];
        if (opts.filter((o) => o.trim()).length < 2) return "Please provide at least two checkbox options.";
        if (opts.some((o) => !o.trim())) return "Please fill in every checkbox option (or delete the empty ones).";
        if (!(form.multiCorrect || []).some(Boolean)) return "Please tick at least one correct option.";
        return null;
      }
      case "fill_blank": {
        const nums = extractBlankNumbers(form.blanksText || "");
        if (nums.length === 0) return "Add at least one blank marker like [1] in the template text.";
        if (form.autoGrade !== false) {
          const missing = nums.some(
            (n) => !(form.answerKey || []).find((r) => String(r.number) === n && r.answer.trim())
          );
          if (missing) return "Fill in the answer key for every blank.";
        }
        return null;
      }
      case "matching": {
        const left = form.matchLeft || [];
        const right = form.matchRight || [];
        if (left.filter((t) => t.trim()).length < 2 || right.filter((t) => t.trim()).length < 2)
          return "Please provide at least two left items and two right items.";
        if (left.some((t) => !t.trim()) || right.some((t) => !t.trim()))
          return "Please fill in every match item (or delete the empty ones).";
        if (!(form.matchAnswers || []).length) return "Please add the correct left → right mapping.";
        return null;
      }
      case "ordering": {
        const items = form.orderingItems || [];
        if (items.filter((t) => t.trim()).length < 2) return "Please provide at least two sequence items.";
        if (items.some((t) => !t.trim())) return "Please fill in every sequence item (or delete the empty ones).";
        return null;
      }
      default:
        return null;
    }
  }

  function isFormDirty(): boolean {
    if (form.text.trim()) return true;
    switch (currentFormat) {
      case "mcq": return (form.mcqOptions || []).some((o) => o.trim());
      case "multi_select": return (form.multiOptions || []).some((o) => o.trim());
      case "fill_blank": return Boolean((form.blanksText || "").trim());
      case "matching":
        return (form.matchLeft || []).some((t) => t.trim()) || (form.matchRight || []).some((t) => t.trim());
      case "ordering": return (form.orderingItems || []).some((t) => t.trim());
      default: return false;
    }
  }

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartTitle.trim()) return;

    let nextParts = parts;
    if (activePartId && stagedQuestions.length > 0) {
      nextParts = nextParts.map((p) =>
        p.id === activePartId ? { ...p, questions: [...p.questions, ...stagedQuestions] } : p
      );
    }

    const newPart: ExamPart = {
      id: Date.now().toString(),
      title: newPartTitle,
      marks: parseInt(newPartMarks) || 10,
      description: `Format restricted to ${QUESTION_TYPE_LABELS[newPartType]}.`,
      allowedType: newPartType,
      questions: [],
    };

    setParts([...nextParts.filter((p) => p.questions.length > 0), newPart]);
    setActivePartId(newPart.id);
    setStagedQuestions([]);
    setEditingQuestionId(null);
    setEditingSource(null);
    setForm(blankQuestion(newPartType));
    setNewPartTitle("");
    setNewPartMarks("");
    setSectionError("");
  };

  const buildQuestionFromForm = (): Question | null => {
    const err = validateQuestionForm();
    if (err) {
      setQuestionError(err);
      return null;
    }
    setQuestionError("");
    return { ...form, id: editingQuestionId || Date.now().toString(), type: currentFormat };
  };

  const handleNextQuestion = () => {
    const q = buildQuestionFromForm();
    if (!q) return;
    if (editingSource === "part" && activePartId) {
      setParts((prev) =>
        prev.map((part) =>
          part.id === activePartId
            ? { ...part, questions: part.questions.map((existing) => (existing.id === q.id ? q : existing)) }
            : part
        )
      );
    } else if (editingSource === "staged") {
      setStagedQuestions((prev) => prev.map((existing) => (existing.id === q.id ? q : existing)));
    } else {
      setStagedQuestions((prev) => [...prev, q]);
    }
    setEditingQuestionId(null);
    setEditingSource(null);
    setForm(blankQuestion(currentFormat));
  };

  const handleAddSection = () => {
    setSectionError("");
    let finalStaged = stagedQuestions;

    if (isFormDirty()) {
      const err = validateQuestionForm();
      if (err) {
        setQuestionError(err);
        return;
      }
      const q: Question = { ...form, id: editingQuestionId || Date.now().toString(), type: currentFormat };
      if (editingSource === "part" && activePartId) {
        setParts((prev) =>
          prev.map((part) =>
            part.id === activePartId
              ? { ...part, questions: part.questions.map((e2) => (e2.id === q.id ? q : e2)) }
              : part
          )
        );
      } else {
        finalStaged =
          editingSource === "staged"
            ? stagedQuestions.map((e2) => (e2.id === q.id ? q : e2))
            : [...stagedQuestions, q];
      }
    }

    if (finalStaged.length === 0 && !activePartId) {
      setSectionError("Add at least one question before saving the section.");
      return;
    }
    if (activePartId) {
      setParts((prev) =>
        prev
          .map((part) =>
            part.id === activePartId ? { ...part, questions: [...part.questions, ...finalStaged] } : part
          )
          .filter((part) => part.questions.length > 0)
      );
    }
    setStagedQuestions([]);
    setActivePartId("");
    setEditingQuestionId(null);
    setEditingSource(null);
    setForm(blankQuestion("mcq"));
    setQuestionError("");
  };

  const handleEditQuestion = (q: Question, source: "staged" | "part") => {
    setForm(q);
    setEditingQuestionId(q.id);
    setEditingSource(source);
    setQuestionError("");
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleDeleteStaged = (id: string) => {
    setStagedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDeleteQuestion = (partId: string, questionId: string) => {
    setParts((prev) =>
      prev.map((p) =>
        p.id === partId ? { ...p, questions: p.questions.filter((q) => q.id !== questionId) } : p
      )
    );
  };

  const openDeleteConfirmation = (payload: {
    source: "staged" | "part";
    questionId: string;
    partId?: string;
  }) => setDeleteConfirm(payload);

  const closeDeleteConfirmation = () => setDeleteConfirm(null);

  const handleConfirmDeleteQuestion = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.source === "staged") handleDeleteStaged(deleteConfirm.questionId);
    else if (deleteConfirm.partId) handleDeleteQuestion(deleteConfirm.partId, deleteConfirm.questionId);
    if (editingQuestionId === deleteConfirm.questionId) {
      setEditingQuestionId(null);
      setEditingSource(null);
      setForm(blankQuestion(currentFormat));
    }
    setDeleteConfirm(null);
  };

  const openCancelConfirmation = (target: "question" | "exam") =>
    setCancelConfirm({ open: true, target });

  const closeCancelConfirmation = () => setCancelConfirm((prev) => ({ ...prev, open: false }));

  const handleDiscardConfirmed = () => {
    const target = cancelConfirm.target;
    setCancelConfirm((prev) => ({ ...prev, open: false }));
    if (target === "question") {
      setForm(blankQuestion(currentFormat));
      setEditingQuestionId(null);
      setEditingSource(null);
    } else {
      router.push("/teacher-exams?tab=scheduled");
    }
  };

  const countTotalQuestions = () =>
    parts.reduce((acc, part) => acc + part.questions.length, 0) + stagedQuestions.length;

  const handleSaveExam = async () => {
    if (saving) return;
    setSaveError("");

    const finalParts = parts.filter((p) => p.questions.length > 0);
    const totalQCount = finalParts.reduce((acc, part) => acc + part.questions.length, 0);
    if (finalParts.length === 0 || totalQCount === 0) {
      setSaveError("Please create at least one section with at least one question before saving.");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        const result = await updateExam(editId, {
          title: examData.title || "Untitled Examination",
          description: examData.description,
          department: examData.department,
          subject: examData.subject,
          durationMinutes: examData.duration,
          parts: finalParts,
          questionCount: totalQCount,
          startDate: examData.startDate || undefined,
        });
        if (!result.success) {
          setSaveError(result.message || "This exam cannot be edited.");
          return;
        }
        router.push("/teacher-exams");
        return;
      }

      const result = await createExam({
        title: examData.title || "Untitled Examination",
        department: examData.department,
        subject: examData.subject,
        durationMinutes: examData.duration,
        parts: finalParts,
        questionCount: totalQCount,
        startDate: examData.startDate || undefined,
      });

      if (!result.id) {
        setSaveError(result.message || "Failed to create exam.");
        return;
      }
      router.push("/teacher-exams");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TeacherTopbar
        title={step === 1 ? "Configure Exam Parameters" : "Sections & Question Setup"}
        description={
          step === 1
            ? "Set department and time duration."
            : "Organize questionnaire sections and configure multi-format rules."
        }
      />
      <main className="p-6 space-y-6">
        {/* STEP CONTROLS */}
        <Card className="p-4 flex justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                step === 1 ? "bg-navy-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Parameters
            </button>
            <button
              type="button"
              disabled={!isSettingsFormComplete()}
              onClick={() => setStep(2)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                step === 2 ? "bg-navy-900 text-white" : "text-slate-600 hover:text-slate-900"
              } ${!isSettingsFormComplete() ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              2. Questions ({countTotalQuestions()})
            </button>
          </div>
        </Card>

        {/* STEP 1 */}
        {step === 1 && (
          <Card>
            <CardContent className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  General Information
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                    value={examData.title}
                    onChange={(e) => {
                      setExamData({ ...examData, title: e.target.value });
                      setFieldErrors((p) => ({ ...p, title: undefined }));
                    }}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none transition-all placeholder:text-slate-400 ${
                      fieldErrors.title
                        ? "border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        : "border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    }`}
                  />
                  <FieldError message={fieldErrors.title} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Instructions & Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detail academic honor codes, workspace configuration parameters, etc..."
                    value={examData.description}
                    onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Department *
                    </label>
                    <select
                      value={examData.department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none transition-all cursor-pointer bg-white ${
                        fieldErrors.department
                          ? "border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          : "border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      }`}
                    >
                      {teacherAssignments.length === 0 ? (
                        <option value="">No departments assigned yet</option>
                      ) : (
                        teacherAssignments.map((a) => (
                          <option key={a.department} value={a.department}>
                            {a.department}
                          </option>
                        ))
                      )}
                    </select>
                    <FieldError message={fieldErrors.department} />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Only your organization-assigned departments show up here.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subject *
                    </label>
                    <select
                      value={examData.subject}
                      onChange={(e) => {
                        setExamData({ ...examData, subject: e.target.value });
                        setFieldErrors((p) => ({ ...p, subject: undefined }));
                      }}
                      disabled={subjectsInSelectedDepartment.length === 0}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none transition-all cursor-pointer bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
                        fieldErrors.subject
                          ? "border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          : "border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      }`}
                    >
                      {subjectsInSelectedDepartment.length === 0 ? (
                        <option value="">No subjects in this department</option>
                      ) : (
                        subjectsInSelectedDepartment.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))
                      )}
                    </select>
                    <FieldError message={fieldErrors.subject} />
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Only the subjects you teach within that department.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Duration (Minutes) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={examData.duration}
                      onChange={(e) => {
                        setExamData({ ...examData, duration: parseInt(e.target.value) || 0 });
                        setFieldErrors((p) => ({ ...p, duration: undefined }));
                      }}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none transition-all ${
                        fieldErrors.duration
                          ? "border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                          : "border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      }`}
                    />
                    <FieldError message={fieldErrors.duration} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Exam Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={examData.startDate}
                      onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Leave empty to launch the exam manually yourself.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editId) openCancelConfirmation("exam");
                    else router.push("/teacher-exams?tab=scheduled");
                  }}
                  className="bg-white border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (validateParameters()) setStep(2);
                  }}
                >
                  Continue to Question Setup <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            {/* SECTION CREATOR */}
            <Card>
              <CardContent>
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wider block mb-3">
                  Exam Sections Hierarchy
                </span>
                <form
                  onSubmit={handleCreatePart}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/70 p-4 rounded-xl border border-slate-200"
                >
                  <div className="md:col-span-5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Section Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Section A: Multiple Choice"
                      value={newPartTitle}
                      onChange={(e) => setNewPartTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Section Format Rule
                    </label>
                    <select
                      value={newPartType}
                      onChange={(e) => setNewPartType(e.target.value as QuestionType)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all cursor-pointer"
                    >
                      {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
                        <option key={t} value={t}>
                          {QUESTION_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <Button type="submit" className="w-full">
                      <Plus className="w-4 h-4" /> Add Section
                    </Button>
                  </div>
                </form>

                <div className="flex flex-wrap gap-2 mt-4 border-t border-slate-100 pt-4 items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">
                    Saved Sections:
                  </span>
                  {savedParts.length === 0 ? (
                    <span className="text-xs font-medium text-slate-400 italic">
                      No sections saved yet. A section is saved once it has at least one question.
                    </span>
                  ) : (
                    savedParts.map((p) => (
                      <Badge key={p.id} variant="neutral" className="text-xs">
                        {p.title}
                        <span className="opacity-70 font-mono text-[10px]">
                          ({QUESTION_TYPE_LABELS[p.allowedType]})
                        </span>
                        <span className="bg-navy-900/10 text-navy-900 text-[10px] px-1.5 rounded-full font-bold">
                          {p.questions.length}
                        </span>
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* QUESTION BUILDER */}
            {!activePartId ? (
              <Card className="border-dashed p-12 text-center space-y-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-navy-900">No Active Section</h3>
                <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
                  Create a section above to start adding questions to it.
                </p>
              </Card>
            ) : (
              <div ref={formSectionRef}>
                <Card>
                  <CardContent className="space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h2 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                        Active Section: {activePart?.title}
                      </h2>
                      <Badge variant="info">{QUESTION_TYPE_LABELS[currentFormat]}</Badge>
                    </div>

                    {/* MARKS + MEDIA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Points / Marks
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={form.marks}
                          onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 1 })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-navy-900 outline-none focus:border-sky-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Media Attachment
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,audio/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleMediaFile(file);
                          }}
                        />
                        {form.mediaUrl ? (
                          <div className="space-y-2">
                            {form.mediaType === "image" && (
                              <img
                                src={form.mediaUrl}
                                alt="Question media"
                                className="max-h-36 rounded-xl border border-slate-200 object-contain bg-slate-50"
                              />
                            )}
                            {form.mediaType === "video" && (
                              <video
                                src={form.mediaUrl}
                                controls
                                className="max-h-36 w-full rounded-xl border border-slate-200 bg-black"
                              />
                            )}
                            {form.mediaType === "audio" && (
                              <audio src={form.mediaUrl} controls className="w-full" />
                            )}
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 rounded-full px-2.5 py-1">
                                {form.mediaType === "image" ? (
                                  <ImageIcon size={12} />
                                ) : form.mediaType === "video" ? (
                                  <VideoIcon size={12} />
                                ) : (
                                  <Music size={12} />
                                )}
                                {form.mediaType?.toUpperCase()}
                              </span>
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                              >
                                Replace
                              </button>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, mediaUrl: undefined, mediaType: "none" })}
                                className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-600 hover:border-sky-400 hover:text-sky-700 hover:bg-sky-50/50 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {uploading ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Paperclip size={14} />
                                Attach image, video, or audio from device
                              </>
                            )}
                          </button>
                        )}
                        <FieldError message={mediaError} />
                        <div className="flex items-center gap-3 mt-2 text-slate-400">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold">
                            <ImageIcon size={11} /> IMAGE
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold">
                            <VideoIcon size={11} /> VIDEO
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold">
                            <Music size={11} /> AUDIO
                          </span>
                          <span className="text-[10px]">· max 15MB</span>
                        </div>
                      </div>
                    </div>

                    {/* QUESTION PROMPT */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Question Text Prompt *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter the main question prompt or problem statement..."
                        value={form.text}
                        onChange={(e) => {
                          setForm({ ...form, text: e.target.value });
                          setQuestionError("");
                        }}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none transition-all placeholder:text-slate-400 resize-none ${
                          questionError
                            ? "border-rose-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                            : "border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        }`}
                      />
                      <FieldError message={questionError} />
                    </div>

                    {/* MCQ */}
                    {currentFormat === "mcq" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Multiple Choice Options (Select correct answer)
                        </label>
                        <div className="space-y-2.5">
                          {(form.mcqOptions || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-8 h-8 shrink-0 rounded-lg bg-navy-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setForm({ ...form, mcqCorrect: i })}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                  form.mcqCorrect === i
                                    ? "border-sky-500 bg-sky-50 text-sky-600"
                                    : "border-slate-300"
                                }`}
                              >
                                {form.mcqCorrect === i && (
                                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                                )}
                              </button>
                              <input
                                type="text"
                                value={opt}
                                placeholder="Type answer choice..."
                                onChange={(e) => {
                                  const c = [...(form.mcqOptions || [])];
                                  c[i] = e.target.value;
                                  setForm({ ...form, mcqOptions: c });
                                }}
                                className="grow border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    mcqOptions: (form.mcqOptions || []).filter((_, idx) => idx !== i),
                                  })
                                }
                                disabled={(form.mcqOptions || []).length <= 2}
                                className="text-xs text-rose-500 font-semibold hover:underline disabled:opacity-30 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, mcqOptions: [...(form.mcqOptions || []), ""] })}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}

                    {/* MULTI SELECT */}
                    {currentFormat === "multi_select" && (
                      <div className="space-y-3">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Checkbox Options (Check all correct answers)
                        </label>
                        <div className="space-y-2.5">
                          {(form.multiOptions || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-8 h-8 shrink-0 rounded-lg bg-navy-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <input
                                type="checkbox"
                                checked={(form.multiCorrect || [])[i] || false}
                                onChange={(e) => {
                                  const c = [...(form.multiCorrect || [])];
                                  c[i] = e.target.checked;
                                  setForm({ ...form, multiCorrect: c });
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={opt}
                                placeholder="Type answer choice..."
                                onChange={(e) => {
                                  const c = [...(form.multiOptions || [])];
                                  c[i] = e.target.value;
                                  setForm({ ...form, multiOptions: c });
                                }}
                                className="grow border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setForm({
                                    ...form,
                                    multiOptions: (form.multiOptions || []).filter((_, idx) => idx !== i),
                                    multiCorrect: (form.multiCorrect || []).filter((_, idx) => idx !== i),
                                  });
                                }}
                                disabled={(form.multiOptions || []).length <= 2}
                                className="text-xs text-rose-500 font-semibold hover:underline disabled:opacity-30 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              multiOptions: [...(form.multiOptions || []), ""],
                              multiCorrect: [...(form.multiCorrect || []), false],
                            })
                          }
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                        >
                          + Add Checkbox Option
                        </button>
                      </div>
                    )}

                    {/* TRUE / FALSE */}
                    {currentFormat === "true_false" && (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Correct Key Answer
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, tfCorrect: true })}
                            className={`px-6 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              form.tfCorrect
                                ? "bg-sky-50 border-sky-400 text-sky-700 font-bold"
                                : "border-slate-200 text-slate-600"
                            }`}
                          >
                            True
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, tfCorrect: false })}
                            className={`px-6 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              !form.tfCorrect
                                ? "bg-sky-50 border-sky-400 text-sky-700 font-bold"
                                : "border-slate-200 text-slate-600"
                            }`}
                          >
                            False
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SHORT ANSWER */}
                    {currentFormat === "short_answer" && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                            <FileText size={15} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-navy-900">
                              Short Answer — Manually Graded
                            </p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Students will respond in a short text box. After the exam,
                              you&apos;ll grade each response yourself from the grading page —
                              no auto-grading variants needed here.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LONG */}
                    {currentFormat === "long_answer" && (
                      <p className="text-xs text-slate-400 italic">
                        Students will respond in a free-form long-answer text box. No extra configuration needed.
                      </p>
                    )}

                    {/* CODING */}
                    {currentFormat === "coding" && (
                      <p className="text-xs text-slate-400 italic">
                        Students will respond in a free-form code box. No language, starter code, or test cases are configured here.
                      </p>
                    )}

                    {/* FILL IN THE BLANK */}
                    {currentFormat === "fill_blank" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Template Text (mark each blank as [1], [2], [3]…)
                          </label>
                          <input
                            type="text"
                            value={form.blanksText || ""}
                            onChange={(e) => {
                              const text = e.target.value;
                              const nums = extractBlankNumbers(text);
                              const prev = form.answerKey || [];
                              const nextKey =
                                nums.length > 0
                                  ? nums.map((n) => {
                                      const existing = prev.find((r) => String(r.number) === n);
                                      return existing ? { ...existing } : { number: n, answer: "" };
                                    })
                                  : prev;
                              setForm({ ...form, blanksText: text, answerKey: nextKey });
                              setQuestionError("");
                            }}
                            placeholder="e.g. The capital of France is [1] and its currency is [2]."
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                          />
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            Students will see one answer box per [n] marker, in order.
                          </p>
                        </div>

                        {/* Choices / Hints */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Answer Choices / Hints (optional — shown to students)
                          </label>
                          <div className="space-y-2">
                            {(form.blankChoices || []).map((c, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-8 h-8 shrink-0 rounded-lg bg-sky-500 text-white text-xs font-bold flex items-center justify-center font-mono">
                                  {i + 1}
                                </span>
                                <input
                                  type="text"
                                  value={c}
                                  placeholder="Type a choice (e.g. Paris)..."
                                  onChange={(e) => {
                                    const arr = [...(form.blankChoices || [])];
                                    arr[i] = e.target.value;
                                    setForm({ ...form, blankChoices: arr });
                                  }}
                                  className="grow border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setForm({
                                      ...form,
                                      blankChoices: (form.blankChoices || []).filter((_, idx) => idx !== i),
                                    })
                                  }
                                  className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setForm({ ...form, blankChoices: [...(form.blankChoices || []), ""] })
                            }
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                          >
                            + Add Choice
                          </button>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            Students see these numbered and may answer with the number (1, 2…) or the word.
                          </p>
                        </div>

                        {/* Answer Key */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Answer Key (one correct answer per blank)
                          </label>
                          {(form.answerKey || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              No blanks yet — type [1] in the sentence or click "+ Add Blank".
                            </p>
                          ) : (
                            (form.answerKey || []).map((row, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-14 shrink-0 text-center border border-slate-200 bg-slate-50 rounded-xl px-2 py-2 text-xs font-bold text-navy-900">
                                  [{row.number}]
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {(form.blankChoices || []).filter((c) => c.trim()).length > 0 ? (
                                  <select
                                    value={row.answer}
                                    onChange={(e) => {
                                      const c = [...(form.answerKey || [])];
                                      c[i] = { ...c[i], answer: e.target.value };
                                      setForm({ ...form, answerKey: c });
                                    }}
                                    className="grow border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400 bg-white cursor-pointer"
                                  >
                                    <option value="">Select correct answer…</option>
                                    {(form.blankChoices || [])
                                      .filter((c) => c.trim())
                                      .map((c, ci) => (
                                        <option key={ci} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Correct answer for this blank"
                                    value={row.answer}
                                    onChange={(e) => {
                                      const c = [...(form.answerKey || [])];
                                      c[i] = { ...c[i], answer: e.target.value };
                                      setForm({ ...form, answerKey: c });
                                    }}
                                    className="grow border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteBlankRow(row.number)}
                                  className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={addBlankRow}
                            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                          >
                            + Add Blank
                          </button>
                          <p className="text-[11px] text-slate-400">
                            "+ Add Blank" inserts a new [n] marker at the end of your sentence — move it into place as needed. Deleting a row also removes its marker.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* MATCHING */}
                    {currentFormat === "matching" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Left Items (numbered)
                            </label>
                            {(form.matchLeft || []).map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-navy-900 w-5">{i + 1}.</span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const c = [...(form.matchLeft || [])];
                                    c[i] = e.target.value;
                                    setForm({ ...form, matchLeft: c });
                                  }}
                                  className="grow border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-navy-900 outline-none focus:border-sky-400"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, matchLeft: [...(form.matchLeft || []), ""] })}
                              className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                            >
                              + Add Item
                            </button>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                              Right Items (lettered)
                            </label>
                            {(form.matchRight || []).map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-navy-900 w-5">
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    const c = [...(form.matchRight || [])];
                                    c[i] = e.target.value;
                                    setForm({ ...form, matchRight: c });
                                  }}
                                  className="grow border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-navy-900 outline-none focus:border-sky-400"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, matchRight: [...(form.matchRight || []), ""] })}
                              className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                            >
                              + Add Item
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Correct Mapping (e.g. 1 → C)
                          </label>
                          {(form.matchAnswers || []).map((row, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <select
                                value={row.left}
                                onChange={(e) => {
                                  const c = [...(form.matchAnswers || [])];
                                  c[i] = { ...c[i], left: e.target.value };
                                  setForm({ ...form, matchAnswers: c });
                                }}
                                className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-navy-900 outline-none focus:border-sky-400 cursor-pointer"
                              >
                                {(form.matchLeft || []).map((_, idx) => (
                                  <option key={idx} value={String(idx + 1)}>
                                    {idx + 1}
                                  </option>
                                ))}
                              </select>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <select
                                value={row.right}
                                onChange={(e) => {
                                  const c = [...(form.matchAnswers || [])];
                                  c[i] = { ...c[i], right: e.target.value };
                                  setForm({ ...form, matchAnswers: c });
                                }}
                                className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-navy-900 outline-none focus:border-sky-400 cursor-pointer"
                              >
                                {(form.matchRight || []).map((_, idx) => (
                                  <option key={idx} value={String.fromCharCode(65 + idx)}>
                                    {String.fromCharCode(65 + idx)}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    matchAnswers: (form.matchAnswers || []).filter((_, idx) => idx !== i),
                                  })
                                }
                                className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                matchAnswers: [...(form.matchAnswers || []), { left: "1", right: "A" }],
                              })
                            }
                            className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                          >
                            + Add Mapping Row
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ORDERING */}
                    {currentFormat === "ordering" && (
                      <div className="space-y-2.5">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Target Sequence Order (Top to Bottom)
                        </label>
                        {(form.orderingItems || []).map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs font-bold text-navy-900">{i + 1}.</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const c = [...(form.orderingItems || [])];
                                c[i] = e.target.value;
                                setForm({ ...form, orderingItems: c });
                              }}
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              orderingItems: [
                                ...(form.orderingItems || []),
                                `Step ${(form.orderingItems || []).length + 1}`,
                              ],
                            })
                          }
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                        >
                          + Add Sequence Item
                        </button>
                      </div>
                    )}

                    {/* Auto-Grading toggle */}
                    {AUTO_GRADABLE.includes(currentFormat) && (
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy-900">Auto-Grading</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {form.autoGrade !== false
                              ? "Answers are graded automatically using your answer key and points are awarded instantly."
                              : "Disabled — this question will wait for manual grading on the Grading page."}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.autoGrade !== false}
                          onClick={() => setForm({ ...form, autoGrade: form.autoGrade === false })}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
                            form.autoGrade !== false ? "bg-sky-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                              form.autoGrade !== false ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* CONTROLS */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      {sectionError && (
                        <p className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                          <AlertTriangle size={12} /> {sectionError}
                        </p>
                      )}
                      {editingQuestionId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openCancelConfirmation("question")}
                          className={`${sectionError ? "" : "mr-auto"} bg-white border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800`}
                        >
                          Cancel Edit
                        </Button>
                      )}
                      <Button variant="outline" onClick={handleNextQuestion}>
                        <Plus className="w-4 h-4" />
                        {editingQuestionId ? "Save & Next Question" : "Next Question"}
                      </Button>
                      <Button onClick={handleAddSection}>
                        <Check className="w-4 h-4" />
                        Add Section
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STAGED QUESTIONS */}
            {activePartId && stagedQuestions.length > 0 && (
              <Card>
                <CardContent className="space-y-3">
                  <h2 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Staged Questions ({stagedQuestions.length}) — will be saved when you click &ldquo;Add Section&rdquo;
                  </h2>
                  {stagedQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center gap-4"
                    >
                      <div>
                        <span className="text-xs font-bold text-navy-900 mr-1.5">Q{idx + 1}.</span>
                        <span className="text-xs font-medium text-slate-800">{q.text}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="info">{q.marks} pts</Badge>
                        {AUTO_GRADABLE.includes(q.type) && (
                          <Badge variant={q.autoGrade !== false ? "success" : "warning"}>
                            {q.autoGrade !== false ? "Auto" : "Manual"}
                          </Badge>
                        )}
                        <button
                          onClick={() => handleEditQuestion(q, "staged")}
                          className="text-slate-500 hover:text-navy-900 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation({ source: "staged", questionId: q.id })}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* SAVED SECTIONS SUMMARY */}
            <Card>
              <CardContent className="space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Saved Questions ({parts.reduce((acc, p) => acc + p.questions.length, 0)})
                  </h2>
                  <Badge variant="neutral">
                    Total Marks:{" "}
                    {parts.reduce((acc, p) => acc + p.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0)}{" "}
                    pts
                  </Badge>
                </div>
                {parts.every((p) => p.questions.length === 0) ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-xs text-slate-400 font-semibold">No sections saved yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {parts
                      .filter((part) => part.questions.length > 0)
                      .map((part) => (
                        <div
                          key={part.id}
                          className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                        >
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Badge>{part.title}</Badge>
                              <Badge variant="neutral">{QUESTION_TYPE_LABELS[part.allowedType]}</Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-500">
                                {part.questions.length} items
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePartId(part.id);
                                  setStagedQuestions([]);
                                  setEditingQuestionId(null);
                                  setEditingSource(null);
                                  setForm(blankQuestion(part.allowedType));
                                  requestAnimationFrame(() => {
                                    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                  });
                                }}
                                className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add Question
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2.5 pt-0.5">
                            {part.questions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center gap-4"
                              >
                                <div>
                                  <span className="text-xs font-bold text-navy-900 mr-1.5">Q{idx + 1}.</span>
                                  <span className="text-xs font-medium text-slate-800">{q.text}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <Badge variant="info">{q.marks} pts</Badge>
                                  {AUTO_GRADABLE.includes(q.type) && (
                                    <Badge variant={q.autoGrade !== false ? "success" : "warning"}>
                                      {q.autoGrade !== false ? "Auto" : "Manual"}
                                    </Badge>
                                  )}
                                  <button
                                    onClick={() => {
                                      setActivePartId(part.id);
                                      handleEditQuestion(q, "part");
                                    }}
                                    className="text-slate-500 hover:text-navy-900 cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      openDeleteConfirmation({
                                        source: "part",
                                        partId: part.id,
                                        questionId: q.id,
                                      })
                                    }
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* SAVE CONTROLS */}
                <div className="flex justify-end items-center gap-2.5 pt-5 border-t border-slate-100">
                  {saveError && (
                    <p className="mr-auto flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                      <AlertTriangle size={14} className="shrink-0" /> {saveError}
                    </p>
                  )}
                  <Button variant="outline" onClick={() => setStep(1)} className={saveError ? "" : "mr-auto"}>
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Parameters
                  </Button>
                  <Button onClick={handleSaveExam} disabled={saving}>
                    {saving ? "Saving..." : editId ? "Update Exam" : "Save Exam"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* CANCEL / DISCARD MODAL */}
      <Dialog open={cancelConfirm.open} onClose={closeCancelConfirmation}>
        <DialogHeader
          title={
            cancelConfirm.target === "question" ? "Cancel editing this question?" : "Discard exam changes?"
          }
          onClose={closeCancelConfirmation}
        />
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-navy-900">
                {cancelConfirm.target === "question"
                  ? "You have unsaved question changes."
                  : "You have unsaved exam changes."}
              </p>
              <p className="text-xs leading-5 text-slate-500 font-medium">
                {cancelConfirm.target === "question"
                  ? "If you discard, the original question will be kept and your current edits will be removed."
                  : "If you discard, the original exam will remain unchanged and you will return to the exams page."}
              </p>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={closeCancelConfirmation}
              className="bg-white border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscardConfirmed}
              className="bg-white border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Discard
            </Button>
          </div>
        </div>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={!!deleteConfirm} onClose={closeDeleteConfirmation}>
        <DialogHeader title="Delete this question?" onClose={closeDeleteConfirmation} />
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-navy-900">This question will be removed.</p>
              <p className="text-xs leading-5 text-slate-500 font-medium">This action cannot be undone.</p>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteConfirmation}
              className="bg-white border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleConfirmDeleteQuestion}
              className="bg-white border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              Delete Question
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-slate-500 font-semibold text-center text-xs">
          Loading Exam Builder...
        </div>
      }
    >
      <ExamBuilderContent />
    </Suspense>
  );
}