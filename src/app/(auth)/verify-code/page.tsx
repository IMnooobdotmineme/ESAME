"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // Imported useRouter

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyCode() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialized the router
  const email = searchParams.get("email") || "";
  
  // Get the 'from' parameter from the URL (e.g., /verify-code?email=abc@test.com&from=login)
  const fromPage = searchParams.get("from") || "forgot-password";

  // Determine the dynamic back route based on the 'from' parameter
  let backRoute = "/forgot-password";
  if (fromPage === "login") {
    backRoute = "/login";
  } else if (fromPage === "signup" || fromPage === "sign-up") {
    backRoute = "/sign-up";
  }

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Countdown for the resend link
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const updateDigit = (index: number, value: string) => {
    if (error) setError(false);
    const next = [...digits];
    next[index] = value;
    setDigits(next);
  };

  const handleChange = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      updateDigit(index, "");
      return;
    }
    updateDigit(index, value.slice(-1));
    if (index < CODE_LENGTH - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        updateDigit(index, "");
      } else if (index > 0) {
        updateDigit(index - 1, "");
        focusInput(index - 1);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    setError(false);
    focusInput(Math.min(pasted.length, CODE_LENGTH - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setError(true);
      focusInput(digits.findIndex((d) => !d));
      return;
    }
    setIsSubmitting(true);
    setError(false);

    setTimeout(() => {
      setIsSubmitting(false);
      
      console.log("Successfully verified code:", code);
      
      // Redirects the user straight to the reset-password page
      router.push("/reset-password");
    }, 900);
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(CODE_LENGTH).fill(""));
    setError(false);
    focusInput(0);
    console.log("Resent verification code to:", email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F3FA] via-white to-[#D5DEEF] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[480px] bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-[#395886]/10 border border-[#D5DEEF]/60">
        
        {/* Back Link with updated conditional route configuration */}
        <a
          href={backRoute}
          className="inline-flex items-center text-sm font-semibold text-[#8AAEE0] hover:text-[#395886] transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </a>

        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#F0F3FA] flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-[#395886]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Header Text */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#395886] tracking-tight">Verify your account</h2>
          <p className="mt-2 text-sm text-[#638ECB] leading-relaxed">
            Enter the 6-digit code we sent to{" "}
            {email ? <span className="font-semibold text-[#395886]">{email}</span> : "your email"} to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Grid Inputs */}
          <div>
            <div className="grid grid-cols-6 gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  onFocus={(e) => e.target.select()}
                  autoFocus={index === 0}
                  className={`w-full aspect-square text-center text-xl font-bold rounded-xl border text-[#395886] transition-all focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent ${
                    error
                      ? "bg-rose-50/50 border-rose-300 focus:ring-rose-400"
                      : "bg-[#F0F3FA]/50 border-[#D5DEEF] focus:ring-[#638ECB]"
                  }`}
                />
              ))}
            </div>
            {error && (
              <p className="mt-3 text-sm text-rose-500 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                Please fill in all 6 boxes.
              </p>
            )}
          </div>

          {/* Action Button */}
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
            {isSubmitting ? "Verifying..." : "Verify code"}
          </button>
        </form>

        {/* Resend Link Section */}
        <p className="mt-6 text-center text-sm text-[#8AAEE0] font-medium">
          Didn't get a code?{" "}
          {secondsLeft > 0 ? (
            <span className="text-[#B1C9EF]">Resend in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-[#395886] hover:text-[#638ECB] hover:underline transition-colors"
            >
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  );
}