"use client";

import React, { useState } from "react";

// Define the available question types based on SRS
type QuestionType = 
  | "mcq" 
  | "essay" 
  | "coding" 
  | "true_false" 
  | "short_answer";

interface TestInterface {
  points: number;
  isMandatory: boolean;
  explanation: string;
}

export default function QuestionBuilder() {
  const [selectedType, setSelectedType] = useState<QuestionType>("mcq");
  
  // Common Metadata Fields shared by all question types
  const [meta, setMeta] = useState<TestInterface>({
    points: 1,
    isMandatory: true,
    explanation: ""
  });

  // Type-specific state blocks
  const [questionText, setQuestionText] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["Option A", "Option B"]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden max-w-4xl mx-auto text-slate-900 font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-50/60 border-b border-slate-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Dynamic Question Workspace
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure parameters, points metrics, and evaluation conditions.
          </p>
        </div>
        
        {/* Core Question Type Select Engine */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Question Type
          </label>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as QuestionType)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:border-sky-400 transition-all cursor-pointer"
          >
            <option value="mcq">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
            <option value="essay">Essay / Long Answer</option>
            <option value="coding">Automated Coding Environment</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-5">
        
        {/* ROW 1: SHARED GLOBAL SETTINGS (POINTS & CONSTRAINTS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Score Weight (Points)
            </label>
            <input 
              type="number" 
              min="1"
              value={meta.points}
              onChange={(e) => setMeta({...meta, points: parseInt(e.target.value) || 1})}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
            />
          </div>
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700">
              <input 
                type="checkbox"
                checked={meta.isMandatory}
                onChange={(e) => setMeta({...meta, isMandatory: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer"
              />
              Mandatory Question
            </label>
          </div>
        </div>

        {/* ROW 2: UNIVERSAL BASE QUESTION TEXT INPUT */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Question Prompt / Prompt Body
          </label>
          <textarea 
            rows={3}
            placeholder="Enter the query or text prompt instructions for the examinee here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* --- DYNAMIC INTERFACE SWAPPER BLOCK --- */}
        <div className="border-t border-slate-100 pt-5">
          
          {/* A. MULTIPLE CHOICE INTERFACE */}
          {selectedType === "mcq" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Answer Options & Correct Target
              </label>
              {mcqOptions.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input 
                    type="radio"
                    name="correct-mcq"
                    checked={correctOptionIdx === idx}
                    onChange={() => setCorrectOptionIdx(idx)}
                    className="w-4 h-4 text-sky-600 focus:ring-sky-400 cursor-pointer"
                  />
                  <input 
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const updated = [...mcqOptions];
                      updated[idx] = e.target.value;
                      setMcqOptions(updated);
                    }}
                    className={`flex-1 border rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none ${
                      correctOptionIdx === idx ? "border-sky-400 bg-sky-50/20" : "border-slate-200"
                    }`}
                  />
                  <button 
                    type="button"
                    onClick={() => removeOption(idx)}
                    disabled={mcqOptions.length <= 2}
                    className="text-xs text-rose-500 font-semibold hover:underline disabled:opacity-30 cursor-pointer transition-colors p-1"
                  >
                    Delete
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={addOption}
                className="mt-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline block cursor-pointer"
              >
                + Append Choice Entry
              </button>
            </div>
          )}

          {/* B. TRUE / FALSE INTERFACE */}
          {selectedType === "true_false" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Truth Assignment
              </label>
              <div className="flex gap-3">
                {["True", "False"].map((val, idx) => (
                  <button 
                    key={val}
                    type="button"
                    onClick={() => setCorrectOptionIdx(idx)}
                    className={`px-6 py-2 border text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      correctOptionIdx === idx 
                        ? "bg-sky-50 border-sky-400 text-sky-700 font-bold" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* C. SHORT ANSWER INTERFACE */}
          {selectedType === "short_answer" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Accepted Text Matches (Case Insensitive)
              </label>
              <input 
                type="text"
                placeholder="Type precise text evaluation strings expected..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 placeholder:text-slate-400"
              />
            </div>
          )}

          {/* D. ESSAY INTERFACE */}
          {selectedType === "essay" && (
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Minimum Word Bounds
                </label>
                <input 
                  type="number"
                  value={wordLimit.min}
                  onChange={(e) => setWordLimit({...wordLimit, min: parseInt(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maximum Word Bounds
                </label>
                <input 
                  type="number"
                  value={wordLimit.max}
                  onChange={(e) => setWordLimit({...wordLimit, max: parseInt(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>
          )}

          {/* E. AUTOMATED CODING ENVIRONMENT */}
          {selectedType === "coding" && (
            <div className="space-y-3">
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Runtime Compiler Sandbox
                </label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3.x</option>
                  <option value="java">Java LTS</option>
                  <option value="cpp">C++ (GCC)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Boilerplate / Starter Code Given to Student
                </label>
                <textarea 
                  rows={4}
                  placeholder={`function solution() {\n  // Write codebase structure here\n}`}
                  className="w-full font-mono text-xs bg-slate-900 text-sky-300 rounded-xl p-3.5 border border-slate-800 outline-none focus:ring-1 focus:ring-sky-400"
                />
              </div>
            </div>
          )}

        </div>

        {/* UNIVERSAL EXPLANATION FOOTER FIELD */}
        <div className="border-t border-slate-100 pt-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Post-Grading Explanatory Feedback Notes
          </label>
          <input 
            type="text"
            placeholder="Provide context solutions visible to students during downstream grade distribution review panels..."
            value={meta.explanation}
            onChange={(e) => setMeta({...meta, explanation: e.target.value})}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 placeholder:text-slate-400"
          />
        </div>

      </div>

      {/* COMMIT ACTIONS CONTROL DECK */}
      <div className="bg-slate-50/60 border-t border-slate-200 p-4 flex justify-end gap-2.5">
        <button 
          type="button"
          onClick={() => {
            setQuestionText("");
            setMeta({ points: 1, isMandatory: true, explanation: "" });
            setMcqOptions(["Option A", "Option B"]);
            setCorrectOptionIdx(0);
          }}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          Clear Configuration
        </button>
        <button 
          type="button"
          className="px-5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          Save & Commit Question
        </button>
      </div>

    </div>
  );
}