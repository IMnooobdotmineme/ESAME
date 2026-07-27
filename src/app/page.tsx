import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden">

      {/* ================= HERO SECTION ================= */}
      <div className="relative w-full bg-white">

        {/* Top Right Light Blue Curve Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-[#eef5fd] rounded-bl-[100%] z-0"></div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          {/* Navbar */}
          <nav className="flex items-center justify-between py-6 mb-10">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-[#1f385c]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4h2v16H5zM9 4h9v4H9zM9 10h7v4H9zM9 16h9v4H9z" />
              </svg>
              <span className="text-3xl font-bold text-[#1f385c]">Esame</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Student Key"
                  className="pl-5 pr-12 py-2 border border-slate-300 rounded-full text-sm text-slate-500 w-56 focus:outline-none focus:border-[#1f385c]"
                />
                <button className="absolute right-1 w-8 h-8 bg-[#1f385c] text-white rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
              <Link href="/sign-up">
                  <button className="px-6 py-2 bg-[#1f385c] text-white rounded-full text-sm font-semibold hover:bg-[#152a48] transition">
               Sign Up
              </button>
              </Link>
              <Link href="/login">
              <button className="px-6 py-2 border border-slate-300 text-[#1f385c] rounded-full text-sm font-semibold hover:bg-slate-50 transition">
                
             Login
              </button>
              </Link>
              
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex flex-col lg:flex-row items-center justify-between pb-32">
            <div className="max-w-[600px] space-y-6">
              <div className="inline-block px-5 py-1.5 border border-[#1f385c]/20 rounded-full text-sm text-[#1f385c] bg-white">
                Secure Assessment Platform
              </div>

              <h1 className="text-[3.5rem] font-black text-black leading-tight tracking-tight">
                Reliable, Secure &<br />
                Intelligent <span className="text-[#89c8ff]">Online<br/>Examinations</span>
              </h1>

              <p className="text-[1.1rem] text-slate-700 leading-snug max-w-[500px]">
                Conduct high-integrity digital assessments with real-time supervision, proactive anti-cheating mechanisms, and automated AI assistance. Built for modern educational institutions.
              </p>

              <button className="px-8 py-3.5 bg-[#1f385c] text-white rounded-full font-semibold hover:bg-[#152a48] transition mt-2">
                Get Started As Organization
              </button>

              <div className="flex gap-12 pt-6">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <div>
                    <h4 className="font-bold text-slate-900">Anti-Cheating Logs</h4>
                    <p className="text-sm text-slate-600 mt-1">Tab, copy-paste, & focus detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  <div>
                    <h4 className="font-bold text-slate-900">AI Assistant</h4>
                    <p className="text-sm text-slate-600 mt-1">Smart question bank generations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Illustration (original inline SVG — replaces missing /WEB_ONE.jpg) */}
            <div className="w-[440px] flex-shrink-0 z-10 relative mt-14 lg:mt-0">
              {/* Soft glow behind illustration */}
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-[360px] h-[360px] rounded-full bg-[#eaf3ff]"></div>
              </div>

              <svg viewBox="0 0 420 420" className="w-full h-auto">
                {/* decorative ring */}
                <circle cx="210" cy="210" r="170" fill="none" stroke="#dceafd" strokeWidth="2" />
                <circle cx="210" cy="210" r="140" fill="none" stroke="#dceafd" strokeWidth="2" />

                {/* clipboard body */}
                <rect x="120" y="70" width="180" height="260" rx="16" fill="#ffffff" stroke="#1f385c" strokeWidth="4" />
                {/* clip */}
                <rect x="185" y="52" width="50" height="26" rx="8" fill="#1f385c" />
                {/* title bar */}
                <rect x="140" y="96" width="140" height="34" rx="6" fill="#ffdf6b" />
                <text x="210" y="120" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="20" fill="#1f385c">TEST</text>

                {/* checklist rows */}
                <g>
                  <rect x="140" y="150" width="18" height="18" rx="4" fill="#89c8ff" />
                  <path d="M144 159l4 4 8-8" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="168" y="153" width="112" height="10" rx="4" fill="#e6edf5" />
                </g>
                <g>
                  <rect x="140" y="182" width="18" height="18" rx="4" fill="#a6f0c2" />
                  <path d="M144 191l4 4 8-8" stroke="#1f385c" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="168" y="185" width="90" height="10" rx="4" fill="#e6edf5" />
                </g>
                <g>
                  <rect x="140" y="214" width="18" height="18" rx="4" fill="#e6edf5" />
                  <rect x="168" y="217" width="100" height="10" rx="4" fill="#e6edf5" />
                </g>
                <g>
                  <rect x="140" y="246" width="18" height="18" rx="4" fill="#e6edf5" />
                  <rect x="168" y="249" width="75" height="10" rx="4" fill="#e6edf5" />
                </g>

                {/* pencil */}
                <g transform="rotate(45 300 300)">
                  <rect x="288" y="230" width="16" height="90" rx="4" fill="#ffdf6b" />
                  <path d="M288 230 L304 230 L296 210 Z" fill="#f0a04b" />
                  <rect x="288" y="316" width="16" height="10" fill="#e6edf5" />
                </g>

                {/* hand holding clipboard base */}
                <path d="M150 330 Q210 360 270 330 L270 345 Q210 372 150 345 Z" fill="#1f385c" />
              </svg>
            </div>
          </div>
        </div>

        {/* Overlapping waves */}
        <div className="absolute bottom-[-150px] left-0 w-full overflow-hidden leading-none z-0 h-[300px]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
            <path fill="#1f385c" d="M0,160L80,149.3C160,139,320,117,480,128C640,139,800,181,960,208C1120,235,1280,245,1360,250.7L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
          <svg viewBox="0 0 1440 320" className="absolute bottom-[-50px] w-full h-full opacity-90" preserveAspectRatio="none">
             <path fill="#6ca2e8" d="M0,224L80,240C160,256,320,288,480,277.3C640,267,800,213,960,202.7C1120,192,1280,224,1360,240L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* ================= WHY CHOOSE SECTION ================= */}
      <section className="pt-56 pb-24 px-6 max-w-[1100px] mx-auto text-center relative z-10">
        <h2 className="text-4xl font-bold text-black mb-6">Why choose Esame?</h2>
        <p className="text-slate-600 max-w-3xl mx-auto mb-16 text-[1.05rem] leading-relaxed">
          Traditional digital assessments fail to balance academic reliability with simple access control. ESAME solves this by combining client-less deployment with multi-layer browser integrity infrastructure
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-[#f8fbff] rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-start min-h-[250px]">
            <div className="w-10 h-10 bg-[#a6c8f0] text-black rounded-lg flex items-center justify-center text-lg font-bold mb-6">1</div>
            <h3 className="text-lg font-bold text-black mb-3">Frictionless Student Access</h3>
            <p className="text-[0.85rem] text-slate-500 leading-relaxed">Students don't need persistent user records or signups. They provide their name and institutional identification code to request immediate entry parameters.</p>
          </div>

          <div className="bg-[#f8fbff] rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-start min-h-[250px]">
            <div className="w-10 h-10 bg-[#a6f0c2] text-black rounded-lg flex items-center justify-center text-lg font-bold mb-6">2</div>
            <h3 className="text-lg font-bold text-black mb-3">Real-Time Anti-Cheating</h3>
            <p className="text-[0.85rem] text-slate-500 leading-relaxed">Instantaneous browser traps register multi-window changes, tab switches, and key cutting loops, sending critical structural proctor alerts under 1 second.</p>
          </div>

          <div className="bg-[#f8fbff] rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-start min-h-[250px]">
            <div className="w-10 h-10 bg-[#f0d4a6] text-black rounded-lg flex items-center justify-center text-lg font-bold mb-6">3</div>
            <h3 className="text-lg font-bold text-black mb-3">AI-Powered Efficiency</h3>
            <p className="text-[0.85rem] text-slate-500 leading-relaxed">Teachers gain assistive generation engines that quickly draft evaluation options by topic, complexity, or discipline, drastically speeding up content preparation workflows.</p>
          </div>
        </div>
      </section>

      {/* ================= USE CASES ================= */}
      {/* Reference layout: heading/paragraph as its own full-width row, then the two
          use-case cards sit side-by-side beneath it (not stacked in a narrow column) */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute left-[-50px] top-[5%] w-[450px] h-[300px] bg-[#1f385c] rounded-r-full z-0"></div>
        <div className="absolute left-[-20px] top-[28%] w-[350px] h-[150px] bg-[#6ca2e8] rounded-r-full z-0 -z-10"></div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="pl-8 lg:pl-40 mb-14 max-w-2xl">
            <h2 className="text-[2.5rem] font-bold text-black mb-4 leading-tight">Just a few ways you can use</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              ESAME scales dynamically according to role privileges and system scopes—whether you are hosting large university cohorts or fast modular class tests.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pl-8 lg:pl-40">
            {/* Blue Tinted Card */}
            <div className="bg-[#f4f7fc] p-10 rounded-[20px] border border-blue-50 shadow-sm">
              <span className="inline-block px-8 py-1.5 bg-[#abc7eb] text-[#1f385c] rounded-full text-sm font-medium mb-6">
                Institutional Lead
              </span>
              <h3 className="text-xl font-bold text-black mb-3">Organization-Wide Testing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Set up entire semesters, departments, and academic years. Register and delegate access vectors directly to your active training staff while tracking core success parameters on institutional dashboards.</p>
            </div>

            {/* Green Tinted Card */}
            <div className="bg-[#f4fcf6] p-10 rounded-[20px] border border-green-50 shadow-sm">
              <span className="inline-block px-8 py-1.5 bg-[#a3e8b9] text-emerald-900 rounded-full text-sm font-medium mb-6">
                Course Supervisor
              </span>
              <h3 className="text-xl font-bold text-black mb-3">Classroom Exam Scheduling</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Build secure test sessions with customized dynamic rules. Monitor incoming applicant pipelines, handle live lockdown violations, and process grading schemas directly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECURE EXAM BANNER & FEATURES ================= */}
      <section className="pt-20 pb-32 px-6 max-w-[1200px] mx-auto relative overflow-hidden">

        <div className="bg-[#1f385c] rounded-2xl p-14 flex flex-col md:flex-row items-center justify-between text-white shadow-xl mb-32 z-20 relative">
          <div className="mb-6 md:mb-0 max-w-lg text-center md:text-left">
            <h2 className="text-[2rem] font-medium mb-2 tracking-wide">Your next secure exam session is here</h2>
            <p className="text-[#a0bcdb] text-[1.1rem]">Everything you need to deploy high-integrity<br/> testing environments</p>
          </div>
          <button className="px-10 py-3.5 bg-white text-[#1f385c] font-bold rounded-full hover:bg-slate-100 transition shadow">
            Start now!
          </button>
        </div>

        <div className="text-center mb-16 relative z-20">
          <h2 className="text-4xl font-bold text-[#3d597d] mb-4">Advanced Product Features</h2>
          <p className="text-slate-600 max-w-[600px] mx-auto text-lg">
            Engineered around a high-performance framework stack<br/>
            (Next.js, Supabase, and PostgreSQL) to support strict execution<br/> workflows.
          </p>
        </div>

        <div className="absolute bottom-[20%] left-[-10%] w-[120%] h-[300px] bg-[#1f385c] -rotate-[8deg] z-0"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[120%] h-[200px] bg-[#6ca2e8] -rotate-[8deg] z-0"></div>

        {/* Feature Cards Grid — square badge icons to match reference (was rounded-full) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-20">

          <div className="bg-white p-6 rounded-[20px] shadow-lg border border-slate-100 flex flex-col items-start min-h-[260px]">
            <div className="w-10 h-10 bg-[#405f87] rounded-xl flex items-center justify-center text-white mb-5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <h3 className="font-bold text-[1.1rem] text-black mb-3">Anti-Cheating Logs</h3>
            <p className="text-[0.8rem] text-slate-500 leading-relaxed">Tracks window focus shifting, full-screen manipulation limits</p>
          </div>

          <div className="bg-white p-6 rounded-[20px] shadow-lg border border-slate-100 flex flex-col items-start min-h-[260px]">
            <div className="w-10 h-10 bg-[#405f87] rounded-xl flex items-center justify-center text-white mb-5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <h3 className="font-bold text-[1.1rem] text-black mb-3">AI Generation Assistant</h3>
            <p className="text-[0.8rem] text-slate-500 leading-relaxed">Generate structural questions instantly through chat interactions filtered by difficulty levels</p>
          </div>

          <div className="bg-white p-6 rounded-[20px] shadow-lg border border-slate-100 flex flex-col items-start min-h-[260px]">
            <div className="w-10 h-10 bg-[#405f87] rounded-xl flex items-center justify-center text-white mb-5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </div>
            <h3 className="font-bold text-[1.1rem] text-black mb-3">Lock & Resume Flow</h3>
            <p className="text-[0.8rem] text-slate-500 leading-relaxed">Automatically freezes a student's session upon reaching maximum warning</p>
          </div>

          <div className="bg-white p-6 rounded-[20px] shadow-lg border border-slate-100 flex flex-col items-start min-h-[260px]">
            <div className="w-10 h-10 bg-[#405f87] rounded-xl flex items-center justify-center text-white mb-5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
            </div>
            <h3 className="font-bold text-[1.1rem] text-black mb-3">Unified Grading Panel</h3>
            <p className="text-[0.8rem] text-slate-500 leading-relaxed">Processes automatic grades for standard queries while routing advanced</p>
          </div>

        </div>
      </section>

      {/* ================= PRE-FOOTER CTA ================= */}
      <section className="pt-20 pb-32 text-center px-6 bg-white relative z-20">
        <h2 className="text-[2.5rem] font-bold text-[#3d597d] mb-4">
          Ready to transform how your<br/> institution evaluates success?
        </h2>
        <p className="text-slate-600 mb-10 max-w-[600px] mx-auto text-[1.1rem] leading-relaxed">
          Join modern educational institutions using Esame to<br/> build, deliver, and track comprehensive tests with<br/> absolute precision.
        </p>

        <button className="px-8 py-3 bg-gradient-to-r from-[#5077a3] to-[#8eb5de] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition shadow-md flex items-center justify-center gap-2 mx-auto">
          Get Started
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
        <p className="text-[#a8a8a8] mt-4 text-[0.95rem]">It only takes a minute to<br/> get started.</p>
      </section>

      {/* ================= FOOTER ================= */}
      <div className="relative bg-[#1f385c]">
        <div className="absolute top-[-100px] left-0 w-full overflow-hidden leading-none z-10">
           <svg viewBox="0 0 1440 150" preserveAspectRatio="none" className="block w-full h-[150px]">
             <path fill="#1f385c" d="M0,32L120,42.7C240,53,480,75,720,80C960,85,1200,75,1320,69.3L1440,64L1440,150L1320,150C1200,150,960,150,720,150C480,150,240,150,120,150L0,150Z"></path>
           </svg>
        </div>

        <footer className="max-w-[1200px] mx-auto px-6 pt-10 pb-4 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-white">

            <div className="col-span-1">
              <h3 className="text-[1.05rem] mb-4 text-[#e0e0e0]">A little more about us :</h3>
              <p className="text-[0.85rem] text-[#9ca3af] mb-6 leading-relaxed">
                We make it easy for students, job seekers, and companies to find the right match through a simple job posting and application system.
              </p>
              <button className="px-6 py-2 bg-white text-[#1f385c] rounded-full text-xs font-bold hover:bg-slate-100 transition shadow">
                Join us!
              </button>
            </div>

            <div className="col-span-1 md:pl-10">
              <h3 className="font-bold mb-4 text-white text-[0.9rem]">Platform</h3>
              <ul className="space-y-3 text-[0.85rem] text-[#9ca3af]">
                <li><Link href="#" className="hover:text-white transition">Browse Jobs</Link></li>
                <li><Link href="#" className="hover:text-white transition">Post a Job</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="font-bold mb-4 text-white text-[0.9rem]">Explore</h3>
              <ul className="space-y-3 text-[0.85rem] text-[#9ca3af]">
                <li><Link href="#" className="hover:text-white transition">Internships</Link></li>
                <li><Link href="#" className="hover:text-white transition">Companies</Link></li>
                <li><Link href="#" className="hover:text-white transition">Career Tips</Link></li>
                <li><Link href="#" className="hover:text-white transition">Collaboration features</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="font-bold mb-4 text-white text-[0.9rem]">Resources</h3>
              <ul className="space-y-3 text-[0.85rem] text-[#9ca3af]">
                <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">FAQs</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition">Support</Link></li>
              </ul>
            </div>
          </div>
        </footer>

        <div className="bg-white w-full py-6">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
            <div className="text-2xl font-bold text-[#1f385c] flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 4h2v16H5zM9 4h9v4H9zM9 10h7v4H9zM9 16h9v4H9z" />
              </svg>
              Esame
            </div>
            <p className="text-[0.7rem] text-slate-500 mt-4 md:mt-0">
              © 2026 NextHire. All rights reserved. Making job searching simple and accessible.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}