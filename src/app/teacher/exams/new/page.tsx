"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  Layers,
  Lock
} from "lucide-react";

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
  const [shortAnswers, setShortAnswers] = useState<string[]>([""]);
  const [essayMinMax, setEssayMinMax] = useState({ min: 100, max: 1000 });
  const [codingLang, setCodingLang] = useState("python");
  const [codingStarter, setCodingStarter] = useState("# Write your code here\n");
  const [blanksText, setBlanksText] = useState("The capital of France is [Paris].");
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([
    { left: "HTML", right: "Structure" },
    { left: "CSS", right: "Styling" }
  ]);
  const [orderingItems, setOrderingItems] = useState<string[]>(["Step 1", "Step 2", "Step 3"]);
  const [numericAnswer, setNumericAnswer] = useState({ val: 9.81, tolerance: 0.05, unit: "m/s²" });

  const activePart = parts.find((p) => p.id === activePartId);
  const currentFormat = activePart?.allowedType || "mcq";

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
      ...(qType === "short_answer" && { shortAnswers: shortAnswers.filter((a) => a.trim() !== "") }),
      ...(qType === "essay" && { essayMinMax: { ...essayMinMax } }),
      ...(qType === "coding" && { codingLang, codingStarter }),
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

    // Reset Form Defaults
    setQText("");
    setQExplanation("");
    setQMediaType("none");
    setQMediaUrl("");
    setMcqOptions(["Option A", "Option B"]);
    setMcqCorrect(0);
    setMultiOptions(["Option A", "Option B"]);
    setMultiCorrect([true, false]);
    setShortAnswers([""]);
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
    <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-900 pb-12 p-6 md:p-8">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#395886] tracking-wider block mb-1">
            EXAM ARCHITECTURE DESK
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 1 ? "Configure Exam Parameters" : "Sections & Question Setup"}
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {step === 1
              ? "Set academic context, department, and time duration."
              : "Organize questionnaire sections and configure multi-format rules."}
          </p>
        </div>

        {/* STEP CONTROLS */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              step === 1 ? "bg-[#395886] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1. Parameters
          </button>
          <button
            type="button"
            disabled={!isSettingsFormComplete()}
            onClick={() => setStep(2)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              step === 2 ? "bg-[#395886] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
            } ${!isSettingsFormComplete() ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            2. Questions ({countTotalQuestions()})
          </button>
        </div>
      </div>

      {/* STEP 1: EXAM PARAMETERS */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black uppercase text-[#395886] tracking-wider">PRIMARY SETTINGS</span>
            <h2 className="text-lg font-black text-slate-900">General Information</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                EXAM TITLE *
              </label>
              <input
                type="text"
                placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:border-[#638ECB] focus:ring-2 focus:ring-[#638ECB]/20 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                INSTRUCTIONS & DESCRIPTION
              </label>
              <textarea
                rows={3}
                placeholder="Detail academic honor codes, workspace configuration parameters, etc..."
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 focus:border-[#638ECB] focus:ring-2 focus:ring-[#638ECB]/20 outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  ASSIGNED DEPARTMENT / SUBJECT *
                </label>
                <input
                  type="text"
                  placeholder="Computer Science"
                  value={examData.department}
                  onChange={(e) => setExamData({ ...examData, department: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#638ECB] focus:ring-2 focus:ring-[#638ECB]/20 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  ACADEMIC YEAR
                </label>
                <input
                  type="text"
                  placeholder="2026-2027"
                  value={examData.academicYear}
                  onChange={(e) => setExamData({ ...examData, academicYear: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:border-[#638ECB] focus:ring-2 focus:ring-[#638ECB]/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  DURATION (MINUTES) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={examData.duration}
                  onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#638ECB] focus:ring-2 focus:ring-[#638ECB]/20 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <input
                type="checkbox"
                id="templateToggle"
                checked={examData.saveAsTemplate}
                onChange={(e) => setExamData({ ...examData, saveAsTemplate: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 accent-[#395886] focus:ring-[#638ECB] cursor-pointer"
              />
              <label htmlFor="templateToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                Save this configuration as a reusable Template
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => router.push("/teacher/exams")}
              className="px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
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
              className="px-8 py-3.5 bg-[#395886] hover:bg-[#2d466c] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
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
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-xs">
            <span className="text-[10px] font-black uppercase text-[#395886] tracking-wider block mb-1">
              STRUCTURAL BLUEPRINT
            </span>
            <h2 className="text-lg font-black text-slate-900 mb-4">Exam Sections Hierarchy</h2>

            <form
              onSubmit={handleCreatePart}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/70 p-5 rounded-2xl border border-slate-100"
            >
              <div className="md:col-span-5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Section A: QCM Questions"
                  value={newPartTitle}
                  onChange={(e) => setNewPartTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#638ECB]"
                  required
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Section Format Rule
                </label>
                <select
                  value={newPartType}
                  onChange={(e) => setNewPartType(e.target.value as QuestionType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#638ECB]"
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
                  className="w-full bg-[#395886] hover:bg-[#2d466c] text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all shadow-xs"
                >
                  + Add Section
                </button>
              </div>
            </form>

            {/* ACTIVE SECTION TABS */}
            <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-5 items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Active Sections:</span>
              {parts.length === 0 ? (
                <span className="text-xs font-bold text-slate-400 italic">
                  No sections created yet. Create a section above to begin.
                </span>
              ) : (
                parts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePartId(p.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 ${
                      activePartId === p.id
                        ? "bg-[#395886] text-white border-[#395886] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{p.title}</span>
                    <span className="opacity-75 font-mono text-[11px]">({QUESTION_TYPE_LABELS[p.allowedType]})</span>
                    <span className="ml-1 bg-white/20 text-current text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                      {p.questions.length}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* QUESTION BUILDER AREA */}
          {parts.length === 0 ? (
            /* LOCKED EMPTY STATE IF NO SECTION CREATED YET */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-xs space-y-3">
              <div className="w-12 h-12 bg-[#395886]/10 text-[#395886] rounded-2xl flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">No Section Defined</h3>
              <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto">
                Please create your first section in the <span className="text-[#395886] font-bold">Structural Blueprint</span> above before adding questions.
              </p>
            </div>
          ) : (
            /* ACTIVE QUESTION BUILDER FORM */
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#395886] tracking-wider block mb-1">
                    QUESTION BUILDER
                  </span>
                  <h2 className="text-lg font-black text-slate-900">
                    Target Section: {activePart?.title || "Select a section"}
                  </h2>
                </div>

                {/* LOCKED FORMAT BADGE FOR THE ENTIRE SECTION */}
                <div className="flex items-center gap-2 bg-[#395886]/10 text-[#395886] px-3.5 py-2 rounded-xl border border-[#395886]/20">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">
                    Locked Format: {QUESTION_TYPE_LABELS[currentFormat]}
                  </span>
                </div>
              </div>

              {/* MARKS, MANDATORY & MEDIA METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Points / Marks
                  </label>
                  <input
                    type="number"
                    value={qMarks}
                    onChange={(e) => setQMarks(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#638ECB]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Media Attachment
                  </label>
                  <select
                    value={qMediaType}
                    onChange={(e: any) => setQMediaType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#638ECB]"
                  >
                    <option value="none">None</option>
                    <option value="image">Image URL</option>
                    <option value="audio">Audio URL</option>
                    <option value="video">Video URL</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={qMandatory}
                      onChange={(e) => setQMandatory(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 accent-[#395886] focus:ring-[#638ECB]"
                    />
                    Mandatory Question
                  </label>
                </div>

                {qMediaType !== "none" && (
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      {qMediaType.toUpperCase()} Media URL
                    </label>
                    <input
                      type="url"
                      placeholder={`https://example.com/media.${qMediaType === "image" ? "png" : "mp4"}`}
                      value={qMediaUrl}
                      onChange={(e) => setQMediaUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
                    />
                  </div>
                )}
              </div>

              {/* QUESTION PROMPT */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Question Text Prompt *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the main question prompt or problem statement..."
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 focus:border-[#638ECB] focus:ring-2 focus:ring-[#638ECB]/20 outline-none resize-none"
                />
              </div>

              {/* --- DYNAMIC FORM EDITORS (STRICTLY RESTRICTED TO currentFormat) --- */}

              {/* 1. MCQ (QCM) */}
              {currentFormat === "mcq" && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Multiple Choice Radio Options (Select correct answer)
                  </label>
                  <div className="space-y-3">
                    {mcqOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setMcqCorrect(i)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            mcqCorrect === i ? "border-[#395886] bg-slate-50 text-[#395886]" : "border-slate-300"
                          }`}
                        >
                          {mcqCorrect === i && <span className="w-2.5 h-2.5 rounded-full bg-[#395886]" />}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const c = [...mcqOptions];
                            c[i] = e.target.value;
                            setMcqOptions(c);
                          }}
                          className={`flex-grow border rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none ${
                            mcqCorrect === i ? "border-[#395886]" : "border-slate-200"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setMcqOptions(mcqOptions.filter((_, idx) => idx !== i))}
                          disabled={mcqOptions.length <= 2}
                          className="text-xs text-rose-500 font-bold hover:underline disabled:opacity-30"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMcqOptions([...mcqOptions, `Option ${String.fromCharCode(65 + mcqOptions.length)}`])}
                    className="text-xs font-bold text-[#638ECB] hover:text-[#395886] hover:underline block mt-2"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {/* 2. MULTI SELECT */}
              {currentFormat === "multi_select" && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Checkbox Options (Check all correct answers)
                  </label>
                  <div className="space-y-3">
                    {multiOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={multiCorrect[i] || false}
                          onChange={(e) => {
                            const c = [...multiCorrect];
                            c[i] = e.target.checked;
                            setMultiCorrect(c);
                          }}
                          className="w-5 h-5 rounded border-slate-300 accent-[#395886] focus:ring-[#638ECB]"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const c = [...multiOptions];
                            c[i] = e.target.value;
                            setMultiOptions(c);
                          }}
                          className="flex-grow border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setMultiOptions(multiOptions.filter((_, idx) => idx !== i));
                            setMultiCorrect(multiCorrect.filter((_, idx) => idx !== i));
                          }}
                          disabled={multiOptions.length <= 2}
                          className="text-xs text-rose-500 font-bold hover:underline disabled:opacity-30"
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
                    className="text-xs font-bold text-[#638ECB] hover:text-[#395886] hover:underline block mt-2"
                  >
                    + Add Checkbox Option
                  </button>
                </div>
              )}

              {/* 3. TRUE / FALSE */}
              {currentFormat === "true_false" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Correct Key Answer
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setTfCorrect(true)}
                      className={`px-8 py-3 border rounded-xl text-xs font-bold transition-all ${
                        tfCorrect ? "bg-slate-100 border-[#395886] text-[#395886]" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      True
                    </button>
                    <button
                      type="button"
                      onClick={() => setTfCorrect(false)}
                      className={`px-8 py-3 border rounded-xl text-xs font-bold transition-all ${
                        !tfCorrect ? "bg-slate-100 border-[#395886] text-[#395886]" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      False
                    </button>
                  </div>
                </div>
              )}

              {/* 4. SHORT ANSWER */}
              {currentFormat === "short_answer" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Accepted Answer Variants (Auto-grading)
                  </label>
                  {shortAnswers.map((ans, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="e.g. CPU, Central Processing Unit"
                        value={ans}
                        onChange={(e) => {
                          const c = [...shortAnswers];
                          c[i] = e.target.value;
                          setShortAnswers(c);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
                      />
                      {shortAnswers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShortAnswers(shortAnswers.filter((_, idx) => idx !== i))}
                          className="text-xs text-rose-500 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShortAnswers([...shortAnswers, ""])}
                    className="text-xs font-bold text-[#638ECB] hover:text-[#395886] hover:underline block mt-1"
                  >
                    + Add Accepted Answer Variant
                  </button>
                </div>
              )}

              {/* 5. ESSAY */}
              {currentFormat === "essay" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Minimum Word Count
                    </label>
                    <input
                      type="number"
                      value={essayMinMax.min}
                      onChange={(e) => setEssayMinMax({ ...essayMinMax, min: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#638ECB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Maximum Word Count
                    </label>
                    <input
                      type="number"
                      value={essayMinMax.max}
                      onChange={(e) => setEssayMinMax({ ...essayMinMax, max: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#638ECB]"
                    />
                  </div>
                </div>
              )}

              {/* 6. CODING */}
              {currentFormat === "coding" && (
                <div className="space-y-3">
                  <div className="w-48">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Programming Language
                    </label>
                    <select
                      value={codingLang}
                      onChange={(e) => setCodingLang(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#638ECB]"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript (Node)</option>
                      <option value="cpp">C++ 20</option>
                      <option value="java">Java 17</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Starter Code Template
                    </label>
                    <textarea
                      rows={4}
                      value={codingStarter}
                      onChange={(e) => setCodingStarter(e.target.value)}
                      className="w-full font-mono text-xs bg-slate-900 text-sky-300 p-4 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 7. FILL IN THE BLANK */}
              {currentFormat === "fill_blank" && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Template Text (Use brackets [blank] for missing words)
                  </label>
                  <input
                    type="text"
                    value={blanksText}
                    onChange={(e) => setBlanksText(e.target.value)}
                    placeholder="e.g. The capital of France is [Paris]."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
                  />
                </div>
              )}

              {/* 8. MATCHING PAIRS */}
              {currentFormat === "matching" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
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
                        className="w-1/2 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
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
                        className="w-1/2 border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMatchingPairs([...matchingPairs, { left: "", right: "" }])}
                    className="text-xs font-bold text-[#638ECB] hover:text-[#395886] hover:underline block mt-1"
                  >
                    + Add Matching Pair
                  </button>
                </div>
              )}

              {/* 9. ORDERING */}
              {currentFormat === "ordering" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Target Sequence Order (Top to Bottom)
                  </label>
                  {orderingItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-black text-[#395886]">{i + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const c = [...orderingItems];
                          c[i] = e.target.value;
                          setOrderingItems(c);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-[#638ECB]"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setOrderingItems([...orderingItems, `Step ${orderingItems.length + 1}`])}
                    className="text-xs font-bold text-[#638ECB] hover:text-[#395886] hover:underline block mt-1"
                  >
                    + Add Sequence Item
                  </button>
                </div>
              )}

              {/* 10. NUMERIC */}
              {currentFormat === "numeric" && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={numericAnswer.val}
                      onChange={(e) => setNumericAnswer({ ...numericAnswer, val: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-[#638ECB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Tolerance (±)
                    </label>
                    <input
                      type="number"
                      value={numericAnswer.tolerance}
                      onChange={(e) =>
                        setNumericAnswer({ ...numericAnswer, tolerance: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-[#638ECB]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Unit Label
                    </label>
                    <input
                      type="text"
                      value={numericAnswer.unit}
                      onChange={(e) => setNumericAnswer({ ...numericAnswer, unit: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-[#638ECB]"
                    />
                  </div>
                </div>
              )}

              {/* EXPLANATION */}
              <div className="pt-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Solution Rationale / Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why the answer is correct for candidate feedback..."
                  value={qExplanation}
                  onChange={(e) => setQExplanation(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:border-[#638ECB] outline-none resize-none"
                />
              </div>

              {/* ADD QUESTION BUTTON */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleAddQuestionToPart}
                  className="px-6 py-3 bg-[#395886] hover:bg-[#2d466c] text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                >
                  + Add Question to {activePart?.title}
                </button>
              </div>
            </div>
          )}

          {/* ALL CONFIGURED QUESTIONS SUMMARY */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#395886] tracking-wider block mb-1">
                  QUESTION REPOSITORY
                </span>
                <h2 className="text-lg font-black text-slate-900">Configured Questions ({countTotalQuestions()})</h2>
              </div>
              <span className="text-xs font-black bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200">
                Total Marks: {parts.reduce((acc, p) => acc + p.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0)} pts
              </span>
            </div>

            {countTotalQuestions() === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-bold">
                  No questions added yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {parts.map((part) => (
                  <div key={part.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-[#395886] text-white px-3 py-1 rounded-md">
                          {part.title}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded uppercase">
                          {QUESTION_TYPE_LABELS[part.allowedType]}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{part.questions.length} items</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {part.questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-black text-slate-800 mr-2">Q{idx + 1}.</span>
                            <span className="text-xs font-bold text-slate-900">{q.text}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-black text-[#395886] bg-[#638ECB]/10 px-2.5 py-1 rounded-md border border-[#638ECB]/20">
                              {q.marks} pts
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(part.id, q.id)}
                              className="text-xs text-rose-500 font-bold hover:underline"
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
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all mr-auto"
              >
                ← Back to Parameters
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-8 py-3.5 bg-[#395886] hover:bg-[#2d466c] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                Deploy Exam Architecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCHED SUCCESS MODAL */}
      {isLaunched && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-[#638ECB]/10 text-[#395886] rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Exam Live & Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Provide this access code to students to launch their test session.
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ACCESS CODE</span>
              <span className="text-4xl font-black font-mono tracking-widest text-[#395886]">{accessCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`mt-1 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  isCopied
                    ? "bg-[#395886] text-white"
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
              className="w-full bg-[#395886] hover:bg-[#2d466c] text-white font-bold text-xs py-3.5 rounded-xl transition-all"
            >
              Done & View All Exams
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 font-bold text-center">Loading Exam Builder...</div>}>
      <ExamBuilderContent />
    </Suspense>
  );
}