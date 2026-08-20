"use client";

import React, { useEffect, useState } from "react";
import { KeyRound, Mail, Check, Eye, EyeOff, ShieldCheck, Lock, Fingerprint } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function PasswordField({
  label,
  name,
  value,
  onChange,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-navy-900">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-11 py-3 text-sm outline-none transition-colors focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.name && data.email) setProfile({ name: data.name, email: data.email });
      })
      .catch((err) => console.error("Failed to load admin profile:", err));
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setSaved(false);
    setError("");
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update password.");
        setIsSubmitting(false);
        return;
      }

      setSaved(true);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AdminTopbar
        title="Account Details"
        description="Manage your administrator password and account security."
      />

      <main className="p-6 md:p-10 flex justify-center">
        <div className="w-full max-w-4xl space-y-6">
          {/* Profile summary */}
          <Card className="relative overflow-hidden border-slate-200/80 shadow-sm">
            <div className="relative h-32 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800">
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1.5px 1.5px, white 1.5px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              />
            </div>

            <div className="relative z-10 px-8 pb-8 -mt-10 flex flex-col items-center text-center">
              <div className="relative z-20 h-24 w-24 shrink-0 rounded-full bg-navy-900 ring-4 ring-white shadow-lg flex items-center justify-center">
                <span className="text-2xl font-semibold text-white leading-none">AD</span>
              </div>
              <h2 className="text-xl font-semibold text-navy-900 mt-4">
                {profile?.name ?? "System Admin"}
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail size={14} /> {profile?.email ?? "—"}
              </p>
              <Badge variant="info" className="mt-3">
                <ShieldCheck size={12} /> Administrator
              </Badge>
            </div>
          </Card>

          {/* Change password */}
          <Card className="border-slate-200/80 shadow-sm p-8 md:p-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-sky-50 flex items-center justify-center">
                <KeyRound size={18} className="text-sky-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-navy-900">Change Password</h3>
                <p className="text-xs text-slate-400">Keep your administrator account secure</p>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <form onSubmit={updatePassword} className="space-y-5 max-w-lg">
              <PasswordField
                label="Current Password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
              />

              <PasswordField
                label="New Password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                hint="Min. 8 characters"
              />

              <PasswordField
                label="Confirm New Password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
              />

              {error && (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="gap-2" disabled={isSubmitting}>
                  <Fingerprint size={15} />
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Check size={14} /> Password updated
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}