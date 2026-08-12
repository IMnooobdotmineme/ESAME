"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Upload, Check } from "lucide-react";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgName, setOrgName] = useState("Kiririom Institute of Technology");
  const [description, setDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  }

  function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSavedPassword(true);
    setTimeout(() => setSavedPassword(false), 2000);
  }

  return (
    <>
      <OrgTopbar title="Setting & Privacy" description="Manage your organization's account and security" />

      <main className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-navy-900">Account Details</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your admin profile and security credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          {/* Left column */}
          <div className="xl:col-span-2 space-y-6">

            {/* Profile information */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-navy-900 border-b border-slate-100 pb-3 mb-4">
                Profile Information
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                    Organization Name
                  </label>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    value="admin@esame.com"
                    disabled
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-400 bg-slate-50 outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Contact system support to change your root email address.
                  </p>
                </div>
                <Button type="submit">
                  {savedProfile ? <Check size={15} /> : null}
                  {savedProfile ? "Saved" : "Save Profile"}
                </Button>
              </form>
            </Card>

            {/* Change password */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-navy-900 border-b border-slate-100 pb-3 mb-4">
                Change Password
              </h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
                <Button type="submit" variant="secondary">
                  {savedPassword ? <Check size={15} /> : null}
                  {savedPassword ? "Password Updated" : "Update Password"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right column */}
          <div>
            <Card className="p-8 h-full flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-28 w-28 rounded-full bg-navy-900 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity relative"
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                ) : (
                  <User size={44} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="mt-3 text-base font-semibold text-navy-900">{orgName}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600"
              >
                <Upload size={13} />
                Upload a clear photo of yourself (JPG/PNG)
              </button>

              <div className="w-full mt-6 text-left">
                <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="A short description about your organization..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 resize-none"
                />
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}