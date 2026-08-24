"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EsameLogo } from "@/components/organization/EsameLogo";

/* ---------------------------------------------------------------- */
/*  Small helper: fades + slides a section into view once it enters  */
/*  the viewport. Pure IntersectionObserver, no dependencies.        */
/* ---------------------------------------------------------------- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Us" },
  { id: "services", label: "Services" },
  { id: "team", label: "Team" },
];

const SOCIAL_LINKS = [
  {
    label: "X / Twitter",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "LinkedIn",
    href: "#",
    path: "M4.983 3.5a2.5 2.5 0 11-.005 5 2.5 2.5 0 01.005-5zM.5 8.75h4v14.75h-4zm7.5 0h3.83v2.02h.054c.534-1.01 1.84-2.076 3.79-2.076 4.054 0 4.8 2.667 4.8 6.13v8.676h-4v-7.69c0-1.835-.033-4.195-2.556-4.195-2.56 0-2.953 2-2.953 4.06v7.825h-4z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.332 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.948-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "Facebook",
    href: "#",
    path: "M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.196 2.238.196v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.877h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z",
  },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden">
      {/* ================= DARK STICKY NAVIGATION ================= */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#0f1c31]/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/5"
            : "bg-[#0f1c31] border-b border-white/0"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            <a href="#home" className="flex items-center shrink-0">
              <EsameLogo height={28} className="brightness-0 invert" />
            </a>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={`#${link.id}`}
                    onClick={() => setMobileOpen(false)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                      active
                        ? "text-white bg-white/10"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute left-4 right-4 -bottom-[1px] h-[2px] rounded-full bg-[#4fc3f7] origin-left transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </a>
                );
              })}
            </nav>

            {/* CTA + auth (desktop) */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/join"
                className="group relative flex items-center justify-center pl-11 pr-5 py-2 bg-white border border-white/0 rounded-full text-sm text-[#1f385c] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="-translate-x-1 transition-transform duration-500 ease-in-out group-hover:-translate-x-5">
                  Student Key
                </span>
                <span className="absolute left-2 w-7 h-7 bg-[#1f385c] text-white rounded-full flex items-center justify-center transition-[left] duration-500 ease-in-out group-hover:left-[calc(100%-2.25rem)]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="group relative px-6 py-2.5 rounded-full text-sm font-semibold text-[#0f1c31] bg-[#ffdf6b] overflow-hidden transition-all duration-300 hover:bg-[#ffe58a] hover:shadow-[0_0_25px_-4px_rgba(255,223,107,0.8)] hover:-translate-y-0.5"
              >
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden relative w-10 h-10 flex items-center justify-center text-white"
            >
              <span
                className={`absolute h-[2px] w-6 bg-white rounded-full transition-all duration-300 ${
                  mobileOpen ? "rotate-45" : "-translate-y-2"
                }`}
              />
              <span
                className={`absolute h-[2px] w-6 bg-white rounded-full transition-all duration-300 ${
                  mobileOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute h-[2px] w-6 bg-white rounded-full transition-all duration-300 ${
                  mobileOpen ? "-rotate-45" : "translate-y-2"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 bg-[#0f1c31] border-t border-white/5 ${
            mobileOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col px-6 py-4 gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeSection === link.id
                    ? "text-white bg-white/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/student/join"
              onClick={() => setMobileOpen(false)}
              className="group relative flex items-center justify-center pl-11 pr-5 py-2 mt-3 bg-white rounded-full text-sm text-[#1f385c] font-semibold"
            >
              <span className="-translate-x-1 transition-transform duration-500 ease-in-out group-hover:-translate-x-5">
                Student Key
              </span>
              <span className="absolute left-2 w-7 h-7 bg-[#1f385c] text-white rounded-full flex items-center justify-center transition-[left] duration-500 ease-in-out group-hover:left-[calc(100%-2.25rem)]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
              <Link
                href="/login"
                className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold text-slate-200 border border-white/15 hover:bg-white/5 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/sign-up"
                className="flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold text-[#0f1c31] bg-[#4fc3f7]"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section id="home" className="relative w-full bg-white pt-[72px] scroll-mt-[72px]">
        <div className="absolute top-0 right-0 w-1/2 h-[560px] bg-[#eef5fd] rounded-bl-[100%] z-0 animate-blob" />
        <div className="absolute top-40 left-0 w-64 h-64 bg-[#a6f0c2]/20 rounded-full blur-3xl z-0 animate-blob animate-blob-delay" />

        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between pt-16 pb-28 lg:pb-40">
            <Reveal className="max-w-[600px] space-y-6">
              <div className="inline-block px-5 py-1.5 border border-[#1f385c]/20 rounded-full text-sm text-[#1f385c] bg-white shadow-sm">
                Secure Assessment Platform
              </div>

              <h1 className="text-[2.6rem] sm:text-[3.5rem] font-black text-black leading-tight tracking-tight">
                Reliable, Secure &amp;
                <br />
                Intelligent{" "}
                <span className="text-[#2ea3e8] relative">
                  Online Examinations
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 text-[#89c8ff]"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9C40 2 160 2 198 9"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-[1.1rem] text-slate-700 leading-snug max-w-[500px]">
                Conduct high-integrity digital assessments with real-time supervision, proactive
                anti-cheating mechanisms, and automated AI assistance. Built for modern
                educational institutions.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/sign-up">
                  <button className="px-8 py-3.5 bg-[#1f385c] text-white rounded-full font-semibold transition-all duration-300 hover:bg-[#152a48] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#1f385c]/20">
                    Get Started As Organization
                  </button>
                 </Link>
                <a
                  href="#services"
                  className="px-8 py-3.5 rounded-full font-semibold text-[#1f385c] border border-[#1f385c]/20 transition-all duration-300 hover:bg-slate-50 hover:-translate-y-0.5"
                >
                  See how it works
                </a>
              </div>

              <div className="flex flex-wrap gap-x-12 gap-y-6 pt-6">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-400 mt-1 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-slate-900">Anti-Cheating Logs</h4>
                    <p className="text-sm text-slate-600 mt-1">Tab, copy-paste, & focus detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-400 mt-1 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <h4 className="font-bold text-slate-900">AI Assistant</h4>
                    <p className="text-sm text-slate-600 mt-1">Smart question bank generations</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Hero Illustration */}
            <Reveal delay={150} className="w-[320px] sm:w-[420px] flex-shrink-0 z-10 relative mt-16 lg:mt-0">
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-full bg-[#eef5fd]" />
              </div>

              <svg viewBox="0 0 420 420" className="w-full h-auto drop-shadow-xl">
                <circle cx="210" cy="210" r="170" fill="none" stroke="#dceafd" strokeWidth="2" />
                <circle cx="210" cy="210" r="140" fill="none" stroke="#dceafd" strokeWidth="2" />

                <rect x="120" y="70" width="180" height="260" rx="16" fill="#ffffff" stroke="#1f385c" strokeWidth="4" />
                <rect x="185" y="52" width="50" height="26" rx="8" fill="#1f385c" />
                <rect x="140" y="96" width="140" height="34" rx="6" fill="#ffdf6b" />
                <text
                  x="210"
                  y="120"
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                  fontWeight="800"
                  fontSize="20"
                  fill="#1f385c"
                >
                  TEST
                </text>

                <g>
                  <rect x="140" y="150" width="18" height="18" rx="4" fill="#89c8ff" />
                  <path
                    d="M144 159l4 4 8-8"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <rect x="168" y="153" width="112" height="10" rx="4" fill="#e6edf5" />
                </g>
                <g>
                  <rect x="140" y="182" width="18" height="18" rx="4" fill="#a6f0c2" />
                  <path
                    d="M144 191l4 4 8-8"
                    stroke="#1f385c"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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

                <g transform="rotate(45 300 300)">
                  <rect x="288" y="230" width="16" height="90" rx="4" fill="#ffdf6b" />
                  <path d="M288 230 L304 230 L296 210 Z" fill="#f0a04b" />
                  <rect x="288" y="316" width="16" height="10" fill="#e6edf5" />
                </g>

                <path d="M150 330 Q210 360 270 330 L270 345 Q210 372 150 345 Z" fill="#1f385c" />
              </svg>
            </Reveal>
          </div>
        </div>

        <div className="absolute bottom-[-1px] left-0 w-full overflow-hidden leading-none z-0 h-[160px] sm:h-[200px]">
          <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
            <path
              fill="#1f385c"
              d="M0,160L80,149.3C160,139,320,117,480,128C640,139,800,181,960,208C1120,235,1280,245,1360,250.7L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
            />
          </svg>
        </div>
      </section>

      {/* ================= ABOUT US ================= */}
      <section id="about" className="pt-40 pb-24 px-6 max-w-[1100px] mx-auto text-center relative z-10 scroll-mt-[72px]">
        <Reveal>
          <span className="inline-block px-4 py-1 rounded-full bg-[#eaf6fd] text-[#1f7fbf] text-xs font-semibold mb-4">
            About Us
          </span>
          <h2 className="text-4xl font-bold text-black mb-6">Why choose Esame?</h2>
          <p className="text-slate-600 max-w-3xl mx-auto mb-16 text-[1.05rem] leading-relaxed">
            Traditional digital assessments fail to balance academic reliability with simple
            access control. Esame solves this by combining client-less deployment with
            multi-layer browser integrity infrastructure, built by educators for educators.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              n: "1",
              bg: "#a6c8f0",
              title: "Frictionless Student Access",
              body: "Students don't need persistent user records or signups. They provide their name and institutional identification code to request immediate entry parameters.",
            },
            {
              n: "2",
              bg: "#a6f0c2",
              title: "Real-Time Anti-Cheating",
              body: "Instantaneous browser traps register multi-window changes, tab switches, and key-cutting loops, sending critical structural proctor alerts in under 1 second.",
            },
            {
              n: "3",
              bg: "#f0d4a6",
              title: "AI-Powered Efficiency",
              body: "Teachers gain assistive generation engines that quickly draft evaluation options by topic, complexity, or discipline, drastically speeding up content preparation.",
            },
          ].map((item, i) => (
            <Reveal delay={i * 120} key={item.title}>
              <div className="group bg-[#f8fbff] rounded-2xl p-8 border border-slate-100 shadow-sm flex flex-col items-start min-h-[250px] h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#a6c8f0]">
                <div
                  style={{ backgroundColor: item.bg }}
                  className="w-10 h-10 text-black rounded-lg flex items-center justify-center text-lg font-bold mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                >
                  {item.n}
                </div>
                <h3 className="text-lg font-bold text-black mb-3">{item.title}</h3>
                <p className="text-[0.85rem] text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="py-24 relative overflow-hidden bg-[#f8fafc] scroll-mt-[72px]">
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <Reveal className="mb-14 max-w-2xl">
            <span className="inline-block px-4 py-1 rounded-full bg-[#a6c8f0] text-[#1f385c] text-xs font-semibold mb-4">
              Built For Every Role
            </span>
            <h2 className="text-[2.5rem] font-bold text-black mb-4 leading-tight">
              Just a few ways you can use Esame
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Esame scales dynamically according to role privileges and system scopes — whether
              you are hosting large university cohorts or fast modular class tests.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 relative mb-24">
            <div className="absolute -left-10 -top-10 w-56 h-56 bg-[#1f385c]/[0.06] rounded-full -z-10 hidden lg:block" />
            <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-[#a3e8b9]/20 rounded-full -z-10 hidden lg:block" />

            <Reveal>
              <div className="bg-[#f4f7fc] p-10 rounded-[20px] border border-blue-50 shadow-sm relative h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <span className="inline-block px-8 py-1.5 bg-[#abc7eb] text-[#1f385c] rounded-full text-sm font-medium mb-6">
                  Institutional Lead
                </span>
                <h3 className="text-xl font-bold text-black mb-3">Organization-Wide Testing</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Set up entire semesters, departments, and academic years. Register and delegate
                  access vectors directly to your active training staff while tracking core
                  success parameters on institutional dashboards.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="bg-[#f4fcf6] p-10 rounded-[20px] border border-green-50 shadow-sm relative h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <span className="inline-block px-8 py-1.5 bg-[#a3e8b9] text-emerald-900 rounded-full text-sm font-medium mb-6">
                  Course Supervisor
                </span>
                <h3 className="text-xl font-bold text-black mb-3">Classroom Exam Scheduling</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Build secure test sessions with customized dynamic rules. Monitor incoming
                  applicant pipelines, handle live lockdown violations, and process grading
                  schemas directly.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#3d597d] mb-4">Advanced Product Features</h2>
            <p className="text-slate-600 max-w-[600px] mx-auto text-lg">
              Engineered around a high-performance framework stack (Next.js, Supabase, and
              PostgreSQL) to support strict execution workflows.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              {
                icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                title: "Anti-Cheating Logs",
                body: "Tracks window focus shifting, full-screen manipulation limits",
              },
              {
                icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                title: "AI Generation Assistant",
                body: "Generate structural questions instantly through chat interactions filtered by difficulty levels",
              },
              {
                icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
                title: "Lock & Resume Flow",
                body: "Automatically freezes a student's session upon reaching maximum warning",
              },
              {
                icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
                title: "Unified Grading Panel",
                body: "Processes automatic grades for standard queries while routing advanced",
              },
            ].map((f, i) => (
              <Reveal delay={i * 100} key={f.title}>
                <div className="group bg-white p-6 rounded-[20px] shadow-lg border border-slate-100 flex flex-col items-start min-h-[260px] h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="w-10 h-10 bg-[#405f87] rounded-xl flex items-center justify-center text-white mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#2ea3e8]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={f.icon} />
                    </svg>
                  </div>
                  <h3 className="font-bold text-[1.1rem] text-black mb-3">{f.title}</h3>
                  <p className="text-[0.8rem] text-slate-500 leading-relaxed">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section id="team" className="py-24 px-6 bg-white scroll-mt-[72px]">
        <div className="max-w-[1200px] mx-auto">
          <Reveal className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-[#eaf6fd] text-[#1f7fbf] text-xs font-semibold mb-4">
              Our Team
            </span>
            <h2 className="text-4xl font-bold text-black mb-4">Meet the Team</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              The people behind Esame, building secure and intelligent examinations.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Ro Arthiphu", "Srun Chankhemara", "Sokha Marady"].map((name, i) => (
              <Reveal delay={i * 120} key={name}>
                <div className="group bg-[#f8fbff] rounded-2xl p-8 border border-slate-100 shadow-sm text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-[#a6c8f0]">
                  <div className="w-20 h-20 mx-auto rounded-full bg-[#1f385c] text-white flex items-center justify-center text-2xl font-bold mb-5 transition-transform duration-300 group-hover:scale-105">
                    {name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <h3 className="text-lg font-bold text-black">{name}</h3>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={150} className="mt-16">
            <div className="bg-[#1f385c] rounded-2xl p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between text-white shadow-xl">
              <div className="mb-6 md:mb-0 max-w-lg text-center md:text-left">
                <h2 className="text-[1.75rem] sm:text-[2rem] font-medium mb-2 tracking-wide">
                  Your next secure exam is here
                </h2>
                <p className="text-[#a0bcdb] text-[1.05rem]">
                  Everything you need to deploy high-integrity testing environments
                </p>
              </div>
              <Link href="/sign-up">

                <button className="px-10 py-3.5 bg-white text-[#1f385c] font-bold rounded-full transition-all duration-300 hover:bg-slate-100 hover:-translate-y-0.5 hover:shadow-lg shrink-0">
                  Start now!
                </button>
              </Link>

            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <div className="relative bg-[#1f385c]">
        <footer className="max-w-[1200px] mx-auto px-6 pt-16 pb-4 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-14 text-white">
            <div className="lg:col-span-2">
              <EsameLogo height={30} className="brightness-0 invert mb-5" />
              <p className="text-[0.85rem] text-[#9ca3af] mb-6 leading-relaxed max-w-sm">
                Esame helps institutions run reliable, secure online exams — from
                teacher-created assessments to real-time proctoring and instant results, all
                without the overhead of legacy testing software.
              </p>

              <div className="space-y-2 mb-6 text-[0.85rem] text-[#9ca3af]">
                <a href="mailto:ESAME@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors w-fit">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ESAME@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-3 mb-8">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white transition-all duration-300 hover:bg-[#4fc3f7] hover:text-[#0f1c31] hover:-translate-y-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={s.path} />
                    </svg>
                  </a>
                ))}
              </div>

              <Link
                href="/sign-up"
                className="inline-block px-6 py-2 bg-white text-[#1f385c] rounded-full text-xs font-bold transition-all duration-300 hover:bg-slate-100 hover:-translate-y-0.5 shadow"
              >
                Get Started
              </Link>
            </div>

            <div className="col-span-1">
              <h3 className="font-bold mb-4 text-white text-[0.9rem]">Platform</h3>
              <ul className="space-y-3 text-[0.85rem] text-[#9ca3af]">
                <li><a href="#services" className="hover:text-white transition-colors">For Organizations</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">For Teachers</a></li>
                <li><a href="#home" className="hover:text-white transition-colors">For Students</a></li>
                <li><a href="#team" className="hover:text-white transition-colors">Our Team</a></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="font-bold mb-4 text-white text-[0.9rem]">Features</h3>
              <ul className="space-y-3 text-[0.85rem] text-[#9ca3af]">
                <li><a href="#services" className="hover:text-white transition-colors">Anti-Cheating Detection</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">AI Question Generation</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Automated Grading</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Analytics &amp; Reporting</a></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h3 className="font-bold mb-4 text-white text-[0.9rem]">Resources</h3>
              <ul className="space-y-3 text-[0.85rem] text-[#9ca3af]">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="mailto:ESAME@gmail.com" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
        </footer>

        <div className="border-t border-white/10 w-full py-6">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[0.75rem] text-[#9ca3af] order-2 md:order-1">
              © 2026 Esame. All rights reserved. Secure, intelligent online examinations.
            </p>
            <div className="flex items-center gap-5 order-1 md:order-2 text-[0.75rem] text-[#9ca3af]">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}