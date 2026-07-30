"use client";

import React, { useState } from "react";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login Data submitted:", formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg space-y-6 p-8 sm:p-10">
        <div className="text-center">
          <EsameLogo height={28} />
          <h2 className="mt-4 text-3xl font-extrabold text-navy-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-500">Please sign in to your account.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-navy-900">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-navy-900 font-medium transition-all duration-200"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-navy-900">
                Password
              </label>
              <div className="text-sm">
                <a href="/forgot-password" className="font-medium text-sky-500 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-navy-900 font-medium transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="font-semibold text-sky-500 hover:underline">
            Create an organization
          </a>
        </p>
      </Card>
    </div>
  );
}