"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'security' | 'organization' | 'system';
  unread: boolean;
}

export default function AdminNotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: '1',
      title: 'Security Flag Triggered',
      message: 'Multiple failed admin login attempts detected on Org #14.',
      time: '5m ago',
      type: 'security',
      unread: true,
    },
    {
      id: '2',
      title: 'New Organization Request',
      message: 'Stanford University submitted an enterprise sign-up application.',
      time: '12m ago',
      type: 'organization',
      unread: true,
    },
    {
      id: '3',
      title: 'System Backup Completed',
      message: 'Automated daily database backup finished with 0 errors.',
      time: '1h ago',
      type: 'system',
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer focus:outline-none"
        aria-label="Admin Notifications"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Indicator Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
            
            {/* Header */}
            <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">System Alerts</span>
                {unreadCount > 0 && (
                  <span className="bg-[#E6F7FA] text-[#0B7A93] text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  className="text-xs font-medium text-[#0B7A93] hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Alerts List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {notifications.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 hover:bg-slate-50/80 transition-colors flex gap-3 ${item.unread ? 'bg-slate-50/40' : ''}`}
                >
                  {/* Category Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'security' ? 'bg-rose-50 text-rose-600' :
                    item.type === 'organization' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.type === 'security' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {item.type === 'organization' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {item.type === 'system' && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 pt-2 border-t border-slate-100 text-center">
              <Link 
                href="/admin/logs" 
                onClick={() => setIsOpen(false)} 
                className="text-xs font-semibold text-[#0B7A93] hover:underline block py-1"
              >
                View System Logs →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}