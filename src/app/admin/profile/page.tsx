"use client";

import React, { useState } from "react";
import { UserCheck, KeyRound, Shield, Check, Lock } from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({
    firstName: "Super",
    lastName: "Admin",
    email: "admin@esame.edu",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Profile updated successfully!");
  };

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    alert("Password updated successfully!");
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <span className="text-[10px] font-black tracking-widest text-[#4A7BB0] uppercase block mb-1">
          Identity & Security
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Account Details
        </h2>
        <p className="text-slate-400 mt-1 text-sm font-medium">
          Manage your executive administrator credentials and access keys.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <form
            onSubmit={saveProfile}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-5 h-5 text-[#4A7BB0]" />
              <h3 className="text-base font-extrabold text-slate-900">
                Personal Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#4A7BB0] focus:ring-1 focus:ring-[#4A7BB0] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#4A7BB0] focus:ring-1 focus:ring-[#4A7BB0] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Root Admin Email Address
              </label>
              <input
                name="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 font-semibold cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-slate-400 font-medium">
                Root email addresses require root console authorization to
                transfer.
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Save Profile Changes
            </button>
          </form>

          {/* Password Form */}
          <form
            onSubmit={updatePassword}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-5 h-5 text-[#4A7BB0]" />
              <h3 className="text-base font-extrabold text-slate-900">
                Change Master Password
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                required
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#4A7BB0] focus:ring-1 focus:ring-[#4A7BB0] transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#4A7BB0] focus:ring-1 focus:ring-[#4A7BB0] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-[#4A7BB0] focus:ring-1 focus:ring-[#4A7BB0] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4A7BB0] hover:bg-[#3b6592] text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Right Sidebar: Privilege Badge Matching Figma Navy Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#1C2B46] p-8 rounded-2xl shadow-sm text-white space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  Super Admin
                </h3>
                <span className="text-[11px] font-extrabold text-[#6A81A5] uppercase tracking-wider">
                  Tier 1 Authorization
                </span>
              </div>
            </div>

            <p className="text-xs text-[#C2D3E8] leading-relaxed font-medium">
              Your account has full root privileges to oversee all campus
              organizations, anti-cheating protocols, and audit logs.
            </p>

            <ul className="text-xs text-[#C2D3E8] space-y-3 font-semibold pt-2 border-t border-white/10">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Manage all Educational Institutions</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Configure Platform Anti-Cheating</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Access System Compliance Logs</span>
              </li>
            </ul>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 mt-4">
              <p className="text-[11px] font-bold text-[#6A81A5] uppercase tracking-wider">
                Account Provisioned
              </p>
              <p className="text-sm font-extrabold text-white mt-0.5">
                January 12, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}