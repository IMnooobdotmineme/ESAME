"use client";

import React, { useState } from 'react';

const mockLogs = [
  { id: 101, type: 'Security', message: 'Exam locked for Student ID: 2024-091 due to 3rd tab-switching violation.', timestamp: '2026-07-15 09:42:15 AM' },
  { id: 102, type: 'Login', message: 'User sharding@school.org logged in successfully.', timestamp: '2026-07-15 09:15:02 AM' },
  { id: 103, type: 'System', message: 'New organization "MIT" registration submitted and pending approval.', timestamp: '2026-07-14 14:22:10 PM' },
  { id: 104, type: 'Error', message: 'Failed to connect to Cloudinary API during image upload.', timestamp: '2026-07-14 10:05:33 AM' },
];

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Login', 'Security', 'System', 'Error'];

  const filteredLogs = activeTab === 'All' 
    ? mockLogs 
    : mockLogs.filter(log => log.type === activeTab);

  const getLogColor = (type: string) => {
    switch(type) {
      case 'Security': return 'text-orange-600 bg-orange-100';
      case 'Error': return 'text-red-600 bg-red-100';
      case 'Login': return 'text-green-600 bg-green-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
        <p className="text-gray-500 mt-1 text-sm">Monitor system events, user logins, and security violations.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === tab ? 'text-[#1E7DF8] border-b-2 border-[#1E7DF8]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab} Logs
            </button>
          ))}
        </div>

        {/* Log List */}
        <div className="divide-y divide-gray-100">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold ${getLogColor(log.type)}`}>
                  {log.type}
                </span>
                <p className="text-sm text-gray-800 font-medium">{log.message}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{log.timestamp}</span>
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No logs found for this category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}