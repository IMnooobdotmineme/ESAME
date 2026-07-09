"use client";

import React, { useState } from 'react';

export default function RegisterAccount() {
  const [userType, setUserType] = useState<'teacher' | 'student'>('teacher');
  const [hasNoWebsite, setHasNoWebsite] = useState(false);
  const [formData, setFormData] = useState({
    country: 'Afghanistan',
    region: '',
    orgName: '',
    orgWebsite: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted Step 1 Data:', { userType, ...formData, hasNoWebsite });
    // Go to next step logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      
      {/* 5-Step Progress Header Bar */}
      <div className="w-full max-w-4xl bg-white border border-gray-100 rounded-2xl shadow-sm mb-8 px-6 py-4 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] text-sm font-medium text-gray-400">
          <div className="flex items-center gap-2 text-gray-900 border-b-2 border-[#4F46E5] pb-1">
            <span className="w-6 h-6 rounded-full border-2 border-[#4F46E5] flex items-center justify-center text-xs font-bold text-[#4F46E5]">1</span>
            Country
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">2</span>
            Email
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">3</span>
            Organization
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">4</span>
            Teacher
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">5</span>
            Details
          </div>
        </div>
      </div>

      {/* Main Form Content Card */}
      <div className="max-w-2xl w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-8">
          Register New Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* User Type Selection */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-3">User</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer text-gray-900 font-medium">
                <input
                  type="radio"
                  name="userType"
                  checked={userType === 'teacher'}
                  onChange={() => setUserType('teacher')}
                  className="w-5 h-5 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300"
                />
                I am a teacher
              </label>
              <label className="flex items-center gap-3 cursor-pointer text-gray-900 font-medium">
                <input
                  type="radio"
                  name="userType"
                  checked={userType === 'student'}
                  onChange={() => setUserType('student')}
                  className="w-5 h-5 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300"
                />
                I am a student
              </label>
            </div>
          </div>

          {/* Country Field */}
          <div>
            <label htmlFor="country" className="block text-base font-bold text-gray-900 mb-2">Country</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
            >
              <option value="Afghanistan">Afghanistan</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Cambodia">Cambodia</option>
            </select>
          </div>

          {/* Region Field */}
          <div>
            <label htmlFor="region" className="block text-base font-bold text-gray-900 mb-2">Region</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
            >
              <option value="">Region</option>
              <option value="Kabul">Kabul</option>
              <option value="Phnom Penh">Phnom Penh</option>
              <option value="California">California</option>
            </select>
          </div>

          {/* Organization Name */}
          <div>
            <label htmlFor="orgName" className="block text-base font-bold text-gray-900 mb-2">Organization name</label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              required
              placeholder="School name"
              value={formData.orgName}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
            />
          </div>

          {/* Organization Web Address */}
          <div>
            <label htmlFor="orgWebsite" className="block text-base font-bold text-gray-900 mb-2">Organization's web address</label>
            <input
              id="orgWebsite"
              name="orgWebsite"
              type="text"
              placeholder="School web address"
              disabled={hasNoWebsite}
              value={formData.orgWebsite}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>

          {/* Website Checkbox Toggle */}
          <div className="flex items-center">
            <input
              id="no-website"
              type="checkbox"
              checked={hasNoWebsite}
              onChange={(e) => setHasNoWebsite(e.target.checked)}
              className="h-5 w-5 text-[#4F46E5] focus:ring-[#4F46E5] border-gray-300 rounded"
            />
            <label htmlFor="no-website" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
              My organization doesn't have a website
            </label>
          </div>

          {/* Next Step Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-[#4F46E5] text-white font-bold rounded-full shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-all"
            >
              Next
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}