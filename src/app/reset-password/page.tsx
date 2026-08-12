"use client";

import React, { useState } from "react";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SetNewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    console.log("Password successfully updated.");
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg p-8 sm:p-10">
        {!isSubmitted ? (
          <div className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <EsameLogo height={28} />
              <h2 className="mt-4 text-3xl font-extrabold text-navy-900 tracking-tight">
                Set New Password
              </h2>
              <p className="mt-3 text-sm text-slate-500 px-4">
                Your new password must be different from previous used passwords.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 animate-in slide-in-from-top-2">
                <p className="font-semibold">Oops!</p>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-navy-900">New Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <p className="mt-2 text-xs text-slate-400">Must be at least 8 characters.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-900">Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Reset Password
              </Button>
            </form>
          </div>
        ) : (
          <div className="text-center animate-in zoom-in duration-300 py-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-50 mb-6 border-2 border-sky-100">
              <svg className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-2">Password Reset!</h2>
            <p className="text-sm text-slate-500 mb-8">
              Your password has been successfully reset. <br />
              You can now log in with your new password.
            </p>

            <a href="/login" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 transition-all">
              Continue to log in
            </a>
          </div>
        )}
      </Card>
    </div>
  );
}