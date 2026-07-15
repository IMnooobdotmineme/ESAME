"use client";

import React from 'react';

export default function AdminDashboard() {
  // Sample data simulating database analytics
  const stats = [
    { title: 'Total Organizations', value: '142', increase: '+12%', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { title: 'Total Teachers', value: '1,204', increase: '+5%', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { title: 'Total Exams', value: '8,439', increase: '+24%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { title: 'Security Alerts', value: '312', increase: '-2%', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, Super Admin</h2>
        <p className="text-gray-500 mt-1 text-sm">Here is what is happening across the ESAME platform today.</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-[#1E7DF8]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-semibold ${stat.increase.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.increase}
              </span>
              <span className="text-sm text-gray-400 ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for future graphs/tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-80 flex items-center justify-center">
          <p className="text-gray-400 font-medium">System Usage Graph (Coming Soon)</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-80 flex items-center justify-center">
          <p className="text-gray-400 font-medium">Recent Security Activity (Coming Soon)</p>
        </div>
      </div>
      
    </div>
  );
}