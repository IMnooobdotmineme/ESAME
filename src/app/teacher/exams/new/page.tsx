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
  const [step, setStep] = useState<1 | 2>(2); 

  // --- STEP 1: EXAM PARAMETERS STATE ---
  const [examData, setExamData] = useState({
    title: 'CS101 Introduction to Computer Science (Midterm)',
    description: 'Detail academic honor codes, workspace configuration parameters, etc...',
    department: 'Computer Science',
    subject: 'CS101',
    academicYear: '2026-2027',
    semester: 'Semester 1',
    duration: 60,
    startDate: '',
    endDate: '',
    saveAsTemplate: false,
  });

  // --- STEP 2: MULTI-PART EXAM STRUCTURE STATE ---
  const [parts, setParts] = useState<ExamPart[]>([
    {
      id: 'part-1',
      title: 'Part A: Multiple Choice Questions (QCM)',
      marks: 50,
      description: 'Select the single most correct answer for each query.',
      allowedType: 'mcq', // Strictly limits this section to MCQ formats
      questions: []
    }
  ]);
  const [activePartId, setActivePartId] = useState<string>('part-1');
  
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

        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
          <button 
            onClick={() => setStep(1)}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${step === 1 ? 'bg-[#0B7A93] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            1. Settings
          </button>
          <button 
            onClick={() => examData.title ? setStep(2) : alert("Please input the Exam Title to continue!")}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all ${step === 2 ? 'bg-[#0B7A93] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Exam Title</label>
              <input 
                type="text" 
                placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                value={examData.title}
                onChange={(e) => setExamData({...examData, title: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Subject / Course Code</label>
              <input 
                type="text" 
                placeholder="e.g., CS101"
                value={examData.subject}
                onChange={(e) => setExamData({...examData, subject: e.target.value})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Duration (Minutes)</label>
              <input 
                type="number" 
                value={examData.duration}
                onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 60})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#0B7A93]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Start Window</label>
                <input 
                  type="datetime-local" 
                  value={examData.startDate}
                  onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Close Window</label>
                <input 
                  type="datetime-local" 
                  value={examData.endDate}
                  onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93]"
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
            <button onClick={handleSaveDraft} className="px-6 py-3 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">
              Save as Draft
            </button>
            <button onClick={() => setStep(2)} className="px-8 py-3.5 bg-[#0B7A93] text-white text-xs font-bold rounded-xl hover:bg-[#09667c] transition-all">
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
                  placeholder="e.g., Part B: True or False Items"
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
          </div>

          {/* BLOCK B: HIGH-FIDELITY BUILDER SHEET FOR ACTIVE SELECTION */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
            
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
                          onChange={(e) => { const c = [...multiCorrect]; c[i] = e.target.checked; setMultiCorrect(c); }} 
                          className="w-5 h-5 rounded text-[#0B7A93] border-slate-300" 
                        />
                        <input 
                          type="text" 
                          value={opt} 
                          onChange={(e) => { const c = [...multiOptions]; c[i] = e.target.value; setMultiOptions(c); }} 
                          className="flex-grow border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-[#0B7A93]" 
                        />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => { setMultiOptions([...multiOptions, `Option ${String.fromCharCode(65 + multiOptions.length)}`]); setMultiCorrect([...multiCorrect, false]); }} className="text-xs font-bold text-[#0B7A93] hover:underline block mt-2">+ Append Multi Grid Choice</button>
                </div>
              )}

              {qType === 'short_answer' && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Evaluated Literal Match Criteria</label>
                  <div className="space-y-3">
                    {shortAnswers.map((ans, i) => (
                      <input key={i} type="text" placeholder="Accepted evaluation parsing phrase value..." value={ans} onChange={(e) => { const c = [...shortAnswers]; c[i] = e.target.value; setShortAnswers(c); }} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-[#0B7A93]" />
                    ))}
                  </div>
                  <button type="button" onClick={() => setShortAnswers([...shortAnswers, ''])} className="text-xs font-bold text-[#0B7A93] hover:underline block mt-1">+ Append Alternative Matching Formula</button>
                </div>
              )}

              {qType === 'essay' && (
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Minimum Characters Bounds</label>
                    <input type="number" value={essayMinMax.min} onChange={(e) => setEssayMinMax({...essayMinMax, min: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:border-[#0B7A93]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Maximum Characters Bounds</label>
                    <input type="number" value={essayMinMax.max} onChange={(e) => setEssayMinMax({...essayMinMax, max: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:border-[#0B7A93]" />
                  </div>
                </div>
              )}

              {qType === 'coding' && (
                <div className="space-y-4">
                  <div className="max-w-xs">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Compiler Execution Profile</label>
                    <select value={codingLang} onChange={(e) => setCodingLang(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:border-[#0B7A93]">
                      <option value="python">Python 3.x Environment</option>
                      <option value="javascript">JavaScript (NodeJS Runtime)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Starter Template Code block</label>
                    <textarea rows={4} placeholder="def execute_solution():" value={codingStarter} onChange={(e) => setCodingStarter(e.target.value)} className="w-full font-mono text-xs bg-[#0d1527] text-teal-400 p-4 rounded-xl outline-none" />
                  </div>
                </div>
              )}

              {qType === 'fill_blank' && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Evaluated Question Blueprint Phrase string</label>
                  <input type="text" value={blanksText} onChange={(e) => setBlanksText(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-[#0B7A93]" />
                </div>
              )}

              {qType === 'matching' && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Formulate Solution Map Link Pairs</label>
                  <div className="space-y-2">
                    {matchingPairs.map((pair, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <input type="text" value={pair.left} onChange={(e) => { const c = [...matchingPairs]; c[idx].left = e.target.value; setMatchingPairs(c); }} placeholder="Left Segment Node" className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:border-[#0B7A93]" />
                        <span className="text-slate-300">➔</span>
                        <input type="text" value={pair.right} onChange={(e) => { const c = [...matchingPairs]; c[idx].right = e.target.value; setMatchingPairs(c); }} placeholder="Right Target Reference" className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:border-[#0B7A93]" />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setMatchingPairs([...matchingPairs, { left: '', right: '' }])} className="text-xs font-bold text-[#0B7A93] hover:underline block mt-1">+ Append Link Target Pair</button>
                </div>
              )}

              {qType === 'ordering' && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Sequence Sorting indexes</label>
                  <div className="space-y-2">
                    {orderingItems.map((item, idx) => (
                      <input key={idx} type="text" value={item} onChange={(e) => { const c = [...orderingItems]; c[idx] = e.target.value; setOrderingItems(c); }} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-[#0B7A93]" />
                    ))}
                  </div>
                  <button type="button" onClick={() => setOrderingItems([...orderingItems, `Item ${orderingItems.length + 1}`])} className="text-xs font-bold text-[#0B7A93] hover:underline block mt-1">+ Append Sorting Node</button>
                </div>
              )}

              {qType === 'numeric' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Float Target</label>
                    <input type="number" value={numericAnswer.val} onChange={(e) => setNumericAnswer({...numericAnswer, val: parseFloat(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:border-[#0B7A93]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Tolerance Margin (±)</label>
                    <input type="number" value={numericAnswer.tolerance} onChange={(e) => setNumericAnswer({...numericAnswer, tolerance: parseFloat(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:border-[#0B7A93]" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Unit Signage String</label>
                    <input type="text" placeholder="e.g., Pascal" value={numericAnswer.unit} onChange={(e) => setNumericAnswer({...numericAnswer, unit: e.target.value})} className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:border-[#0B7A93]" />
                  </div>
                </div>
              )}

            </div>

            {/* FEEDBACK FIELD */}
            <div className="border-t border-slate-100 pt-5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Post-Release Solutions Assessment Explanatory Feedback Notes</label>
              <input 
                type="text" 
                placeholder="Explanatory evaluation guidelines visible during distributions..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
              />
            </div>

            {/* ACTIONS BAR */}
            <div className="flex justify-end items-center gap-6 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setQText(''); setQExplanation(''); }} 
                className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-all"
              >
                Clear Workspace Configuration
              </button>
              <button 
                type="button"
                onClick={handleAddQuestionToPart} 
                className="px-6 py-3 bg-[#0d1527] text-white hover:bg-[#1a253d] text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Save & Commit Question
              </button>
            </div>
          </div>

          {/* BLOCK C: ACCORDION QUESTION DECK GROUPED BY EXAM PARTS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Exam Questionnaire Pipeline Deck Summary</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Hierarchical structural breakdown view of currently built sections.</p>
            </div>

            <div className="space-y-6">
              {parts.map((part) => (
                <div key={part.id} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Part Title Header strip */}
                  <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">{part.title}</h5>
                      <p className="text-[10px] text-[#0B7A93] font-bold mt-1 uppercase tracking-wider">
                        Strict Format Constraint: {part.allowedType.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="bg-slate-200/60 text-slate-700 font-bold px-3 py-1 rounded-md text-[10px] uppercase tracking-wider">
                      {part.questions.length} Items Total
                    </span>
                  </div>

                  {/* Inside Questions index rendering list */}
                  <div className="p-5 bg-white divide-y divide-slate-100 space-y-4">
                    {part.questions.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-3 italic">No questions mapped inside this section type constraint parameters tree yet...</p>
                    ) : (
                      part.questions.map((q, idx) => (
                        <div key={q.id} className="pt-4 first:pt-0">
                          <div className="flex justify-between items-start text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-900 block">Q{idx + 1}: {q.text}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                Format: {q.type.replace('_', ' ')} • Weight Allocation: {q.marks} Marks • {q.isMandatory ? 'Mandatory Field' : 'Optional Condition'}
                              </span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleDeleteQuestion(part.id, q.id)}
                              className="text-xs font-bold text-rose-500 hover:underline px-2"
                            >
                              Delete
                            </button>
                          </div>

                          {/* DYNAMIC SOLUTION DISPLAY AT BOTTOM */}
                          <div className="mt-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2">
                            
                            {/* MCQ PREVIEW */}
                            {q.type === 'mcq' && q.mcqOptions && (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Configured Multiple Choice Answers (QCM):</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.mcqOptions.map((opt, i) => (
                                    <div key={i} className={`flex items-center gap-2 p-2 px-3 rounded-lg border text-xs ${
                                      q.mcqCorrect === i 
                                        ? 'bg-[#0B7A93]/5 border-[#0B7A93]/20 text-[#0B7A93] font-bold' 
                                        : 'bg-white border-slate-200/60 text-slate-500'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${q.mcqCorrect === i ? 'bg-[#0B7A93]' : 'bg-slate-300'}`} />
                                      {opt}
                                      {q.mcqCorrect === i && <span className="text-[9px] font-black ml-auto uppercase tracking-wider text-[#0B7A93]">Correct Choice</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* TRUE/FALSE PREVIEW */}
                            {q.type === 'true_false' && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Correct Identity:</span>
                                <span className="font-black text-[#0B7A93] uppercase bg-[#0B7A93]/10 border border-[#0B7A93]/10 px-2.5 py-0.5 rounded-md text-[10px]">
                                  {q.tfCorrect ? 'True' : 'False'}
                                </span>
                              </div>
                            )}

                            {/* MULTI_SELECT PREVIEW */}
                            {q.type === 'multi_select' && q.multiOptions && (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Solution Selection Bounds:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.multiOptions.map((opt, i) => {
                                    const isCorrect = q.multiCorrect?.[i];
                                    return (
                                      <div key={i} className={`flex items-center gap-2 p-2 px-3 rounded-lg border text-xs ${
                                        isCorrect ? 'bg-[#0B7A93]/5 border-[#0B7A93]/20 text-[#0B7A93] font-bold' : 'bg-white border-slate-200/60 text-slate-400'
                                      }`}>
                                        <span className={`w-3.5 h-3.5 flex items-center justify-center rounded text-[10px] ${isCorrect ? 'bg-[#0B7A93] text-white' : 'border border-slate-300'}`}>
                                          {isCorrect && '✓'}
                                        </span>
                                        {opt}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* SHORT ANSWER PREVIEW */}
                            {q.type === 'short_answer' && q.shortAnswers && (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Evaluated Match Criteria:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {q.shortAnswers.map((ans, i) => (
                                    <span key={i} className="bg-white border border-slate-200/60 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-bold shadow-sm">"{ans}"</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ESSAY PREVIEW */}
                            {q.type === 'essay' && q.essayMinMax && (
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Restrictions:</span>
                                <span className="font-semibold text-slate-700">Min. {q.essayMinMax.min} words — Max. {q.essayMinMax.max} words.</span>
                              </div>
                            )}

                            {/* CODING PREVIEW */}
                            {q.type === 'coding' && (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Runtime Environment:</span>
                                  <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded">{q.codingLang}</span>
                                </div>
                                {q.codingStarter && (
                                  <pre className="text-[10px] font-mono bg-[#0d1527] text-teal-400 p-3 rounded-xl max-h-24 overflow-y-auto">{q.codingStarter}</pre>
                                )}
                              </div>
                            )}

                            {/* MATCHING PREVIEW */}
                            {q.type === 'matching' && q.matchingPairs && (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Target Key Pairs Matrix:</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.matchingPairs.map((pair, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200/60 rounded-lg p-2 px-3 text-xs font-semibold">
                                      <span className="text-slate-700">{pair.left}</span>
                                      <span className="text-slate-300">➔</span>
                                      <span className="text-[#0B7A93] font-bold">{pair.right}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ORDERING PREVIEW */}
                            {q.type === 'ordering' && q.orderingItems && (
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Correct Ordered Sequence Alignment:</span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {q.orderingItems.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span className="text-slate-300 text-[10px]">➔</span>}
                                      <span className="bg-white border border-slate-200/60 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-bold">
                                        <strong className="text-slate-400 mr-1">{idx + 1}.</strong> {item}
                                      </span>
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* NUMERIC VALUE PREVIEW */}
                            {q.type === 'numeric' && q.numericAnswer && (
                              <div className="flex flex-wrap gap-5 text-xs text-slate-600">
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Target Value:</span>
                                  <span className="font-bold text-slate-800 text-xs">{q.numericAnswer.val}</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tolerance Range:</span>
                                  <span className="font-bold text-slate-800 text-xs">± {q.numericAnswer.tolerance}</span>
                                </div>
                                {q.numericAnswer.unit && (
                                  <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Unit Sign:</span>
                                    <span className="font-bold text-[#0B7A93] text-xs uppercase bg-[#0B7A93]/10 px-2 py-0.5 rounded">{q.numericAnswer.unit}</span>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DEPLOY BUTTON TRACK CONTROLLERS */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleSaveDraft} 
                className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition-all"
              >
                Save Workspace Layout as Draft
              </button>
              <button 
                type="button"
                onClick={handlePublish} 
                className="px-8 py-3.5 bg-[#0B7A93] text-white hover:bg-[#09667c] text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Finalize & Publish Complete Exam
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}