"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Building,
  ShieldCheck,
  Sliders,
  Clock,
  Percent,
  RefreshCw,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  KeyRound,
  Eye,
  Layers,
} from "lucide-react";

export default function SettingsPage() {
  // Account Information State
  const [profile, setProfile] = useState({
    fullName: "Professor Julian Vance",
    email: "j.vance@university.edu",
    department: "Computer Science & Engineering",
    facultyId: "FAC-2026-8891",
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

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER CARD */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black tracking-wider text-sky-700 uppercase block mb-1">
            SYSTEM CONFIGURATION
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">
            Portal Settings
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Tune your educator profile credentials, adjust runtime exam proctor parameters, and toggle platform alerts.
          </p>
        </div>

        {savedSuccess && (
          <div className="bg-sky-50 border border-slate-200 text-navy-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-navy-900" />
            <span>Settings committed to active session cache!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT & CENTER COLUMNS: CONFIGURATION MODULES */}
        <div className="lg:col-span-2 space-y-6">
          {/* PROFILE CARD */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D5DEEF] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#D5DEEF] pb-4">
              <User className="w-4 h-4 text-sky-700" />
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Educator Profile Matrix
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Legal Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl px-4 py-3 text-xs font-semibold text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Academic Email Node
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl px-4 py-3 text-xs font-semibold text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Department Assignment
                </label>
                <input
                  type="text"
                  value={profile.department}
                  disabled
                  className="w-full bg-sky-50 border border-slate-200 text-slate-400 rounded-xl px-4 py-3 text-xs font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Faculty Reference ID
                </label>
                <input
                  type="text"
                  value={profile.facultyId}
                  disabled
                  className="w-full bg-[#F0F3FA] border border-[#D5DEEF] text-slate-400 rounded-xl px-4 py-3 text-xs font-semibold cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>

          {/* ASSESSMENT SYSTEM TEMPLATE DEFAULTS */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D5DEEF] shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#D5DEEF] pb-4">
              <Sliders className="w-4 h-4 text-sky-700" />
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Global Assessment Blueprints
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Default Duration (Mins)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={examDefaults.defaultDuration}
                    onChange={(e) =>
                      setExamDefaults({
                        ...examDefaults,
                        defaultDuration: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl px-4 py-3 text-xs font-bold text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Passing Threshold (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={examDefaults.passingThreshold}
                    onChange={(e) =>
                      setExamDefaults({
                        ...examDefaults,
                        passingThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl px-4 py-3 text-xs font-bold text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Backup Sync Loop (Mins)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={examDefaults.autoBackupInterval}
                    onChange={(e) =>
                      setExamDefaults({
                        ...examDefaults,
                        autoBackupInterval: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-full bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl px-4 py-3 text-xs font-bold text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* TOGGLE PARAMS */}
            <div className="pt-4 space-y-4 border-t border-[#D5DEEF]">
              <label className="flex items-start gap-3.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={examDefaults.enableStrictProctoring}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      enableStrictProctoring: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-[#D5DEEF] focus:ring-[#395886] mt-0.5 transition-all accent-[#395886]"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800 group-hover:text-[#395886] transition-colors">
                    Enforce strict browser stream proctoring by default
                  </span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                    Automatically isolates window focusing rules and logs interface breaches.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3.5 cursor-pointer select-none group pt-2">
                <input
                  type="checkbox"
                  checked={examDefaults.allowPartialGrading}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      allowPartialGrading: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-[#D5DEEF] focus:ring-[#395886] mt-0.5 transition-all accent-[#395886]"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-800 group-hover:text-[#395886] transition-colors">
                    Allow structural partial points accumulation
                  </span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                    Permits partial score evaluations on compound multiple-selection formats.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SECURITY, ALERTS & ACTION HOOK */}
        <div className="space-y-6">
          {/* SYSTEM ALERTS SOCKET */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D5DEEF] shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-[#D5DEEF] pb-4">
              <Bell className="w-4 h-4 text-[#638ECB]" />
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Webhook Alert Relays
              </h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer select-none gap-3">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Instant Submission Logs
                  </span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                    Ping workspace when student returns paper.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.instantSubmissionAlerts}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      instantSubmissionAlerts: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-[#D5DEEF] focus:ring-[#395886] transition-all accent-[#395886] shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none gap-3 pt-3 border-t border-[#D5DEEF]">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Live Proctoring Anomalies
                  </span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                    Flash indicators during tab-switching violations.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.anomalyFlags}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      anomalyFlags: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-[#D5DEEF] focus:ring-[#395886] transition-all accent-[#395886] shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none gap-3 pt-3 border-t border-[#D5DEEF]">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    Weekly Performance Summaries
                  </span>
                  <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
                    Email a matrix snapshot of completed classes.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyAnalyticsSummary}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      weeklyAnalyticsSummary: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-[#D5DEEF] focus:ring-[#395886] transition-all accent-[#395886] shrink-0"
                />
              </label>
            </div>
          </div>

          {/* SYSTEM COMMIT ACTIONS */}
          <div className="bg-[#F0F3FA]/70 border border-[#D5DEEF] p-6 rounded-3xl space-y-4">
            <div className="flex gap-2 text-xs text-slate-500 font-medium leading-relaxed">
              <Info className="w-4 h-4 text-[#638ECB] shrink-0 mt-0.5" />
              <span>
                Modifying parameter boundaries affects global defaults inside active creation cards. Make sure configurations match institution constraints.
              </span>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                className="w-full bg-[#395886] hover:bg-[#2e476d] text-white font-bold text-xs py-3.5 px-5 rounded-xl transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration Logs</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full bg-white text-slate-600 border border-[#D5DEEF] font-bold text-xs py-3.5 px-5 rounded-xl hover:bg-[#F0F3FA] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                <span>Reset Layout Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}