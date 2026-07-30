import React from 'react';
import Link from 'next/link';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  Sparkles,
  Check,
  Ticket,
} from 'lucide-react';
import { EsameLogo } from "@/components/organization/EsameLogo";

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-display',
});
const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-ticket-mono',
});

function Perforation({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden>
      <div className="h-2.5 w-2.5 rounded-full bg-slate-50" />
      <div className="flex-1 border-t-2 border-dashed border-slate-200" />
      <div className="h-2.5 w-2.5 rounded-full bg-slate-50" />
    </div>
  );
}

export default function Home() {
  return (
    <div className={`${display.variable} ${mono.variable} ${body.className} min-h-screen bg-white text-slate-800 overflow-x-hidden`}>

      {/* ================= NAVBAR ================= */}
      <nav className="max-w-[1200px] mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/">
          <EsameLogo height={28} />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/student/join"
            className="flex items-center gap-3 pl-5 pr-1 py-1 border border-slate-300 rounded-full text-sm text-slate-500 hover:border-navy-900 transition"
          >
            <span style={{ fontFamily: 'var(--font-ticket-mono)' }}>Student Key</span>
            <span className="w-8 h-8 bg-navy-900 text-white rounded-full flex items-center justify-center shrink-0">
              <ArrowRight size={16} />
            </span>
          </Link>
          <button className="px-6 py-2 bg-navy-900 text-white rounded-full text-sm font-semibold hover:bg-navy-800 transition">
            Sign Up
          </button>
          <button className="px-6 py-2 border border-slate-300 text-navy-900 rounded-full text-sm font-semibold hover:bg-slate-50 transition">
            Login
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-1/2 h-[600px] bg-sky-50 rounded-bl-[120px] -z-10" />

        <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center py-10 pb-28">
          {/* Left: copy */}
          <div className="space-y-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 border border-navy-900/15 rounded-full text-xs tracking-widest text-navy-900 bg-white"
              style={{ fontFamily: 'var(--font-ticket-mono)' }}
            >
              <Ticket size={13} />
              SECURE ASSESSMENT PLATFORM
            </div>

            <h1
              className="text-[3.4rem] leading-[1.05] tracking-tight text-black font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Reliable, secure &amp;<br />
              intelligent <span className="text-sky-500">online<br />examinations</span>
            </h1>

            <p className="text-[1.1rem] text-slate-600 leading-relaxed max-w-[480px]">
              Conduct high-integrity digital assessments with real-time supervision,
              proactive anti-cheating mechanisms, and automated AI assistance. Built
              for modern educational institutions.
            </p>

            <button
              className="px-8 py-3.5 bg-navy-900 text-white rounded-full font-semibold hover:bg-navy-800 transition mt-2 inline-flex items-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Get Started As Organization
              <ArrowRight size={18} />
            </button>

            <div className="flex gap-10 pt-6">
              <div className="flex items-start gap-2">
                <Check size={18} className="text-emerald-500 mt-1 shrink-0" strokeWidth={3} />
                <div>
                  <h4 className="font-semibold text-slate-900">Anti-cheating logs</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Tab, copy-paste &amp; focus detection</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check size={18} className="text-emerald-500 mt-1 shrink-0" strokeWidth={3} />
                <div>
                  <h4 className="font-semibold text-slate-900">AI assistant</h4>
                  <p className="text-sm text-slate-500 mt-0.5">Smart question bank generation</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: signature element — admission ticket */}
          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[24px] bg-sky-100 -z-10" />

            <div className="rounded-[24px] border border-slate-200 bg-white shadow-xl overflow-hidden rotate-[1.5deg]">
              {/* Ticket header strip */}
              <div className="bg-navy-900 px-6 py-4 flex items-center justify-between">
                <span className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                  ESAME
                </span>
                <div className="flex gap-1">
                  {[3, 5, 2, 6, 4, 2, 5].map((h, i) => (
                    <div key={i} className="w-[3px] bg-sky-300" style={{ height: `${h * 3}px` }} />
                  ))}
                </div>
              </div>

              <div className="px-6 pt-6 pb-4 relative">
                <p
                  className="text-[10px] tracking-[0.2em] text-slate-400 mb-4"
                  style={{ fontFamily: 'var(--font-ticket-mono)' }}
                >
                  ADMIT ONE · EXAM SESSION PASS
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] tracking-widest text-slate-400 mb-1">CANDIDATE</p>
                    <p className="text-navy-900 font-medium border-b border-dashed border-slate-200 pb-1.5" style={{ fontFamily: 'var(--font-ticket-mono)' }}>
                      Sok Panha
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] tracking-widest text-slate-400 mb-1">ROOM CODE</p>
                      <p className="text-navy-900 font-medium border-b border-dashed border-slate-200 pb-1.5" style={{ fontFamily: 'var(--font-ticket-mono)' }}>
                        7F-K391
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest text-slate-400 mb-1">DURATION</p>
                      <p className="text-navy-900 font-medium border-b border-dashed border-slate-200 pb-1.5" style={{ fontFamily: 'var(--font-ticket-mono)' }}>
                        45 min
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verified stamp */}
                <div className="absolute top-14 right-4 rotate-[-14deg] border-2 border-emerald-500/70 text-emerald-600 rounded-lg px-3 py-1 text-[11px] font-bold tracking-widest">
                  VERIFIED
                </div>
              </div>

              <div className="px-6">
                <Perforation />
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 tracking-wide" style={{ fontFamily: 'var(--font-ticket-mono)' }}>
                  VALID FOR ONE SESSION
                </p>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  READY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section divider */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-navy-900" style={{ clipPath: 'ellipse(70% 100% at 30% 100%)' }} />
      </div>

      {/* ================= WHY CHOOSE ================= */}
      <section className="pt-24 pb-24 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="text-4xl font-bold text-black mb-5" style={{ fontFamily: 'var(--font-display)' }}>
          Why choose Esame?
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-16 text-[1.05rem] leading-relaxed">
          Traditional digital assessments fail to balance academic reliability with
          simple access control. Esame solves this by combining client-less
          deployment with multi-layer browser integrity infrastructure.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: Ticket,
              tint: 'bg-sky-50 text-sky-600',
              title: 'Frictionless student access',
              text: "Students don't need persistent user records or signups. They provide their name and institutional ID to request immediate entry.",
            },
            {
              icon: Eye,
              tint: 'bg-emerald-50 text-emerald-600',
              title: 'Real-time anti-cheating',
              text: 'Instantaneous browser traps register multi-window changes, tab switches, and key-cutting loops, sending proctor alerts under 1 second.',
            },
            {
              icon: Sparkles,
              tint: 'bg-amber-50 text-amber-600',
              title: 'AI-powered efficiency',
              text: 'Teachers gain assistive generation engines that draft evaluation options by topic and difficulty, speeding up content preparation.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-start min-h-[240px] hover:shadow-md transition"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-6 ${item.tint}`}>
                <item.icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {item.title}
              </h3>
              <p className="text-[0.85rem] text-slate-500 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= USE CASES ================= */}
      <section className="py-20 px-6 max-w-[1100px] mx-auto">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-[2.3rem] font-bold text-black mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Just a few ways you can use it
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Esame scales dynamically according to role privileges and system
            scopes — whether you're hosting large university cohorts or fast
            modular class tests.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-sky-50/60 p-10 rounded-[20px] border border-sky-100">
            <span
              className="inline-block px-4 py-1 bg-navy-900 text-white rounded-full text-[11px] tracking-widest font-medium mb-6"
              style={{ fontFamily: 'var(--font-ticket-mono)' }}
            >
              ADMIN PASS
            </span>
            <h3 className="text-xl font-semibold text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Organization-wide testing
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Set up entire semesters, departments, and academic years. Delegate
              access directly to your teaching staff while tracking core success
              metrics on institutional dashboards.
            </p>
          </div>

          <div className="bg-emerald-50/60 p-10 rounded-[20px] border border-emerald-100">
            <span
              className="inline-block px-4 py-1 bg-emerald-700 text-white rounded-full text-[11px] tracking-widest font-medium mb-6"
              style={{ fontFamily: 'var(--font-ticket-mono)' }}
            >
              INSTRUCTOR PASS
            </span>
            <h3 className="text-xl font-semibold text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Classroom exam scheduling
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Build secure test sessions with dynamic rules. Monitor incoming
              candidate pipelines, handle live lockdown violations, and process
              grading directly.
            </p>
          </div>
        </div>
      </section>

      {/* ================= BANNER ================= */}
      <section className="px-6 max-w-[1100px] mx-auto py-10">
        <div className="bg-navy-900 rounded-2xl p-12 flex flex-col md:flex-row items-center justify-between text-white gap-6">
          <div className="text-center md:text-left max-w-lg">
            <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Your next secure exam session is here
            </h2>
            <p className="text-sky-100/80">
              Everything you need to deploy high-integrity testing environments.
            </p>
          </div>
          <button className="px-9 py-3.5 bg-white text-navy-900 font-semibold rounded-full hover:bg-slate-100 transition shrink-0">
            Start now!
          </button>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="pt-20 pb-24 px-6 max-w-[1100px] mx-auto text-center">
        <h2 className="text-4xl font-bold text-navy-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Advanced product features
        </h2>
        <p className="text-slate-600 max-w-[560px] mx-auto text-lg mb-14">
          Engineered around a high-performance framework stack to support strict
          execution workflows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          {[
            { icon: Eye, title: 'Anti-cheating logs', text: 'Tracks window focus shifting and full-screen manipulation limits.' },
            { icon: Sparkles, title: 'AI generation assistant', text: 'Generate structured questions through chat, filtered by difficulty.' },
            { icon: ShieldCheck, title: 'Lock & resume flow', text: "Automatically freezes a student's session upon reaching max warnings." },
            { icon: Check, title: 'Unified grading panel', text: 'Processes automatic grades while routing advanced answers for review.' },
          ].map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm min-h-[220px]">
              <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-white mb-5">
                <f.icon size={18} />
              </div>
              <h3 className="font-semibold text-[1.05rem] text-black mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {f.title}
              </h3>
              <p className="text-[0.8rem] text-slate-500 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="pt-10 pb-28 text-center px-6">
        <h2 className="text-[2.3rem] font-bold text-navy-900 mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Ready to transform how your<br />institution evaluates success?
        </h2>
        <p className="text-slate-600 mb-9 max-w-[520px] mx-auto text-[1.05rem] leading-relaxed">
          Join modern educational institutions using Esame to build, deliver, and
          track comprehensive tests with absolute precision.
        </p>
        <button className="px-8 py-3 bg-navy-900 text-white rounded-full font-semibold text-sm hover:bg-navy-800 transition inline-flex items-center gap-2">
          Get Started
          <ArrowRight size={16} />
        </button>
        <p className="text-slate-400 mt-4 text-sm">It only takes a minute to get started.</p>
      </section>

      {/* ================= FOOTER (ticket stub) ================= */}
      <footer className="bg-navy-900 text-white">
        <div className="max-w-[1100px] mx-auto px-6 pt-3">
          <div className="border-t-2 border-dashed border-white/15" />
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1">
            <p className="text-[11px] tracking-widest text-sky-300/80 mb-3" style={{ fontFamily: 'var(--font-ticket-mono)' }}>
              A LITTLE MORE ABOUT US
            </p>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Esame helps institutions run reliable, secure online exams — from
              teacher-created assessments to real-time proctoring and instant
              results, without the overhead of legacy testing software.
            </p>
            <button className="px-5 py-2 bg-white text-navy-900 rounded-full text-xs font-bold hover:bg-slate-100 transition">
              Get Started
            </button>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Platform</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="#" className="hover:text-white transition">For Organizations</Link></li>
              <li><Link href="#" className="hover:text-white transition">For Teachers</Link></li>
              <li><Link href="#" className="hover:text-white transition">For Students</Link></li>
              <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Features</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="#" className="hover:text-white transition">Anti-Cheating Detection</Link></li>
              <li><Link href="#" className="hover:text-white transition">AI Question Generation</Link></li>
              <li><Link href="#" className="hover:text-white transition">Automated Grading</Link></li>
              <li><Link href="#" className="hover:text-white transition">Analytics &amp; Reporting</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Resources</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition">FAQs</Link></li>
              <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white transition">Support</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-[1100px] mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="opacity-90">
              <EsameLogo height={22} />
            </div>
            <p
              className="text-[11px] text-slate-400 tracking-wide"
              style={{ fontFamily: 'var(--font-ticket-mono)' }}
            >
              © 2026 ESAME · SECURE EXAM ACCESS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}