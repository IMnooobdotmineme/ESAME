"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Maximize,
  AppWindow,
  Copy,
  Layers,
  AlertTriangle,
  Save,
} from "lucide-react";

export default function AdminSecurityPage() {
  const [settings, setSettings] = useState({
    fullscreenRequired: true,
    tabDetection: true,
    copyPasteDetection: true,
    multipleTabDetection: true,
    warningLimit: 2,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Security configurations saved successfully!");
  };

  const securityFeatures = [
    {
      id: "fullscreenRequired",
      label: "Enforce Fullscreen Mode",
      desc: "Require students to remain in dedicated fullscreen mode during exams.",
      icon: Maximize,
    },
    {
      id: "tabDetection",
      label: "Tab Switching Detection",
      desc: "Flag and record instances when students navigate away from the active exam.",
      icon: AppWindow,
    },
    {
      id: "copyPasteDetection",
      label: "Copy / Paste Interception",
      desc: "Disable context menus, copying questions, or pasting external clipboard text.",
      icon: Copy,
    },
    {
      id: "multipleTabDetection",
      label: "Multiple Device / Tab Prevention",
      desc: "Prevent concurrent exam attempts on different browsers or devices.",
      icon: Layers,
    },
  ];

  return (
    /* Added mx-auto here to center the container within the page body */
    <div className="space-y-6 font-sans animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* PAGE HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-[#D5DEEF]">
        <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
          GLOBAL RULES
        </span>
        <h2 className="text-2xl font-black text-[#395886] tracking-tight">
          Security Configuration
        </h2>
        <p className="text-xs font-medium text-slate-400 mt-0.5">
          Configure anti-cheating protocols and automated session response
          triggers.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-[#D5DEEF] space-y-8"
      >
        {/* DETECTION TOGGLES */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-[#D5DEEF] pb-3">
            <ShieldCheck className="w-5 h-5 text-[#395886]" />
            <h3 className="text-base font-black text-[#395886]">
              Proctoring & Detection Controls
            </h3>
          </div>

          <div className="space-y-4">
            {securityFeatures.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = settings[feature.id as keyof typeof settings];

              return (
                <div
                  key={feature.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-2xl hover:bg-[#F0F3FA]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-[#F0F3FA] rounded-xl text-[#395886] mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#395886] text-sm">
                        {feature.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>

                  {/* Custom Palette Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      handleToggle(feature.id as keyof typeof settings)
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? "bg-[#395886]" : "bg-[#D5DEEF]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* WARNING RULES */}
        <div className="space-y-4 pt-6 border-t border-[#D5DEEF]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-[#395886]">
              Session Interception & Lock Thresholds
            </h3>
          </div>

          <div className="bg-[#F0F3FA]/60 p-6 rounded-2xl border border-[#D5DEEF] space-y-3">
            <label className="block text-xs font-bold text-[#395886]">
              Violation Warning Limit
            </label>
            <p className="text-xs text-slate-400 font-medium">
              Maximum allowable infractions before the platform automatically
              locks the exam and notifies the proctor.
            </p>
            <input
              type="number"
              min="1"
              max="5"
              value={settings.warningLimit}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  warningLimit: parseInt(e.target.value) || 1,
                })
              }
              className="w-32 px-4 py-2.5 bg-white border border-[#D5DEEF] rounded-xl text-[#395886] font-bold text-xs focus:outline-none focus:border-[#395886] focus:ring-2 focus:ring-[#395886] transition-all"
            />
          </div>
        </div>

        {/* SUBMIT */}
        <div className="pt-4 border-t border-[#D5DEEF] flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#395886] hover:bg-[#2e476d] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configurations
          </button>
        </div>
      </form>
    </div>
  );
}