"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation"; // Added router import

// Suggestion data — combobox still shows these as suggestions,
// but the user is free to type any value they want.
const countries = ["Afghanistan", "Cambodia", "Canada", "France", "United Kingdom", "United States"];
const regions = ["California", "Kabul", "Paris", "Phnom Penh", "Texas", "London"];
const orgTypes = ["High School", "University", "Primary School", "Language Center", "Tech Institute"];

type Field = "country" | "region" | "orgType";

// ---- Reusable combobox: type freely, or pick a suggestion ----
function Combobox({
  field,
  label,
  required,
  placeholder,
  value,
  suggestions,
  isOpen,
  onChange,
  onFocus,
  onBlur,
  onSelect,
  onClear,
}: {
  field: Field;
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  suggestions: string[];
  isOpen: boolean;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[#1F2A44]">
        {label} {required && <span className="text-rose-500">*</span>}
        {!required && <span className="text-[#8FA0BF] font-normal"> (Optional)</span>}
      </label>
      <div className="relative mt-1">
        <input
          type="text"
          name={field}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="block w-full px-4 py-3 pr-10 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] bg-white focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
        />
        {value && (
          <button
            type="button"
            aria-label={`Clear ${label}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9FAFCB] hover:text-[#3B4763] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#D5DEEF] rounded-xl shadow-lg shadow-[#395886]/10 p-2 space-y-0.5 max-h-48 overflow-y-auto">
          <p className="px-3 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#9FAFCB]">
            Suggestions
          </p>
          {suggestions.map((item) => (
            <div
              key={item}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="px-3 py-2 text-sm text-[#1F2A44] hover:bg-[#F0F3FA] rounded-lg cursor-pointer transition-colors"
            >
              {item}
            </div>
          ))}
        </div>
      )}

      {isOpen && suggestions.length === 0 && value && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#D5DEEF] rounded-xl shadow-lg shadow-[#395886]/10 p-3">
          <p className="text-xs text-[#9FAFCB]">
            No matches — <span className="text-[#395886] font-medium">"{value}"</span> will be used as entered.
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrganizationSignUp() {
  const router = useRouter(); // Initialized router
  
  const [formData, setFormData] = useState({
    orgName: "",
    workEmail: "",
    password: "",
    orgAddress: "",
    country: "",
    region: "",
    orgType: "",
  });

  // Tab state (1 = Org Info, 2 = Account Setup)
  const [activeTab, setActiveTab] = useState<1 | 2>(1);

  // Which combobox is currently showing its suggestion list
  const [openDropdown, setOpenDropdown] = useState<Field | null>(null);

  // Show/hide password toggle
  const [showPassword, setShowPassword] = useState(false);

  // Timers so a click on a suggestion registers before blur closes the list
  const blurTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleComboChange = (field: Field, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setOpenDropdown(field);
  };

  const handleSelectOption = (field: Field, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setOpenDropdown(null);
  };

  const handleClearField = (field: Field) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
    setOpenDropdown(field);
  };

  const handleComboBlur = (field: Field) => {
    blurTimers.current[field] = setTimeout(() => {
      setOpenDropdown((current) => (current === field ? null : current));
    }, 120);
  };

  const handleComboFocus = (field: Field) => {
    if (blurTimers.current[field]) clearTimeout(blurTimers.current[field]);
    setOpenDropdown(field);
  };

  const getSuggestions = (field: Field) => {
    const source = field === "country" ? countries : field === "region" ? regions : orgTypes;
    const query = formData[field].toLowerCase();
    if (!query) return source;
    return source.filter((item) => item.toLowerCase().includes(query));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Complete Organization Data:", formData);
    
    // Redirects directly to the verify-code page and passes the workEmail parameter
    router.push(`/verify-code?email=${encodeURIComponent(formData.workEmail)}`);
  };

  const isTab1Valid =
    formData.orgName.trim() !== "" && formData.orgType.trim() !== "" && formData.country.trim() !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EDF1FA] via-[#F5F7FC] to-[#E4EAF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-[50%] min-w-[350px] bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-[#395886]/10 border border-[#E7ECF7]">
        {/* Back to website */}
        <a
          href="https://yourwebsite.com"
          className="inline-flex items-center text-sm font-medium text-[#9FAFCB] hover:text-[#1F2A44] transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to website
        </a>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-extrabold text-[#1F2A44] tracking-tight">Create Organization</h2>
          <p className="mt-2 text-sm text-[#7D8CAB]">Set up your workspace to get started.</p>
        </div>

        {/* Tab progress indicators */}
        <div className="flex border-b border-[#E7ECF7] mb-8 select-none">
          <div
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 1 ? "border-[#395886] text-[#395886]" : "border-transparent text-[#B8C4DD]"
            }`}
          >
            1. Organization Info
          </div>
          <div
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              activeTab === 2 ? "border-[#395886] text-[#395886]" : "border-transparent text-[#B8C4DD]"
            }`}
          >
            2. Account Setup
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* TAB 1: Organization Info */}
          {activeTab === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold text-[#1F2A44]">
                  Organization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  name="orgName"
                  type="text"
                  required
                  value={formData.orgName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
                  placeholder="Acme Corp, Inc."
                />
              </div>

              <Combobox
                field="orgType"
                label="Organization Type"
                required
                placeholder="e.g. University, or type your own"
                value={formData.orgType}
                suggestions={getSuggestions("orgType")}
                isOpen={openDropdown === "orgType"}
                onChange={(value) => handleComboChange("orgType", value)}
                onFocus={() => handleComboFocus("orgType")}
                onBlur={() => handleComboBlur("orgType")}
                onSelect={(value) => handleSelectOption("orgType", value)}
                onClear={() => handleClearField("orgType")}
              />

              <Combobox
                field="country"
                label="Country"
                required
                placeholder="Type to search or enter a country"
                value={formData.country}
                suggestions={getSuggestions("country")}
                isOpen={openDropdown === "country"}
                onChange={(value) => handleComboChange("country", value)}
                onFocus={() => handleComboFocus("country")}
                onBlur={() => handleComboBlur("country")}
                onSelect={(value) => handleSelectOption("country", value)}
                onClear={() => handleClearField("country")}
              />

              <Combobox
                field="region"
                label="Region"
                placeholder="Type to search or enter a region"
                value={formData.region}
                suggestions={getSuggestions("region")}
                isOpen={openDropdown === "region"}
                onChange={(value) => handleComboChange("region", value)}
                onFocus={() => handleComboFocus("region")}
                onBlur={() => handleComboBlur("region")}
                onSelect={(value) => handleSelectOption("region", value)}
                onClear={() => handleClearField("region")}
              />

              <div>
                <label className="block text-sm font-semibold text-[#1F2A44]">
                  Organization Address <span className="text-[#8FA0BF] font-normal">(Optional)</span>
                </label>
                <input
                  name="orgAddress"
                  type="text"
                  value={formData.orgAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
                  placeholder="123 Education St, Floor 4"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  disabled={!isTab1Valid}
                  onClick={() => setActiveTab(2)}
                  className={`w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white transition-all ${
                    isTab1Valid
                      ? "bg-[#1F2A44] hover:bg-[#16203A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#395886] cursor-pointer"
                      : "bg-[#C9D2E3] cursor-not-allowed"
                  }`}
                >
                  {isTab1Valid ? "Next Step" : "Please fill required fields"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Account Setup */}
          {activeTab === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-semibold text-[#1F2A44]">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <input
                  name="workEmail"
                  type="email"
                  required
                  value={formData.workEmail}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
                  placeholder="admin@acmecorp.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1F2A44]">
                  Secure Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 pr-11 border border-[#C9D6EE] rounded-xl text-[#1F2A44] placeholder-[#9FAFCB] focus:outline-none focus:ring-2 focus:ring-[#395886] focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9FAFCB] hover:text-[#3B4763] transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5 1.638 0 3.19-.375 4.568-1.043m3.132-2.185A10.478 10.478 0 0022.066 12c-1.292-4.338-5.31-7.5-10.066-7.5-.988 0-1.945.14-2.85.4M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#9FAFCB]">Use at least 8 characters.</p>
              </div>

              <div className="pt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={() => setActiveTab(1)}
                  className="w-1/3 flex justify-center py-3.5 px-4 border border-[#C9D6EE] rounded-xl shadow-sm text-sm font-bold text-[#3B4763] bg-white hover:bg-[#F5F7FC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#395886] transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[#395886] hover:bg-[#2E4A73] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#395886] transition-all transform hover:-translate-y-0.5"
                >
                  Register Organization
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-[#7D8CAB]">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-[#395886] hover:underline">
            Log in here
          </a>
        </p>
      </div>
    </div>
  );
}