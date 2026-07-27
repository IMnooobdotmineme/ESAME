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
  
  // Custom type payload parameters
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
  allowedType: QuestionType; // Enforces section rule restrictions
  questions: Question[];
}

const DEFAULT_INITIAL_PART: ExamPart = {
  id: 'default-section-1',
  title: 'Section A: General Questions',
  marks: 100,
  description: 'Default section for exam questionnaire setup.',
  allowedType: 'mcq',
  questions: []
};

function ExamBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const editId = searchParams.get('edit');
  const tabParam = searchParams.get('tab');

  // STEP STATE (Defaults to 1, updated automatically if editing or tab=questions)
  const [step, setStep] = useState<1 | 2>(1); 

  // --- STEP 1: EXAM PARAMETERS STATE ---
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

  // Launch & Access Code States
  const [isLaunched, setIsLaunched] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // --- STEP 2: MULTI-PART EXAM STRUCTURE STATE ---
  // Defaults with 1 section pre-created so screen is never empty
  const [parts, setParts] = useState<ExamPart[]>([DEFAULT_INITIAL_PART]);
  const [activePartId, setActivePartId] = useState<string>('default-section-1');
  
  // Section Creator Form States
  const [newPartTitle, setNewPartTitle] = useState('');
  const [newPartMarks, setNewPartMarks] = useState<string>('');
  const [newPartType, setNewPartType] = useState<QuestionType>('mcq');

  // Current Working Question States
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState<number>(5);
  const [qMandatory, setQMandatory] = useState(true);
  const [qExplanation, setQExplanation] = useState('');
  const [qMediaType, setQMediaType] = useState<'none' | 'image' | 'audio' | 'video'>('none');
  const [qMediaUrl, setQMediaUrl] = useState('');

  // Dynamic Type-Specific Working States
  const [mcqOptions, setMcqOptions] = useState<string[]>(['Option A', 'Option B']);
  const [mcqCorrect, setMcqCorrect] = useState<number>(0);
  const [multiOptions, setMultiOptions] = useState<string[]>(['Option A', 'Option B']);
  const [multiCorrect, setMultiCorrect] = useState<boolean[]>([true, false]);
  const [tfCorrect, setTfCorrect] = useState<boolean>(true);
  const [shortAnswers, setShortAnswers] = useState<string[]>(['']);
  const [essayMinMax, setEssayMinMax] = useState({ min: 100, max: 1000 });
  const [codingLang, setCodingLang] = useState('python');
  const [codingStarter, setCodingStarter] = useState('');
  const [blanksText, setBlanksText] = useState('Type your [blank1] sentences here.');
  const [matchingPairs, setMatchingPairs] = useState<{ left: string; right: string }[]>([{ left: '', right: '' }]);
  const [orderingItems, setOrderingItems] = useState<string[]>(['Item 1', 'Item 2']);
  const [numericAnswer, setNumericAnswer] = useState({ val: 0, tolerance: 0, unit: '' });

  // LOAD EXISTING EXAM FOR EDITING AND AUTOMATICALLY RESTORE ALL SECTIONS & QUESTIONS
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

            // If structured parts exist, restore them
            if (found.parts && Array.isArray(found.parts) && found.parts.length > 0) {
              setParts(found.parts);
              setActivePartId(found.parts[0].id);
              setQType(found.parts[0].allowedType);
            } 
            // If questions were saved as a flat array, wrap them inside a section automatically
            else if (found.questions && Array.isArray(found.questions) && found.questions.length > 0) {
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
          console.error("Failed to parse local exams data for edit:", err);
        }
      }
    }

    // Direct navigation to Step 2 when editing or tab=questions is specified
    if (editId || tabParam === 'questions') {
      setStep(2);
    }
  }, [editId, tabParam]);

  // Sync builder layout whenever the active section layout shifts
  useEffect(() => {
    const currentActivePart = parts.find(p => p.id === activePartId);
    if (currentActivePart) {
      setQType(currentActivePart.allowedType);
    }
  }, [activePartId, parts]);

  // Generate 6-character uppercase alphanumeric access code
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

  // --- WORKFLOW STEP 1 PARAMETER VALIDATION CHECK ---
  const isSettingsFormComplete = () => {
    if (editId) return true;
    return (
      examData.title.trim() !== '' &&
      examData.duration > 0 &&
      examData.startDate !== '' &&
      examData.endDate !== ''
    );
  };

  // --- STRUCTURAL PART MANIPULATIONS ---
  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartTitle.trim()) return;

    const newPart: ExamPart = {
      id: Date.now().toString(),
      title: newPartTitle,
      marks: parseInt(newPartMarks) || 10,
      description: `All items inside this section are strictly restricted to ${newPartType.replace('_', ' ').toUpperCase()} format configurations.`,
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

    // Ensure there is at least one active section available
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

      // Save respective data schemas
      ...(qType === 'mcq' && { mcqOptions: [...mcqOptions], mcqCorrect }),
      ...(qType === 'multi_select' && { multiOptions: [...multiOptions], multiCorrect: [...multiCorrect] }),
      ...(qType === 'true_false' && { tfCorrect }),
      ...(qType === 'short_answer' && { shortAnswers: shortAnswers.filter(a => a.trim() !== '') }),
      ...(qType === 'essay' && { essayMinMax: { ...essayMinMax } }),
      ...(qType === 'coding' && { codingLang, codingStarter }),
      ...(qType === 'fill_blank' && { blanksText }),
      ...(qType === 'matching' && { matchingPairs: matchingPairs.filter(p => p.left.trim() !== '') }),
      ...(qType === 'ordering' && { orderingItems: [...orderingItems] }),
      ...(qType === 'numeric' && { numericAnswer: { ...numericAnswer } })
    };

    setParts(updatedParts.map(part => {
      if (part.id === targetPartId) {
        return { ...part, questions: [...part.questions, newQuestion] };
      }
      return part;
    }));

    // Reset working states
    setQText('');
    setQExplanation('');
    setQMediaType('none');
    setQMediaUrl('');
    setMcqOptions(['Option A', 'Option B']);
    setMcqCorrect(0);
    setMultiOptions(['Option A', 'Option B']);
    setMultiCorrect([true, false]);
    setShortAnswers(['']);
    setMatchingPairs([{ left: '', right: '' }]);
    setOrderingItems(['Item 1', 'Item 2']);
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
      alert("Please construct at least one question within your exam layout before deployment.");
      return;
    }

    const generatedCode = generateAccessCode();
    setAccessCode(generatedCode);

    const finalExam = {
      id: editId || Date.now().toString(),
      title: examData.title || "Untitled Assessment Session",
      course: examData.department,
      duration: `${examData.duration} mins`,
      questions: totalQCount,
      code: generatedCode,
      date: examData.startDate ? new Date(examData.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Jul 16, 2026',
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

  const handleSaveDraft = () => {
    alert("Exam configuration successfully saved as a draft.");
    router.push('/teacher/exams');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-6 text-slate-900 animate-in fade-in duration-200">
      
      {/* HEADER CONTROLS PIPELINE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase text-[#0B7A93] tracking-wider">Exam Manager Studio</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {step === 1 ? "Configure Exam Parameters" : "Segmented Structural Builder"}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {step === 1 ? "Set academic context and timetables." : "Organize questionnaire sheets into sectioned parts."}
          </p>
        </div>

        {/* WORKFLOW PIPELINE TAB CONTROLS */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
          <button 
            type="button"
            onClick={() => setStep(1)}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${step === 1 ? 'bg-[#0B7A93] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            1. Settings
          </button>
          <button 
            type="button"
            disabled={!isSettingsFormComplete()}
            onClick={() => setStep(2)}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${
              step === 2 
                ? 'bg-[#0B7A93] text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-900'
            } ${
              !isSettingsFormComplete() 
                ? 'opacity-40 cursor-not-allowed hover:text-slate-400' 
                : ''
            }`}
          >
            2. Sections & Questions ({countTotalQuestions()})
          </button>
        </div>
      </div>

      {/* STEP 1: EXAM PARAMETERS DISPLAY */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Exam Title *</label>
              <input 
                type="text" 
                placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                value={examData.title}
                onChange={(e) => setExamData({...examData, title: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Instructions / Description</label>
              <textarea 
                rows={3}
                placeholder="Detail academic honor codes, workspace configuration parameters, etc..."
                value={examData.description}
                onChange={(e) => setExamData({...examData, description: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Assigned Department</label>
              <select 
                value={examData.department}
                onChange={(e) => setExamData({...examData, department: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#0B7A93]"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Academic Year</label>
              <input 
                type="text" 
                placeholder="e.g., 2026-2027"
                value={examData.academicYear}
                onChange={(e) => setExamData({...examData, academicYear: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Semester</label>
              <select 
                value={examData.semester}
                onChange={(e) => setExamData({...examData, semester: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#0B7A93]"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Duration (Minutes) *</label>
              <input 
                type="number" 
                min="1"
                value={examData.duration}
                onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 0})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#0B7A93]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Start Window *</label>
                <input 
                  type="datetime-local" 
                  value={examData.startDate}
                  onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Close Window *</label>
                <input 
                  type="datetime-local" 
                  value={examData.endDate}
                  onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="templateToggle"
                checked={examData.saveAsTemplate}
                onChange={(e) => setExamData({...examData, saveAsTemplate: e.target.checked})}
                className="w-4 h-4 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93]"
              />
              <label htmlFor="templateToggle" className="text-xs font-bold text-slate-600 cursor-pointer">
                Save this Exam configuration as a Template for future reuse
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={handleSaveDraft} className="px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">
              Save as Draft
            </button>
            <button 
              type="button"
              onClick={() => {
                if (isSettingsFormComplete()) {
                  setStep(2);
                } else {
                  alert("Please ensure all mandatory parameter configurations marked with (*) are filled accurately.");
                }
              }} 
              className="px-8 py-3.5 bg-[#0B7A93] text-white text-xs font-bold rounded-xl hover:bg-[#09667c] transition-all"
            >
              Continue to Question Setup
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MULTI-PART QUESTION COMPOSER MATRIX */}
      {step === 2 && (
        <div className="space-y-8">

          {/* BLOCK A: SECTIONAL CREATOR & TABS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">1. Sectional Structural Hierarchy Blueprint</h3>
            
            <form onSubmit={handleCreatePart} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Section/Part Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Part A: Multiple Choice Questions"
                  value={newPartTitle}
                  onChange={(e) => setNewPartTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Section Question Format Rule</label>
                <select 
                  value={newPartType}
                  onChange={(e) => setNewPartType(e.target.value as QuestionType)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#0B7A93]"
                >
                  <option value="mcq">Multiple Choice (QCM)</option>
                  <option value="true_false">True / False Profile</option>
                  <option value="multi_select">Multiple Select Bounds</option>
                  <option value="short_answer">Short Literal Answer</option>
                  <option value="essay">Essay / Long Form Response</option>
                  <option value="coding">Isolated Code Sandbox</option>
                  <option value="fill_blank">Fill in the Blanks</option>
                  <option value="matching">Matching Identity Pairs</option>
                  <option value="ordering">Sequence Order Stack</option>
                  <option value="numeric">Strict Numeric Value</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Marks</label>
                <input 
                  type="text" 
                  placeholder="20"
                  value={newPartMarks}
                  onChange={(e) => setNewPartMarks(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-3 text-xs text-center focus:outline-none focus:border-[#0B7A93]"
                />
              </div>
              <div className="md:col-span-3">
                <button type="submit" className="w-full bg-[#0d1527] text-white font-bold text-xs py-3.5 px-4 rounded-xl hover:bg-[#1a253d] transition-all">
                  + Append Section
                </button>
              </div>
            </form>

            {/* SECTION SELECTOR TABS */}
            <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-5 items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Active Sections:</span>
              {parts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePartId(p.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                    activePartId === p.id 
                      ? 'bg-[#0B7A93] text-white border-[#0B7A93] shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p.title} <span className="opacity-75 font-mono ml-1">({p.questions.length})</span>
                </button>
              ))}
              {parts.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const fallback = { ...DEFAULT_INITIAL_PART, id: Date.now().toString() };
                    setParts([fallback]);
                    setActivePartId(fallback.id);
                  }}
                  className="text-xs font-bold text-[#0B7A93] hover:underline"
                >
                  + Add Default Section
                </button>
              )}
            </div>
          </div>

          {/* BLOCK B: HIGH-FIDELITY BUILDER FORM FOR ACTIVE SECTION */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-[10px] bg-teal-50 text-[#0B7A93] px-3 py-1 rounded-md font-black uppercase tracking-wider">
                  Target Section: {parts.find(p => p.id === activePartId)?.title || "Section A"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Add Question to Section</h3>
              </div>
              
              <div className="flex flex-col items-end">
                <select 
                  value={qType}
                  onChange={(e) => setQType(e.target.value as QuestionType)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#0B7A93]"
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="multi_select">Multiple Select</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay / Long Answer</option>
                  <option value="coding">Coding Sandbox</option>
                  <option value="fill_blank">Fill in the Blank</option>
                  <option value="matching">Matching Pairs</option>
                  <option value="ordering">Ordering Stack</option>
                  <option value="numeric">Numeric Value</option>
                </select>
              </div>
            </div>

            {/* COMMON FIELDS CONFIG MATRIX */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Marks Metric</label>
                <input 
                  type="number" 
                  value={qMarks}
                  onChange={(e) => setQMarks(parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#0B7A93]"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-600">
                  <input 
                    type="checkbox" 
                    checked={qMandatory} 
                    onChange={(e) => setQMandatory(e.target.checked)} 
                    className="w-4 h-4 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93]" 
                  />
                  Mandatory Flag
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Media Attachment</label>
                <select 
                  value={qMediaType} 
                  onChange={(e) => setQMediaType(e.target.value as any)} 
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#0B7A93]"
                >
                  <option value="none">No Media</option>
                  <option value="image">Image Attachment</option>
                  <option value="audio">Audio Prompt</option>
                  <option value="video">Video Reel</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Media URL</label>
                <input 
                  type="text" 
                  disabled={qMediaType === 'none'}
                  placeholder="https://..."
                  value={qMediaUrl}
                  onChange={(e) => setQMediaUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>

            {/* QUESTION TEXT */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Question Text Prompt *</label>
              <textarea 
                rows={3}
                placeholder={`Formulate your ${qType.replace('_', ' ').toUpperCase()} question prompt here...`}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
              />
            </div>

            {/* DYNAMIC FIELDS PER QUESTION TYPE */}
            <div className="border-t border-dashed border-slate-100 pt-6">
              {qType === 'mcq' && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Multiple Choice Options Grid (Select Correct Option)</label>
                  <div className="space-y-3">
                    {mcqOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <button 
                          type="button" 
                          onClick={() => setMcqCorrect(i)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            mcqCorrect === i 
                              ? 'border-[#0B7A93] bg-[#0B7A93]/10 text-[#0B7A93]' 
                              : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {mcqCorrect === i && <span className="w-2.5 h-2.5 rounded-full bg-[#0B7A93]" />}
                        </button>
                        
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={(e) => { 
                            const c = [...mcqOptions]; 
                            c[i] = e.target.value; 
                            setMcqOptions(c); 
                          }} 
                          className={`flex-grow border rounded-xl px-4 py-3 text-xs focus:outline-none transition-all ${
                            mcqCorrect === i 
                              ? 'border-[#0B7A93] ring-1 ring-[#0B7A93]' 
                              : 'border-slate-200 focus:border-[#0B7A93]'
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
                    className="text-xs font-bold text-[#0B7A93] hover:underline block mt-2"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {qType === 'true_false' && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Correct Answer</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setTfCorrect(true)} className={`px-8 py-3.5 border rounded-xl text-xs font-bold transition-all ${tfCorrect ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' : 'border-slate-200 text-slate-600'}`}>True</button>
                    <button type="button" onClick={() => setTfCorrect(false)} className={`px-8 py-3.5 border rounded-xl text-xs font-bold transition-all ${!tfCorrect ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' : 'border-slate-200 text-slate-600'}`}>False</button>
                  </div>
                </div>
              )}

              {qType === 'multi_select' && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Multiple Select Options (Check all correct)</label>
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
                          className="w-4 h-4 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93]"
                        />
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const o = [...multiOptions];
                            o[i] = e.target.value;
                            setMultiOptions(o);
                          }}
                          className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
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
                    className="text-xs font-bold text-[#0B7A93] hover:underline block mt-2"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {qType === 'short_answer' && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Accepted Answers</label>
                  {shortAnswers.map((ans, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input 
                        type="text"
                        placeholder="Accepted answer phrase..."
                        value={ans}
                        onChange={(e) => {
                          const s = [...shortAnswers];
                          s[i] = e.target.value;
                          setShortAnswers(s);
                        }}
                        className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                      />
                      <button 
                        type="button"
                        onClick={() => setShortAnswers(shortAnswers.filter((_, idx) => idx !== i))}
                        disabled={shortAnswers.length <= 1}
                        className="text-xs text-rose-500 font-bold hover:underline disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setShortAnswers([...shortAnswers, ''])}
                    className="text-xs font-bold text-[#0B7A93] hover:underline block mt-1"
                  >
                    + Add Alternative Answer
                  </button>
                </div>
              )}

              {qType === 'essay' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Minimum Words</label>
                    <input 
                      type="number"
                      value={essayMinMax.min}
                      onChange={(e) => setEssayMinMax({ ...essayMinMax, min: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Maximum Words</label>
                    <input 
                      type="number"
                      value={essayMinMax.max}
                      onChange={(e) => setEssayMinMax({ ...essayMinMax, max: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* EXPLANATION / SOLUTION NOTES */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Feedback / Answer Explanation</label>
              <input 
                type="text"
                placeholder="Explanatory notes shown during review..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
              />
            </div>

            {/* ACTIONS FOR QUESTION COMPOSER */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => {
                  setQText('');
                  setQExplanation('');
                  setQMediaType('none');
                  setQMediaUrl('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Clear Form
              </button>
              <button 
                type="button"
                onClick={handleAddQuestionToPart}
                className="px-6 py-3 bg-[#0d1527] text-white font-bold text-xs rounded-xl hover:bg-[#1a253d] transition-all shadow-sm"
              >
                + Add Question to Section
              </button>
            </div>
          </div>

          {/* BLOCK C: LIVE ALL QUESTIONS INSPECTOR PANEL */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">All Exam Questions ({countTotalQuestions()})</h3>
                <p className="text-slate-400 text-xs mt-0.5">Complete list of all questions created across all sections.</p>
              </div>
              <span className="text-xs font-bold bg-teal-50 text-[#0B7A93] px-3 py-1.5 rounded-lg border border-teal-100">
                Total Score: {parts.reduce((acc, p) => acc + p.questions.reduce((qAcc, q) => qAcc + q.marks, 0), 0)} pts
              </span>
            </div>

            {countTotalQuestions() === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">No questions added yet. Use the composer form above to add your first question.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {parts.map((part) => (
                  <div key={part.id} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/30 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-[#0B7A93] text-white px-2.5 py-1 rounded-md">
                          {part.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Type: {part.allowedType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{part.questions.length} questions</span>
                    </div>

                    {part.questions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No questions inside this section yet.</p>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {part.questions.map((q, idx) => (
                          <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1.5 flex-grow">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800">Q{idx + 1}.</span>
                                <span className="text-xs font-bold text-slate-900">{q.text}</span>
                              </div>

                              {/* MCQ Render preview */}
                              {q.type === 'mcq' && q.mcqOptions && (
                                <div className="grid grid-cols-2 gap-1.5 pl-6 pt-1">
                                  {q.mcqOptions.map((opt, oIdx) => (
                                    <div key={oIdx} className={`text-[11px] px-2.5 py-1 rounded-md border ${oIdx === q.mcqCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                      {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.mcqCorrect && '✓'}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* True/False Render preview */}
                              {q.type === 'true_false' && (
                                <p className="text-[11px] text-emerald-700 font-bold pl-6">
                                  Correct Answer: {q.tfCorrect ? 'True' : 'False'}
                                </p>
                              )}
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2 shrink-0">
                              <span className="text-xs font-black text-[#0B7A93] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
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
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* GLOBAL PIPELINE CONTROLS */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setStep(1)} 
                className="px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all mr-auto"
              >
                ← Back to Settings Params
              </button>
              <button 
                type="button"
                onClick={() => router.push('/teacher/exams')} 
                className="px-6 py-3 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handlePublish}
                className="px-8 py-3.5 bg-[#0B7A93] text-white text-xs font-bold rounded-xl hover:bg-[#09667c] transition-all shadow-md"
              >
                Deploy Exam Architecture
              </button>
            </div>
          </div>

        </div>
      )}

      {/* POST-LAUNCH SUCCESS OVERLAY MODAL */}
      {isLaunched && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-[#0B7A93]/10 text-[#0B7A93] rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">Exam Live & Active</h3>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">
                Provide students with this unique 6-character access code to join the assessment.
              </p>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Student Access Code
              </span>
              <span className="text-4xl font-black font-mono tracking-widest text-[#0D1527] select-all">
                {accessCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`mt-1 text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  isCopied
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isCopied ? "Copied to Clipboard!" : "Copy Access Code"}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsLaunched(false);
                  router.push('/teacher/exams');
                }}
                className="w-full bg-[#0B7A93] hover:bg-[#09667c] text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-sm"
              >
                Done & View All Exams
              </button>
            </div>
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