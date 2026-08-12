"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Lock,
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Terminal,
  Info
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";

// --- TYPE DEFINITIONS ---
type QuestionType =
  | "mcq"
  | "multi_select"
  | "true_false"
  | "short_answer"
  | "essay"
  | "coding"
  | "fill_blank"
  | "matching"
  | "ordering"
  | "numeric";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  isMandatory: boolean;
  explanation: string;
  mediaType: "none" | "image" | "audio" | "video";
  mediaUrl?: string;

  mcqOptions?: string[];
  mcqCorrect?: number;
  multiOptions?: string[];
  multiCorrect?: boolean[];
  tfCorrect?: boolean;
  shortAnswers?: string[];
  essayMinMax?: { min: number; max: number };
  codingLang?: string;
  codingStarter?: string;
  codingTestCases?: { id: string; input: string; expectedOutput: string; hidden: boolean }[];
  blanksText?: string;
  matchingPairs?: { left: string; right: string }[];
  orderingItems?: string[];
  numericAnswer?: { val: number; tolerance: number; unit: string };
}

interface ExamPart {
  id: string;
  title: string;
  marks: number;
  description: string;
  allowedType: QuestionType;
  questions: Question[];
}

interface PersistedExamRecord {
  id: string;
  title?: string;
  course?: string;
  department?: string;
  academicYear?: string;
  duration?: string | number;
  parts?: ExamPart[];
  questions?: Question[];
  [key: string]: unknown;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple Choice (QCM)",
  multi_select: "Multiple Select",
  true_false: "True / False",
  short_answer: "Short Answer",
  essay: "Essay / Long Form",
  coding: "Coding Challenge",
  fill_blank: "Fill in the Blank",
  matching: "Matching Pairs",
  ordering: "Sequence / Ordering",
  numeric: "Numeric Evaluation"
};

function ExamBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editId = searchParams.get("edit");
  const tabParam = searchParams.get("tab");

  const [step, setStep] = useState<1 | 2>(1);

  // --- EXAM PARAMETERS STATE ---
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    department: "Computer Science",
    academicYear: "2026-2027",
    duration: 60,
    saveAsTemplate: false
  });

  const [isLaunched, setIsLaunched] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // --- SECTIONS & QUESTIONS STATE ---
  const [parts, setParts] = useState<ExamPart[]>([]);
  const [activePartId, setActivePartId] = useState<string>("");

  const [newPartTitle, setNewPartTitle] = useState("");
  const [newPartMarks, setNewPartMarks] = useState<string>("");
  const [newPartType, setNewPartType] = useState<QuestionType>("mcq");

  // Question Form States
  const [qText, setQText] = useState("");
  const [qMarks, setQMarks] = useState<number>(5);
  const [qMandatory, setQMandatory] = useState(true);
  const [qExplanation, setQExplanation] = useState("");
  const [qMediaType, setQMediaType] = useState<"none" | "image" | "audio" | "video">("none");
  const [qMediaUrl, setQMediaUrl] = useState("");

  // Specialized Question Types States
  const [mcqOptions, setMcqOptions] = useState<string[]>(["Option A", "Option B"]);
  const [mcqCorrect, setMcqCorrect] = useState<number>(0);
  const [multiOptions, setMultiOptions] = useState<string[]>(["Option A", "Option B"]);
  const [multiCorrect, setMultiCorrect] = useState<boolean[]>([true, false]);
  const [tfCorrect, setTfCorrect] = useState<boolean>(true);
  const [codingLang, setCodingLang] = useState("python");
  const [codingStarter, setCodingStarter] = useState("# Write your code here\n");
  const [codingTestCases, setCodingTestCases] = useState<
    { id: string; input: string; expectedOutput: string; hidden: boolean }[]
  >([{ id: "tc-1", input: "", expectedOutput: "", hidden: false }]);
  const [blanksText, setBlanksText] = useState("The capital of France is [Paris].");
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: "HTML", right: "Structure" },
    { left: "CSS", right: "Styling" }
  ]);
  const [orderingItems, setOrderingItems] = useState<string[]>(["Step 1", "Step 2", "Step 3"]);
  const [numericAnswer, setNumericAnswer] = useState({ val: 9.81, tolerance: 0.05, unit: "m/s²" });

  const activePart = parts.find((p) => p.id === activePartId);
  const currentFormat = activePart?.allowedType || "mcq";

  // Full reset used when the teacher switches to a different section —
  // every field goes back to a clean default so nothing "leaks" from the
  // previous section's question type.
  const resetQuestionForm = () => {
    setQText("");
    setQMarks(5);
    setQMandatory(true);
    setQExplanation("");
    setQMediaType("none");
    setQMediaUrl("");
    setMcqOptions(["Option A", "Option B"]);
    setMcqCorrect(0);
    setMultiOptions(["Option A", "Option B"]);
    setMultiCorrect([true, false]);
    setTfCorrect(true);
    setCodingLang("python");
    setCodingStarter("# Write your code here\n");
    setCodingTestCases([{ id: "tc-1", input: "", expectedOutput: "", hidden: false }]);
    setBlanksText("The capital of France is [Paris].");
    setMatchingPairs([
      { left: "HTML", right: "Structure" },
      { left: "CSS", right: "Styling" }
    ]);
    setOrderingItems(["Step 1", "Step 2", "Step 3"]);
    setNumericAnswer({ val: 9.81, tolerance: 0.05, unit: "m/s²" });
  };

  // Lighter reset used right after saving a question into the current
  // section — keeps Marks and Mandatory as-is (handy when adding several
  // similar questions in a row) but clears the prompt and answer fields.
  const resetQuestionDraftAfterSave = () => {
    setQText("");
    setQExplanation("");
    setQMediaType("none");
    setQMediaUrl("");
    setMcqOptions(["Option A", "Option B"]);
    setMcqCorrect(0);
    setMultiOptions(["Option A", "Option B"]);
    setMultiCorrect([true, false]);
    setTfCorrect(true);
    setCodingStarter("# Write your code here\n");
    setCodingTestCases([{ id: "tc-1", input: "", expectedOutput: "", hidden: false }]);
    setBlanksText("The capital of France is [Paris].");
    setMatchingPairs([
      { left: "HTML", right: "Structure" },
      { left: "CSS", right: "Styling" }
    ]);
    setOrderingItems(["Step 1", "Step 2", "Step 3"]);
    setNumericAnswer({ val: 9.81, tolerance: 0.05, unit: "m/s²" });
  };

  // Clear the question draft every time the teacher switches sections, so
  // switching from e.g. a Multiple Choice section to a Fill in the Blank
  // section starts from a blank prompt instead of keeping the old text.
  useEffect(() => {
    resetQuestionForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePartId]);

  useEffect(() => {
    if (editId) {
      const rawData = localStorage.getItem("localExamsData");
      if (rawData) {
        try {
          const currentExams = JSON.parse(rawData) as {
            active?: PersistedExamRecord[];
            scheduled?: PersistedExamRecord[];
            completed?: PersistedExamRecord[];
          };
          const allExams = [
            ...(currentExams.active || []),
            ...(currentExams.scheduled || []),
            ...(currentExams.completed || [])
          ];
          const found = allExams.find((e) => e.id === editId);
          if (found) {
            const restoredDuration =
              typeof found.duration === "number"
                ? found.duration
                : typeof found.duration === "string"
                ? Number.parseInt(found.duration, 10)
                : Number.NaN;

            setExamData((prev) => ({
              ...prev,
              title: typeof found.title === "string" ? found.title : prev.title,
              department:
                typeof found.department === "string"
                  ? found.department
                  : typeof found.course === "string"
                  ? found.course
                  : prev.department,
              academicYear: typeof found.academicYear === "string" ? found.academicYear : prev.academicYear,
              duration: Number.isFinite(restoredDuration) ? restoredDuration : prev.duration
            }));

            if (found.parts && Array.isArray(found.parts) && found.parts.length > 0) {
              setParts(found.parts);
              setActivePartId(found.parts[0].id);
            } else if (found.questions && Array.isArray(found.questions) && found.questions.length > 0) {
              const convertedPart: ExamPart = {
                id: "restored-section-1",
                title: "Section 1: Restored Questions",
                marks: 100,
                description: "Section automatically generated from saved exam questions.",
                allowedType: found.questions[0]?.type || "mcq",
                questions: found.questions
              };
              setParts([convertedPart]);
              setActivePartId(convertedPart.id);
            }
          }
        } catch (err) {
          console.error("Failed to parse local exams data:", err);
        }
      }
    }

    if (editId || tabParam === "questions") {
      setStep(2);
    }
  }, [editId, tabParam]);

  const generateAccessCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCopyCode = () => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isSettingsFormComplete = () => {
    if (editId) return true;
    return examData.title.trim() !== "" && examData.department.trim() !== "" && examData.duration > 0;
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
      questions: []
    };

    setParts((prev) => [...prev, newPart]);
    setActivePartId(newPart.id);
    setNewPartTitle("");
    setNewPartMarks("");
  };

  const handleAddQuestionToPart = () => {
    if (!activePartId || !activePart) {
      alert("Please create and select a section before adding questions!");
      return;
    }

    if (!qText.trim()) {
      alert("Please enter the question text prompt before saving!");
      return;
    }

    const qType = activePart.allowedType;

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: qType,
      text: qText,
      marks: qMarks,
      isMandatory: qMandatory,
      explanation: qExplanation,
      mediaType: qMediaType,
      mediaUrl: qMediaUrl || undefined,

      ...(qType === "mcq" && { mcqOptions: [...mcqOptions], mcqCorrect }),
      ...(qType === "multi_select" && { multiOptions: [...multiOptions], multiCorrect: [...multiCorrect] }),
      ...(qType === "true_false" && { tfCorrect }),
      ...(qType === "coding" && { codingLang, codingStarter, codingTestCases: [...codingTestCases] }),
      ...(qType === "fill_blank" && { blanksText }),
      ...(qType === "matching" && { matchingPairs: [...matchingPairs] }),
      ...(qType === "ordering" && { orderingItems: [...orderingItems] }),
      ...(qType === "numeric" && { numericAnswer: { ...numericAnswer } })
    };

    setParts((prev) =>
      prev.map((part) => {
        if (part.id === activePartId) {
          return { ...part, questions: [...part.questions, newQuestion] };
        }
        return part;
      })
    );

    resetQuestionDraftAfterSave();
  };

  const handleDeleteQuestion = (partId: string, questionId: string) => {
    setParts(
      parts.map((p) => {
        if (p.id === partId) {
          return { ...p, questions: p.questions.filter((q) => q.id !== questionId) };
        }
        return p;
      })
    );
  };

  const countTotalQuestions = () => parts.reduce((acc, part) => acc + part.questions.length, 0);

  const handlePublish = () => {
    if (parts.length === 0) {
      alert("Please create at least one section before publishing.");
      return;
    }

    const totalQCount = countTotalQuestions();
    if (totalQCount === 0) {
      alert("Please construct at least one question before deploying.");
      return;
    }

    const generatedCode = generateAccessCode();
    setAccessCode(generatedCode);

    const finalExam = {
      id: editId || Date.now().toString(),
      title: examData.title || "Untitled Examination",
      course: examData.department,
      department: examData.department,
      academicYear: examData.academicYear,
      duration: `${examData.duration} mins`,
      questions: totalQCount,
      code: generatedCode,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      students: "0 Registered",
      isTemplate: examData.saveAsTemplate,
      parts: parts
    };

    const rawData = localStorage.getItem("localExamsData");
    const defaultData = { active: [], scheduled: [], completed: [] };
    const currentExams = rawData ? JSON.parse(rawData) : defaultData;

    if (editId) {
      ["active", "scheduled", "completed"].forEach((key) => {
        const list = currentExams[key];
        if (Array.isArray(list)) {
          currentExams[key] = list.map((item: any) =>
            item.id === editId ? { ...finalExam, questions: parts.flatMap((part) => part.questions) } : item
          );
        }
      });
    } else {
      currentExams.scheduled = [
        { ...finalExam, questions: parts.flatMap((part) => part.questions) },
        ...(currentExams.scheduled || [])
      ];
    }

    localStorage.setItem("localExamsData", JSON.stringify(currentExams));
    setIsLaunched(true);
  };

  return (
    <>
      <TeacherTopbar
        title={step === 1 ? "Configure Exam Parameters" : "Sections & Question Setup"}
        description={
          step === 1
            ? "Set academic context, department, and time duration."
            : "Organize questionnaire sections and configure multi-format rules."
        }
      />

      <main className="w-full max-w-6xl mx-auto p-6 space-y-6 font-sans">

      {/* STEP CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-end">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              step === 1 ? "bg-navy-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Parameters
          </button>
          <button
            type="button"
            disabled={!isSettingsFormComplete()}
            onClick={() => setStep(2)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              step === 2 ? "bg-navy-900 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            } ${!isSettingsFormComplete() ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            2. Questions ({countTotalQuestions()})
          </button>
        </div>
      </div>

      {/* STEP 1: EXAM PARAMETERS */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              General Information
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                EXAM TITLE *
              </label>
              <input
                type="text"
                placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                INSTRUCTIONS & DESCRIPTION
              </label>
              <textarea
                rows={3}
                placeholder="Detail academic honor codes, workspace configuration parameters, etc..."
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ASSIGNED DEPARTMENT *
                </label>
                <input
                  type="text"
                  placeholder="Computer Science"
                  value={examData.department}
                  onChange={(e) => setExamData({ ...examData, department: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  ACADEMIC YEAR
                </label>
                <input
                  type="text"
                  placeholder="2026-2027"
                  value={examData.academicYear}
                  onChange={(e) => setExamData({ ...examData, academicYear: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  DURATION (MINUTES) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={examData.duration}
                  onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                id="templateToggle"
                checked={examData.saveAsTemplate}
                onChange={(e) => setExamData({ ...examData, saveAsTemplate: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer"
              />
              <label htmlFor="templateToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Save this configuration as a reusable Template
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/teacher/exams")}
              className="px-5 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (isSettingsFormComplete()) {
                  setStep(2);
                } else {
                  alert("Please fill in all required fields marked with (*).");
                }
              }}
              className="px-5 py-2 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Continue to Question Setup →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SECTIONS & QUESTION BUILDER */}
      {step === 2 && (
        <div className="space-y-6">
          
          {/* SECTION CREATOR */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-3">
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-400 transition-all cursor-pointer"
                >
                  <option value="mcq">Multiple Choice (QCM)</option>
                  <option value="multi_select">Multiple Select</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay / Long Form</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="fill_blank">Fill in the Blank</option>
                  <option value="matching">Matching Pairs</option>
                  <option value="ordering">Sequence / Ordering</option>
                  <option value="numeric">Numeric Evaluation</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Section
                </button>
              </div>
            </form>

            {/* ACTIVE SECTION TABS */}
            <div className="flex flex-wrap gap-2 mt-4 border-t border-slate-100 pt-4 items-center">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Active Sections:</span>
              {parts.length === 0 ? (
                <span className="text-xs font-medium text-slate-400 italic">
                  No sections created yet. Create a section above to begin.
                </span>
              ) : (
                parts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePartId(p.id)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all border flex items-center gap-2 cursor-pointer ${
                      activePartId === p.id
                        ? "bg-navy-900 text-white border-navy-900 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{p.title}</span>
                    <span className="opacity-75 font-mono text-[10px]">({QUESTION_TYPE_LABELS[p.allowedType]})</span>
                    <span className="bg-white/20 text-current text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                      {p.questions.length}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* QUESTION BUILDER AREA */}
          {parts.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center shadow-xs space-y-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Section Defined</h3>
              <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
                Please create your first section above before adding questions.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Target Section: {activePart?.title || "Select a section"}
                </h2>

                <div className="flex items-center gap-1.5 bg-sky-50 text-navy-900 px-3 py-1 rounded-lg border border-sky-200 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Format: {QUESTION_TYPE_LABELS[currentFormat]}</span>
                </div>
              </div>

              {/* MARKS, MANDATORY & MEDIA METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Points / Marks
                  </label>
                  <input
                    type="number"
                    value={qMarks}
                    onChange={(e) => setQMarks(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Media Attachment
                  </label>
                  <select
                    value={qMediaType}
                    onChange={(e: any) => setQMediaType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-400 transition-all cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="image">Image URL</option>
                    <option value="audio">Audio URL</option>
                    <option value="video">Video URL</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={qMandatory}
                      onChange={(e) => setQMandatory(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer"
                    />
                    Mandatory Question
                  </label>
                </div>

                {qMediaType !== "none" && (
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      {qMediaType.toUpperCase()} Media URL
                    </label>
                    <input
                      type="url"
                      placeholder={`https://example.com/media.${qMediaType === "image" ? "png" : "mp4"}`}
                      value={qMediaUrl}
                      onChange={(e) => setQMediaUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-sky-400 transition-all"
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
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* DYNAMIC FORM EDITORS */}

              {/* 1. MCQ */}
              {currentFormat === "mcq" && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Multiple Choice Radio Options (Select correct answer)
                  </label>
                  <div className="space-y-2.5">
                    {mcqOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setMcqCorrect(i)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                            mcqCorrect === i ? "border-sky-500 bg-sky-50 text-sky-600" : "border-slate-300"
                          }`}
                        >
                          {mcqCorrect === i && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const c = [...mcqOptions];
                            c[i] = e.target.value;
                            setMcqOptions(c);
                          }}
                          className={`flex-grow border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none ${
                            mcqCorrect === i ? "border-sky-400 bg-sky-50/20" : "border-slate-200"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setMcqOptions(mcqOptions.filter((_, idx) => idx !== i))}
                          disabled={mcqOptions.length <= 2}
                          className="text-xs text-rose-500 font-semibold hover:underline disabled:opacity-30 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMcqOptions([...mcqOptions, `Option ${String.fromCharCode(65 + mcqOptions.length)}`])}
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
                    {multiOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={multiCorrect[i] || false}
                          onChange={(e) => {
                            const c = [...multiCorrect];
                            c[i] = e.target.checked;
                            setMultiCorrect(c);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const c = [...multiOptions];
                            c[i] = e.target.value;
                            setMultiOptions(c);
                          }}
                          className="flex-grow border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-sky-400"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMultiOptions(multiOptions.filter((_, idx) => idx !== i));
                            setMultiCorrect(multiCorrect.filter((_, idx) => idx !== i));
                          }}
                          disabled={multiOptions.length <= 2}
                          className="text-xs text-rose-500 font-semibold hover:underline disabled:opacity-30 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMultiOptions([...multiOptions, `Option ${String.fromCharCode(65 + multiOptions.length)}`]);
                      setMultiCorrect([...multiCorrect, false]);
                    }}
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
                      onClick={() => setTfCorrect(true)}
                      className={`px-6 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        tfCorrect ? "bg-sky-50 border-sky-400 text-sky-700 font-bold" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => setTfCorrect(false)}
                      className={`px-6 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !tfCorrect ? "bg-sky-50 border-sky-400 text-sky-700 font-bold" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      False
                    </button>
                  </div>
                </div>
              )}

              {/* 4. SHORT ANSWER — no extra config; graded manually from the shared prompt above */}
              {currentFormat === "short_answer" && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium">
                    Short answer questions are graded manually by you after submission — no extra
                    setup is needed here beyond the question prompt above.
                  </p>
                </div>
              )}

              {/* 5. ESSAY — no word limit; free-form long answer graded manually */}
              {currentFormat === "essay" && (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium">
                    Essay questions accept a free-form long answer with no word limit, graded
                    manually by you after submission — no extra setup is needed here beyond the
                    question prompt above.
                  </p>
                </div>
              )}

              {/* 6. CODING */}
              {currentFormat === "coding" && (
                <div className="space-y-4">
                  <div className="w-48">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Programming Language
                    </label>
                    <select
                      value={codingLang}
                      onChange={(e) => setCodingLang(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-400 transition-all cursor-pointer"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript (Node)</option>
                      <option value="cpp">C++ 20</option>
                      <option value="java">Java 17</option>
                    </select>
                  </div>

                  {/* STARTER CODE — styled like a real code editor */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Starter Code Template
                    </label>
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xs">
                      <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/60 border-b border-slate-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                        <span className="ml-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          {codingLang === "cpp" ? "main.cpp" : codingLang === "java" ? "Main.java" : codingLang === "javascript" ? "solution.js" : "solution.py"}
                        </span>
                      </div>
                      <div className="flex">
                        <div
                          aria-hidden
                          className="select-none text-right pr-3 pl-3 py-3.5 text-xs font-mono leading-5 text-slate-600 bg-slate-950/40 border-r border-slate-800"
                        >
                          {codingStarter.split("\n").map((_, i) => (
                            <div key={i}>{i + 1}</div>
                          ))}
                        </div>
                        <textarea
                          rows={8}
                          spellCheck={false}
                          value={codingStarter}
                          onChange={(e) => setCodingStarter(e.target.value)}
                          className="flex-1 min-w-0 font-mono text-xs leading-5 bg-transparent text-sky-300 p-3.5 focus:outline-none resize-y whitespace-pre"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      This is what the student sees pre-filled in their code editor when the exam starts.
                    </p>
                  </div>

                  {/* TEST CASES — auto-grading */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Test Cases (Auto-Grading)
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Info className="w-3 h-3" />
                        Student code runs against every case below
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {codingTestCases.map((tc, i) => (
                        <div key={tc.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Test Case {i + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  const c = [...codingTestCases];
                                  c[i] = { ...c[i], hidden: !c[i].hidden };
                                  setCodingTestCases(c);
                                }}
                                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  tc.hidden
                                    ? "bg-slate-800 border-slate-800 text-white"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {tc.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                {tc.hidden ? "Hidden" : "Visible to student"}
                              </button>
                              {codingTestCases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setCodingTestCases(codingTestCases.filter((_, idx) => idx !== i))}
                                  className="text-rose-500 hover:text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Input
                              </label>
                              <textarea
                                rows={2}
                                placeholder="e.g. 5 3"
                                value={tc.input}
                                onChange={(e) => {
                                  const c = [...codingTestCases];
                                  c[i] = { ...c[i], input: e.target.value };
                                  setCodingTestCases(c);
                                }}
                                className="w-full font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Expected Output
                              </label>
                              <textarea
                                rows={2}
                                placeholder="e.g. 8"
                                value={tc.expectedOutput}
                                onChange={(e) => {
                                  const c = [...codingTestCases];
                                  c[i] = { ...c[i], expectedOutput: e.target.value };
                                  setCodingTestCases(c);
                                }}
                                className="w-full font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCodingTestCases([
                          ...codingTestCases,
                          { id: `tc-${Date.now()}`, input: "", expectedOutput: "", hidden: false }
                        ])
                      }
                      className="mt-2.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      + Add Test Case
                    </button>
                  </div>
                </div>
              )}

              {/* 7. FILL IN THE BLANK — redesigned with live preview + detected blanks list */}
              {currentFormat === "fill_blank" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Template Text
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1.5">
                      Wrap the correct word or phrase in brackets — e.g.{" "}
                      <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">
                        The capital of France is [Paris].
                      </code>{" "}
                      Add as many bracketed blanks as you need.
                    </p>
                    <textarea
                      rows={3}
                      value={blanksText}
                      onChange={(e) => setBlanksText(e.target.value)}
                      placeholder="e.g. The [mitochondria] is the powerhouse of the [cell]."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 resize-none"
                    />
                  </div>

                  {/* LIVE PREVIEW — how the student will see it */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Student Preview
                    </label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs leading-relaxed text-slate-700">
                      {(() => {
                        const parts = blanksText.split(/(\[[^\]]*\])/g).filter((p) => p !== "");
                        if (parts.length === 0 || (parts.length === 1 && !/\[[^\]]*\]/.test(parts[0]))) {
                          return <span className="text-slate-400 italic">Your template preview will appear here...</span>;
                        }
                        let blankIndex = 0;
                        return parts.map((part, i) => {
                          if (/^\[[^\]]*\]$/.test(part)) {
                            blankIndex += 1;
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center justify-center mx-1 px-2.5 min-w-[2.5rem] rounded-md border border-sky-300 bg-sky-50 text-sky-700 font-bold text-[10px] align-middle"
                              >
                                Blank {blankIndex}
                              </span>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        });
                      })()}
                    </div>
                  </div>

                  {/* DETECTED BLANKS & ANSWERS */}
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Detected Blanks &amp; Accepted Answers
                    </label>
                    {(() => {
                      const matches = Array.from(blanksText.matchAll(/\[([^\]]*)\]/g)).map((m) => m[1].trim());
                      if (matches.length === 0) {
                        return (
                          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
                            No blanks detected yet — wrap a word in [brackets] above.
                          </div>
                        );
                      }
                      return (
                        <div className="flex flex-wrap gap-2">
                          {matches.map((ans, i) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white pl-2.5 pr-3 py-1.5"
                            >
                              <span className="text-[10px] font-bold text-white bg-navy-900 rounded px-1.5 py-0.5">
                                {i + 1}
                              </span>
                              <span className="text-xs font-medium text-slate-800">
                                {ans === "" ? (
                                  <span className="text-rose-500 italic">empty — add an answer</span>
                                ) : (
                                  ans
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* 8. MATCHING PAIRS */}
              {currentFormat === "matching" && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Matching Pair Connections
                  </label>
                  {matchingPairs.map((pair, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Left Item"
                        value={pair.left}
                        onChange={(e) => {
                          const c = [...matchingPairs];
                          c[i].left = e.target.value;
                          setMatchingPairs(c);
                        }}
                        className="w-1/2 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400"
                      />
                      <span className="text-xs font-bold text-slate-400">↔</span>
                      <input
                        type="text"
                        placeholder="Right Item"
                        value={pair.right}
                        onChange={(e) => {
                          const c = [...matchingPairs];
                          c[i].right = e.target.value;
                          setMatchingPairs(c);
                        }}
                        className="w-1/2 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMatchingPairs([...matchingPairs, { left: "", right: "" }])}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                  >
                    + Add Matching Pair
                  </button>
                </div>
              )}

              {/* 9. ORDERING */}
              {currentFormat === "ordering" && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Sequence Order (Top to Bottom)
                  </label>
                  {orderingItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900">{i + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const c = [...orderingItems];
                          c[i] = e.target.value;
                          setOrderingItems(c);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOrderingItems([...orderingItems, `Step ${orderingItems.length + 1}`])}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block mt-1 cursor-pointer"
                  >
                    + Add Sequence Item
                  </button>
                </div>
              )}

              {/* 10. NUMERIC — redesigned with a plain-language explanation + live accepted-range preview */}
              {currentFormat === "numeric" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/60 px-3.5 py-2.5">
                    <Info className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-sky-800 leading-relaxed">
                      The student's answer is marked correct if it falls within{" "}
                      <strong>Correct Answer ± Tolerance</strong>. For example, a Correct Answer of{" "}
                      <strong>9.81</strong> with a Tolerance of <strong>0.05</strong> accepts any value from{" "}
                      <strong>9.76 to 9.86</strong>. Use a Tolerance of <strong>0</strong> to require an exact match.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Correct Answer
                      </label>
                      <input
                        type="number"
                        value={numericAnswer.val}
                        onChange={(e) => setNumericAnswer({ ...numericAnswer, val: parseFloat(e.target.value) || 0 })}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tolerance (±)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={numericAnswer.tolerance}
                        onChange={(e) =>
                          setNumericAnswer({ ...numericAnswer, tolerance: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>

                  <div className="max-w-xs">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Unit Label <span className="normal-case font-medium text-slate-400">(optional, shown next to the answer)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. m/s², kg, %"
                      value={numericAnswer.unit}
                      onChange={(e) => setNumericAnswer({ ...numericAnswer, unit: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* LIVE ACCEPTED RANGE PREVIEW */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                      Accepted Range
                    </span>
                    <span className="text-sm font-bold text-emerald-800 font-mono">
                      {(numericAnswer.val - numericAnswer.tolerance).toFixed(2)} &ndash;{" "}
                      {(numericAnswer.val + numericAnswer.tolerance).toFixed(2)}
                      {numericAnswer.unit ? ` ${numericAnswer.unit}` : ""}
                    </span>
                  </div>
                </div>
              )}

              {/* EXPLANATION */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Solution Rationale / Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why the answer is correct for candidate feedback..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium focus:border-sky-400 outline-none resize-none placeholder:text-slate-400 text-slate-900"
                />
              </div>

              {/* ADD QUESTION BUTTON */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleAddQuestionToPart}
                  className="px-5 py-2 bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question to {activePart?.title}</span>
                </button>
              </div>
            </div>
          )}

          {/* ALL CONFIGURED QUESTIONS SUMMARY */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Configured Questions ({countTotalQuestions()})
              </h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
                Total Marks: {parts.reduce((acc, p) => acc + p.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0)} pts
              </span>
            </div>

            {countTotalQuestions() === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-semibold">
                  No questions added yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {parts.map((part) => (
                  <div key={part.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-navy-900 text-white px-2.5 py-1 rounded-md">
                          {part.title}
                        </span>
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                          {QUESTION_TYPE_LABELS[part.allowedType]}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{part.questions.length} items</span>
                    </div>

                    <div className="space-y-2.5 pt-0.5">
                      {part.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex justify-between items-center gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-900 mr-1.5">Q{idx + 1}.</span>
                            <span className="text-xs font-medium text-slate-800">{q.text}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                              {q.marks} pts
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(part.id, q.id)}
                              className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PUBLISH CONTROLS */}
            <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors mr-auto cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Parameters
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-5 py-2 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Deploy Exam Architecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCHED SUCCESS MODAL */}
      {isLaunched && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-5">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Exam Live & Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Provide this access code to students to launch their test session.
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-5 rounded-xl flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ACCESS CODE</span>
              <span className="text-3xl font-extrabold font-mono tracking-widest text-slate-900">{accessCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`mt-1 text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCopied
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLaunched(false);
                router.push("/teacher/exams");
              }}
              className="w-full bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Done & View All Exams
            </button>
          </div>
        </div>
      )}

      </main>
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