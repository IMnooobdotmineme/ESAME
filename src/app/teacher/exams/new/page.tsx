"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ManualQuestion {
  text: string;
  type: string;
  points: number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [examData, setExamData] = useState({
    title: '',
    courseCode: '',
    description: '',
    duration: '60',
    questionMethod: '', // 'manual', 'ai', 'upload'
    aiPrompt: '',
    uploadedFileName: '',
    proctoringWebcam: true,
    proctoringTabLock: true,
    startDate: '',
    startTime: ''
  });

  // Local collection bucket for Manual Question Creation
  const [manualQuestions, setManualQuestions] = useState<ManualQuestion[]>([
    { text: '', type: 'multiple-choice', points: 5 }
  ]);

  const addManualQuestionField = () => {
    setManualQuestions([...manualQuestions, { text: '', type: 'multiple-choice', points: 5 }]);
  };

  const handleManualQuestionChange = (index: number, key: keyof ManualQuestion, value: any) => {
    const updated = [...manualQuestions];
    updated[index] = { ...updated[index], [key]: value };
    setManualQuestions(updated);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving full examination entity to infrastructure:", { examData, manualQuestions });
    // Go straight back to exam panel dashboard list safely
    router.push('/teacher/exams');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-in fade-in duration-200">
      
      {/* Dynamic Header Step Counter */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#0B7A93]">Step {step} of 4</span>
          <h2 className="text-2xl font-black text-gray-900 mt-1">
            {step === 1 && "Basic Configuration Details"}
            {step === 2 && "Input Questions Workspace"}
            {step === 3 && "Security Invigilation Rules"}
            {step === 4 && "Final Review Scheduling"}
          </h2>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`h-3 rounded-full transition-all duration-300 ${step >= num ? 'w-10 bg-[#0B7A93]' : 'w-4 bg-gray-200'}`} />
          ))}
        </div>
      </div>

      {/* Main Workspace Frame Container */}
      <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm min-h-[450px]">
        
        {/* STEP 1: GENERAL SYSTEM ARTIFACTS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-base font-bold text-gray-800">Exam Title</label>
                <input 
                  type="text" placeholder="e.g., Organic Chemistry Midterm" value={examData.title}
                  onChange={(e) => setExamData({...examData, title: e.target.value})}
                  className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-bold text-gray-800">Course Code</label>
                <input 
                  type="text" placeholder="e.g., CHEM-202" value={examData.courseCode}
                  onChange={(e) => setExamData({...examData, courseCode: e.target.value})}
                  className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base font-bold text-gray-800">Directives & Guidelines</label>
              <textarea 
                rows={4} placeholder="Input dynamic rules for incoming examinees..." value={examData.description}
                onChange={(e) => setExamData({...examData, description: e.target.value})}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-base"
              />
            </div>

            <div className="space-y-2 max-w-xs">
              <label className="text-base font-bold text-gray-800">Duration (Minutes)</label>
              <input 
                type="number" value={examData.duration} onChange={(e) => setExamData({...examData, duration: e.target.value})}
                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-base"
              />
            </div>
          </div>
        )}

        {/* STEP 2: CHOOSE METHOD AND BUILD QUESTIONS */}
        {step === 2 && (
          <div className="space-y-8">
            {/* If no method selected yet, choose how to insert questions */}
            {!examData.questionMethod ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method 1: Manual Input */}
                <div 
                  onClick={() => setExamData({...examData, questionMethod: 'manual'})}
                  className="p-6 border-2 border-gray-100 hover:border-[#0B7A93] rounded-2xl cursor-pointer text-center space-y-3 transition-all"
                >
                  <div className="w-12 h-12 bg-teal-50 text-[#0B7A93] rounded-xl flex items-center justify-center mx-auto text-xl font-bold">✍️</div>
                  <h4 className="font-bold text-gray-900">Type Manually</h4>
                  <p className="text-xs text-gray-400">Add questions directly inside an explicit input form right now.</p>
                </div>

                {/* Method 2: AI Engine Generation */}
                <div 
                  onClick={() => setExamData({...examData, questionMethod: 'ai'})}
                  className="p-6 border-2 border-gray-100 hover:border-[#0B7A93] rounded-2xl cursor-pointer text-center space-y-3 transition-all"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">🧠</div>
                  <h4 className="font-bold text-gray-900">AI Prompt Matrix</h4>
                  <p className="text-xs text-gray-400">Describe topics and let our large model generate parameters automatically.</p>
                </div>

                {/* Method 3: Document Uploader */}
                <div 
                  onClick={() => setExamData({...examData, questionMethod: 'upload'})}
                  className="p-6 border-2 border-gray-100 hover:border-[#0B7A93] rounded-2xl cursor-pointer text-center space-y-3 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">📁</div>
                  <h4 className="font-bold text-gray-900">Upload Old Doc / PDF</h4>
                  <p className="text-xs text-gray-400">Drop your pre-existing exam file; our parsing system handles parsing structural splits.</p>
                </div>
              </div>
            ) : (
              <div>
                {/* Header indicating current selection with change button option */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Mode Active: {examData.questionMethod === 'manual' && 'Manual Content Creator Form'}
                    {examData.questionMethod === 'ai' && 'Integrated AI Prompt Pipeline'}
                    {examData.questionMethod === 'upload' && 'Structural Document Ingestion Portal'}
                  </span>
                  <button 
                    onClick={() => setExamData({...examData, questionMethod: '', uploadedFileName: ''})} 
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Change Method
                  </button>
                </div>

                {/* VIEW A: MANUAL INTERACTIVE FORM SYSTEM */}
                {examData.questionMethod === 'manual' && (
                  <div className="space-y-6">
                    {manualQuestions.map((q, idx) => (
                      <div key={idx} className="p-6 bg-gray-50/50 border border-gray-200 rounded-2xl space-y-4 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-500">Question Item #{idx + 1}</span>
                        </div>
                        <input 
                          type="text" placeholder="Enter question description text prompt..." value={q.text}
                          onChange={(e) => handleManualQuestionChange(idx, 'text', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-sm"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <select 
                            value={q.type} onChange={(e) => handleManualQuestionChange(idx, 'type', e.target.value)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none"
                          >
                            <option value="multiple-choice">Multiple Choice (MCQ)</option>
                            <option value="essay">Open Text Essay</option>
                          </select>
                          <input 
                            type="number" value={q.points} onChange={(e) => handleManualQuestionChange(idx, 'points', parseInt(e.target.value) || 0)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none"
                            placeholder="Points"
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={addManualQuestionField}
                      className="w-full py-3.5 border border-dashed border-gray-300 hover:border-[#0B7A93] rounded-2xl text-sm font-bold text-[#0B7A93] transition-colors bg-teal-50/10"
                    >
                      + Append Next Form Question Field
                    </button>
                  </div>
                )}

                {/* VIEW B: INTEGRATED AI MODEL PROMPTING */}
                {examData.questionMethod === 'ai' && (
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700">Describe exam blueprint guidelines for the AI generation model:</label>
                    <textarea 
                      rows={4} value={examData.aiPrompt} onChange={(e) => setExamData({...examData, aiPrompt: e.target.value})}
                      placeholder="e.g., Create 20 multiple choice questions focusing on cellular division, Krebs cycle tracking, and basic ATP synthesis metrics suitable for undergrad bio majors."
                      className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-sm text-gray-800"
                    />
                    <button 
                      type="button" onClick={() => alert("Simulating backend layout synthesis mapping execution flow inputs.")}
                      className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-sm transition-colors"
                    >
                      Execute Model Generation
                    </button>
                  </div>
                )}

                {/* VIEW C: PARSING FILE DROP UPLOADER CONTAINER */}
                {examData.questionMethod === 'upload' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-200 hover:border-[#0B7A93] rounded-2xl p-12 text-center transition-all bg-slate-50/50 relative cursor-pointer">
                      <input 
                        type="file" accept=".pdf,.docx,.txt" 
                        onChange={(e) => setExamData({...examData, uploadedFileName: e.target.files?.[0]?.name || ''})}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <p className="text-2xl mb-2">📥</p>
                      <p className="text-base font-bold text-gray-800">Drag & Drop Legacy Examination Materials</p>
                      <p className="text-xs text-gray-400 mt-1">Accepts standard PDF, DOCX, or pure TXT manifests configurations.</p>
                    </div>
                    {examData.uploadedFileName && (
                      <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center justify-between">
                        <span className="text-sm font-medium">Linked File Target: <strong>{examData.uploadedFileName}</strong></span>
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase">Parsed Ready</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PROCTORING SECURITY PROFILES */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
              <div>
                <h4 className="text-base font-bold text-gray-900">AI Live Webcam Verification</h4>
                <p className="text-xs text-gray-500 mt-0.5">Flags missing candidates, multiple faces, or dynamic gaze divergence anomalies.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" checked={examData.proctoringWebcam} 
                  onChange={(e) => setExamData({...examData, proctoringWebcam: e.target.checked})} className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0B7A93]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
              <div>
                <h4 className="text-base font-bold text-gray-900">Tab Switching & Fullscreen Constraints</h4>
                <p className="text-xs text-gray-500 mt-0.5">Automatically lock student environments if they wander to search targets outside the UI context.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" checked={examData.proctoringTabLock} 
                  onChange={(e) => setExamData({...examData, proctoringTabLock: e.target.checked})} className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0B7A93]"></div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: TIMEFRAMES SUMMARY PUBLISHING MAP */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-bold text-gray-800">Launch Date Activation</label>
                <input 
                  type="date" value={examData.startDate} onChange={(e) => setExamData({...examData, startDate: e.target.value})}
                  className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-base font-bold text-gray-800">Operational Target Start Time</label>
                <input 
                  type="time" value={examData.startTime} onChange={(e) => setExamData({...examData, startTime: e.target.value})}
                  className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#0B7A93] text-gray-800 text-base"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 mt-4">
              <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuration Summary Review</h5>
              <p className="text-sm text-gray-700"><strong>Exam Container:</strong> {examData.title || 'Untitled Exam'} ({examData.courseCode || 'No Course Code'})</p>
              <p className="text-sm text-gray-700"><strong>Assigned Timeline Parameters:</strong> Allotted runtime span values set at {examData.duration} standard tracking minutes.</p>
              <p className="text-sm text-gray-700">
                <strong>Question Generation Mode Selected: </strong> 
                <span className="capitalize font-bold text-[#0B7A93]">{examData.questionMethod || 'None Selected'}</span>
              </p>
              <p className="text-sm text-gray-700"><strong>Active Surveillance Proctor Profiling:</strong> Webcams ({examData.proctoringWebcam ? 'Engaged' : 'Muted'}), Tab Locks ({examData.proctoringTabLock ? 'Active' : 'Bypassed'}).</p>
            </div>
          </div>
        )}

      </div>

      {/* Control Buttons Footer */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep} disabled={step === 1}
          className={`px-6 py-3.5 text-base font-bold rounded-xl border transition-colors ${step === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
        >
          Previous Step
        </button>

        {step < 4 ? (
          <button
            onClick={nextStep}
            className="px-6 py-3.5 text-base font-bold text-white bg-[#0B7A93] hover:bg-[#09667c] rounded-xl transition-colors shadow-sm"
          >
            Continue Next
          </button>
        ) : (
          <button
            onClick={handlePublish}
            className="px-8 py-3.5 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md transform hover:-translate-y-0.5"
          >
            Finalize & Publish Exam
          </button>
        )}
      </div>

    </div>
  );
}