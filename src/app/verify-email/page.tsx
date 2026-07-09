"use client";

import React from 'react';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
        
        {/* Modern Email Sent Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-50 animate-pulse">
          <svg 
            className="h-8 w-8 text-[#4F46E5]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
        </div>

        {/* Header Text */}
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Verify your email
          </h2>
          <p className="mt-4 text-base text-gray-600 font-medium">
            We've sent a confirmation link to your organization's work email address.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Please click the link inside the email to confirm your account and activate your workspace.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {/* Handy shortcut button to open mail */}
          <button
            onClick={() => window.open('https://mail.google.com', '_blank')}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#4F46E5] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Open Mail Client
          </button>
          
          {/* Resend Action */}
          <button 
            onClick={() => console.log("Resending confirmation email...")} 
            className="w-full flex justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-all duration-200"
          >
            Resend confirmation link
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 mt-6">
          Can't find it? Check your spam folder or contact support.
        </p>

      </div>
    </div>
  );
}