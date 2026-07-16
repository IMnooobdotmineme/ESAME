"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Added router import

export default function Login() {
  const router = useRouter(); // Initialized router
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login data:", formData);
    
    // Redirects to /verify-code and passes the email as a query parameter
    router.push(`/verify-code?email=${encodeURIComponent(formData.email)}`);
  };

  const handleGoogleLogin = () => {
    console.log("Redirect to Google OAuth flow");
  };

  const isValid = formData.email.trim() !== "" && formData.password.trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDF1FA] via-[#F5F7FC] to-[#E4EAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-[50%] min-w-[350px] bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-[#395886]/10 border border-[#E7ECF7]">
        {/* Back to website */}
        <a
          href="https://yourwebsite.com"
          className="inline-flex items-center text-sm font-medium text-[#9FAFCB] hover:text-[#1F2A44] transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </a>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#1F2A44] tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm text-[#7D8CAB]">Log in to your workspace to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-[#1F2A44]">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-4 py-3 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#1F2A44]">
                Password <span className="text-rose-500">*</span>
              </label>
              <a href="/forgot-password" className="text-sm font-semibold text-[#395886] hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative mt-1">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-4 py-3 pr-11 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9FAFCB] hover:text-[#3B4763] transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5 1.638 0 3.19-.375 4.568-1.043m3.132-2.185A10.478 10.478 0 0022.066 12c-1.292-4.338-5.31-7.5-10.066-7.5-.988 0-1.945.14-2.85.4M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-md border-[#C9D6EE] text-[#395886] focus:ring-2 focus:ring-[#395886]/40"
            />
            <span className="text-sm text-[#4B5468]">Remember me</span>
          </label>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white transition-all transform ${
                isValid
                  ? "bg-[#395886] hover:bg-[#2E4A73] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#395886] cursor-pointer"
                  : "bg-[#C9D2E3] cursor-not-allowed"
              }`}
            >
              Log in
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-[#E7ECF7]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[#9FAFCB]">or</span>
          <div className="h-px flex-1 bg-[#E7ECF7]" />
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-[#C9D6EE] bg-white text-sm font-bold text-[#1F2A44] hover:bg-[#F5F7FC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#395886] transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-[#7D8CAB]">
          Don't have an account?{" "}
          <a href="/sign-up" className="font-semibold text-[#395886] hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}