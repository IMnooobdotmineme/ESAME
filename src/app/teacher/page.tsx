"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// 1. Explicitly define the unified structure to satisfy TypeScript's compiler
interface ExamItem {
  id: string;
  title: string;
  course: string;
  duration: string;
  questions: number;
  code: string;
  students?: string;  // Optional: Only used in active exams
  date?: string;      // Optional: Only used in scheduled exams
  graded?: string;    // Optional: Only used in completed exams
}

export default function MyExamsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'completed'>('active');

  // 2. Type the data structure explicitly using our new interface
  const examsData: Record<'active' | 'scheduled' | 'completed', ExamItem[]> = {
    active: [
      { id: '1', title: 'Introduction to Computer Science (Midterm)', course: 'CS101', duration: '60 mins', questions: 30, code: 'CS101-MID', students: '45/50' },
      { id: '2', title: 'Data Structures & Algorithms Quiz 3', course: 'CS204', duration: '45 mins', questions: 15, code: 'DS-QZ3', students: '22/25' }
    ],
    scheduled: [
      { id: '3', title: 'Advanced Database Systems Final', course: 'CS404', duration: '120 mins', questions: 50, code: 'DB-FINAL', date: 'July 24, 2026' },
      { id: '4', title: 'Discrete Mathematics Retake', course: 'MATH201', duration: '90 mins', questions: 25, code: 'MATH-RET', date: 'Aug 02, 2026' }
    ],
    completed: [
      { id: '5', title: 'Software Engineering Ethics Baseline Test', course: 'SE302', duration: '30 mins', questions: 20, code: 'SE-ETH', graded: 'Fully Graded' },
      { id: '6', title: 'Web Development Practical Exam 1', course: 'CS108', duration: '180 mins', questions: 5, code: 'WEB-P1', graded: '12 Pending Review' }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Upper Action Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Examination Repository</h2>
          <p className="text-gray-500 text-sm mt-1">Review live feeds, coordinate dynamic test schedules, or access completed grading suites.</p>
        </div>
        <Link 
          href="/teacher/exams/new" 
          className="px-6 py-3.5 bg-[#0B7A93] text-white text-base font-bold rounded-xl hover:bg-[#09667c] transition-colors shadow-sm shrink-0 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create New Exam
        </Link>
      </div>

      {/* Chunky Navigation Status Tabs */}
      <div className="flex border-b border-gray-200 gap-2 bg-gray-100/60 p-1.5 rounded-xl max-w-md">
        {(['active', 'scheduled', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-bold capitalize rounded-lg transition-all ${
              activeTab === tab 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab} Exams
          </button>
        ))}
      </div>

      {/* Exam Collection Grid */}
      <div className="grid grid-cols-1 gap-4">
        {examsData[activeTab].length === 0 ? (
          <div className="bg-white text-center p-16 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No tests exist in this operational status folder.</p>
          </div>
        ) : (
          examsData[activeTab].map((exam) => (
            <div key={exam.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-gray-200 transition-all">
              
              {/* Info Block */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-bold tracking-wide">
                    {exam.course}
                  </span>
                  <span className="text-sm text-gray-400 font-medium">
                    Duration: {exam.duration} • {exam.questions} Questions
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900">{exam.title}</h3>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Access Join Code:</span>
                  <span className="font-mono font-bold text-xs bg-teal-50 text-[#0B7A93] px-2.5 py-1 rounded border border-teal-100">
                    {exam.code}
                  </span>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="flex items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 justify-end">
                {activeTab === 'active' && (
                  <>
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-sm font-bold text-gray-900">{exam.students} Active</p>
                      <p className="text-xs text-emerald-500 font-medium">Streams connected</p>
                    </div>
                    <Link href="/teacher/monitor" className="px-5 py-3 bg-[#0B7A93] hover:bg-[#09667c] text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                      Launch Live Monitor
                    </Link>
                  </>
                )}

                {activeTab === 'scheduled' && (
                  <>
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-sm font-bold text-gray-900">{exam.date}</p>
                      <p className="text-xs text-amber-500 font-medium">Launch Pending</p>
                    </div>
                    <button className="px-5 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors">
                      Modify Parameters
                    </button>
                  </>
                )}

                {activeTab === 'completed' && (
                  <>
                    <div className="text-right hidden sm:block mr-2">
                      <p className="text-sm font-bold text-gray-900">{exam.graded}</p>
                      <p className="text-xs text-gray-400 font-medium">Final collection records</p>
                    </div>
                    <Link href="/teacher/grading" className="px-5 py-3 bg-gray-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                      Evaluate Grading Suite
                    </Link>
                  </>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}