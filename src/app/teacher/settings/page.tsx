"use client";

import React, { useState } from "react";
import {
  User,
  Building2,
  Sliders,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Globe,
  Award,
  KeyRound,
  Check,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "organization" | "assessment" | "alerts" | "security"
  >("profile");

  // Account Information State
  const [profile, setProfile] = useState({
    fullName: "Professor Julian Vance",
    email: "j.vance@university.edu",
    department: "Computer Science & Engineering",
    facultyId: "FAC-2026-8891",
    title: "Senior Lecturer & Exam Director",
  });

  // Organization & Campus State
  const [organization, setOrganization] = useState({
    institutionName: "Faculty of Computer Science & Engineering",
    universityDomain: "university.edu",
    currentTerm: "Fall Semester 2026-2027",
    ssoEnabled: true,
    campusCode: "MAIN-CAMPUS-01",
  });

  // Global Assessment Default Configurations
  const [examDefaults, setExamDefaults] = useState({
    defaultDuration: 60,
    passingThreshold: 50,
    enableStrictProctoring: true,
    allowPartialGrading: true,
    autoBackupInterval: 5,
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

  const handleResetDefaults = () => {
    setProfile({
      fullName: "Professor Julian Vance",
      email: "j.vance@university.edu",
      department: "Computer Science & Engineering",
      facultyId: "FAC-2026-8891",
      title: "Senior Lecturer & Exam Director",
    });
    setExamDefaults({
      defaultDuration: 60,
      passingThreshold: 50,
      enableStrictProctoring: true,
      allowPartialGrading: true,
      autoBackupInterval: 5,
    });
    setNotifications({
      instantSubmissionAlerts: true,
      anomalyFlags: true,
      weeklyAnalyticsSummary: false,
    });
  };

  const tabs = [
    { id: "profile", label: "Educator Profile" },
    { id: "organization", label: "Organization & Campus" },
    { id: "assessment", label: "Assessment Blueprints" },
    { id: "alerts", label: "Alerts & Webhooks" },
    { id: "security", label: "Security & Authentication" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
            Institutional Governance
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Settings & Governance
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Manage your institutional parameters, educator profile, runtime defaults, and notification relays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configuration Saved!</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            className="bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* UNDERLINE TAB NAVIGATION */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-4 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                isActive
                  ? "text-slate-900 border-b-2 border-sky-400"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB FORM CONTENT CARDS */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* TAB 1: EDUCATOR PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Educator Profile Matrix
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Legal Full Name
                </label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Academic Email Node
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty Role Title
                </label>
                <input
                  type="text"
                  value={profile.title}
                  onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Faculty Reference ID
                </label>
                <input
                  type="text"
                  value={profile.facultyId}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-not-allowed font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORGANIZATION & CAMPUS */}
        {activeTab === "organization" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Institutional Hierarchy
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty / Institution Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={organization.institutionName}
                    onChange={(e) =>
                      setOrganization({ ...organization, institutionName: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all pr-9"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Active Academic Term
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={organization.currentTerm}
                    onChange={(e) =>
                      setOrganization({ ...organization, currentTerm: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all pr-9"
                  />
                  <Award className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Primary Department Assignment
                </label>
                <input
                  type="text"
                  value={profile.department}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Campus Identifier Code
                </label>
                <input
                  type="text"
                  value={organization.campusCode}
                  disabled
                  className="w-full bg-slate-50 border border-slate-200 text-slate-400 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-not-allowed font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Enforce Institutional SSO Domain Verification
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Restrict exam access strictly to <span className="font-mono font-bold text-slate-800">@{organization.universityDomain}</span> emails.
                </p>
              </div>
              <input
                type="checkbox"
                checked={organization.ssoEnabled}
                onChange={(e) =>
                  setOrganization({ ...organization, ssoEnabled: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 shrink-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 3: ASSESSMENT BLUEPRINTS */}
        {activeTab === "assessment" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Global Assessment Blueprints
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Default Duration (Mins)
                </label>
                <input
                  type="number"
                  value={examDefaults.defaultDuration}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      defaultDuration: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Passing Threshold (%)
                </label>
                <input
                  type="number"
                  value={examDefaults.passingThreshold}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      passingThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Backup Sync Loop (Mins)
                </label>
                <input
                  type="number"
                  value={examDefaults.autoBackupInterval}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      autoBackupInterval: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            <div className="pt-3 space-y-3 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={examDefaults.enableStrictProctoring}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      enableStrictProctoring: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    Enforce strict browser stream proctoring by default
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                    Automatically isolates window focusing rules and logs interface breaches.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none group pt-1">
                <input
                  type="checkbox"
                  checked={examDefaults.allowPartialGrading}
                  onChange={(e) =>
                    setExamDefaults({
                      ...examDefaults,
                      allowPartialGrading: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="block text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    Allow structural partial points accumulation
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
                    Permits partial score evaluations on compound multiple-selection formats.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: ALERTS & WEBHOOKS */}
        {activeTab === "alerts" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Webhook Alert Relays
              </h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer select-none gap-3">
                <div>
                  <span className="block text-xs font-bold text-slate-900">
                    Instant Submission Logs
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
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
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none gap-3 pt-3 border-t border-slate-100">
                <div>
                  <span className="block text-xs font-bold text-slate-900">
                    Live Proctoring Anomalies
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
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
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer select-none gap-3 pt-3 border-t border-slate-100">
                <div>
                  <span className="block text-xs font-bold text-slate-900">
                    Weekly Performance Summaries
                  </span>
                  <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
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
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 cursor-pointer shrink-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: SECURITY & AUTHENTICATION */}
        {activeTab === "security" && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Security & Authentication Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Master Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all pr-9"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="hidden sm:block"></div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Passkey Secret
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Passkey
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Parameter changes automatically sync with institution server policies.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex-1 sm:flex-initial bg-white text-slate-700 border border-slate-200 font-semibold text-xs py-2 px-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-initial bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}