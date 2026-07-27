"use client";

import React, { useState } from 'react';

export default function SetNewPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear any previous errors

    // Basic Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    // TODO: Add your backend API call here to securely update the user's password
    console.log('Password successfully updated.');
    
    // Simulate a successful API response
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Container matching your layout */}
      <div className="w-[50%] min-w-[350px] max-w-lg bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        
        {!isSubmitted ? (
          // STATE 1: SET NEW PASSWORD FORM
          <div className="animate-in fade-in duration-300">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Set New Password
              </h2>
              <p className="mt-3 text-sm text-gray-500 px-4">
                Your new password must be different from previous used passwords.
              </p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 animate-in slide-in-from-top-2">
                <p className="font-semibold">Oops!</p>
                <p>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <p className="mt-2 text-xs text-gray-400">Must be at least 8 characters.</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1E7DF8] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E7DF8] transition-all transform hover:-translate-y-0.5"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        ) : (
          // STATE 2: SUCCESS MESSAGE
          <div className="text-center animate-in zoom-in duration-300 py-4">
            
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-50 mb-6 border-2 border-green-100">
              <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
              Password Reset!
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              Your password has been successfully reset. <br/>
              You can now log in with your new password.
            </p>

            <a
              href="/login"
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#1E7DF8] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E7DF8] transition-all"
            >
              Continue to log in
            </a>
          </div>
        )}
      </div>
    </div>
  );
}