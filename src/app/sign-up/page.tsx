
"use client";

import React, { useState } from 'react';

// Sample data for searchable selections
const countries = ["Afghanistan", "Cambodia", "Canada", "France", "United Kingdom", "United States"];
const regions = ["California", "Kabul", "Paris", "Phnom Penh", "Texas", "London"];
const orgTypes = ["High School", "University", "Primary School", "Language Center", "Tech Institute"];

export default function OrganizationSignUp() {
  const [formData, setFormData] = useState({
    orgName: '',
    workEmail: '',
    password: '',
    orgAddress: '',
    country: '',
    region: '',
    orgType: ''
  });

  // Tab State (1 for Org Info, 2 for Account Details)
  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'country' | 'region' | 'orgType' | null>(null);
  
  // Search filter query states
  const [searchQueries, setSearchQueries] = useState({ country: '', region: '', orgType: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectOption = (field: 'country' | 'region' | 'orgType', value: string) => {
    setFormData({ ...formData, [field]: value });
    setOpenDropdown(null);
    setSearchQueries({ ...searchQueries, [field]: '' });
  };

  // Filtered arrays based on typing search queries
  const filteredCountries = countries.filter(c => c.toLowerCase().includes(searchQueries.country.toLowerCase()));
  const filteredRegions = regions.filter(r => r.toLowerCase().includes(searchQueries.region.toLowerCase()));
  const filteredOrgTypes = orgTypes.filter(t => t.toLowerCase().includes(searchQueries.orgType.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Complete Organization Data:', formData);
  };

  // Validation: Check if required fields in Tab 1 are filled
  const isTab1Valid = formData.orgName.trim() !== '' && formData.orgType !== '' && formData.country !== '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* 50% Width Container */}
      <div className="w-[50%] min-w-[350px] bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Back to Website Button */}
        <a 
          href="https://yourwebsite.com" 
          className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to website
        </a>
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Organization
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Set up your workspace to get started.
          </p>
        </div>

        {/* Tab Headers (Now unclickable progress indicators) */}
        <div className="flex border-b border-gray-200 mb-8 select-none">
          <div
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 1 
                ? 'border-[#4F46E5] text-[#4F46E5]' 
                : 'border-transparent text-gray-400'
            }`}
          >
            1. Organization Info
          </div>
          <div
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 2 
                ? 'border-[#4F46E5] text-[#4F46E5]' 
                : 'border-transparent text-gray-400'
            }`}
          >
            2. Account Setup
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* TAB 1 CONTENT: Organization Info */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Organization Name <span className="text-red-500">*</span></label>
                <input
                  name="orgName"
                  type="text"
                  required
                  value={formData.orgName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="Acme Corp, Inc."
                />
              </div>

              {/* Organization Type (Searchable Dropdown) */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700">Organization Type <span className="text-red-500">*</span></label>
                <div 
                  onClick={() => setOpenDropdown(openDropdown === 'orgType' ? null : 'orgType')}
                  className="mt-1 flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <span className={formData.orgType ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.orgType || "Select Type (e.g. University)"}
                  </span>
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>
                
                {openDropdown === 'orgType' && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Search type..."
                      value={searchQueries.orgType}
                      onChange={(e) => setSearchQueries({ ...searchQueries, orgType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredOrgTypes.map((type) => (
                        <div
                          key={type}
                          onClick={() => handleSelectOption('orgType', type)}
                          className="px-3 py-2 text-sm text-gray-900 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                        >
                          {type}
                        </div>
                      ))}
                      {filteredOrgTypes.length === 0 && <div className="p-2 text-xs text-gray-400 text-center">No results found</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Country (Searchable Dropdown) */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700">Country <span className="text-red-500">*</span></label>
                <div 
                  onClick={() => setOpenDropdown(openDropdown === 'country' ? null : 'country')}
                  className="mt-1 flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium cursor-pointer"
                >
                  <span className={formData.country ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.country || "Select Country"}
                  </span>
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>

                {openDropdown === 'country' && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={searchQueries.country}
                      onChange={(e) => setSearchQueries({ ...searchQueries, country: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredCountries.map((c) => (
                        <div
                          key={c}
                          onClick={() => handleSelectOption('country', c)}
                          className="px-3 py-2 text-sm text-gray-900 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Region (Searchable Dropdown) */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700">Region <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div 
                  onClick={() => setOpenDropdown(openDropdown === 'region' ? null : 'region')}
                  className="mt-1 flex items-center justify-between w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 font-medium cursor-pointer"
                >
                  <span className={formData.region ? 'text-gray-900' : 'text-gray-400'}>
                    {formData.region || "Select Region"}
                  </span>
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </div>

                {openDropdown === 'region' && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Search region..."
                      value={searchQueries.region}
                      onChange={(e) => setSearchQueries({ ...searchQueries, region: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredRegions.map((r) => (
                        <div
                          key={r}
                          onClick={() => handleSelectOption('region', r)}
                          className="px-3 py-2 text-sm text-gray-900 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        >
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Organization Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Organization Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  name="orgAddress"
                  type="text"
                  value={formData.orgAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="123 Education St, Floor 4"
                />
              </div>

              {/* Next Button with Validation */}
              <div className="pt-4">
                <button
                  type="button"
                  disabled={!isTab1Valid}
                  onClick={() => setActiveTab(2)}
                  className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all ${
                    isTab1Valid 
                    ? 'bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 cursor-pointer' 
                    : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isTab1Valid ? 'Next Step' : 'Please fill required fields'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2 CONTENT: Account Setup */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Work Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Work Email <span className="text-red-500">*</span></label>
                <input
                  name="workEmail"
                  type="email"
                  required
                  value={formData.workEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="admin@acmecorp.com"
                />
              </div>

              {/* Secure Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700">Secure Password <span className="text-red-500">*</span></label>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveTab(1)}
                  className="w-1/3 flex justify-center py-3.5 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#4F46E5] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4F46E5] transition-all transform hover:-translate-y-0.5"
                >
                  Register Organization
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Back to Login Link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-[#4F46E5] hover:underline">
            Log in here
          </a>
        </p>

      </div>
    </div>
  );
}