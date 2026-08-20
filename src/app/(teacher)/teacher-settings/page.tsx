"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  User,
  KeyRound,
  Building2,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Upload,
  Crop,
  Trash2,
  Check,
} from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { TEACHER_ASSIGNMENTS } from "@/lib/teacher-assignments-data";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400";
const labelClass = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuWrapRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState({
    fullName: "Julian Vance",
    email: "j.vance@university.edu",
  });

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [rawAvatar, setRawAvatar] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Departments & subjects are assigned by the organization admin — read-only here.
  const assignments = TEACHER_ASSIGNMENTS || [];

  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  function cropAvatarDataUrl(dataUrl: string, zoom: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Unable to prepare image."));
          return;
        }

        const sourceSize = Math.min(image.naturalWidth, image.naturalHeight) / zoom;
        const sx = (image.naturalWidth - sourceSize) / 2;
        const sy = (image.naturalHeight - sourceSize) / 2;
        ctx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = () => reject(new Error("Unable to load image."));
      image.src = dataUrl;
    });
  }

  // Close the avatar menu on outside click
  useEffect(() => {
    if (!avatarMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (avatarMenuWrapRef.current && !avatarMenuWrapRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarMenuOpen]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setRawAvatar(dataUrl);
      setCropZoom(1);
      setAvatarError("");
      try {
        const cropped = await cropAvatarDataUrl(dataUrl, 1);
        setAvatarPreview(cropped);
      } catch {
        setAvatarPreview(dataUrl);
      }
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function deleteAvatar() {
    setAvatarMenuOpen(false);
    setAvatarPreview(null);
    setRawAvatar(null);
    setCropOpen(false);
  }

  function applyAvatarCrop() {
    if (!rawAvatar) return;
    cropAvatarDataUrl(rawAvatar, cropZoom)
      .then((cropped) => {
        setAvatarPreview(cropped);
        setCropOpen(false);
      })
      .catch(() => setAvatarError("Unable to prepare image."));
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setPasswordError("");
    setPasswords({ current: "", next: "", confirm: "" });
    setSavedPassword(true);
    setTimeout(() => setSavedPassword(false), 3000);
  };

  return (
    <>
      <TeacherTopbar
        title="Settings"
        description="Manage your profile and password. Departments and subjects are assigned by your organization."
      />

      <main className="w-full max-w-3xl mx-auto p-6 space-y-6">
        {/* PROFILE */}
        <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Profile</h3>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0" ref={avatarMenuWrapRef}>
              <button
                type="button"
                onClick={() => avatarPreview && setAvatarPreviewOpen(true)}
                className="h-20 w-20 rounded-full bg-navy-900 flex items-center justify-center overflow-hidden relative"
                disabled={!avatarPreview}
                aria-label={avatarPreview ? "View profile photo" : undefined}
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                ) : (
                  <User size={32} className="text-white" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAvatarMenuOpen((v) => !v)}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow ring-2 ring-white hover:bg-sky-600 transition-colors"
                aria-label="Change profile photo"
              >
                <Camera size={12} />
              </button>

              {avatarMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
                  >
                    <Upload size={14} />
                    Upload photo
                  </button>
                  {avatarPreview && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarMenuOpen(false);
                          setCropOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
                      >
                        <Crop size={14} />
                        Edit / Crop
                      </button>
                      <button
                        type="button"
                        onClick={deleteAvatar}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                        Delete photo
                      </button>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-base font-semibold text-navy-900">{profile.fullName}</p>
              
              {avatarError && <p className="mt-1 text-xs text-red-600">{avatarError}</p>}
            </div>
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
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className={`${inputClass} pl-9 text-slate-400 bg-slate-50 cursor-not-allowed`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {savedProfile && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Profile Saved!</span>
              </div>
            )}
            <Button type="submit">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </form>

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
        <form onSubmit={handleUpdatePassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
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
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100" />

            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNext ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowNext((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showNext ? "Hide password" : "Show password"}
                >
                  {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && <p className="text-xs font-semibold text-red-600">{passwordError}</p>}
          </div>

          <div className="flex items-center justify-end gap-3">
            {savedPassword && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Password Updated!</span>
              </div>
            )}
            <Button type="submit" variant="secondary">
              <KeyRound className="w-4 h-4" />
              Update Password
            </Button>
          </div>
        </form>
      </main>

      {/* Crop dialog */}
      <Dialog open={cropOpen} onClose={() => setCropOpen(false)} className="max-w-md">
        <DialogHeader title="Edit Profile Image" onClose={() => setCropOpen(false)} />
        <div className="px-6 py-5 space-y-4">
          <div className="mx-auto relative h-64 w-64 overflow-hidden rounded-full bg-slate-100">
            {rawAvatar && (
              <Image
                src={rawAvatar}
                alt="Crop preview"
                fill
                className="object-cover"
                style={{ transform: `scale(${cropZoom})` }}
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-navy-900 mb-1.5 block">Zoom</label>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={cropZoom}
              onChange={(e) => setCropZoom(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
          </div>
          {avatarError && <p className="text-sm text-red-600">{avatarError}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={applyAvatarCrop}>
            <Check size={15} />
            Save
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Full-size preview modal */}
      <Dialog open={avatarPreviewOpen} onClose={() => setAvatarPreviewOpen(false)} className="max-w-sm">
        <DialogHeader title="Profile Photo" onClose={() => setAvatarPreviewOpen(false)} />
        <div className="px-6 py-6 flex justify-center">
          {avatarPreview && (
            <div className="relative h-72 w-72 rounded-2xl overflow-hidden bg-slate-100">
              <Image src={avatarPreview} alt={`${profile.fullName} profile photo`} fill className="object-cover" />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}