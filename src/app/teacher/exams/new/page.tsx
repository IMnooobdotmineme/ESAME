"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function CreateExamPage() {
  const router = useRouter();
  
  // FORCE STEP 1 LANDING AS DEFAULT
  const [step, setStep] = useState<1 | 2>(1); 

  // --- STEP 1: EXAM PARAMETERS STATE (CLEAN & UNFILLED FOR EXPLICIT VALIDATION) ---
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    department: 'Computer Science',
    subject: '',
    academicYear: '2026-2027',
    semester: 'Semester 1',
    duration: 60,
    startDate: '',
    endDate: '',
    saveAsTemplate: false,
  });

  // --- STEP 2: MULTI-PART EXAM STRUCTURE STATE ---
  const [parts, setParts] = useState<ExamPart[]>([]);
  const [activePartId, setActivePartId] = useState<string>('');
  
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

  // Sync builder layout whenever the active section layout shifts
  useEffect(() => {
    const currentActivePart = parts.find(p => p.id === activePartId);
    if (currentActivePart) {
      setQType(currentActivePart.allowedType);
    }
  }, [activePartId, parts]);

  // --- WORKFLOW STEP 1 PARAMETER VALIDATION CHECK ---
  const isSettingsFormComplete = () => {
    return (
      examData.title.trim() !== '' &&
      examData.subject.trim() !== '' &&
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

    setParts([...parts, newPart]);
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

    setParts(parts.map(part => {
      if (part.id === activePartId) {
        return { ...part, questions: [...part.questions, newQuestion] };
      }
      return part;
    }));

    // Reset layout builder text blocks but preserve structure configuration types
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
    
    alert("Question committed and indexed under active section rule bounds!");
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
      alert("Please construct at least one question within your exam parts layout configuration before deployment.");
      return;
    }

    const finalExam = {
      id: Date.now().toString(),
      title: examData.title || "Untitled Assessment Session",
      course: examData.subject,
      duration: `${examData.duration} mins`,
      questions: totalQCount,
      code: `${examData.subject.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      date: examData.startDate ? new Date(examData.startDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Jul 16, 2026',
      students: '0/0',
      isTemplate: examData.saveAsTemplate
    };

    const rawData = localStorage.getItem('localExamsData');
    const defaultData = { active: [], scheduled: [], completed: [] };
    const currentExams = rawData ? JSON.parse(rawData) : defaultData;

    currentExams.scheduled = [finalExam, ...currentExams.scheduled];
    localStorage.setItem('localExamsData', JSON.stringify(currentExams));

    alert(`Successfully deployed exam sheet! System Join Code generated: ${finalExam.code}`);
    router.push('/teacher/exams');
  };

  const handleSaveDraft = () => {
    alert("Exam sheet hierarchy successfully committed to active draft repository.");
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
            title={!isSettingsFormComplete() ? "Complete all required settings parameters to unlock this section" : ""}
          >
            2. Sections & Questions
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Subject / Course Code *</label>
              <input 
                type="text" 
                placeholder="e.g., CS101"
                value={examData.subject}
                onChange={(e) => setExamData({...examData, subject: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
                required
              />
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

            <div className="grid grid-cols-2 gap-4">
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
                  alert("Please ensure all mandatory parameter configurations marked with (*) are filled accurately (Title, Course Code, Duration, and Timetable windows) before moving forward.");
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

          {/* BLOCK A: SECTIONAL SECTION CREATOR */}
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

            {/* SEGMENTED TAB SELECTOR INDEX */}
            {parts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-100 pt-5">
                {parts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePartId(p.id)}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all border ${
                      activePartId === p.id 
                        ? 'bg-[#0B7A93] text-white border-[#0B7A93] shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.title} <span className="opacity-60 ml-1">({p.allowedType.replace('_', ' ').toUpperCase()})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DYNAMIC LAYOUT SWITCHER: EMPTY STATE vs FORM SPECIFICATION VIEW */}
          {parts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm max-w-5xl mx-auto flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 text-lg">
                📋
              </div>
              <h4 className="text-sm font-bold text-slate-700">No Exam Sections Defined Yet</h4>
              <p className="text-xs text-slate-400 max-w-md">
                Create your first customized exam segment above using the <strong>Blueprint</strong> matrix to instantly unlock your isolated question sheets.
              </p>
            </div>
          ) : (
            <>
              {/* BLOCK B: HIGH-FIDELITY BUILDER SHEET FOR ACTIVE SELECTION */}
              <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-[10px] bg-teal-50 text-[#0B7A93] px-3 py-1 rounded-md font-black uppercase tracking-wider">
                      Target Destination: {parts.find(p => p.id === activePartId)?.title}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">Configure Question Specifications</h3>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <select 
                      value={qType}
                      disabled // LOCKED DOWN - Cannot change question type outside section schema rules!
                      className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 outline-none cursor-not-allowed border-dashed"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="multi_select">Multiple Select</option>
                      <option value="true_false">True / False</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="essay">Essay / Long Answer</option>
                      <option value="coding">Coding Sandbox</option>
                      <option value="fill_blank">Fill in the Blank</option>
                      <option value="matching">Matching Pairs</option>
                      <option value="ordering">Ordering Stack</option>
                      <option value="numeric">Numeric Value</option>
                    </select>
                    <span className="text-[9px] font-black text-[#0B7A93] uppercase tracking-wider mt-1.5 italic">Locked to section type setup</span>
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
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Media Core Mode</label>
                    <select 
                      value={qMediaType} 
                      onChange={(e) => setQMediaType(e.target.value as any)} 
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#0B7A93]"
                    >
                      <option value="none">No Media Attachment</option>
                      <option value="image">Attach Image Matrix</option>
                      <option value="audio">Attach Audio Prompt</option>
                      <option value="video">Attach Video Reel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Resource URL</label>
                    <input 
                      type="text" 
                      disabled={qMediaType === 'none'}
                      placeholder="https://domain.com/asset.mp4"
                      value={qMediaUrl}
                      onChange={(e) => setQMediaUrl(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                {/* QUERY BLOCK */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Question Text Prompt</label>
                  <textarea 
                    rows={3}
                    placeholder={`Formulate your structural ${qType.replace('_', ' ').toUpperCase()} text template question...`}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
                  />
                </div>

                {/* DYNAMIC ADAPTIVE FIELDS BLOCK */}
                <div className="border-t border-dashed border-slate-100 pt-6">
                  
                  {qType === 'mcq' && (
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Multiple Choice Options Grid (QCM)</label>
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
                        + Append Grid Node
                      </button>
                    </div>
                  )}

                  {qType === 'true_false' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Assign Solution Identity</label>
                      <div className="flex gap-4">
                        <button type="button" onClick={() => setTfCorrect(true)} className={`px-8 py-3.5 border rounded-xl text-xs font-bold transition-all ${tfCorrect ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' : 'border-slate-200 text-slate-600'}`}>True</button>
                        <button type="button" onClick={() => setTfCorrect(false)} className={`px-8 py-3.5 border rounded-xl text-xs font-bold transition-all ${!tfCorrect ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' : 'border-slate-200 text-slate-600'}`}>False</button>
                      </div>
                    </div>
                  )}

                  {qType === 'multi_select' && (
                    <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Multiple Selection Bounds Matrix</label>
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
                        + Append Grid Node
                      </button>
                    </div>
                  )}

                  {qType === 'short_answer' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Accepted Literal Match Criteria</label>
                      {shortAnswers.map((ans, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <input 
                            type="text"
                            placeholder="Accepted evaluation parsing phrase value..."
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
                        + Append Alternative Matching Formula
                      </button>
                    </div>
                  )}

                  {qType === 'essay' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Minimum Character Count</label>
                        <input 
                          type="number"
                          value={essayMinMax.min}
                          onChange={(e) => setEssayMinMax({ ...essayMinMax, min: parseInt(e.target.value) || 0 })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Maximum Character Count</label>
                        <input 
                          type="number"
                          value={essayMinMax.max}
                          onChange={(e) => setEssayMinMax({ ...essayMinMax, max: parseInt(e.target.value) || 0 })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                        />
                      </div>
                    </div>
                  )}

                  {qType === 'coding' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Target Sandbox Language</label>
                        <select 
                          value={codingLang}
                          onChange={(e) => setCodingLang(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#0B7A93]"
                        >
                          <option value="python">Python</option>
                          <option value="javascript">JavaScript</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Starter Code Template</label>
                        <textarea 
                          rows={4}
                          placeholder="# Write your initialization code boilerplate here..."
                          value={codingStarter}
                          onChange={(e) => setCodingStarter(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#0B7A93]"
                        />
                      </div>
                    </div>
                  )}

                  {qType === 'fill_blank' && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Sentence Blueprint Configuration</label>
                      <input 
                        type="text"
                        value={blanksText}
                        onChange={(e) => setBlanksText(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">Use brackets like <code>[blank1]</code> to anchor system parsers to custom input states.</span>
                    </div>
                  )}

                  {qType === 'matching' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Identity Pairs Association Matrix</label>
                      {matchingPairs.map((pair, i) => (
                        <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-5">
                            <input 
                              type="text"
                              placeholder="Left Term (Premise)"
                              value={pair.left}
                              onChange={(e) => {
                                const m = [...matchingPairs];
                                m[i].left = e.target.value;
                                setMatchingPairs(m);
                              }}
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                            />
                          </div>
                          <div className="sm:col-span-1 text-center font-bold text-slate-400 text-xs">=</div>
                          <div className="sm:col-span-5">
                            <input 
                              type="text"
                              placeholder="Right Term (Target Match)"
                              value={pair.right}
                              onChange={(e) => {
                                const m = [...matchingPairs];
                                m[i].right = e.target.value;
                                setMatchingPairs(m);
                              }}
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                            />
                          </div>
                          <div className="sm:col-span-1 text-right">
                            <button 
                              type="button"
                              onClick={() => setMatchingPairs(matchingPairs.filter((_, idx) => idx !== i))}
                              disabled={matchingPairs.length <= 1}
                              className="text-xs text-rose-500 font-bold hover:underline disabled:opacity-30"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => setMatchingPairs([...matchingPairs, { left: '', right: '' }])}
                        className="text-xs font-bold text-[#0B7A93] hover:underline block mt-1"
                      >
                        + Append Identity Pair Row
                      </button>
                    </div>
                  )}

                  {qType === 'ordering' && (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Sequence Order Stack (Correct Top-Down Order)</label>
                      {orderingItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-400 w-4">{i + 1}.</span>
                          <input 
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const o = [...orderingItems];
                              o[i] = e.target.value;
                              setOrderingItems(o);
                            }}
                            className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                          />
                          <button 
                            type="button"
                            onClick={() => setOrderingItems(orderingItems.filter((_, idx) => idx !== i))}
                            disabled={orderingItems.length <= 2}
                            className="text-xs text-rose-500 font-bold hover:underline disabled:opacity-30"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => setOrderingItems([...orderingItems, `Item ${orderingItems.length + 1}`])}
                        className="text-xs font-bold text-[#0B7A93] hover:underline block mt-1"
                      >
                        + Append Sequence Item Node
                      </button>
                    </div>
                  )}

                  {qType === 'numeric' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Exact Solution Value</label>
                        <input 
                          type="number"
                          value={numericAnswer.val}
                          onChange={(e) => setNumericAnswer({ ...numericAnswer, val: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Accepted Tolerance (±)</label>
                        <input 
                          type="number"
                          value={numericAnswer.tolerance}
                          onChange={(e) => setNumericAnswer({ ...numericAnswer, tolerance: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Unit Descriptor Label</label>
                        <input 
                          type="text"
                          placeholder="e.g., kg, m/s, %"
                          value={numericAnswer.unit}
                          onChange={(e) => setNumericAnswer({ ...numericAnswer, unit: e.target.value })}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#0B7A93]"
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* EXPLANATION / SOLUTION NOTES */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Post-Release Solutions Assessment Explanatory Feedback Notes</label>
                  <input 
                    type="text"
                    placeholder="Explanatory evaluation guidelines visible during distributions..."
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
                    Clear Workspace Configuration
                  </button>
                  <button 
                    type="button"
                    onClick={handleAddQuestionToPart}
                    className="px-6 py-2.5 bg-[#0d1527] text-white font-bold text-xs rounded-xl hover:bg-[#1a253d] transition-all"
                  >
                    Save & Commit Question
                  </button>
                </div>
              </div>

              {/* BLOCK C: SUMMARY PIPELINE DECK */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Exam Questionnaire Pipeline Deck Summary</h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">Hierarchical structural breakdown view of currently built sections.</p>
                </div>

                <div className="space-y-4">
                  {parts.map((part) => (
                    <div key={part.id} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{part.title}</h4>
                          <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Strict Format Constraint: {part.allowedType.replace('_', ' ').toUpperCase()}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-md">
                          {part.questions.length} Items Total
                        </span>
                      </div>

                      {part.questions.length > 0 && (
                        <div className="space-y-2 pl-3 border-l border-slate-200 mt-2">
                          {part.questions.map((q, idx) => (
                            <div key={q.id} className="text-xs bg-white p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                              <span className="text-slate-600 font-medium">Q{idx + 1}: {q.text.substring(0, 60)}{q.text.length > 60 ? '...' : ''}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-bold text-[10px]">{q.marks} pts</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteQuestion(part.id, q.id)}
                                  className="text-rose-500 font-bold hover:underline text-[10px]"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

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
                    Abort Project
                  </button>
                  <button 
                    type="button"
                    onClick={handlePublish}
                    className="px-8 py-3.5 bg-[#0B7A93] text-white text-xs font-bold rounded-xl hover:bg-[#09667c] transition-all shadow-md"
                  >
                    Deploy Full Exam Architecture
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}