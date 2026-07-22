"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isValid = email.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to send verification code.");
      }

      router.push(
        `/verify-code?email=${encodeURIComponent(data.email || email)}&from=forgot-password&purpose=forgot_password`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F3FA] via-white to-[#D5DEEF] py-12 px-4 sm:px-6 lg:px-8">
      {/* Mid-sized container matching the size of the verification card */}
      <div className="w-full max-w-[480px] bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-[#395886]/10 border border-[#D5DEEF]/60">
        
        {/* Back to login */}
        <a
          href="/login"
          className="inline-flex items-center text-sm font-semibold text-[#1F2A44] mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to login
        </a>

        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#F0F3FA] flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-[#395886]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#395886] tracking-tight">Forgot your password?</h2>
          <p className="mt-2 text-sm text-[#638ECB] leading-relaxed">
            No worries — enter the email tied to your account and we'll send you a 6-digit code to verify it's you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#395886]">
              Work Email <span className="text-rose-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full px-4 py-3 bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl text-[#395886] placeholder-[#B1C9EF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#638ECB] focus:border-transparent transition-all"
              placeholder="admin@acmecorp.com"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[#395886] hover:bg-[#2E466C] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#395886] transition-all transform cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isSubmitting && (
              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {isSubmitting ? "Sending code..." : "Send verification code"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-rose-500 font-semibold text-center">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-[#8AAEE0] font-medium">
          Remembered your password?{" "}
          <a href="/login" className="font-bold text-[#395886] hover:text-[#638ECB] hover:underline transition-colors">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
