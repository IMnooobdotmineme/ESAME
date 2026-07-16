"use client";

import React, { useState } from 'react';
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
  points: number;
  isMandatory: boolean;
  explanation: string;
  mediaType: 'none' | 'image' | 'audio' | 'video';
  mediaUrl?: string;
}

interface ExamPart {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // --- STEP 1: EXAM PARAMETERS STATE ---
  const [examData, setExamData] = useState({
    title: '',
    description: '',
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
      title: 'Part A: Multiple Choice Questions',
      description: 'Select the single most correct answer for each query.',
      questions: []
    }
  ]);
  const [activePartId, setActivePartId] = useState<string>('part-1');
  const [newPartTitle, setNewPartTitle] = useState('');
  const [newPartDesc, setNewPartDesc] = useState('');

  // Current Working Question States
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState(5);
  const [qMandatory, setQMandatory] = useState(true);
  const [qExplanation, setQExplanation] = useState('');
  const [qMediaType, setQMediaType] = useState<'none' | 'image' | 'audio' | 'video'>('none');
  const [qMediaUrl, setQMediaUrl] = useState('');

  // Dynamic Type-Specific Dummy States
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

  // --- STRUCTURAL PART MANIPULATIONS ---
  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartTitle.trim()) return;

    const newPart: ExamPart = {
      id: Date.now().toString(),
      title: newPartTitle,
      description: newPartDesc,
      questions: []
    };

    setParts([...parts, newPart]);
    setActivePartId(newPart.id);
    setNewPartTitle('');
    setNewPartDesc('');
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
      points: qPoints,
      isMandatory: qMandatory,
      explanation: qExplanation,
      mediaType: qMediaType,
      mediaUrl: qMediaUrl || undefined
    };

    setParts(parts.map(part => {
      if (part.id === activePartId) {
        return { ...part, questions: [...part.questions, newQuestion] };
      }
      return part;
    }));

    // Reset prompt fields for fluid repetition workflow
    setQText('');
    setQExplanation('');
    setQMediaType('none');
    setQMediaUrl('');
    alert("Question committed to selected section!");
  };

  const handleDeleteQuestion = (partId: string, questionId: string) => {
    setParts(parts.map(p => {
      if (p.id === partId) {
        return { ...p, questions: p.questions.filter(q => q.id !== questionId) };
      }
      return p;
    }));
  };

  // --- LOGISTICS TARGET CONTROLLERS ---
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
    <div className="w-full max-w-5xl mx-auto space-y-8 p-6 text-gray-900 animate-in fade-in duration-200">
      
      {/* HEADER CONTROLS PIPELINE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <span className="text-xs font-black uppercase text-[#0B7A93] tracking-wider">Exam Manager Studio</span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            {step === 1 ? "Configure Exam Parameters" : "Segmented Structural Builder"}
          </h2>
          <p className="text-gray-400 text-sm">
            {step === 1 ? "Set academic context and timetables." : "Organize questionnaire sheets into sectioned parts."}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-gray-100">
          <button 
            onClick={() => setStep(1)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${step === 1 ? 'bg-[#0B7A93] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            1. Settings
          </button>
          <button 
            onClick={() => examData.title ? setStep(2) : alert("Please input the Exam Title to continue!")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${step === 2 ? 'bg-[#0B7A93] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            2. Sections & Questions
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* STEP 1: EXAM PARAMETERS DISPLAY            */}
      {/* ========================================== */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Exam Title</label>
              <input 
                type="text" 
                placeholder="e.g., CS101 Introduction to Computer Science (Midterm)"
                value={examData.title}
                onChange={(e) => setExamData({...examData, title: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Instructions / Description</label>
              <textarea 
                rows={3}
                placeholder="Detail academic honor codes, workspace configuration parameters, etc..."
                value={examData.description}
                onChange={(e) => setExamData({...examData, description: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assigned Department</label>
              <select 
                value={examData.department}
                onChange={(e) => setExamData({...examData, department: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject / Course Code</label>
              <input 
                type="text" 
                placeholder="e.g., CS101"
                value={examData.subject}
                onChange={(e) => setExamData({...examData, subject: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Academic Year</label>
              <input 
                type="text" 
                placeholder="e.g., 2026-2027"
                value={examData.academicYear}
                onChange={(e) => setExamData({...examData, academicYear: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Semester</label>
              <select 
                value={examData.semester}
                onChange={(e) => setExamData({...examData, semester: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duration (Minutes)</label>
              <input 
                type="number" 
                value={examData.duration}
                onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 60})}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start Window</label>
                <input 
                  type="datetime-local" 
                  value={examData.startDate}
                  onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Close Window</label>
                <input 
                  type="datetime-local" 
                  value={examData.endDate}
                  onChange={(e) => setExamData({...examData, endDate: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="templateToggle"
                checked={examData.saveAsTemplate}
                onChange={(e) => setExamData({...examData, saveAsTemplate: e.target.checked})}
                className="w-4 h-4 rounded text-[#0B7A93] border-gray-300"
              />
              <label htmlFor="templateToggle" className="text-sm font-bold text-gray-600 cursor-pointer">
                Save this Exam configuration as a Template for future reuse
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button onClick={handleSaveDraft} className="px-6 py-3 border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50">
              Save as Draft
            </button>
            <button onClick={() => setStep(2)} className="px-8 py-3.5 bg-[#0B7A93] text-white text-sm font-bold rounded-xl hover:bg-[#09667c]">
              Continue to Question Setup
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: MULTI-PART QUESTION COMPOSER MATRIX               */}
      {/* ========================================================= */}
      {step === 2 && (
        <div className="space-y-8">

          {/* BLOCK A: SECTIONAL SECTION CREATOR */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase mb-3">1. Sectional Structural Hierarchy Blueprint</h3>
            <form onSubmit={handleCreatePart} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-50 p-4 rounded-xl">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Section/Part Title</label>
                <input 
                  type="text" 
                  placeholder="e.g., Part B: Short Answers"
                  value={newPartTitle}
                  onChange={(e) => setNewPartTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Section Context Instructions (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., No syntax compilators allowed in this section."
                  value={newPartDesc}
                  onChange={(e) => setNewPartDesc(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <button type="submit" className="bg-slate-900 text-white font-bold text-xs py-2.5 px-4 rounded-lg hover:bg-slate-800">
                + Append Exam Section Part
              </button>
            </form>

            {/* SEGMENTED TAB SELECTOR INDEX */}
            <div className="flex flex-wrap gap-2 mt-4 border-t border-gray-100 pt-4">
              {parts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePartId(p.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                    activePartId === p.id 
                      ? 'bg-[#0B7A93] text-white border-[#0B7A93] shadow-sm' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p.title} ({p.questions.length} Qs)
                </button>
              ))}
            </div>
          </div>

          {/* BLOCK B: HIGH-FIDELITY BUILDER SHEET FOR ACTIVE SELECTION */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
              <div>
                <span className="text-[10px] bg-teal-50 text-[#0B7A93] px-2.5 py-1 rounded-md font-black uppercase">
                  Target Destination: {parts.find(p => p.id === activePartId)?.title}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">Configure Question Specifications</h3>
              </div>
              
              <select 
                value={qType}
                onChange={(e) => setQType(e.target.value as QuestionType)}
                className="bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none"
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
            </div>

            {/* COMMON FIELDS CONFIG MATRIX */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Points Metric</label>
                <input 
                  type="number" 
                  value={qPoints}
                  onChange={(e) => setQPoints(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600">
                  <input type="checkbox" checked={qMandatory} onChange={(e) => setQMandatory(e.target.checked)} className="w-4 h-4 rounded text-[#0B7A93]" />
                  Mandatory Flag
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Media Core Mode</label>
                <select value={qMediaType} onChange={(e) => setQMediaType(e.target.value as any)} className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs font-semibold">
                  <option value="none">No Media Attachment</option>
                  <option value="image">Attach Image Matrix</option>
                  <option value="audio">Attach Audio Prompt</option>
                  <option value="video">Attach Video Reel</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Resource URL</label>
                <input 
                  type="text" 
                  disabled={qMediaType === 'none'}
                  placeholder="https://domain.com/asset.mp4"
                  value={qMediaUrl}
                  onChange={(e) => setQMediaUrl(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* QUERY BLOCK */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Question Text Prompt</label>
              <textarea 
                rows={2}
                placeholder="Formulate query constraints structure here..."
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 outline-none"
              />
            </div>

            {/* DYNAMIC ADAPTIVE FIELDS BLOCK (EXAM.NET STYLE METHOD SWITCHES) */}
            <div className="border-t border-dashed border-gray-100 pt-6">
              
              {qType === 'mcq' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Multiple Choice Options Grid</label>
                  {mcqOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="radio" checked={mcqCorrect === i} onChange={() => setMcqCorrect(i)} className="w-4 h-4 text-[#0B7A93]" />
                      <input type="text" value={opt} onChange={(e) => { const c = [...mcqOptions]; c[i] = e.target.value; setMcqOptions(c); }} className="flex-1 border border-gray-200 rounded-xl px-4 py-1.5 text-sm" />
                      <button onClick={() => setMcqOptions(mcqOptions.filter((_, idx) => idx !== i))} disabled={mcqOptions.length <= 2} className="text-xs text-rose-500 font-bold disabled:opacity-30">Delete</button>
                    </div>
                  ))}
                  <button onClick={() => setMcqOptions([...mcqOptions, `Option ${String.fromCharCode(65 + mcqOptions.length)}`])} className="text-xs font-bold text-[#0B7A93] hover:underline">+ Append Grid Node</button>
                </div>
              )}

              {qType === 'multi_select' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Multiple Selection Bounds Matrix</label>
                  {multiOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input type="checkbox" checked={multiCorrect[i] || false} onChange={(e) => { const c = [...multiCorrect]; c[i] = e.target.checked; setMultiCorrect(c); }} className="w-4 h-4 rounded text-[#0B7A93]" />
                      <input type="text" value={opt} onChange={(e) => { const c = [...multiOptions]; c[i] = e.target.value; setMultiOptions(c); }} className="flex-1 border border-gray-200 rounded-xl px-4 py-1.5 text-sm" />
                    </div>
                  ))}
                  <button onClick={() => { setMultiOptions([...multiOptions, `Option ${String.fromCharCode(65 + multiOptions.length)}`]); setMultiCorrect([...multiCorrect, false]); }} className="text-xs font-bold text-[#0B7A93] hover:underline">+ Append Multi Grid Choice</button>
                </div>
              )}

              {qType === 'true_false' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Assign Solution Identity</label>
                  <div className="flex gap-4">
                    <button onClick={() => setTfCorrect(true)} className={`px-8 py-3 border rounded-xl text-sm font-bold transition-all ${tfCorrect ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' : 'border-gray-200 text-gray-600'}`}>True</button>
                    <button onClick={() => setTfCorrect(false)} className={`px-8 py-3 border rounded-xl text-sm font-bold transition-all ${!tfCorrect ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' : 'border-gray-200 text-gray-600'}`}>False</button>
                  </div>
                </div>
              )}

              {qType === 'short_answer' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase">Evaluated Literal Match Criteria</label>
                  {shortAnswers.map((ans, i) => (
                    <input key={i} type="text" placeholder="Accepted evaluation parsing phrase value..." value={ans} onChange={(e) => { const c = [...shortAnswers]; c[i] = e.target.value; setShortAnswers(c); }} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-[#0B7A93]" />
                  ))}
                  <button onClick={() => setShortAnswers([...shortAnswers, ''])} className="text-xs font-bold text-[#0B7A93] hover:underline">+ Append Alternative Matching Formula</button>
                </div>
              )}

              {qType === 'essay' && (
                <div className="grid grid-cols-2 gap-4 max-w-sm">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Characters Bounds</label>
                    <input type="number" value={essayMinMax.min} onChange={(e) => setEssayMinMax({...essayMinMax, min: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Maximum Characters Bounds</label>
                    <input type="number" value={essayMinMax.max} onChange={(e) => setEssayMinMax({...essayMinMax, max: parseInt(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                  </div>
                </div>
              )}

              {qType === 'coding' && (
                <div className="space-y-4">
                  <div className="max-w-xs">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Compiler Execution Profile</label>
                    <select value={codingLang} onChange={(e) => setCodingLang(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-semibold">
                      <option value="python">Python 3.x Environment</option>
                      <option value="javascript">JavaScript (NodeJS Runtime)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Starter Template Code block</label>
                    <textarea rows={3} placeholder="def execute_solution():&#10;    # Write context lines here" value={codingStarter} onChange={(e) => setCodingStarter(e.target.value)} className="w-full font-mono text-xs bg-slate-900 text-teal-400 p-4 rounded-xl outline-none" />
                  </div>
                </div>
              )}

              {qType === 'fill_blank' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Evaluated Question Blueprint Phrase string</label>
                  <input type="text" value={blanksText} onChange={(e) => setBlanksText(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm" />
                  <p className="text-[10px] text-gray-400 italic">Use structure notation maps such as [blank1] or [blank2] to format slot layout maps.</p>
                </div>
              )}

              {qType === 'matching' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Formulate Solution Map Link Pairs</label>
                  {matchingPairs.map((pair, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={pair.left} onChange={(e) => { const c = [...matchingPairs]; c[idx].left = e.target.value; setMatchingPairs(c); }} placeholder="Left Segment Node" className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm" />
                      <span className="text-gray-300">➔</span>
                      <input type="text" value={pair.right} onChange={(e) => { const c = [...matchingPairs]; c[idx].right = e.target.value; setMatchingPairs(c); }} placeholder="Right Target Reference" className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-sm" />
                    </div>
                  ))}
                  <button onClick={() => setMatchingPairs([...matchingPairs, { left: '', right: '' }])} className="text-xs font-bold text-[#0B7A93] hover:underline">+ Append Link Target Pair</button>
                </div>
              )}

              {qType === 'ordering' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sequence Sorting indexes (Top-down alignment signifies Correct order)</label>
                  {orderingItems.map((item, idx) => (
                    <input key={idx} type="text" value={item} onChange={(e) => { const c = [...orderingItems]; c[idx] = e.target.value; setOrderingItems(c); }} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
                  ))}
                  <button onClick={() => setOrderingItems([...orderingItems, `Item ${orderingItems.length + 1}`])} className="text-xs font-bold text-[#0B7A93] hover:underline">+ Append Sorting Node</button>
                </div>
              )}

              {qType === 'numeric' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Float Target Target</label>
                    <input type="number" value={numericAnswer.val} onChange={(e) => setNumericAnswer({...numericAnswer, val: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tolerance Margin (±)</label>
                    <input type="number" value={numericAnswer.tolerance} onChange={(e) => setNumericAnswer({...numericAnswer, tolerance: parseFloat(e.target.value) || 0})} className="w-full border border-gray-200 rounded-lg p-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unit Signage String</label>
                    <input type="text" placeholder="e.g., Pascal" value={numericAnswer.unit} onChange={(e) => setNumericAnswer({...numericAnswer, unit: e.target.value})} className="w-full border border-gray-200 rounded-lg p-1.5 text-sm" />
                  </div>
                </div>
              )}

            </div>

            {/* FEEDBACK FIELD */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Post-Release Solutions Assessment Explanatory Feedback Notes</label>
              <input 
                type="text" 
                placeholder="Explanatory evaluation guidelines visible during distributions..."
                value={qExplanation}
                onChange={(e) => setQExplanation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none"
              />
            </div>

            {/* ACTIONS BAR */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { setQText(''); setQExplanation(''); }} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Clear Workspace Configuration</button>
              <button onClick={handleAddQuestionToPart} className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-sm font-bold rounded-xl shadow-sm">
                Save & Commit Question
              </button>
            </div>
          </div>

          {/* BLOCK C: ACCORDION QUESTION DECK GROUPED BY EXAM PARTS */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Exam Questionnaire Pipeline Deck Summary</h4>
              <p className="text-xs text-gray-400 mt-0.5">Hierarchical structural breakdown view of currently built sections.</p>
            </div>

            <div className="space-y-6">
              {parts.map((part) => (
                <div key={part.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {/* Part Title Header strip */}
                  <div className="bg-slate-50/80 border-b border-gray-100 px-5 py-3.5 flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-black text-gray-900 uppercase tracking-wide">{part.title}</h5>
                      {part.description && <p className="text-[10px] text-gray-400 font-medium mt-0.5">{part.description}</p>}
                    </div>
                    <span className="bg-slate-200/60 text-slate-700 font-black px-2.5 py-0.5 rounded text-[10px]">
                      {part.questions.length} Items Total
                    </span>
                  </div>

                  {/* Inside Questions index rendering list */}
                  <div className="p-4 bg-white divide-y divide-gray-50">
                    {part.questions.length === 0 ? (
                      <p className="text-xs text-gray-400 font-medium py-2 px-1 italic">No questions mapped inside this section configuration parameter tree yet...</p>
                    ) : (
                      part.questions.map((q, idx) => (
                        <div key={q.id} className="flex justify-between items-center py-3 text-xs first:pt-0 last:pb-0">
                          <div>
                            <span className="font-bold text-gray-900 block">Q{idx + 1}: {q.text.slice(0, 90)}{q.text.length > 90 && '...'}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 block">
                              Format: {q.type.replace('_', ' ')} • Weight Allocation: {q.points} pts • {q.isMandatory ? 'Mandatory Field' : 'Optional Condition'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteQuestion(part.id, q.id)}
                            className="text-xs font-bold text-rose-500 hover:underline px-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DEPLOY BUTTON TRACK CONTROLLERS */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button onClick={handleSaveDraft} className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-xl transition-all">
                Save Workspace Layout as Draft
              </button>
              <button onClick={handlePublish} className="px-8 py-3.5 bg-[#0B7A93] text-white hover:bg-[#09667c] text-sm font-bold rounded-xl transition-all shadow-sm">
                Finalize & Publish Complete Exam
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}