"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { User, Upload, Check, Trash2, Crop } from "lucide-react";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgName, setOrgName] = useState("Organization");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [rawAvatar, setRawAvatar] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPassword, setSavedPassword] = useState(false);

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

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/org/profile", { cache: "no-store" });
        const payload = await res.json();
        if (res.ok && payload?.org) {
          setOrgName(payload.org.name ?? "Organization");
          setEmail(payload.org.email ?? "");
          setDescription(payload.org.description ?? "");
          setAvatarPreview(payload.org.avatarUrl ?? null);
          setRawAvatar(payload.org.avatarUrl ?? null);
        }
      } catch {
        // no-op
      }
    }

    loadProfile();
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setRawAvatar(dataUrl);
      setCropZoom(1);
      try {
        setAvatarPreview(await cropAvatarDataUrl(dataUrl, 1));
      } catch {
        setAvatarPreview(dataUrl);
      }
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function deleteAvatar() {
    setAvatarPreview(null);
    setRawAvatar(null);
    setCropOpen(false);
  }

  async function applyAvatarCrop() {
    if (!rawAvatar) return;
    try {
      setAvatarPreview(await cropAvatarDataUrl(rawAvatar, cropZoom));
      setCropOpen(false);
    } catch {
      setCropOpen(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/org/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          description,
          avatarUrl: avatarPreview,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }
      const payload = await res.json();
      if (payload?.org) {
        setOrgName(payload.org.name ?? orgName);
        setDescription(payload.org.description ?? "");
        setAvatarPreview(payload.org.avatarUrl ?? null);
        setRawAvatar(payload.org.avatarUrl ?? null);
      }

      setSavedProfile(true);
      window.dispatchEvent(new Event("org-profile-updated"));
      setTimeout(() => setSavedProfile(false), 2000);
    } catch {
      setSavedProfile(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
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

    try {
      const res = await fetch("/api/org/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to update password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSavedPassword(true);
      setTimeout(() => setSavedPassword(false), 2000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to update password.");
    }
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
                    value={email}
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
              <div className="mt-3 flex items-center gap-2">
                {avatarPreview && (
                  <>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCropOpen(true)} disabled={!rawAvatar}>
                      <Crop size={13} />
                      Edit
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={deleteAvatar}>
                      <Trash2 size={13} />
                      Delete
                    </Button>
                  </>
                )}
              </div>

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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setCropOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={applyAvatarCrop}>
            Apply
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
