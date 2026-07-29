"use client";

import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AdminNotificationDropdown from '@/components/AdminNotificationDropdown';
import AdminNotificationToastContainer from '@/components/AdminNotificationToastContainer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Organizations', href: '/admin/organizations', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Users', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Security Settings', href: '/admin/security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { name: 'System Logs', href: '/admin/logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  const handleSignOut = () => {
    console.log("Signing out...");
    router.push('/login');
  };

  const currentTitle = navItems.find(item => item.href === pathname)?.name || 'Admin Portal';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-[#132238] flex flex-col shrink-0">
        
        {/* WHITE LOGO HEADER BOX (Identical Brand Icon & Typography to Teacher Portal) */}
        <div className="h-[72px] bg-white flex items-center px-6 border-b border-slate-100 shrink-0">
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
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#0F172A] tracking-tight">Esame</span>
              <span className="bg-[#E6F7FA] text-[#0B7A93] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* DARK NAVY NAVIGATION MENU */}
        <div className="flex-1 py-6 px-4 overflow-y-auto space-y-8 bg-[#132238]">
          <div>
            <p className="text-[11px] font-bold text-slate-400/80 tracking-[0.2em] mb-4 px-3 uppercase">
              ADMIN PORTAL
            </p>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={`flex items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-[#3E72A0] text-white font-semibold shadow-xs' 
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}>
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                      <span className="ml-3.5 text-[14px] font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        
        {/* Header Bar */}
        <header className="h-[72px] bg-[#F8FAFC] flex items-center justify-between px-10 shrink-0 relative z-10 border-b border-slate-200/50">
          
          {/* Header Title */}
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
              {currentTitle}
            </h1>
            <p className="text-[13px] text-slate-400 mt-0.5 font-medium">Manage platform organizations, users, and security</p>
          </div>
          
          {/* Right Header Actions */}
          <div className="flex items-center space-x-6">
            
            {/* Search Input */}
            <div className="relative w-80 hidden lg:block">
              <input 
                type="text" 
                placeholder="Search system..." 
                className="w-full pl-5 pr-12 py-2.5 bg-white border border-slate-200 rounded-full text-[14px] focus:outline-none focus:bg-white focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93] transition-all placeholder-slate-400 text-slate-800 shadow-2xs"
              />
              <svg className="w-5 h-5 text-slate-400 absolute right-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Admin Notifications Dropdown */}
            <AdminNotificationDropdown />
            
            {/* Profile Avatar */}
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E6F7FA] text-[#0B7A93] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B7A93] transition-transform hover:scale-105 cursor-pointer font-extrabold text-sm"
              >
                A
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40">
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-semibold text-slate-900">System Admin</p>
                      <p className="text-xs text-slate-500 truncate">admin@esame.com</p>
                    </div>
                    
                    <Link 
                      href="/admin/security" 
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#E6F7FA]/60 hover:text-[#0B7A93] font-medium transition-colors"
                    >
                      Security Settings
                    </Link>
                    
                    <button 
                      onClick={handleSignOut} 
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors border-t border-slate-100 mt-1 pt-2 pb-2 rounded-b-2xl cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Floating System Admin Toast Container */}
      <AdminNotificationToastContainer />
    </div>
  );
}