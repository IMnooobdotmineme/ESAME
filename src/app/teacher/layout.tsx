"use client";

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// 1. Import Notification Components
import NotificationDropdown from '@/components/NotificationDropdown';
import NotificationToastContainer from '@/components/NotificationToastContainer';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setProfileOpen] = useState(false);
  
  // Main Navigation Items
  const mainNavItems = [
    { name: 'Dashboard', href: '/teacher', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'My Exams', href: '/teacher/exams', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* Dark Navy Sidebar Matching Figma */}
      <aside className="w-[290px] bg-[#1C2B46] flex flex-col shrink-0 min-h-screen">
        
        {/* Top White Logo Area */}
        <div className="h-[92px] bg-white flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex items-center justify-center shrink-0">
              <Image 
                src="/logo-icon.png" 
                alt="Esame Logo" 
                width={32} 
                height={32} 
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-black text-[#0F172A] tracking-tight">Esame</span>
          </div>
        </div>

        {/* Sidebar Navigation Body */}
        <div className="flex-1 py-8 px-4 overflow-y-auto space-y-8 bg-[#1C2B46]">
          <div>
            <p className="text-[11px] font-bold text-[#6A81A5] tracking-[0.2em] mb-4 px-3 uppercase">
              TEACHER PORTAL
            </p>
            <nav className="space-y-2">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/teacher' && pathname.includes(item.href));
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#4A7BB0] text-white font-semibold shadow-sm' 
                        : 'text-[#C2D3E8] hover:bg-white/10 hover:text-white'
                    }`}>
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="ml-4 text-[15px]">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#6A81A5] tracking-[0.2em] mb-4 px-3 uppercase">
              FEATURES
            </p>
            <nav className="space-y-2">
              {featureNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.includes(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#4A7BB0] text-white font-semibold shadow-sm' 
                        : 'text-[#C2D3E8] hover:bg-white/10 hover:text-white'
                    }`}>
                      <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="ml-4 text-[15px]">{item.name}</span>
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
        
        {/* TOP DASHBOARD BAR */}
        <header className="h-[92px] bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0 relative z-10">
          
          {/* Left Title Blocks */}
          <div>
            <h1 className="text-[21px] font-extrabold text-slate-900 tracking-tight leading-tight">
              {currentTitle}
            </h1>
            <p className="text-[13px] text-slate-400 mt-1 font-medium">Manage your classes and examinations</p>
          </div>
          
          {/* Header Interactions */}
          <div className="flex items-center space-x-6">
            
            {/* Search Bar */}
            <div className="relative w-80 hidden lg:block">
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="w-full pl-5 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-full text-[14px] focus:outline-none focus:bg-white focus:border-[#4A7BB0] focus:ring-1 focus:ring-[#4A7BB0] transition-all placeholder-slate-400 text-slate-800"
              />
              <svg className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <NotificationDropdown />
            
            {/* Profile Avatar */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-[#E2ECF8] text-[#2C5282] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A7BB0] transition-transform hover:scale-105 cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-semibold text-slate-900">Dr. Alan Grant</p>
                      <p className="text-xs text-slate-500 truncate">agrant@university.edu</p>
                    </div>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-slate-100 mt-1 pt-2 pb-2 rounded-b-2xl cursor-pointer">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      <NotificationToastContainer />
    </div>
  );
}