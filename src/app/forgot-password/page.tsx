"use client";

import React, { useState } from "react";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sending password reset link to:", email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg p-8 sm:p-10">
        {!isSubmitted ? (
          <div className="animate-in fade-in duration-300">
            <a href="/login" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-navy-900 transition-colors mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to log in
            </a>

            <div className="text-center mb-8">
              <EsameLogo height={28} />
              <h2 className="mt-4 text-3xl font-extrabold text-navy-900 tracking-tight">
                Forgot Password?
              </h2>
              <p className="mt-3 text-sm text-slate-500 px-4">
                No worries, we&apos;ll send you reset instructions. Please enter the email address associated with your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-navy-900">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  placeholder="admin@acmecorp.com"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Reset Password
              </Button>
            </form>
          </div>
        ) : (
          <div className="text-center animate-in zoom-in duration-300 py-4">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sky-50 mb-6">
              <svg className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight mb-2">Check your email</h2>
            <p className="text-sm text-slate-500 mb-8">
              We sent a password reset link to <br />
              <span className="font-semibold text-navy-900">{email}</span>
            </p>

            <a href="/login" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-navy-900 hover:bg-navy-800 transition-all">
              Return to log in
            </a>

            <p className="mt-6 text-sm text-slate-500">
              Didn&apos;t receive the email?{" "}
              <button onClick={() => setIsSubmitted(false)} className="font-semibold text-sky-500 hover:underline bg-transparent border-none p-0 cursor-pointer">
                Click to try again
              </button>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}