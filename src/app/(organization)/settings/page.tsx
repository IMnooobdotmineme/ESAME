"use client";

import { validatePasswordStrength } from "@/lib/password-policy";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { OrgTopbar } from "@/components/organization/OrgTopbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { User, Upload, Check, Trash2, Crop, Camera } from "lucide-react";

const ORG_CACHE_KEY = "org-chrome-cache";

type CachedOrg = { 
  name: string; 
  avatarUrl: string | null;
  orgType?: string;
  country?: string;
  region?: string;
  address?: string;
};

function readCache(): CachedOrg | null {
  try {
    const raw = window.localStorage.getItem(ORG_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedOrg) : null;
  } catch {
    return null;
  }
}

function writeCache(data: CachedOrg) {
  try {
    window.localStorage.setItem(ORG_CACHE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — ignore, cache is a nice-to-have
  }
}

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuWrapRef = useRef<HTMLDivElement>(null);

  // Server-safe defaults — must match server render exactly, no cache read here.
  const [orgName, setOrgName] = useState("Organization");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [orgType, setOrgType] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [rawAvatar, setRawAvatar] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropZoom, setCropZoom] = useState(1);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");

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

  // Client-only, pre-paint: seed name/avatar from the shared cache so this
  // page doesn't flash the placeholder icon before /api/org/profile returns.
  useLayoutEffect(() => {
    const cached = readCache();
    if (cached) {
      setOrgName(cached.name);
      setAvatarPreview(cached.avatarUrl);
      setRawAvatar(cached.avatarUrl);
      if (cached.orgType) setOrgType(cached.orgType);
      if (cached.country) setCountry(cached.country);
      if (cached.region) setRegion(cached.region);
      if (cached.address) setAddress(cached.address);
    }
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/org/profile", { cache: "no-store" });
        const payload = await res.json();
        if (res.ok && payload?.org) {
          const nextName = payload.org.name ?? "Organization";
          const nextAvatar = payload.org.avatarUrl ?? null;
          const nextOrgType = payload.org.orgType ?? "";
          const nextCountry = payload.org.country ?? "";
          const nextRegion = payload.org.region ?? "";
          const nextAddress = payload.org.address ?? "";
          
          setOrgName(nextName);
          setEmail(payload.org.email ?? "");
          setDescription(payload.org.description ?? "");
          setOrgType(nextOrgType);
          setCountry(nextCountry);
          setRegion(nextRegion);
          setAddress(nextAddress);
          setAvatarPreview(nextAvatar);
          setRawAvatar(nextAvatar);
          writeCache({ 
            name: nextName, 
            avatarUrl: nextAvatar,
            orgType: nextOrgType,
            country: nextCountry,
            region: nextRegion,
            address: nextAddress
          });
        }
      } catch {
        // no-op — keep whatever the cache seeded, if anything
      }
    }

    loadProfile();
  }, []);

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

  // Persist just the avatar (keeps current name/description as-is, since the
  // backend PUT saves the whole profile in one shot).
  async function persistAvatar(nextAvatarUrl: string | null) {
    setAvatarSaving(true);
    setAvatarError("");
    try {
      const res = await fetch("/api/org/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          description,
          orgType,
          country,
          region,
          address,
          avatarUrl: nextAvatarUrl,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to save profile image.");
      }

      if (payload?.org) {
        const nextName = payload.org.name ?? orgName;
        const nextAvatar = payload.org.avatarUrl ?? null;
        const nextOrgType = payload.org.orgType ?? orgType;
        const nextCountry = payload.org.country ?? country;
        const nextRegion = payload.org.region ?? region;
        const nextAddress = payload.org.address ?? address;
        
        setOrgName(nextName);
        setDescription(payload.org.description ?? "");
        setOrgType(nextOrgType);
        setCountry(nextCountry);
        setRegion(nextRegion);
        setAddress(nextAddress);
        setAvatarPreview(nextAvatar);
        setRawAvatar(nextAvatar);
        writeCache({ 
          name: nextName, 
          avatarUrl: nextAvatar,
          orgType: nextOrgType,
          country: nextCountry,
          region: nextRegion,
          address: nextAddress
        });
      }

      window.dispatchEvent(new Event("org-profile-updated"));
      return true;
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Unable to save image.");
      return false;
    } finally {
      setAvatarSaving(false);
    }
  }

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

  async function deleteAvatar() {
    setAvatarMenuOpen(false);
    const ok = await persistAvatar(null);
    if (ok) {
      setCropOpen(false);
    }
  }

  // "Apply" saves the cropped image straight to the database.
  async function applyAvatarCrop() {
    if (!rawAvatar) return;
    try {
      const cropped = await cropAvatarDataUrl(rawAvatar, cropZoom);
      const ok = await persistAvatar(cropped);
      if (ok) {
        setCropOpen(false);
      }
    } catch {
      setAvatarError("Unable to prepare image.");
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
          orgType,
          country,
          region,
          address,
          avatarUrl: avatarPreview,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save profile");
      }
      const payload = await res.json();
      if (payload?.org) {
        const nextName = payload.org.name ?? orgName;
        const nextAvatar = payload.org.avatarUrl ?? null;
        const nextOrgType = payload.org.orgType ?? orgType;
        const nextCountry = payload.org.country ?? country;
        const nextRegion = payload.org.region ?? region;
        const nextAddress = payload.org.address ?? address;
        
        setOrgName(nextName);
        setDescription(payload.org.description ?? "");
        setOrgType(nextOrgType);
        setCountry(nextCountry);
        setRegion(nextRegion);
        setAddress(nextAddress);
        setAvatarPreview(nextAvatar);
        setRawAvatar(nextAvatar);
        writeCache({ 
          name: nextName, 
          avatarUrl: nextAvatar,
          orgType: nextOrgType,
          country: nextCountry,
          region: nextRegion,
          address: nextAddress
        });
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
    const pwdPolicyError = validatePasswordStrength(newPassword);
    if (pwdPolicyError) {
      setPasswordError(pwdPolicyError);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                      Organization Type
                    </label>
                    <input
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      placeholder="e.g., University, High School"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                      Country
                    </label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., Cambodia, United States"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                      Region / State / Province
                    </label>
                    <input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g., Phnom Penh, California"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                      Address
                    </label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, floor, building"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
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
                {passwordError && <p className="text-sm text-red-600 whitespace-pre-line">{passwordError}</p>}
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
              <div className="relative h-28 w-28" ref={avatarMenuWrapRef}>
                <button
                  type="button"
                  onClick={() => avatarPreview && setAvatarPreviewOpen(true)}
                  className="h-28 w-28 rounded-full bg-navy-900 flex items-center justify-center overflow-hidden relative"
                  disabled={!avatarPreview}
                  aria-label={avatarPreview ? "View profile photo" : undefined}
                >
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Avatar preview" fill className="object-cover" />
                  ) : (
                    <User size={44} className="text-white" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((v) => !v)}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow ring-2 ring-white hover:bg-sky-600 transition-colors"
                  aria-label="Change profile photo"
                >
                  <Camera size={14} />
                </button>

                {avatarMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20 text-left">
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
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="mt-3 text-base font-semibold text-navy-900">{orgName}</p>
              <p className="mt-1 text-xs text-slate-400">
                {avatarPreview ? "Click photo to view, camera icon to change" : "Click the camera icon to add a photo"}
              </p>
              {avatarError && <p className="mt-1 text-xs text-red-600">{avatarError}</p>}

              <div className="w-full mt-6 text-left">
                <label className="text-sm font-medium text-navy-900 mb-1.5 block">Description</label>
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

      {/* Crop dialog — Save writes directly to the database */}
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
          <Button type="button" variant="outline" onClick={() => setCropOpen(false)} disabled={avatarSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={applyAvatarCrop} disabled={avatarSaving}>
            {avatarSaving ? <Check size={15} className="animate-pulse" /> : null}
            {avatarSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Full-size preview modal, centered on screen */}
      <Dialog open={avatarPreviewOpen} onClose={() => setAvatarPreviewOpen(false)} className="max-w-sm">
        <DialogHeader title="Profile Photo" onClose={() => setAvatarPreviewOpen(false)} />
        <div className="px-6 py-6 flex justify-center">
          {avatarPreview && (
            <div className="relative h-72 w-72 rounded-2xl overflow-hidden bg-slate-100">
              <Image src={avatarPreview} alt={`${orgName} profile photo`} fill className="object-cover" />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}