"use client";

import React, { useState } from 'react';

export default function AdminProfile() {
  const [profile, setProfile] = useState({
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@esame.com',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    alert('Password changed successfully!');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Account Details</h2>
        <p className="text-gray-500 mt-1 text-sm">Manage your admin profile and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Information Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={saveProfile} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Profile Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">First Name</label>
                <input
                  name="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={handleProfileChange}
                  // ADDED: text-gray-900
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={handleProfileChange}
                  // ADDED: text-gray-900
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Email Address</label>
              <input
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                disabled 
              />
              <p className="mt-1 text-xs text-gray-400">Contact system support to change your root email address.</p>
            </div>

            <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm text-sm">
              Save Profile
            </button>
          </form>

          {/* Change Password Form */}
          <form onSubmit={updatePassword} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Change Password</h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700">Current Password</label>
              <input
                name="currentPassword"
                type="password"
                required
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                // ADDED: text-gray-900
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  // ADDED: text-gray-900
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  // ADDED: text-gray-900
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1E7DF8]"
                />
              </div>
            </div>

            <button type="submit" className="px-6 py-2.5 bg-[#1E7DF8] text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-sm text-sm">
              Update Password
            </button>
          </form>
        </div>

        {/* Informational Sidebar */}
        <div className="col-span-1">
          <div className="bg-gray-900 p-6 rounded-2xl shadow-sm text-white">
            <h3 className="text-lg font-semibold mb-2">Admin Privileges</h3>
            <p className="text-sm text-gray-300 mb-4">
              As a Super Admin, your account holds the highest level of security clearance on the ESAME platform.
            </p>
            <ul className="text-sm text-gray-300 space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1E7DF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Manage all Organizations
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1E7DF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Configure Security Settings
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1E7DF8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Access System Logs
              </li>
            </ul>
            <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-400">Account Created</p>
              <p className="text-sm font-semibold">Jan 12, 2026</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}