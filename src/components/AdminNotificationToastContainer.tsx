"use client";

import React, { useState } from 'react';
import Link from 'next/link';

interface AdminToast {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'security' | 'organization' | 'system';
}

export default function AdminNotificationToastContainer() {
  const [toasts, setToasts] = useState<AdminToast[]>([
    {
      id: '1',
      title: 'Unusual Admin Login',
      message: 'IP 192.168.1.45 attempted 5 failed super-admin logins.',
      time: '10:22 AM',
      type: 'security',
    },
    {
      id: '2',
      title: 'Organization Registered',
      message: 'MIT Faculty of Science completed enterprise sign-up.',
      time: '10:23 AM',
      type: 'organization',
    },
  ]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-navy-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex flex-col gap-2 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  toast.type === 'security'
                    ? 'bg-rose-500 animate-pulse'
                    : toast.type === 'organization'
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              <h4 className="text-sm font-extrabold text-white tracking-tight">
                {toast.title}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">
                {toast.time}
              </span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            {toast.message}
          </p>

          <div className="flex items-center gap-4 pt-1">
            <Link
              href={toast.type === 'security' ? '/admin/security' : '/admin/organizations'}
              className="text-xs font-bold text-sky-400 hover:underline"
            >
              View Details &rarr;
            </Link>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}