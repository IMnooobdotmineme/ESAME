"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Maximize2,
  Copy,
  Eye,
  AlertTriangle,
  Save,
  CheckCircle2,
  Sliders,
} from "lucide-react";

interface GlobalSecurityPolicy {
  enableFullscreenDefault: boolean;
  enableTabDetectionDefault: boolean;
  enableClipboardBlockDefault: boolean;
  maxWarningThreshold: number;
  autoLockOnThreshold: boolean;
  allowTeacherOverrides: boolean;
}

export default function AdminSecurityPage() {
  const [policy, setPolicy] = useState<GlobalSecurityPolicy>({
    enableFullscreenDefault: true,
    enableTabDetectionDefault: true,
    enableClipboardBlockDefault: true,
    maxWarningThreshold: 3,
    autoLockOnThreshold: true,
    allowTeacherOverrides: true,
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSavePolicy = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl min-h-screen text-slate-800">
      {/* FLAT PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D5DEEF]/60">
        <div>
          <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
            PLATFORM GOVERNANCE
          </span>
          <h1 className="text-2xl font-black text-[#395886] tracking-tight">
            Global Security Policies
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Configure system-wide default proctoring policies and security guardrails enforced across all organizations[cite: 1].
          </p>
        </div>

        <button
          onClick={handleSavePolicy}
          className="px-4 py-2.5 bg-[#395886] hover:bg-[#2e476d] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Policies Updated!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save System Defaults</span>
            </>
          )}
        </button>
      </div>

      {/* POLICY CONFIGURATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DEFAULT ANTI-CHEATING TOGGLES */}
        <div className="bg-white p-6 rounded-2xl border border-[#D5DEEF] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#D5DEEF] pb-3">
            <ShieldCheck className="w-5 h-5 text-[#395886]" />
            <h2 className="text-sm font-black text-[#395886]">
              Default Assessment Guardrails
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/30 cursor-pointer hover:bg-[#F0F3FA] transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 text-[#395886]" />
                  <span className="text-xs font-black text-[#395886]">
                    Mandatory Fullscreen Mode
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Enforce compulsory full-screen mode by default on new examinations[cite: 1].
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.enableFullscreenDefault}
                onChange={(e) =>
                  setPolicy({ ...policy, enableFullscreenDefault: e.target.checked })
                }
                className="accent-[#395886] w-4 h-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/30 cursor-pointer hover:bg-[#F0F3FA] transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-[#395886]" />
                  <span className="text-xs font-black text-[#395886]">
                    Tab & Window Focus Detection
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Track tab switching and window blurring events during active tests[cite: 1].
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.enableTabDetectionDefault}
                onChange={(e) =>
                  setPolicy({ ...policy, enableTabDetectionDefault: e.target.checked })
                }
                className="accent-[#395886] w-4 h-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/30 cursor-pointer hover:bg-[#F0F3FA] transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-[#395886]" />
                  <span className="text-xs font-black text-[#395886]">
                    Clipboard Restrictions
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Disable copy and paste functions inside exam text editors by default[cite: 1].
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.enableClipboardBlockDefault}
                onChange={(e) =>
                  setPolicy({ ...policy, enableClipboardBlockDefault: e.target.checked })
                }
                className="accent-[#395886] w-4 h-4 mt-1"
              />
            </label>
          </div>
        </div>

        {/* THRESHOLD & OVERRIDE RULES */}
        <div className="bg-white p-6 rounded-2xl border border-[#D5DEEF] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#D5DEEF] pb-3">
            <Lock className="w-5 h-5 text-[#395886]" />
            <h2 className="text-sm font-black text-[#395886]">
              Lock Trigger & Teacher Permissions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/30 space-y-2">
              <label className="text-xs font-black text-[#395886] block">
                System Warning Limit Threshold
              </label>
              <p className="text-[11px] font-medium text-slate-500">
                Maximum allowed security warnings before an exam session automatically locks[cite: 1].
              </p>
              <select
                value={policy.maxWarningThreshold}
                onChange={(e) =>
                  setPolicy({ ...policy, maxWarningThreshold: Number(e.target.value) })
                }
                className="w-full p-2.5 bg-white border border-[#D5DEEF] rounded-xl text-xs font-bold text-[#395886] focus:outline-none"
              >
                <option value={1}>1 Violation (Strict Lock)</option>
                <option value={2}>2 Violations</option>
                <option value={3}>3 Violations (Standard Default)[cite: 1]</option>
                <option value={5}>5 Violations (Relaxed)</option>
              </select>
            </div>

            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/30 cursor-pointer hover:bg-[#F0F3FA] transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#395886]">
                  Automated Session Lock
                </span>
                <p className="text-[11px] font-medium text-slate-500">
                  Automatically lock the student exam screen when the warning threshold is met[cite: 1].
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.autoLockOnThreshold}
                onChange={(e) =>
                  setPolicy({ ...policy, autoLockOnThreshold: e.target.checked })
                }
                className="accent-[#395886] w-4 h-4 mt-1"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-[#D5DEEF] bg-[#F0F3FA]/30 cursor-pointer hover:bg-[#F0F3FA] transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-[#395886]">
                  Allow Teacher Customization
                </span>
                <p className="text-[11px] font-medium text-slate-500">
                  Permit teachers to adjust security parameters when configuring individual exams[cite: 1].
                </p>
              </div>
              <input
                type="checkbox"
                checked={policy.allowTeacherOverrides}
                onChange={(e) =>
                  setPolicy({ ...policy, allowTeacherOverrides: e.target.checked })
                }
                className="accent-[#395886] w-4 h-4 mt-1"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}