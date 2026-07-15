"use client";

import React, { useState } from 'react';

export default function AdminSecurity() {
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
    alert('Security settings updated successfully!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Security Configuration</h2>
        <p className="text-gray-500 mt-1 text-sm">Configure global anti-cheating mechanisms for all active exams.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-8">
        
        {/* Toggles Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Detection Mechanisms</h3>
          
          {[
            { id: 'fullscreenRequired', label: 'Enforce Fullscreen Mode', desc: 'Require students to stay in fullscreen during exams.' },
            { id: 'tabDetection', label: 'Tab Switching Detection', desc: 'Detect when a student navigates away from the active exam tab.' },
            { id: 'copyPasteDetection', label: 'Copy/Paste Detection', desc: 'Prevent copying questions or pasting external text into answers.' },
            { id: 'multipleTabDetection', label: 'Multiple Tab Detection', desc: 'Prevent opening the exam simultaneously in different tabs.' },
          ].map((feature) => (
            <div key={feature.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{feature.label}</p>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(feature.id as keyof typeof settings)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1E7DF8] focus:ring-offset-2 ${settings[feature.id as keyof typeof settings] ? 'bg-[#1E7DF8]' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings[feature.id as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* Rules Section */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Warning & Lock Rules</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Violation Warning Limit</label>
            <p className="text-sm text-gray-500 mb-2">Number of warnings before the system automatically locks the exam session.</p>
            <input
              type="number"
              min="1"
              max="5"
              value={settings.warningLimit}
              onChange={(e) => setSettings({ ...settings, warningLimit: parseInt(e.target.value) })}
              className="mt-1 block w-32 px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
            />
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" className="px-6 py-3 bg-[#1E7DF8] text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
            Save Configurations
          </button>
        </div>
      </form>
    </div>
  );
}