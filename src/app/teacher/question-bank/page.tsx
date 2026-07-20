"use client";

import React, { useState } from 'react';

type QuestionType = 
  | 'all'
  | 'mcq' 
  | 'true_false' 
  | 'coding' 
  | 'short_answer' 
  | 'essay';

interface BankQuestion {
  id: string;
  code: string;
  type: Exclude<QuestionType, 'all'>;
  text: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  usedInExams: number;
  points: number;
  lastModified: string;
}

export default function QuestionBankPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<QuestionType>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  
  // Realistic seed data matching the Computer Science focus from your dashboard
  const [questions, setQuestions] = useState<BankQuestion[]>([
    {
      id: 'q-101',
      code: 'CS-MCQ-04',
      type: 'mcq',
      text: 'Which of the following data structures operates on a Last-In, First-Out (LIFO) basis?',
      category: 'Data Structures',
      difficulty: 'Easy',
      usedInExams: 4,
      points: 2,
      lastModified: 'Jul 18, 2026'
    },
    {
      id: 'q-102',
      code: 'CS-PY-12',
      type: 'coding',
      text: 'Write a recursive function in Python to calculate the nth Fibonacci number with O(n) memoization.',
      category: 'Algorithms',
      difficulty: 'Hard',
      usedInExams: 2,
      points: 15,
      lastModified: 'Jul 15, 2026'
    },
    {
      id: 'q-103',
      code: 'CS-TF-02',
      type: 'true_false',
      text: 'HTTP is a stateful application layer protocol that maintains persistent connections by default.',
      category: 'Networking',
      difficulty: 'Medium',
      usedInExams: 7,
      points: 3,
      lastModified: 'Jun 30, 2026'
    },
    {
      id: 'q-104',
      code: 'CS-SA-88',
      type: 'short_answer',
      text: 'Explain the fundamental difference between pessimistic concurrency control and optimistic concurrency control in database systems.',
      category: 'Database Systems',
      difficulty: 'Medium',
      usedInExams: 1,
      points: 5,
      lastModified: 'Jul 02, 2026'
    },
    {
      id: 'q-105',
      code: 'CS-ESS-09',
      type: 'essay',
      text: 'Analyze the architectural trade-offs between Monolithic systems and Microservices handling high-throughput event-driven operations.',
      category: 'Software Architecture',
      difficulty: 'Hard',
      usedInExams: 0,
      points: 20,
      lastModified: 'Jul 19, 2026'
    }
  ]);

  // Filtering Logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === 'all' || q.type === activeType;
    const matchesDifficulty = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mcq: 'Multiple Choice',
      true_false: 'True / False',
      coding: 'Code Sandbox',
      short_answer: 'Short Answer',
      essay: 'Long Essay'
    };
    return labels[type] || type;
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Easy': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Hard': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-8 text-slate-900 space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase text-[#0B7A93] tracking-widest">Central Repository</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Question Bank</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Manage, filter, and deploy pre-vetted modular assessment items across active examinations.
          </p>
        </div>
        <button 
          type="button" 
          className="bg-[#0B7A93] text-white text-xs font-bold px-5 py-3.5 rounded-xl hover:bg-[#09667c] transition-all shadow-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create New Question
        </button>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Search Box */}
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search by keyword, specific item code, or category index..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
            >
              <option value="All">All Complexities</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Question Type Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {(['all', 'mcq', 'true_false', 'coding', 'short_answer', 'essay'] as QuestionType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                activeType === type
                  ? 'bg-[#0d1527] border-[#0d1527] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type === 'all' ? 'Show All Types' : getTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* REPOSITORY TABLE DATA SHEET */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredQuestions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">No matching questions found</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
                Adjust your active filters or clear search inputs to find historical assets.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 w-28">Ref ID</th>
                  <th className="py-4 px-6 w-40">Format Type</th>
                  <th className="py-4 px-6">Question Context String</th>
                  <th className="py-4 px-6 w-36">Category</th>
                  <th className="py-4 px-6 w-24 text-center">Weight</th>
                  <th className="py-4 px-6 w-28 text-center">Complexity</th>
                  <th className="py-4 px-6 w-24 text-center">Uses</th>
                  <th className="py-4 px-6 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredQuestions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-400">
                      {q.code}
                    </td>
                    <td className="py-4 px-6 font-semibold text-xs text-slate-600">
                      {getTypeLabel(q.type)}
                    </td>
                    <td className="py-4 px-6 pr-12">
                      <p className="text-slate-800 line-clamp-1 font-medium group-hover:text-slate-900 transition-colors">
                        {q.text}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs bg-slate-100/80 text-slate-600 px-2.5 py-1 rounded-md font-medium border border-slate-200/40">
                        {q.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-slate-700 text-xs">
                      {q.points} pt
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-xs text-slate-400">
                      {q.usedInExams === 0 ? (
                        <span className="text-rose-400 italic font-normal text-[11px]">Unused</span>
                      ) : (
                        <span>{q.usedInExams} tests</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          title="Preview Item Structure"
                          className="text-slate-500 hover:text-[#0B7A93] font-semibold text-xs transition-colors"
                        >
                          View
                        </button>
                        <button 
                          type="button" 
                          title="Modify Content Parameters"
                          className="text-slate-500 hover:text-slate-900 font-semibold text-xs transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK INVENTORY METRIC FOOTER BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 bg-slate-50 border border-slate-200/60 p-4 rounded-xl font-medium">
        <span>Showing <b>{filteredQuestions.length}</b> items computed out of total vault logs.</span>
        <span className="mt-1 sm:mt-0">Last automated backup sync: Today, 10:33 AM</span>
      </div>

    </div>
  );
}