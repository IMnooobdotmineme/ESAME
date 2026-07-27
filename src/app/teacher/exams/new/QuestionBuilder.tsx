"use client";

import React, { useState } from 'react';

// Define the available question types based on your SRS
type QuestionType = 
  | 'mcq' 
  | 'essay' 
  | 'coding' 
  | 'true_false' 
  | 'short_answer';

interface TestInterface {
  points: number;
  isMandatory: boolean;
  explanation: string;
}

export default function QuestionBuilder() {
  const [selectedType, setSelectedType] = useState<QuestionType>('mcq');
  
  // Common Metadata Fields shared by all question types
  const [meta, setMeta] = useState<TestInterface>({
    points: 1,
    isMandatory: true,
    explanation: ''
  });

  // Type-specific state blocks
  const [questionText, setQuestionText] = useState('');
  const [mcqOptions, setMcqOptions] = useState<string[]>(['Option A', 'Option B']);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [wordLimit, setWordLimit] = useState({ min: 0, max: 500 });

  // Helpers to adjust multiple choice options dynamically
  const addOption = () => setMcqOptions([...mcqOptions, `Option ${String.fromCharCode(65 + mcqOptions.length)}`]);
  const removeOption = (index: number) => {
    if (mcqOptions.length > 2) {
      setMcqOptions(mcqOptions.filter((_, i) => i !== index));
      if (correctOptionIdx >= mcqOptions.length - 1) setCorrectOptionIdx(0);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden max-w-4xl mx-auto text-gray-900">
      
      {/* Header Banner */}
      <div className="bg-slate-50 border-b border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900">Dynamic Question Workspace</h4>
          <p className="text-xs text-gray-500">Configure parameters, points metrics, and evaluation conditions.</p>
        </div>
        
        {/* Core Question Type Select Engine (The exam.net magic) */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Question Type</label>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as QuestionType)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none transition-all"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
            <option value="essay">Essay / Long Answer</option>
            <option value="coding">Automated Coding Environment</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Row 1: Shared Global Settings (Points & Constraints) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Score Weight (Points)</label>
            <input 
              type="number" 
              min="1"
              value={meta.points}
              onChange={(e) => setMeta({...meta, points: parseInt(e.target.value) || 1})}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium"
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-700">
              <input 
                type="checkbox"
                checked={meta.isMandatory}
                onChange={(e) => setMeta({...meta, isMandatory: e.target.checked})}
                className="w-4 h-4 rounded text-[#0B7A93] focus:ring-[#0B7A93] border-gray-300"
              />
              Mandatory Question
            </label>
          </div>
        </div>

        {/* Row 2: Universal Base Question Text Input */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Question Prompt / Prompt Body</label>
          <textarea 
            rows={3}
            placeholder="Enter the query or text prompt instructions for the examinee here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] outline-none"
          />
        </div>

        {/* --- DYNAMIC INTERFACE SWAPPER BLOCK --- */}
        <div className="border-t border-dashed border-gray-200 pt-6">
          
          {/* A. MULTIPLE CHOICE INTERFACE */}
          {selectedType === 'mcq' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase">Answer Options & Correct Target</label>
              {mcqOptions.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3 animate-in fade-in duration-150">
                  <input 
                    type="radio"
                    name="correct-mcq"
                    checked={correctOptionIdx === idx}
                    onChange={() => setCorrectOptionIdx(idx)}
                    className="w-4 h-4 text-[#0B7A93] focus:ring-[#0B7A93]"
                  />
                  <input 
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const updated = [...mcqOptions];
                      updated[idx] = e.target.value;
                      setMcqOptions(updated);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button 
                    onClick={() => removeOption(idx)}
                    disabled={mcqOptions.length <= 2}
                    className="text-gray-400 hover:text-rose-500 disabled:opacity-30 transition-colors p-1"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button 
                onClick={addOption}
                className="mt-2 text-xs font-bold text-[#0B7A93] hover:text-[#09667c] flex items-center gap-1"
              >
                + Append Choice Entry
              </button>
            </div>
          )}

          {/* B. TRUE / FALSE INTERFACE */}
          {selectedType === 'true_false' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Truth Assignment</label>
              <div className="flex gap-4">
                {['True', 'False'].map((val, idx) => (
                  <button 
                    key={val}
                    onClick={() => setCorrectOptionIdx(idx)}
                    className={`px-6 py-3 border text-sm font-bold rounded-xl transition-all ${
                      correctOptionIdx === idx 
                        ? 'bg-teal-50 border-[#0B7A93] text-[#0B7A93]' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* C. SHORT ANSWER INTERFACE */}
          {selectedType === 'short_answer' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase">Accepted Text Matches (Case Insensitive)</label>
              <input 
                type="text"
                placeholder="Type precise text evaluation strings expected..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* D. ESSAY INTERFACE */}
          {selectedType === 'essay' && (
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Minimum Word Bounds</label>
                <input 
                  type="number"
                  value={wordLimit.min}
                  onChange={(e) => setWordLimit({...wordLimit, min: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Maximum Word Bounds</label>
                <input 
                  type="number"
                  value={wordLimit.max}
                  onChange={(e) => setWordLimit({...wordLimit, max: parseInt(e.target.value) || 0})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          {/* E. AUTOMATED CODING ENVIRONMENT */}
          {selectedType === 'coding' && (
            <div className="space-y-4">
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Runtime Compiler Sandbox</label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold"
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3.x</option>
                  <option value="java">Java LTS</option>
                  <option value="cpp">C++ (GCC)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Boilerplate / Starter Code Given to Student</label>
                <textarea 
                  rows={4}
                  placeholder={`function solution() {\n  // Write codebase structure here\n}`}
                  className="w-full font-mono text-xs bg-slate-900 text-teal-400 rounded-xl p-4 border border-slate-800 outline-none focus:ring-1 focus:ring-[#0B7A93]"
                />
              </div>
            </div>
          )}

        </div>

        {/* Universal Explanation Footer Field */}
        <div className="border-t border-gray-100 pt-4">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Post-Grading Explanatory Feedback Notes</label>
          <input 
            type="text"
            placeholder="Provide context solutions visible to students during downstream grade distribution review panels..."
            value={meta.explanation}
            onChange={(e) => setMeta({...meta, explanation: e.target.value})}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-slate-50/30"
          />
        </div>

      </div>

      {/* Commit Actions Control Deck */}
      <div className="bg-slate-50 border-t border-gray-200 p-4 flex justify-end gap-3">
        <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
          Clear Configuration
        </button>
        <button className="px-5 py-2 text-sm font-bold text-white bg-[#0B7A93] hover:bg-[#09667c] rounded-xl transition-all shadow-sm">
          Save & Commit Question
        </button>
      </div>

    </div>
  );
}