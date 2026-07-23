"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoredExams, deleteExam, Exam } from './examStore';

export default function MyExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'completed'>('active');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    setExams(getStoredExams());
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteExam = (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      deleteExam(examId);
      setExams(getStoredExams());
    }
  };

  const filteredExams = exams.filter(exam => exam.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Examination Repository</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium">Review live feeds, coordinate test schedules, or edit existing exam questions.</p>
        </div>
        <Link href="/teacher/exams/new">
          <button className="bg-[#0B7A93] hover:bg-[#086377] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create New Exam
          </button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 space-x-6">
        {(['active', 'scheduled', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold capitalize transition-all border-b-2 ${
              activeTab === tab
                ? 'border-[#0B7A93] text-[#0B7A93]'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab} Exams ({exams.filter(e => e.status === tab).length})
          </button>
        ))}
      </div>

      {/* Exam Cards */}
      <div className="space-y-4">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 font-medium">No {activeTab} exams found.</p>
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:border-gray-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md tracking-wide uppercase">
                    {exam.courseCode}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    Duration: {exam.durationMinutes} mins • {exam.questions.length} Questions
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{exam.title}</h3>
                
                {/* 6-Character Access Join Code */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">ACCESS JOIN CODE:</span>
                  <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1">
                    <span className="font-mono font-extrabold text-[#0B7A93] text-sm tracking-widest">{exam.accessCode}</span>
                    <button 
                      onClick={() => handleCopyCode(exam.accessCode)}
                      className="text-teal-600 hover:text-teal-800 transition-colors"
                      title="Copy Code"
                    >
                      {copiedCode === exam.accessCode ? (
                        <span className="text-[10px] bg-teal-600 text-white font-bold px-1.5 py-0.5 rounded">Copied!</span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                
                {/* EDIT BUTTON: Navigates to create page with ?edit=ID */}
                <button
                  onClick={() => router.push(`/teacher/exams/new?edit=${exam.id}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Exam & Questions
                </button>

                <Link href="/teacher/monitor">
                  <button className="px-4 py-2 bg-[#0B7A93] hover:bg-[#086377] text-white font-semibold text-sm rounded-xl transition-all">
                    Launch Live Monitor
                  </button>
                </Link>

                <button
                  onClick={() => handleDeleteExam(exam.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="Delete Exam"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}