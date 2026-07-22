"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Automatically fills both boxes if the user pastes a password into the first field
  const handlePasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      setPassword(pastedText);
      setConfirmPassword(pastedText);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      router.push(data.redirect || "/login");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F3FA] via-white to-[#D5DEEF] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[480px] bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-[#395886]/10 border border-[#D5DEEF]/60">
        
        {/* Back to Login link */}
        <a
          href="/login"
          className="inline-flex items-center text-sm font-semibold text-[#1F2A44] mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to login
        </a>

        {/* Shield/Key Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#F0F3FA] flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-[#395886]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Header Title */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#395886] tracking-tight">Set new password</h2>
          <p className="mt-2 text-sm text-[#638ECB] leading-relaxed">
            Must be at least 8 characters. Choose something secure you haven't used before.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Input Field */}
          <div>
            <label className="block text-sm font-bold text-[#395886]">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onPaste={handlePasswordPaste}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-4 pr-12 py-3 bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl text-[#395886] placeholder-[#B1C9EF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#638ECB] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#8AAEE0] hover:text-[#395886] transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input Field */}
          <div>
            <label className="block text-sm font-bold text-[#395886]">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 block w-full px-4 py-3 bg-[#F0F3FA]/50 border border-[#D5DEEF] rounded-xl text-[#395886] placeholder-[#B1C9EF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#638ECB] focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Validation Messages Container */}
          {error && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              {error}
            </p>
          )}

          {/* Core CTA Submit Button */}
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
            {isSubmitting ? "Updating password..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
