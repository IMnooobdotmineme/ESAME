"use client";

import React, { useState } from "react";
import { KeyRound, Mail, Check, Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ADMIN_EMAIL = "admin@esame.edu";

function PasswordField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1.5 block">{label}</label>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function AdminProfilePage() {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saved, setSaved] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    setSaved(true);
    setPasswords({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <>
      <AdminTopbar
        title="Account Details"
        description="Manage your administrator password and account security."
      />

      <main className="p-6 max-w-2xl space-y-6">
        {/* Profile header with banner */}
        <Card className="overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-navy-900 to-navy-800" />
          <div className="px-6 pb-6">
            <div className="flex items-start gap-4 -mt-10">
              <div className="h-20 w-20 shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center text-2xl font-semibold ring-4 ring-white">
                AD
              </div>
              <div className="pt-12">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-navy-900">Super Admin</h2>
                  <Badge variant="info">
                    <ShieldCheck size={12} /> Administrator
                  </Badge>
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail size={14} /> {ADMIN_EMAIL}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <KeyRound size={16} className="text-slate-600" />
            <h3 className="text-sm font-semibold text-navy-900">Change Password</h3>
          </div>

          <form onSubmit={updatePassword} className="space-y-4">
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PasswordField
                label="New Password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
              />
              <PasswordField
                label="Confirm New Password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button type="submit">Update Password</Button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <Check size={14} /> Password updated
                </span>
              )}
            </div>
          </form>
        </Card>
      </main>
    </>
  );
}