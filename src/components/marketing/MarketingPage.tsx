"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, ChevronDown, FileCheck2, GraduationCap, LifeBuoy, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { EsameLogo } from "@/components/organization/EsameLogo";

export type MarketingPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

const ICONS = {
  book: BookOpen,
  building: Building2,
  file: FileCheck2,
  graduation: GraduationCap,
  lifeBuoy: LifeBuoy,
  message: MessageCircle,
  shield: ShieldCheck,
};
type MarketingIcon = keyof typeof ICONS;

export function MarketingPage({ eyebrow, title, intro, children }: MarketingPageProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-[#14213d]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Back to Esame home" className="transition-transform duration-200 hover:scale-[1.02]">
            <EsameLogo height={25} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition-all duration-200 hover:-translate-x-0.5 hover:border-sky-300 hover:text-sky-700"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="absolute -bottom-36 -left-20 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-sky-600">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-[#14213d] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{intro}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {children}
      </section>

      <footer className="bg-[#1f385c] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <EsameLogo height={24} className="brightness-0 invert" />
            <p className="mt-2 text-xs text-white/60">Secure, intelligent online examinations.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
            <Link href="/about" className="transition-colors hover:text-white">About</Link>
            <Link href="/faqs" className="transition-colors hover:text-white">FAQs</Link>
            <Link href="/support" className="transition-colors hover:text-white">Support</Link>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function FeatureCard({ icon, title, children }: { icon: MarketingIcon; title: string; children: React.ReactNode }) {
  const Icon = ICONS[icon];
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform duration-300 group-hover:scale-110">
        <Icon size={21} />
      </div>
      <h2 className="text-base font-bold text-[#14213d]">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{children}</p>
    </div>
  );
}

export function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-semibold text-[#14213d] sm:px-6"
      >
        <span>{question}</span>
        <ChevronDown size={18} className={`shrink-0 text-sky-600 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <p className="border-t border-slate-100 px-5 pb-5 pt-4 text-sm leading-7 text-slate-600 sm:px-6">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function ContactPanel() {
  return (
    <div className="rounded-3xl bg-[#14213d] p-6 text-white shadow-xl shadow-[#14213d]/15 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">Need a hand?</p>
          <h2 className="mt-2 text-xl font-bold">Talk with the Esame team.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Tell us what you are building and we will help you find the right way to run secure assessments.</p>
        </div>
        <a href="mailto:ESAME@gmail.com" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-bold text-[#14213d] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-300">
          <Mail size={16} /> Contact us <ArrowUpRight size={15} />
        </a>
      </div>
    </div>
  );
}
