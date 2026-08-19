"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";
import { TEACHER_ASSIGNMENTS } from "@/lib/teacher-assignments-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CheckCircle2,
  Copy,
  Layers,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
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
  mediaType: "none" | "image" | "audio" | "video";
  mediaUrl?: string;

  mcqOptions?: string[];
  mcqCorrect?: number;
  multiOptions?: string[];
  multiCorrect?: boolean[];
  tfCorrect?: boolean;
  shortAnswers?: string[];
  blanksText?: string;
  answerKey?: AnswerKeyRow[];
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

function blankQuestion(type: QuestionType): Question {
  return {
    id: "",
    type,
    text: "",
    marks: 5,
    mediaType: "none",
    mcqOptions: ["Option A", "Option B"],
    mcqCorrect: 0,
    multiOptions: ["Option A", "Option B"],
    multiCorrect: [true, false],
    tfCorrect: true,
    shortAnswers: [""],
    blanksText: "The capital of France is [1].",
    answerKey: [{ number: "1", answer: "" }],
    matchLeft: ["", ""],
    matchRight: ["", ""],
    matchAnswers: [{ left: "1", right: "A" }],
    orderingItems: ["Step 1", "Step 2", "Step 3"],
  };
}

function ExamBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createExam = useExamStore((state) => state.createExam);
  const updateExam = useExamStore((state) => state.updateExam);
  const exams = useExamStore((state) => state.exams);

  const editId = searchParams.get("edit");
  const tabParam = searchParams.get("tab");
  const editingExam = editId ? exams.find((e) => e.id === editId) : undefined;

  const [step, setStep] = useState<1 | 2>(1);

  // --- EXAM PARAMETERS STATE ---
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    department: TEACHER_ASSIGNMENTS[0]?.department || "",
    subject: TEACHER_ASSIGNMENTS[0]?.subjects[0] || "",
    duration: 60,
    startDate: "",
  });

  const [isLaunched, setIsLaunched] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // --- SECTIONS & QUESTIONS STATE ---
  const [parts, setParts] = useState<ExamPart[]>([]);
  const [activePartId, setActivePartId] = useState<string>("");
  const [stagedQuestions, setStagedQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<"staged" | "part" | null>(null);

  const [newPartTitle, setNewPartTitle] = useState("");
  const [newPartMarks, setNewPartMarks] = useState<string>("");
  const [newPartType, setNewPartType] = useState<QuestionType>("mcq");

  const [form, setForm] = useState<Question>(blankQuestion("mcq"));

  const activePart = parts.find((p) => p.id === activePartId);
  const currentFormat = activePart?.allowedType || "mcq";

  // Pre-fill data when editing an existing exam
  useEffect(() => {
    if (editingExam) {
      if (editingExam.isEnded || (editingExam.isStarted && !editingExam.isEnded)) {
        alert(
          editingExam.isEnded
            ? "Completed exams cannot be edited."
            : "This exam is live and cannot be edited. End the session first."
        );
        router.push("/teacher/exams");
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
    if (editId || tabParam === "questions") {
      setStep(2);
    }
  }, [editId, tabParam]);

  const handleCopyCode = () => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isSettingsFormComplete = () =>
    examData.title.trim() !== "" &&
    examData.department.trim() !== "" &&
    examData.subject.trim() !== "" &&
    examData.duration > 0;

  // The exam must be tagged with a department + subject THIS teacher is
  // actually assigned to (set by the org) — never a free-typed value, and
  // never a department/subject the teacher doesn't teach.
  const subjectsInSelectedDepartment =
    TEACHER_ASSIGNMENTS.find((a) => a.department === examData.department)?.subjects || [];

  const handleDepartmentChange = (department: string) => {
    const match = TEACHER_ASSIGNMENTS.find((a) => a.department === department);
    setExamData({
      ...examData,
      department,
      // Reset subject when the department changes since the old subject may not belong to it.
      subject: match?.subjects[0] || "",
    });
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartTitle.trim()) return;

    const newPart: ExamPart = {
      id: Date.now().toString(),
      title: newPartTitle,
      marks: parseInt(newPartMarks) || 10,
      description: `Format restricted to ${QUESTION_TYPE_LABELS[newPartType]}.`,
      allowedType: newPartType,
      questions: [],
    };

    setParts((prev) => [newPart, ...prev]);
    setActivePartId(newPart.id);
    setStagedQuestions([]);
    setForm(blankQuestion(newPartType));
    setNewPartTitle("");
    setNewPartMarks("");
  };

  const buildQuestionFromForm = (): Question | null => {
    if (!form.text.trim()) {
      alert("Please enter the question text prompt before continuing!");
      return null;
    }
    return { ...form, id: editingQuestionId || Date.now().toString(), type: currentFormat };
  };

  // Stage the current form as a question and open a blank form for the next one
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

  // Finalize the staged questions into the active section
  const handleAddSection = () => {
    let finalStaged = stagedQuestions;

    // If there's an unfinished question sitting in the form, stage it first
    if (form.text.trim()) {
      const q: Question = { ...form, id: editingQuestionId || Date.now().toString(), type: currentFormat };
      if (editingSource === "part" && activePartId) {
        setParts((prev) =>
          prev.map((part) =>
            part.id === activePartId
              ? { ...part, questions: part.questions.map((e) => (e.id === q.id ? q : e)) }
              : part
          )
        );
      } else {
        finalStaged = editingSource === "staged"
          ? stagedQuestions.map((e) => (e.id === q.id ? q : e))
          : [...stagedQuestions, q];
      }
    }

    if (finalStaged.length === 0 && !activePartId) {
      alert("Add at least one question before saving the section.");
      return;
    }

    if (activePartId) {
      setParts((prev) =>
        prev.map((part) =>
          part.id === activePartId
            ? { ...part, questions: [...part.questions, ...finalStaged] }
            : part
        )
      );
    }

    setStagedQuestions([]);
    setActivePartId("");
    setEditingQuestionId(null);
    setEditingSource(null);
    setForm(blankQuestion("mcq"));
  };

  const handleEditQuestion = (q: Question, source: "staged" | "part") => {
    setForm(q);
    setEditingQuestionId(q.id);
    setEditingSource(source);
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

  const countTotalQuestions = () =>
    parts.reduce((acc, part) => acc + part.questions.length, 0) + stagedQuestions.length;

  const handleSaveExam = () => {
    if (parts.length === 0) {
      alert("Please create and save at least one section before saving.");
      return;
    }

    const totalQCount = parts.reduce((acc, part) => acc + part.questions.length, 0);
    if (totalQCount === 0) {
      alert("Please add at least one question to a section before saving.");
      return;
    }

    if (editId) {
      const result = updateExam(editId, {
        title: examData.title || "Untitled Examination",
        department: examData.department,
        subject: examData.subject,
        durationMinutes: examData.duration,
        parts,
        questionCount: totalQCount,
        startDate: examData.startDate || undefined,
      });
      if (!result.success) {
        alert(result.message || "This exam cannot be edited.");
        return;
      }
      router.push("/teacher/exams");
      return;
    }

    const { roomCode } = createExam({
      title: examData.title || "Untitled Examination",
      department: examData.department,
      subject: examData.subject,
      durationMinutes: examData.duration,
      parts,
      questionCount: totalQCount,
      startDate: examData.startDate || undefined,
    });

    setAccessCode(roomCode);
    setIsLaunched(true);
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

        {/* STEP 1: EXAM PARAMETERS */}
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
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
                    required
                  />
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
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all cursor-pointer bg-white"
                      required
                    >
                      {TEACHER_ASSIGNMENTS.length === 0 ? (
                        <option value="">No departments assigned yet</option>
                      ) : (
                        TEACHER_ASSIGNMENTS.map((a) => (
                          <option key={a.department} value={a.department}>
                            {a.department}
                          </option>
                        ))
                      )}
                    </select>
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
                      onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                      disabled={subjectsInSelectedDepartment.length === 0}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all cursor-pointer bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                      required
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
                      onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
                      required
                    />
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
                <Button variant="outline" onClick={() => router.push("/teacher/exams")}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (isSettingsFormComplete()) {
                      setStep(2);
                    } else {
                      alert("Please fill in all required fields marked with (*).");
                    }
                  }}
                >
                  Continue to Question Setup <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: SECTIONS & QUESTION BUILDER */}
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
                      required
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

                {/* SAVED SECTIONS */}
                <div className="flex flex-wrap gap-2 mt-4 border-t border-slate-100 pt-4 items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Saved Sections:</span>
                  {parts.length === 0 ? (
                    <span className="text-xs font-medium text-slate-400 italic">
                      No sections saved yet. Create one above to begin.
                    </span>
                  ) : (
                    parts.map((p) => (
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

            {/* QUESTION BUILDER AREA — only while an active (unsaved) section is selected */}
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
              <Card>
                <CardContent className="space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                      Active Section: {activePart?.title}
                    </h2>
                    <Badge variant="info">{QUESTION_TYPE_LABELS[currentFormat]}</Badge>
                  </div>

                  {/* MARKS & MEDIA METADATA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Points / Marks
                      </label>
                      <input
                        type="number"
                        value={form.marks}
                        onChange={(e) => setForm({ ...form, marks: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-navy-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Media Attachment
                      </label>
                      <select
                        value={form.mediaType}
                        onChange={(e) => setForm({ ...form, mediaType: e.target.value as Question["mediaType"] })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-navy-900 outline-none focus:border-sky-400 cursor-pointer"
                      >
                        <option value="none">None</option>
                        <option value="image">Image URL</option>
                        <option value="audio">Audio URL</option>
                        <option value="video">Video URL</option>
                      </select>
                    </div>

                    {form.mediaType !== "none" && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          {form.mediaType.toUpperCase()} Media URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/media.png"
                          value={form.mediaUrl || ""}
                          onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400"
                        />
                      </div>
                    )}
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
                      onChange={(e) => setForm({ ...form, text: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400 resize-none"
                    />
                  </div>

                  {/* 1. MCQ */}
                  {currentFormat === "mcq" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Multiple Choice Options (Select correct answer)
                      </label>
                      <div className="space-y-2.5">
                        {(form.mcqOptions || []).map((opt, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, mcqCorrect: i })}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                form.mcqCorrect === i ? "border-sky-500 bg-sky-50 text-sky-600" : "border-slate-300"
                              }`}
                            >
                              {form.mcqCorrect === i && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                            </button>
                            <input
                              type="text"
                              value={opt}
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
                                setForm({ ...form, mcqOptions: (form.mcqOptions || []).filter((_, idx) => idx !== i) })
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
                        onClick={() =>
                          setForm({
                            ...form,
                            mcqOptions: [
                              ...(form.mcqOptions || []),
                              `Option ${String.fromCharCode(65 + (form.mcqOptions || []).length)}`,
                            ],
                          })
                        }
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  {/* 2. MULTI SELECT */}
                  {currentFormat === "multi_select" && (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Checkbox Options (Check all correct answers)
                      </label>
                      <div className="space-y-2.5">
                        {(form.multiOptions || []).map((opt, i) => (
                          <div key={i} className="flex items-center gap-3">
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
                            multiOptions: [
                              ...(form.multiOptions || []),
                              `Option ${String.fromCharCode(65 + (form.multiOptions || []).length)}`,
                            ],
                            multiCorrect: [...(form.multiCorrect || []), false],
                          })
                        }
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                      >
                        + Add Checkbox Option
                      </button>
                    </div>
                  )}

                  {/* 3. TRUE / FALSE */}
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
                            form.tfCorrect ? "bg-sky-50 border-sky-400 text-sky-700 font-bold" : "border-slate-200 text-slate-600"
                          }`}
                        >
                          True
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, tfCorrect: false })}
                          className={`px-6 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            !form.tfCorrect ? "bg-sky-50 border-sky-400 text-sky-700 font-bold" : "border-slate-200 text-slate-600"
                          }`}
                        >
                          False
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. SHORT ANSWER */}
                  {currentFormat === "short_answer" && (
                    <div className="space-y-2.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Accepted Answer Variants (Auto-grading)
                      </label>
                      {(form.shortAnswers || []).map((ans, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input
                            type="text"
                            placeholder="e.g. CPU, Central Processing Unit"
                            value={ans}
                            onChange={(e) => {
                              const c = [...(form.shortAnswers || [])];
                              c[i] = e.target.value;
                              setForm({ ...form, shortAnswers: c });
                            }}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                          />
                          {(form.shortAnswers || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setForm({ ...form, shortAnswers: (form.shortAnswers || []).filter((_, idx) => idx !== i) })
                              }
                              className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, shortAnswers: [...(form.shortAnswers || []), ""] })}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                      >
                        + Add Accepted Answer Variant
                      </button>
                    </div>
                  )}

                  {/* 5. LONG QUESTION (formerly Essay) — the base prompt box above is sufficient */}
                  {currentFormat === "long_answer" && (
                    <p className="text-xs text-slate-400 italic">
                      Students will respond in a free-form long-answer text box. No extra configuration needed.
                    </p>
                  )}

                  {/* 6. CODING — simplified to just the prompt box above */}
                  {currentFormat === "coding" && (
                    <p className="text-xs text-slate-400 italic">
                      Students will respond in a free-form code box. No language, starter code, or test cases are configured here.
                    </p>
                  )}

                  {/* 7. FILL IN THE BLANK */}
                  {currentFormat === "fill_blank" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Template Text (mark blanks as [1], [2]... or 1....., 2.....)
                        </label>
                        <input
                          type="text"
                          value={form.blanksText || ""}
                          onChange={(e) => setForm({ ...form, blanksText: e.target.value })}
                          placeholder="e.g. The capital of France is [1]."
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Answer Key
                        </label>
                        {(form.answerKey || []).map((row, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={row.number}
                              onChange={(e) => {
                                const c = [...(form.answerKey || [])];
                                c[i] = { ...c[i], number: e.target.value };
                                setForm({ ...form, answerKey: c });
                              }}
                              className="w-14 border border-slate-200 rounded-xl px-2 py-2 text-xs text-center font-bold text-navy-900 outline-none focus:border-sky-400"
                            />
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Answer"
                              value={row.answer}
                              onChange={(e) => {
                                const c = [...(form.answerKey || [])];
                                c[i] = { ...c[i], answer: e.target.value };
                                setForm({ ...form, answerKey: c });
                              }}
                              className="grow border border-slate-200 rounded-xl px-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400"
                            />
                            <button
                              type="button"
                              onClick={() => setForm({ ...form, answerKey: (form.answerKey || []).filter((_, idx) => idx !== i) })}
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
                              answerKey: [
                                ...(form.answerKey || []),
                                { number: String((form.answerKey || []).length + 1), answer: "" },
                              ],
                            })
                          }
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                        >
                          + Add Row
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 8. MATCHING PAIRS */}
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
                                setForm({ ...form, matchAnswers: (form.matchAnswers || []).filter((_, idx) => idx !== i) })
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

                  {/* 9. ORDERING */}
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
                          setForm({ ...form, orderingItems: [...(form.orderingItems || []), `Step ${(form.orderingItems || []).length + 1}`] })
                        }
                        className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                      >
                        + Add Sequence Item
                      </button>
                    </div>
                  )}

                  {/* NEXT QUESTION / ADD SECTION CONTROLS */}
                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
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
            )}

            {/* STAGED QUESTIONS FOR THE ACTIVE SECTION */}
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
                        <button
                          onClick={() => handleEditQuestion(q, "staged")}
                          className="text-slate-500 hover:text-navy-900 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaged(q.id)}
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

            {/* ALL SAVED SECTIONS SUMMARY */}
            <Card>
              <CardContent className="space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Saved Questions ({parts.reduce((acc, p) => acc + p.questions.length, 0)})
                  </h2>
                  <Badge variant="neutral">
                    Total Marks: {parts.reduce((acc, p) => acc + p.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0)} pts
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
                        <div key={part.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Badge>{part.title}</Badge>
                              <Badge variant="neutral">{QUESTION_TYPE_LABELS[part.allowedType]}</Badge>
                            </div>
                            <span className="text-xs font-medium text-slate-500">{part.questions.length} items</span>
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
                                    onClick={() => handleDeleteQuestion(part.id, q.id)}
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
                <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setStep(1)} className="mr-auto">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Parameters
                  </Button>
                  <Button onClick={handleSaveExam}>{editId ? "Update Exam" : "Save Exam"}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* LAUNCHED SUCCESS MODAL */}
      <Dialog open={isLaunched} onClose={() => setIsLaunched(false)}>
        <DialogHeader title="Exam Saved" onClose={() => setIsLaunched(false)} />
        <div className="px-6 py-5 text-center space-y-5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 -mt-2 font-medium">
            Provide this access code to students when you&apos;re ready to launch.
          </p>

          <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Access Code</span>
            <span className="text-3xl font-extrabold font-mono tracking-widest text-navy-900">{accessCode}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className={`mt-1 text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                isCopied ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-navy-900 hover:bg-slate-100"
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              setIsLaunched(false);
              router.push("/teacher/exams");
            }}
          >
            Done & View All Exams
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-semibold text-center text-xs">Loading Exam Builder...</div>}>
      <ExamBuilderContent />
    </Suspense>
  );
}