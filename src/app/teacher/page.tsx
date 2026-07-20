"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ActiveExam {
  id: string;
  code: string;
  course: string;
  title: string;
  duration: string;
  questions: number;
  studentsConnected: string;
  totalStudents: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  
  // Local state for active running exams
  const [activeExams, setActiveExams] = useState<ActiveExam[]>([
    {
      id: 'active-1',
      code: 'CS101-MID',
      course: 'CS101',
      title: 'Introduction to Computer Science (Midterm)',
      duration: '60 mins',
      questions: 30,
      studentsConnected: '45',
      totalStudents: '50'
    },
    {
      id: 'active-2',
      code: 'DS-QZ3',
      course: 'CS204',
      title: 'Data Structures & Algorithms Quiz 3',
      duration: '45 mins',
      questions: 15,
      studentsConnected: '22',
      totalStudents: '25'
    }
  ]);

  // Load dynamically added exams from localStorage if they are active
  useEffect(() => {
    const rawData = localStorage.getItem('localExamsData');
    if (rawData) {
      try {
        const currentExams = JSON.parse(rawData);
        // If there's an active list in local storage, we sync it
        if (currentExams.active && currentExams.active.length > 0) {
          setActiveExams(currentExams.active);
        }
      } catch (e) {
        console.error("Failed to parse local dashboard exam data", e);
      }
    }
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 p-6 text-slate-900 animate-in fade-in duration-200">
      
      {/* WELCOME BANNER AREA */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#0B7A93] tracking-wider">Workspace Hub</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Teacher Dashboard Overview</h2>
          <p className="text-slate-400 text-xs mt-0.5">Welcome back! Here is a running analytical snapshot of your current courses.</p>
        </div>
        <button 
          onClick={() => router.push('/teacher/exams/new')}
          className="bg-[#0B7A93] hover:bg-[#09667c] text-white text-xs font-bold px-5 py-3 rounded-xl shadow-sm transition-all"
        >
          + Create New Exam
        </button>
      </div>

      {/* 1. QUICK METRICS STATISTICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Live Exam Sessions</span>
            <span className="text-base">📡</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeExams.length}</span>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">Active Now</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Active Students</span>
            <span className="text-base">👥</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">67</span>
            <span className="text-[10px] text-slate-400">across streams</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Pending Evaluations</span>
            <span className="text-base">📝</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">12</span>
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">Requires Grading</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Question Bank Sheets</span>
            <span className="text-base">🗂️</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">148</span>
            <span className="text-[10px] text-slate-400">indexed entries</span>
          </div>
        </div>

      </div>

      {/* 2. QUICK SHORTCUT PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Quick Navigation Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button 
            onClick={() => router.push('/teacher/exams')}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all text-left"
          >
            <span className="p-2 rounded-lg bg-teal-50 text-[#0B7A93] text-sm font-bold">📄</span>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Manage Full Repository</span>
              <span className="text-[10px] text-slate-400">View all past and upcoming tests</span>
            </div>
          </button>

          <button 
            onClick={() => router.push('/teacher/question-bank')}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all text-left"
          >
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-bold">📂</span>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Open Question Bank</span>
              <span className="text-[10px] text-slate-400">Configure reused section forms</span>
            </div>
          </button>

          <button 
            onClick={() => router.push('/teacher/grading')}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all text-left"
          >
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600 text-sm font-bold">🎯</span>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Review Student Submissions</span>
              <span className="text-[10px] text-slate-400">12 items pending automated check</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. CORE REAL-TIME RUNNING EXAMS STATUS */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Active Stream Monitoring</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Currently open exam test portals running concurrent student browser connections.</p>
        </div>

        <div className="space-y-3">
          {activeExams.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <span className="text-slate-300 text-xl block mb-1">📭</span>
              <p className="text-xs text-slate-400 font-medium">No live exam streams currently processing connections.</p>
            </div>
          ) : (
            activeExams.map((exam) => (
              <div 
                key={exam.id} 
                className="p-5 border border-slate-100 bg-white rounded-xl shadow-sm hover:border-slate-200 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      {exam.course}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Duration: {exam.duration} • {exam.questions} Questions
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{exam.title}</h4>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Access Join Code:</span>
                    <span className="bg-teal-50 border border-teal-100/80 text-[#0B7A93] px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                      {exam.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-bold text-slate-800 block">
                      {exam.studentsConnected}/{exam.totalStudents} Active
                    </span>
                    <span className="text-[10px] text-emerald-500 font-medium tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Streams connected
                    </span>
                  </div>
                  <button 
                    onClick={() => router.push(`/teacher/monitor/${exam.id}`)}
                    className="bg-[#0B7A93] hover:bg-[#09667c] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm"
                  >
                    Launch Live Monitor
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}