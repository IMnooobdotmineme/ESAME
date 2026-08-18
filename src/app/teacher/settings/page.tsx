"use client";

import React, { useState } from "react";
import { User, KeyRound, Building2, Save, CheckCircle2, Lock } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Button } from "@/components/ui/button";
import { TEACHER_ASSIGNMENTS } from "@/lib/teacher-assignments-data";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    fullName: "Julian Vance",
    email: "j.vance@university.edu",
  });

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  // Departments & subjects are assigned by the organization admin — read-only here.
  const assignments = TEACHER_ASSIGNMENTS || [];

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.next || passwords.confirm || passwords.current) {
      if (passwords.next !== passwords.confirm) {
        setPasswordError("New password and confirmation don't match.");
        return;
      }
    }

    setPasswordError("");
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <>
      <TeacherTopbar
        title="Settings"
        description="Manage your profile and password. Departments and subjects are assigned by your organization."
      />

      <main className="w-full max-w-3xl mx-auto p-6 space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* PROFILE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Profile</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* DEPARTMENTS & SUBJECTS — read-only, org-managed */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Departments &amp; Subjects
              </h3>
            </div>

            <div className="space-y-3">
              {assignments.map((dept) => (
                <div key={dept.department} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-xs font-bold text-navy-900 bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 shrink-0">
                    {dept.department}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dept.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-3 py-1"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {assignments.length === 0 && (
                <p className="text-xs text-slate-400 font-medium">
                  No departments or subjects assigned yet.
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Set by your organization administrator. Contact them to update this list.
            </p>
          </div>

          {/* PASSWORD */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4 h-4 text-sky-600" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Password</h3>
            </div>

            <div className="max-w-sm space-y-4">
              <div>
                <label className={labelClass}>Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100" />

              <div>
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.next}
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {passwordError && <p className="text-xs font-semibold text-red-600">{passwordError}</p>}
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="flex items-center justify-end gap-3">
            {savedSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Settings Saved!</span>
              </div>
            )}
            <Button type="submit">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}