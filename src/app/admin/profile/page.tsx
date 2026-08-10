"use client";

import React, { useState } from "react";
import { UserCheck, KeyRound, Shield, Check } from "lucide-react";

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
    <div className="w-full space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
            Identity & Security
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Account Details
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your executive administrator credentials and security keys.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: FORMS */}
        <div className="lg:col-span-2 space-y-6">
          {/* PROFILE FORM */}
          <form
            onSubmit={saveProfile}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserCheck className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Root Admin Email Address
              </label>
              <input
                name="email"
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                Root email addresses require root console authorization to transfer.
              </p>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Save Profile Changes
            </button>
          </form>

          {/* PASSWORD FORM */}
          <form
            onSubmit={updatePassword}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Change Master Password
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                required
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl transition-all shadow-2xs cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* RIGHT SIDEBAR: PRIVILEGE BADGE (MATCHING ORGSIDEBAR BG-NAVY-900) */}
        <div className="lg:col-span-1">
          <div className="bg-navy-900 p-6 rounded-xl shadow-xs text-white space-y-5 sticky top-20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Super Admin
                </h3>
                <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block mt-0.5">
                  Tier 1 Authorization
                </span>
              </div>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-medium">
              Your account has full root privileges to oversee all campus
              organizations, anti-cheating protocols, and audit logs.
            </p>

            <ul className="text-xs text-white/90 space-y-2.5 font-medium pt-3 border-t border-white/10">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Manage Educational Institutions</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Configure Anti-Cheating Rules</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Access System Audit Logs</span>
              </li>
            </ul>

            <div className="p-3 bg-white/5 rounded-lg border border-white/10 mt-2">
              <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">
                Account Provisioned
              </p>
              <p className="text-xs font-semibold text-white mt-0.5">
                January 12, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}