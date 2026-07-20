"use client";

import React, { useState } from 'react';

type MonitorStatus = 'all' | 'active' | 'flagged' | 'completed';

interface StudentStream {
  id: string;
  name: string;
  rollNumber: string;
  progress: number; // percentage completed
  status: 'Online' | 'Tab Switched' | 'Disconnected' | 'Finished';
  flagsCount: number;
  ipAddress: string;
  startedAt: string;
}

export default function LiveMonitoringPage() {
  const [selectedExam, setSelectedExam] = useState('CS101-MID');
  const [statusFilter, setStatusFilter] = useState<MonitorStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Realistic mock data matching the active stream view from your dashboard
  const [students, setStudents] = useState<StudentStream[]>([
    {
      id: 'st-01',
      name: 'Alexander Wright',
      rollNumber: 'CS-2026-0042',
      progress: 68,
      status: 'Online',
      flagsCount: 0,
      ipAddress: '192.168.1.104',
      startedAt: '10:02 AM'
    },
    {
      id: 'st-02',
      name: 'Sarah Jenkins',
      rollNumber: 'CS-2026-0115',
      progress: 45,
      status: 'Tab Switched',
      flagsCount: 3,
      ipAddress: '172.56.21.99',
      startedAt: '10:05 AM'
    },
    {
      id: 'st-03',
      name: 'Marcus Chen',
      rollNumber: 'CS-2026-0089',
      progress: 92,
      status: 'Online',
      flagsCount: 0,
      ipAddress: '192.168.1.112',
      startedAt: '10:00 AM'
    },
    {
      id: 'st-04',
      name: 'Emily Ross',
      rollNumber: 'CS-2026-0201',
      progress: 100,
      status: 'Finished',
      flagsCount: 1,
      ipAddress: '108.45.162.4',
      startedAt: '10:01 AM'
    },
    {
      id: 'st-05',
      name: 'David Kim',
      rollNumber: 'CS-2026-0144',
      progress: 12,
      status: 'Disconnected',
      flagsCount: 0,
      ipAddress: 'unknown',
      startedAt: '10:15 AM'
    }
  ]);

  // Handle mock alerts / actions
  const handlePingStudent = (name: string) => {
    alert(`Sent real-time system warning notification to ${name}.`);
  };

  const handleForceSubmit = (name: string) => {
    const confirmSubmit = confirm(`Are you sure you want to forcibly submit the exam session for ${name}? This action cannot be undone.`);
    if (confirmSubmit) {
      alert(`Session terminated. Paper submitted automatically for ${name}.`);
    }
  };

  // Filter & Search Logic
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'active') return student.status === 'Online';
    if (statusFilter === 'flagged') return student.flagsCount > 0 || student.status === 'Tab Switched';
    if (statusFilter === 'completed') return student.status === 'Finished';
    return true;
  });

  const getStatusBadge = (status: StudentStream['status']) => {
    switch (status) {
      case 'Online':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Focus
          </span>
        );
      case 'Tab Switched':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Focus Lost
          </span>
        );
      case 'Disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Offline
          </span>
        );
      case 'Finished':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Submitted
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-8 text-slate-900 space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase text-[#0B7A93] tracking-widest">Live Engine</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Live Active Stream Monitoring</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Observing concurrent student browser connection integrity and proctor flags.
          </p>
        </div>

        {/* ACTIVE EXAM RUN SELECTOR */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap hidden sm:inline">Active Run:</label>
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
          >
            <option value="CS101-MID">Introduction to Computer Science (Midterm)</option>
            <option value="CS302-FIN">Advanced Software Engineering Frameworks</option>
          </select>
        </div>
      </div>

      {/* CORE RUNTIME OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Enrolled</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{students.length}</h3>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Connected Active</span>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {students.filter(s => s.status === 'Online').length}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Integrity Incidents</span>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
              {students.filter(s => s.status === 'Tab Switched' || s.flagsCount > 0).length}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Finished Returns</span>
            <h3 className="text-2xl font-extrabold text-slate-500 mt-1">
              {students.filter(s => s.status === 'Finished').length}
            </h3>
          </div>
          <div className="p-3 bg-slate-100 text-slate-500 rounded-xl">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
          </div>
        </div>
      </div>

      {/* FILTER TOOLBAR CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Status Segmented Controls */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 w-full sm:w-auto">
          {(['all', 'active', 'flagged', 'completed'] as MonitorStatus[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`flex-grow sm:flex-grow-0 px-4 py-2.5 text-xs font-bold rounded-lg capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All Connections' : `${tab} profiles`}
            </button>
          ))}
        </div>

        {/* Real-time Search Box */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text"
            placeholder="Search student name or roll ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* LIVE MONITORED ROSTER LIST */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            No live students match the selected filter query criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <div 
                key={student.id} 
                className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-50/50 transition-all"
              >
                {/* Meta details */}
                <div className="flex items-start gap-4 min-w-[280px]">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">{student.rollNumber}</p>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                      IP: {student.ipAddress}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="w-36 flex items-center">
                  {getStatusBadge(student.status)}
                </div>

                {/* Progress Visualizer Bar */}
                <div className="flex-grow max-w-xs space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Sheet Progress</span>
                    <span>{student.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        student.status === 'Finished' 
                          ? 'bg-slate-400' 
                          : student.status === 'Tab Switched' 
                            ? 'bg-amber-400' 
                            : 'bg-[#0B7A93]'
                      }`}
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>

                {/* Integrity Log Metrics */}
                <div className="w-28 text-left lg:text-center">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">Proctor Flags</span>
                  <span className={`text-xs font-bold mt-1 inline-block ${student.flagsCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {student.flagsCount === 0 ? '0 Flags Logged' : `${student.flagsCount} Violations`}
                  </span>
                </div>

                {/* Context Real-Time Controls */}
                <div className="flex items-center justify-end gap-2 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <button 
                    type="button"
                    onClick={() => handlePingStudent(student.name)}
                    disabled={student.status === 'Finished' || student.status === 'Disconnected'}
                    className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Send Warning
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleForceSubmit(student.name)}
                    disabled={student.status === 'Finished'}
                    className="px-4 py-2 text-xs font-bold bg-rose-50 border border-rose-100 rounded-xl text-rose-700 hover:bg-rose-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Force Submit
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER VAULT FEEDBACK */}
      <div className="text-xs text-slate-400 font-medium flex justify-between items-center bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
        <span>Dynamic continuous stream pulling operational data sockets.</span>
        <span>Secure Session ID: <b>{selectedExam}</b></span>
      </div>

    </div>
  );
}