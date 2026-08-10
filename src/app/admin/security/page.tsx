"use client";

import React, { useState } from "react";
import {
  Shield,
  Lock,
  Maximize2,
  Eye,
  Copy,
  Save,
  CheckCircle2,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default function AdminSecurityPage() {
  const [policies, setPolicies] = useState({
    fullscreenMode: true,
    tabFocusDetection: true,
    clipboardRestrictions: true,
    warningThreshold: "3",
    automatedSessionLock: true,
    allowTeacherCustomization: true,
  });

  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof policies) => {
    setPolicies((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <AdminTopbar
        title="Global Security Policies"
        description="Configure system-wide default proctoring policies and security guardrails enforced across all organizations."
      />

      <main className="p-6 space-y-6 font-sans">

      {/* PAGE ACTION ROW */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Saved Defaults</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save System Defaults</span>
            </>
          )}
        </button>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: DEFAULT ASSESSMENT GUARDRAILS */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Default Assessment Guardrails
            </h2>
          </div>

          <div className="space-y-3">
            {/* Fullscreen Mode */}
            <div
              onClick={() => handleToggle("fullscreenMode")}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Mandatory Fullscreen Mode
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Enforce compulsory full-screen mode by default on new examinations.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={policies.fullscreenMode}
                onChange={() => {}}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-1 cursor-pointer"
              />
            </div>

            {/* Tab Focus Detection */}
            <div
              onClick={() => handleToggle("tabFocusDetection")}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Tab & Window Focus Detection
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Track tab switching and window blurring events during active tests.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={policies.tabFocusDetection}
                onChange={() => {}}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-1 cursor-pointer"
              />
            </div>

            {/* Clipboard Restrictions */}
            <div
              onClick={() => handleToggle("clipboardRestrictions")}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Clipboard Restrictions
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Disable copy and paste functions inside exam text editors by default.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={policies.clipboardRestrictions}
                onChange={() => {}}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-1 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LOCK TRIGGER & TEACHER PERMISSIONS */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Lock Trigger & Teacher Permissions
            </h2>
          </div>

          <div className="space-y-3">
            {/* Warning Limit Threshold Dropdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                System Warning Limit Threshold
              </label>
              <p className="text-[11px] text-slate-500 font-medium">
                Maximum allowed security warnings before an exam session automatically locks.
              </p>
              <select
                value={policies.warningThreshold}
                onChange={(e) =>
                  setPolicies({ ...policies, warningThreshold: e.target.value })
                }
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-400 transition-all cursor-pointer"
              >
                <option value="1">1 Violation (Strict Lock)</option>
                <option value="2">2 Violations (Moderate)</option>
                <option value="3">3 Violations (Standard Default)</option>
                <option value="5">5 Violations (Lenient)</option>
              </select>
            </div>

            {/* Automated Session Lock */}
            <div
              onClick={() => handleToggle("automatedSessionLock")}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Automated Session Lock
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Automatically lock the student exam screen when the warning threshold is met.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policies.automatedSessionLock}
                onChange={() => {}}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-1 cursor-pointer"
              />
            </div>

            {/* Allow Teacher Customization */}
            <div
              onClick={() => handleToggle("allowTeacherCustomization")}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Allow Teacher Customization
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Permit teachers to adjust security parameters when configuring individual exams.
                </p>
              </div>
              <input
                type="checkbox"
                checked={policies.allowTeacherCustomization}
                onChange={() => {}}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 mt-1 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
      </main>
    </>
  );
}