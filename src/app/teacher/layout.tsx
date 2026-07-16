"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setProfileOpen] = useState(false);
  
  // Main Navigation Items
  const mainNavItems = [
    { name: 'Dashboard', href: '/teacher', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'My Exams', href: '/teacher/exams', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Question Bank', href: '/teacher/question-bank', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  ];

  // Features Navigation Items
  const featureNavItems = [
    { name: 'Live Monitoring', href: '/teacher/monitor', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { name: 'Grading & Results', href: '/teacher/grading', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Settings', href: '/teacher/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
  ];

  const handleSignOut = () => {
    console.log("Signing out...");
    router.push('/login');
  };

  const currentTitle = [...mainNavItems, ...featureNavItems].find(item => item.href === pathname)?.name || 'Teacher Portal';

  return (
    <div className="min-h-screen bg-white flex font-sans">
      
      {/* Sidebar - Perfectly aligned with the new header height */}
      <aside className="w-[290px] bg-[#0A1628] flex flex-col border-r border-gray-800 shrink-0">
        
        {/* Logo Area matches new header height (h-[92px]) */}
        <div className="h-[92px] bg-white flex items-center px-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center">
              <svg className="w-full h-full text-[#1E293B]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h4v4H4V4zm6 0h10v4H10V4zM4 10h4v4H4v-4zm6 0h10v4H10v-4zM4 16h4v4H4v-4zm6 0h10v4H10v-4z" />
              </svg>
            </div>
            <span className="text-2xl font-black text-[#1E293B] tracking-tight">Esame</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 py-8 px-4 overflow-y-auto space-y-8">
          <div>
            <p className="text-[12px] font-bold text-gray-400 tracking-[0.2em] mb-4 px-3">
              TEACHER PORTAL
            </p>
            <nav className="space-y-2">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/teacher' && pathname.includes(item.href));
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex items-center px-4 py-3.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#0B7A93] text-white font-semibold shadow-md' : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'}`}>
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="ml-4 text-[16px]">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="text-[12px] font-bold text-gray-400 tracking-[0.2em] mb-4 px-3">
              FEATURES
            </p>
            <nav className="space-y-2">
              {featureNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.includes(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex items-center px-4 py-3.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-[#0B7A93] text-white font-semibold shadow-md' : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'}`}>
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="ml-4 text-[16px]">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* BIGGER TOP DASHBOARD BAR */}
        <header className="h-[92px] bg-white border-b border-gray-200 flex items-center justify-between px-10 shrink-0 relative z-10">
          
          {/* Bigger Left Title Blocks */}
          <div>
            <h1 className="text-[23px] font-extrabold text-gray-900 tracking-tight leading-tight">
              {currentTitle}
            </h1>
            <p className="text-[14px] text-gray-500 mt-1 font-medium">Manage your classes and examinations</p>
          </div>
          
          {/* Bigger Header Interactions */}
          <div className="flex items-center space-x-6">
            
            {/* Expanded Search Bar */}
            <div className="relative w-80 hidden lg:block">
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="w-full pl-5 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-full text-[15px] focus:outline-none focus:bg-white focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] transition-all placeholder-gray-400 text-gray-800"
              />
              <svg className="w-5 h-5 text-gray-400 absolute right-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Chunky Notification Bell */}
            <button className="text-gray-500 hover:text-gray-900 transition-colors p-2 hover:bg-gray-50 rounded-full">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            {/* Resized Profile Avatar */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-[#EADDFF] text-[#6750A4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6750A4] transition-transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-40">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900">Dr. Alan Grant</p>
                      <p className="text-xs text-gray-500 truncate">agrant@university.edu</p>
                    </div>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-gray-100 mt-1 pt-2 pb-2 rounded-b-xl">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}