"use client";

import React, { useState } from 'react';

export default function SettingsPage() {
  // Account Information State
  const [profile, setProfile] = useState({
    fullName: 'Professor Julian Vance',
    email: 'j.vance@university.edu',
    department: 'Computer Science & Engineering',
    facultyId: 'FAC-2026-8891',
  });

  // Global Assessment Default Configurations
  const [examDefaults, setExamDefaults] = useState({
    defaultDuration: 60,
    passingThreshold: 50,
    enableStrictProctoring: true,
    allowPartialGrading: true,
    autoBackupInterval: 5, // minutes
  });

  // Notification Sockets
  const [notifications, setNotifications] = useState({
    instantSubmissionAlerts: true,
    anomalyFlags: true,
    weeklyAnalyticsSummary: false,
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Configuration blueprint successfully committed to system cache.");
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-10 text-slate-900 space-y-10 animate-in fade-in duration-200">
      
      {/* HEADER ROW - Expanded padding and text sizes */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <span className="text-xs font-bold uppercase text-[#0B7A93] tracking-widest">System Configuration</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-2">Portal Settings</h2>
        <p className="text-slate-500 text-base mt-1.5">
          Tune your educator profile credentials, adjust runtime exam proctor parameters, and toggle platform alerts.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* LEFT & CENTER COLUMNS: CONFIGURATION MODULES */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* PROFILE CARD */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-400">Educator Profile Matrix</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Legal Full Name</label>
                <input 
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-5 py-4 text-sm font-semibold focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Academic Email Node</label>
                <input 
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-5 py-4 text-sm font-semibold focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Department Assignment</label>
                <input 
                  type="text"
                  value={profile.department}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-5 py-4 text-sm font-semibold cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Faculty Reference ID</label>
                <input 
                  type="text"
                  value={profile.facultyId}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl px-5 py-4 text-sm font-semibold cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* ASSESSMENT SYSTEM TEMPLATE DEFAULTS */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-400">Global Assessment Blueprints</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Default Duration (Mins)</label>
                <input 
                  type="number"
                  value={examDefaults.defaultDuration}
                  onChange={(e) => setExamDefaults({...examDefaults, defaultDuration: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Passing Threshold (%)</label>
                <input 
                  type="number"
                  value={examDefaults.passingThreshold}
                  onChange={(e) => setExamDefaults({...examDefaults, passingThreshold: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Backup Sync Loop (Mins)</label>
                <input 
                  type="number"
                  value={examDefaults.autoBackupInterval}
                  onChange={(e) => setExamDefaults({...examDefaults, autoBackupInterval: parseInt(e.target.value) || 5})}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-[#0B7A93] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* TOGGLE PARAMS - Scaled checkbox sizing and labels */}
            <div className="pt-6 space-y-5 border-t border-slate-100">
              <label className="flex items-start gap-4 cursor-pointer select-none group">
                <input 
                  type="checkbox"
                  checked={examDefaults.enableStrictProctoring}
                  onChange={(e) => setExamDefaults({...examDefaults, enableStrictProctoring: e.target.checked})}
                  className="w-5 h-5 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93] mt-0.5 transition-all"
                />
                <div>
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Enforce strict browser stream proctoring by default</span>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">Automatically isolates window focusing rules and logs interface breaches.</span>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer select-none group pt-2">
                <input 
                  type="checkbox"
                  checked={examDefaults.allowPartialGrading}
                  onChange={(e) => setExamDefaults({...examDefaults, allowPartialGrading: e.target.checked})}
                  className="w-5 h-5 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93] mt-0.5 transition-all"
                />
                <div>
                  <span className="block text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Allow structural partial points accumulation</span>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">Permits partial score evaluations on compound multiple-selection formats.</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SECURITY, ALERTS & ACTION HOOK */}
        <div className="space-y-10">
          
          {/* SYSTEM ALERTS SOCKET */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-400">Webhook Alert Relays</h3>
            
            <div className="space-y-5">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div>
                  <span className="block text-sm font-bold text-slate-700">Instant Submission Logs</span>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">Ping workspace when student returns paper.</span>
                </div>
                <input 
                  type="checkbox"
                  checked={notifications.instantSubmissionAlerts}
                  onChange={(e) => setNotifications({...notifications, instantSubmissionAlerts: e.target.checked})}
                  className="w-5 h-5 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93] transition-all"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none pt-4 border-t border-slate-100">
                <div>
                  <span className="block text-sm font-bold text-slate-700">Live Proctoring Anomalies</span>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">Flash indicators during tab-switching violations.</span>
                </div>
                <input 
                  type="checkbox"
                  checked={notifications.anomalyFlags}
                  onChange={(e) => setNotifications({...notifications, anomalyFlags: e.target.checked})}
                  className="w-5 h-5 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93] transition-all"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none pt-4 border-t border-slate-100">
                <div>
                  <span className="block text-sm font-bold text-slate-700">Weekly Performance Summaries</span>
                  <span className="block text-xs text-slate-400 font-medium mt-0.5">Email a matrix snapshot of completed classes.</span>
                </div>
                <input 
                  type="checkbox"
                  checked={notifications.weeklyAnalyticsSummary}
                  onChange={(e) => setNotifications({...notifications, weeklyAnalyticsSummary: e.target.checked})}
                  className="w-5 h-5 rounded text-[#0B7A93] border-slate-300 focus:ring-[#0B7A93] transition-all"
                />
              </label>
            </div>
          </div>

          {/* SYSTEM COMMIT ACTIONS */}
          <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-2xl space-y-5">
            <div className="text-xs text-slate-500 font-semibold leading-relaxed">
              Modifying these parameter boundaries affects global defaults inside active creation cards. Make sure configurations match institution constraints.
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                className="w-full bg-[#0B7A93] text-white font-bold text-sm py-4 px-5 rounded-xl hover:bg-[#09667c] transition-all shadow-sm text-center"
              >
                Save Configuration Logs
              </button>
              <button 
                type="button"
                onClick={() => window.location.reload()}
                className="w-full bg-white text-slate-600 border border-slate-200 font-bold text-sm py-4 px-5 rounded-xl hover:bg-slate-100 transition-all text-center"
              >
                Reset Layout Defaults
              </button>
            </div>
          </div>

        </div>

      </form>

    </div>
  );
}