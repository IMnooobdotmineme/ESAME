"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// --- TYPE DEFINITIONS ---
type QuestionType = 
  | 'mcq' 
  | 'multi_select'
  | 'true_false' 
  | 'short_answer' 
  | 'essay' 
  | 'coding' 
  | 'fill_blank' 
  | 'matching' 
  | 'ordering' 
  | 'numeric';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  isMandatory: boolean;
  explanation: string;
  mediaType: 'none' | 'image' | 'audio' | 'video';
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

const DEFAULT_INITIAL_PART: ExamPart = {
  id: 'default-section-1',
  title: 'Section A: General Assessment',
  marks: 100,
  description: 'Primary evaluation section for exam questionnaire setup.',
  allowedType: 'mcq',
  questions: []
};

function ExamBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editId = searchParams.get('edit');
  const tabParam = searchParams.get('tab');

  const [step, setStep] = useState<1 | 2>(1); 

  // --- EXAM PARAMETERS STATE ---
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    department: 'Computer Science',
    academicYear: '2026-2027',
    semester: 'Semester 1',
    duration: 60,
    startDate: '',
    endDate: '',
    saveAsTemplate: false,
  });

  const [isLaunched, setIsLaunched] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // --- SECTIONS & QUESTIONS STATE ---
  const [parts, setParts] = useState<ExamPart[]>([DEFAULT_INITIAL_PART]);
  const [activePartId, setActivePartId] = useState<string>('default-section-1');
  
  const [newPartTitle, setNewPartTitle] = useState('');
  const [newPartMarks, setNewPartMarks] = useState<string>('');
  const [newPartType, setNewPartType] = useState<QuestionType>('mcq');

  // Question Form States
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState<number>(5);
  const [qMandatory, setQMandatory] = useState(true);
  const [qExplanation, setQExplanation] = useState('');
  const [qMediaType, setQMediaType] = useState<'none' | 'image' | 'audio' | 'video'>('none');
  const [qMediaUrl, setQMediaUrl] = useState('');

  const [mcqOptions, setMcqOptions] = useState<string[]>(['Option A', 'Option B']);
  const [mcqCorrect, setMcqCorrect] = useState<number>(0);
  const [multiOptions, setMultiOptions] = useState<string[]>(['Option A', 'Option B']);
  const [multiCorrect, setMultiCorrect] = useState<boolean[]>([true, false]);
  const [tfCorrect, setTfCorrect] = useState<boolean>(true);
  const [shortAnswers, setShortAnswers] = useState<string[]>(['']);
  const [essayMinMax, setEssayMinMax] = useState({ min: 100, max: 1000 });

  useEffect(() => {
    if (editId) {
      const rawData = localStorage.getItem('localExamsData');
      if (rawData) {
        try {
          const currentExams = JSON.parse(rawData);
          const allExams = [
            ...(currentExams.active || []),
            ...(currentExams.scheduled || []),
            ...(currentExams.completed || [])
          ];
          const found = allExams.find((e: any) => e.id === editId);
          if (found) {
            setExamData(prev => ({
              ...prev,
              title: found.title || prev.title,
              department: found.course || prev.department,
              duration: parseInt(found.duration) || prev.duration,
            }));

            if (found.parts && Array.isArray(found.parts) && found.parts.length > 0) {
              setParts(found.parts);
              setActivePartId(found.parts[0].id);
              setQType(found.parts[0].allowedType);
            } else if (found.questions && Array.isArray(found.questions) && found.questions.length > 0) {
              const convertedPart: ExamPart = {
                id: 'restored-section-1',
                title: 'Section A: Restored Questions',
                marks: 100,
                description: 'Section automatically generated from saved exam questions.',
                allowedType: found.questions[0]?.type || 'mcq',
                questions: found.questions
              };
              setParts([convertedPart]);
              setActivePartId(convertedPart.id);
              setQType(convertedPart.allowedType);
            }
          }
        } catch (err) {
          console.error("Failed to parse local exams data:", err);
        }
      }
    }

    if (editId || tabParam === 'questions') {
      setStep(2);
    }
  }, [editId, tabParam]);

  useEffect(() => {
    const currentActivePart = parts.find(p => p.id === activePartId);
    if (currentActivePart) {
      setQType(currentActivePart.allowedType);
    }
  }, [activePartId, parts]);

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
    return (
      examData.title.trim() !== '' &&
      examData.duration > 0 &&
      examData.startDate !== '' &&
      examData.endDate !== ''
    );
  };

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartTitle.trim()) return;

    const newPart: ExamPart = {
      id: Date.now().toString(),
      title: newPartTitle,
      marks: parseInt(newPartMarks) || 10,
      description: `Format restricted to ${newPartType.replace('_', ' ').toUpperCase()}.`,
      allowedType: newPartType,
      questions: []
    };

    setParts(prev => [...prev, newPart]);
    setActivePartId(newPart.id);
    setQType(newPartType);
    setNewPartTitle('');
    setNewPartMarks('');
  };

  const handleAddQuestionToPart = () => {
    if (!qText.trim()) {
      alert("Please enter the question text prompt before saving!");
      return;
    }

    let targetPartId = activePartId;
    let updatedParts = [...parts];

    if (updatedParts.length === 0) {
      const fallbackPart = { ...DEFAULT_INITIAL_PART, id: Date.now().toString() };
      updatedParts = [fallbackPart];
      targetPartId = fallbackPart.id;
      setActivePartId(fallbackPart.id);
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: qType,
      text: qText,
      marks: qMarks,
      isMandatory: qMandatory,
      explanation: qExplanation,
      mediaType: qMediaType,
      mediaUrl: qMediaUrl || undefined,

      ...(qType === 'mcq' && { mcqOptions: [...mcqOptions], mcqCorrect }),
      ...(qType === 'multi_select' && { multiOptions: [...multiOptions], multiCorrect: [...multiCorrect] }),
      ...(qType === 'true_false' && { tfCorrect }),
      ...(qType === 'short_answer' && { shortAnswers: shortAnswers.filter(a => a.trim() !== '') }),
      ...(qType === 'essay' && { essayMinMax: { ...essayMinMax } }),
    };

    setParts(updatedParts.map(part => {
      if (part.id === targetPartId) {
        return { ...part, questions: [...part.questions, newQuestion] };
      }
      return part;
    }));

    setQText('');
    setQExplanation('');
    setQMediaType('none');
    setQMediaUrl('');
    setMcqOptions(['Option A', 'Option B']);
    setMcqCorrect(0);
    setMultiOptions(['Option A', 'Option B']);
    setMultiCorrect([true, false]);
    setShortAnswers(['']);
  };

  const handleDeleteQuestion = (partId: string, questionId: string) => {
    setParts(parts.map(p => {
      if (p.id === partId) {
        return { ...p, questions: p.questions.filter(q => q.id !== questionId) };
      }
      return p;
    }));
  };

  const countTotalQuestions = () => parts.reduce((acc, part) => acc + part.questions.length, 0);

  const handlePublish = () => {
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
      duration: `${examData.duration} mins`,
      questions: totalQCount,
      code: generatedCode,
      date: examData.startDate ? new Date(examData.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Jul 29, 2026',
      students: '0/0',
      isTemplate: examData.saveAsTemplate,
      parts: parts
    };

    const rawData = localStorage.getItem('localExamsData');
    const defaultData = { active: [], scheduled: [], completed: [] };
    const currentExams = rawData ? JSON.parse(rawData) : defaultData;

    if (editId) {
      ['active', 'scheduled', 'completed'].forEach((key) => {
        if (Array.isArray(currentExams[key])) {
          currentExams[key] = currentExams[key].map((item: any) => 
            item.id === editId ? finalExam : item
          );
        }
      });
    } else {
      currentExams.scheduled = [finalExam, ...currentExams.scheduled];
    }

    localStorage.setItem('localExamsData', JSON.stringify(currentExams));
    setIsLaunched(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 text-slate-900 pb-12">
      
      {/* HEADER SECTION (Aligned with Dashboard & Grading Header Style) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#008080] tracking-wider block mb-1">
            EXAM ARCHITECTURE DESK
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 1 ? "Configure Exam Parameters" : "Sections & Questions Setup"}
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {step === 1 ? "Set academic context, department, and time windows." : "Organize questionnaire sheets and assign point rules."}
          </p>
        </div>

        {/* STEP PIPELINE TAB CONTROLS */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
          <button 
            type="button"
            onClick={() => setStep(1)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              step === 1 
                ? 'bg-[#008080] text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Parameters
          </button>
          <button 
            type="button"
            disabled={!isSettingsFormComplete()}
            onClick={() => setStep(2)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              step === 2 
                ? 'bg-[#008080] text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            } ${
              !isSettingsFormComplete() ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            2. Questions ({countTotalQuestions()})
          </button>
        </div>
      </div>

      {/* STEP 1: EXAM PARAMETERS */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black uppercase text-[#008080] tracking-wider">PRIMARY SETTINGS</span>
            <h2 className="text-lg font-black text-slate-900">General Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                EXAM TITLE *
              </label>
              <input 
                type="text" 
                placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                value={examData.title}
                onChange={(e) => setExamData({...examData, title: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:border-[#008080] focus:ring-1 focus:ring-[#008080] outline-none transition-all"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                INSTRUCTIONS & DESCRIPTION
              </label>
              <textarea 
                rows={3}
                placeholder="Detail academic honor codes, workspace configuration parameters, etc..."
                value={examData.description}
                onChange={(e) => setExamData({...examData, description: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 focus:border-[#008080] focus:ring-1 focus:ring-[#008080] outline-none transition-all"
              />
            </div>

            {/* WRITABLE SUBJECT / ASSIGNED DEPARTMENT */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                ASSIGNED DEPARTMENT / SUBJECT *
              </label>
              <input 
                type="text" 
                list="department-list"
                placeholder="e.g., Computer Science, Mathematics..."
                value={examData.department}
                onChange={(e) => setExamData({...examData, department: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#008080] focus:ring-1 focus:ring-[#008080] outline-none transition-all"
              />
              <datalist id="department-list">
                <option value="Computer Science" />
                <option value="Information Technology" />
                <option value="Mathematics" />
                <option value="Physics" />
                <option value="Software Engineering" />
                <option value="Business Administration" />
              </datalist>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                ACADEMIC YEAR
              </label>
              <input 
                type="text" 
                placeholder="2026-2027"
                value={examData.academicYear}
                onChange={(e) => setExamData({...examData, academicYear: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:border-[#008080] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                SEMESTER
              </label>
              <select 
                value={examData.semester}
                onChange={(e) => setExamData({...examData, semester: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#008080] outline-none"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                DURATION (MINUTES) *
              </label>
              <input 
                type="number" 
                min="1"
                value={examData.duration}
                onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:border-[#008080] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  START TIME *
                </label>
                <input 
                  type="datetime-local" 
                  value={examData.startDate}
                  onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:border-[#008080] outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  END TIME *
                </label>
                <input 
                  type="datetime-local" 
                  value={examData.endDate}
                  onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:border-[#008080] outline-none"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                id="templateToggle"
                checked={examData.saveAsTemplate}
                onChange={(e) => setExamData({...examData, saveAsTemplate: e.target.checked})}
                className="w-4 h-4 rounded text-[#008080] border-slate-300 focus:ring-[#008080]"
              />
              <label htmlFor="templateToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                Save this configuration as a reusable Template
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => router.push('/teacher/exams')} 
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
              className="px-8 py-3.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Continue to Question Setup →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SECTIONS & QUESTIONS SETUP */}
      {step === 2 && (
        <div className="space-y-6">

          {/* SECTION CREATOR */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm">
            <span className="text-[10px] font-black uppercase text-[#008080] tracking-wider block mb-1">
              STRUCTURAL BLUEPRINT
            </span>
            <h2 className="text-lg font-black text-slate-900 mb-4">Exam Sections Hierarchy</h2>
            
            <form onSubmit={handleCreatePart} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              <div className="md:col-span-5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Section Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Section A: Multiple Choice Questions"
                  value={newPartTitle}
                  onChange={(e) => setNewPartTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#008080]"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Section Format Rule</label>
                <select 
                  value={newPartType}
                  onChange={(e) => setNewPartType(e.target.value as QuestionType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#008080]"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="true_false">True / False</option>
                  <option value="multi_select">Multiple Select</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay / Long Form</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="w-full bg-[#0D1527] hover:bg-[#1a253d] text-white font-bold text-xs py-3.5 px-4 rounded-xl transition-all shadow-sm">
                  + Add Section
                </button>
              </div>
            </form>

            {/* ACTIVE SECTION TABS */}
            <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-5 items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Active Sections:</span>
              {parts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePartId(p.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                    activePartId === p.id 
                      ? 'bg-[#008080] text-white border-[#008080] shadow-sm' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.title} <span className="opacity-80 font-mono ml-1">({p.questions.length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* QUESTION FORM */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#008080] tracking-wider block mb-1">
                  QUESTION BUILDER
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Target Section: {parts.find(p => p.id === activePartId)?.title || "Section A"}
                </h2>
              </div>
              
              <select 
                value={qType}
                onChange={(e) => setQType(e.target.value as QuestionType)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#008080]"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="multi_select">Multiple Select</option>
                <option value="short_answer">Short Answer</option>
                <option value="essay">Essay / Long Form</option>
              </select>
            </div>

            {/* MARKS & SETTINGS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Points / Marks</label>
                <input 
                  type="number" 
                  value={qMarks}
                  onChange={(e) => setQMarks(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#008080]"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={qMandatory} 
                    onChange={(e) => setQMandatory(e.target.checked)} 
                    className="w-4 h-4 rounded text-[#008080] border-slate-300 focus:ring-[#008080]" 
                  />
                  Mandatory Question
                </label>
              </div>
            </div>

            {/* QUESTION PROMPT */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Question Text Prompt *</label>
              <textarea 
                rows={3}
                placeholder="Enter the main question text..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 focus:border-[#008080] focus:ring-1 focus:ring-[#008080] outline-none"
              />
            </div>

            {/* QUESTION OPTIONS MATRIX */}
            {qType === 'mcq' && (
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Select Correct Radio Button Option</label>
                <div className="space-y-3">
                  {mcqOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={() => setMcqCorrect(i)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          mcqCorrect === i 
                            ? 'border-[#008080] bg-[#008080]/10 text-[#008080]' 
                            : 'border-slate-300'
                        }`}
                      >
                        {mcqCorrect === i && <span className="w-2.5 h-2.5 rounded-full bg-[#008080]" />}
                      </button>
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={(e) => { 
                          const c = [...mcqOptions]; 
                          c[i] = e.target.value; 
                          setMcqOptions(c); 
                        }} 
                        className={`flex-grow border rounded-xl px-4 py-3 text-xs font-medium focus:outline-none transition-all ${
                          mcqCorrect === i 
                            ? 'border-[#008080] ring-1 ring-[#008080]' 
                            : 'border-slate-200 focus:border-[#008080]'
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
                  className="text-xs font-bold text-[#008080] hover:underline block mt-2"
                >
                  + Add Option
                </button>
              </div>
            )}

            {qType === 'true_false' && (
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Correct Answer</label>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setTfCorrect(true)} className={`px-8 py-3.5 border rounded-xl text-xs font-bold transition-all ${tfCorrect ? 'bg-teal-50 border-[#008080] text-[#008080]' : 'border-slate-200 text-slate-600'}`}>True</button>
                  <button type="button" onClick={() => setTfCorrect(false)} className={`px-8 py-3.5 border rounded-xl text-xs font-bold transition-all ${!tfCorrect ? 'bg-teal-50 border-[#008080] text-[#008080]' : 'border-slate-200 text-slate-600'}`}>False</button>
                </div>
              </div>
            )}

            {/* ADD QUESTION BUTTON */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleAddQuestionToPart}
                className="px-6 py-3 bg-[#0D1527] hover:bg-[#1a253d] text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                + Add Question to Section
              </button>
            </div>
          </div>

          {/* ALL QUESTIONS SUMMARY LIST */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#008080] tracking-wider block mb-1">QUESTION REPOSITORY</span>
                <h2 className="text-lg font-black text-slate-900">Configured Questions ({countTotalQuestions()})</h2>
              </div>
              <span className="text-xs font-black bg-teal-50 text-[#008080] px-3 py-1.5 rounded-lg border border-teal-100">
                Total Marks: {parts.reduce((acc, p) => acc + p.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0)} pts
              </span>
            </div>

            {countTotalQuestions() === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-bold">No questions added yet. Use the form above to build questions.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {parts.map((part) => (
                  <div key={part.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/40 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                      <span className="text-xs font-black bg-[#008080] text-white px-3 py-1 rounded-md">
                        {part.title}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{part.questions.length} items</span>
                    </div>

                    <div className="space-y-3 pt-1">
                      {part.questions.map((q, idx) => (
                        <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-black text-slate-800 mr-2">Q{idx + 1}.</span>
                            <span className="text-xs font-bold text-slate-900">{q.text}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-black text-[#008080] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
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
                className="px-8 py-3.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Deploy Exam Architecture
              </button>
            </div>
          </div>

        </div>
      )}

      {/* SUCCESS MODAL */}
      {isLaunched && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-[#008080]/10 text-[#008080] rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">Exam Live & Scheduled</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Give this access code to your students to launch their test session.
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ACCESS CODE</span>
              <span className="text-4xl font-black font-mono tracking-widest text-[#0D1527]">
                {accessCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`mt-1 text-xs font-bold px-5 py-2.5 rounded-xl transition-all ${
                  isCopied ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLaunched(false);
                router.push('/teacher/exams');
              }}
              className="w-full bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs py-3.5 rounded-xl transition-all"
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