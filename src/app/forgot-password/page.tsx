"use client";

import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Add your backend API call here to actually send the reset email
    console.log('Sending password reset link to:', email);
    
    // Simulate a successful submission
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* 50% Width Container to match your previous layout */}
      <div className="w-[50%] min-w-[350px] max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        
        {!isSubmitted ? (
          // STATE 1: EMAIL INPUT FORM
          <div className="animate-in fade-in duration-300">
            {/* Back Button */}
            <a 
              href="/login" 
              className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors mb-6"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to log in
            </a>
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Forgot Password?
              </h2>
              <p className="mt-3 text-sm text-gray-500 px-4">
                No worries, we'll send you reset instructions. Please enter the email address associated with your account.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8] focus:border-transparent transition-all"
                  placeholder="admin@acmecorp.com"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1E7DF8] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E7DF8] transition-all transform hover:-translate-y-0.5"
              >
                Reset Password
              </button>
            </form>
          </div>
        ) : (
          // STATE 2: SUCCESS MESSAGE
          <div className="text-center animate-in zoom-in duration-300 py-4">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-6">
              <svg className="h-8 w-8 text-[#1E7DF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
              Check your email
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              We sent a password reset link to <br/>
              <span className="font-semibold text-gray-900">{email}</span>
            </p>

            <a
              href="/login"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1E7DF8] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E7DF8] transition-all"
            >
              Return to log in
            </a>

            <p className="mt-6 text-sm text-gray-500">
              Didn't receive the email?{' '}
              <button 
                onClick={() => setIsSubmitted(false)}
                className="font-semibold text-[#1E7DF8] hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Click to try again
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}