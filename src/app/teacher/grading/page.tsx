"use client";

import React, { useState } from 'react';

type GradeStatus = 'all' | 'pending' | 'graded';

interface Submission {
  id: string;
  studentName: string;
  rollNumber: string;
  examName: string;
  examCode: string;
  submittedAt: string;
  autoScore: number;  // score from objective questions
  manualScore: number; // score from evaluated subjective questions
  totalPoints: number;
  status: 'Pending Review' | 'Graded';
  category: string;
}

export default function GradingResultsPage() {
  const [statusFilter, setStatusFilter] = useState<GradeStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('All');

  // Realistic mock data matching your teacher ecosystem
  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: 'sub-01',
      studentName: 'Alexander Wright',
      rollNumber: 'CS-2026-0042',
      examName: 'Introduction to Computer Science (Midterm)',
      examCode: 'CS101-MD',
      submittedAt: 'Today, 11:24 AM',
      autoScore: 45,
      manualScore: 38,
      totalPoints: 100,
      status: 'Graded',
      category: 'Computer Science'
    },
    {
      id: 'sub-02',
      studentName: 'Sarah Jenkins',
      rollNumber: 'CS-2026-0115',
      examName: 'Introduction to Computer Science (Midterm)',
      examCode: 'CS101-MD',
      submittedAt: 'Today, 11:10 AM',
      autoScore: 30,
      manualScore: 0,
      totalPoints: 100,
      status: 'Pending Review',
      category: 'Computer Science'
    },
    {
      id: 'sub-03',
      studentName: 'Marcus Chen',
      rollNumber: 'CS-2026-0089',
      examName: 'Introduction to Computer Science (Midterm)',
      examCode: 'CS101-MD',
      submittedAt: 'Today, 10:55 AM',
      autoScore: 50,
      manualScore: 42,
      totalPoints: 100,
      status: 'Graded',
      category: 'Computer Science'
    },
    {
      id: 'sub-04',
      studentName: 'Emily Ross',
      rollNumber: 'CS-2026-0201',
      examName: 'Advanced Data Structures Lab',
      examCode: 'CS302-LN',
      submittedAt: 'Yesterday',
      autoScore: 20,
      manualScore: 0,
      totalPoints: 50,
      status: 'Pending Review',
      category: 'Information Technology'
    },
    {
      id: 'sub-05',
      studentName: 'David Kim',
      rollNumber: 'CS-2026-0144',
      examName: 'Advanced Data Structures Lab',
      examCode: 'CS302-LN',
      submittedAt: 'Yesterday',
      autoScore: 20,
      manualScore: 25,
      totalPoints: 50,
      status: 'Graded',
      category: 'Information Technology'
    }
  ]);

  // Actions
  const handleReleaseGrades = () => {
    alert("All fully graded sheets for this selection have been securely dispatched to student portals.");
  };

  // Filter & Search Logic
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sub.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.examCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesExam = selectedExamFilter === 'All' || sub.examCode === selectedExamFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'pending' && sub.status === 'Pending Review') ||
                          (statusFilter === 'graded' && sub.status === 'Graded');

    return matchesSearch && matchesExam && matchesStatus;
  });

  // Aggregated breakdown metrics
  const totalPending = submissions.filter(s => s.status === 'Pending Review').length;
  const gradedSubmissions = submissions.filter(s => s.status === 'Graded');
  const classAveragePercentage = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((acc, curr) => acc + (((curr.autoScore + curr.manualScore) / curr.totalPoints) * 100), 0) / gradedSubmissions.length)
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-8 text-slate-900 space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase text-[#0B7A93] tracking-widest">Evaluation Desk</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Grading & Results</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Review script submissions, execute manual criteria scoring, and sign off on verified grades.
          </p>
        </div>
        <button 
          type="button" 
          onClick={handleReleaseGrades}
          className="bg-[#0B7A93] text-white text-xs font-bold px-5 py-3.5 rounded-xl hover:bg-[#09667c] transition-all shadow-sm flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Publish Released Grades
        </button>
      </div>

      {/* METRIC CARD INSIGHTS TRACKER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Scripts Received</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{submissions.length}</h3>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Requires Manual Review</span>
            <h3 className={`text-2xl font-extrabold mt-1 ${totalPending > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {totalPending}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${totalPending > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Class Average Calculation</span>
            <h3 className="text-2xl font-extrabold text-[#0B7A93] mt-1">{classAveragePercentage}%</h3>
          </div>
          <div className="p-3 bg-teal-50 text-[#0B7A93] rounded-xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        </div>
      </div>

      {/* TOOLBAR CONTROLS FILTER DECK */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        
        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 self-start w-full lg:w-auto">
          {(['all', 'pending', 'graded'] as GradeStatus[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`flex-grow lg:flex-grow-0 px-5 py-2.5 text-xs font-bold rounded-lg capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All Submissions' : `${tab} status`}
            </button>
          ))}
        </div>

        {/* Search Inputs & Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-grow sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text"
              placeholder="Search student name or index ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedExamFilter}
            onChange={(e) => setSelectedExamFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
          >
            <option value="All">All Assessment Series</option>
            <option value="CS101-MD">CS101-MD (Intro Midterm)</option>
            <option value="CS302-LN">CS302-LN (Data Structures Lab)</option>
          </select>
        </div>

      </div>

      {/* REPOSITORY EVALUATION LIST DATA SHEET */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No exam script submissions match the current criteria checklist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Student Meta</th>
                  <th className="py-4 px-6">Examination Scheme</th>
                  <th className="py-4 px-6 text-center">Auto Points</th>
                  <th className="py-4 px-6 text-center">Manual Points</th>
                  <th className="py-4 px-6 text-center">Net Score Weight</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Operational Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSubmissions.map((sub) => {
                  const netScore = sub.autoScore + sub.manualScore;
                  const passingRatio = netScore / sub.totalPoints >= 0.5;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/40 transition-colors group">
                      {/* Student Profile Block */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{sub.studentName}</div>
                        <div className="text-xs text-slate-400 font-medium mt-0.5">{sub.rollNumber}</div>
                      </td>

                      {/* Exam Name Reference */}
                      <td className="py-4 px-6">
                        <div className="text-slate-800 font-medium line-clamp-1 max-w-xs">{sub.examName}</div>
                        <div className="text-xs font-mono font-bold text-[#0B7A93] mt-0.5">{sub.examCode}</div>
                      </td>

                      {/* Auto Score Points */}
                      <td className="py-4 px-6 text-center font-semibold text-xs text-slate-500">
                        {sub.autoScore} pts
                      </td>

                      {/* Manual Evaluated Points */}
                      <td className="py-4 px-6 text-center text-xs">
                        {sub.status === 'Pending Review' ? (
                          <span className="text-amber-500 italic font-medium">Ungraded</span>
                        ) : (
                          <span className="font-semibold text-slate-500">{sub.manualScore} pts</span>
                        )}
                      </td>

                      {/* Combined Final Weight */}
                      <td className="py-4 px-6 text-center text-xs">
                        {sub.status === 'Pending Review' ? (
                          <span className="text-slate-400 font-medium">Incomplete</span>
                        ) : (
                          <span className={`font-bold ${passingRatio ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {netScore} / {sub.totalPoints} ({Math.round((netScore / sub.totalPoints) * 100)}%)
                          </span>
                        )}
                      </td>

                      {/* Status Checkbox Badge */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider border ${
                          sub.status === 'Graded'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {sub.status === 'Pending Review' ? 'Review Needed' : 'Evaluated'}
                        </span>
                      </td>

                      {/* CTA Action Modals */}
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                            sub.status === 'Pending Review'
                              ? 'bg-[#0d1527] border-[#0d1527] text-white hover:bg-[#1a253d]'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {sub.status === 'Pending Review' ? 'Grade Script' : 'Review Score'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}