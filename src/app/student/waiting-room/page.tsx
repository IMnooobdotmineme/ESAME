// src/app/student/waiting-room/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { getMockExamSession } from "@/lib/student-exam-data";

function getTimeParts(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("");
  const [session] = useState(() => getMockExamSession());
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("esame_student_session");
    if (!raw) {
      router.replace("/student/join");
      return;
    }
    const parsed = JSON.parse(raw);
    setCandidateName(parsed.studentName ?? "");
  }, [router]);

  useEffect(() => {
    const target = new Date(session.startAt).getTime();

    function tick() {
      setMsRemaining(target - Date.now());
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.startAt]);

  if (msRemaining === null) return null;

  const isReady = msRemaining <= 0;
  const { hours, minutes, seconds } = getTimeParts(msRemaining);

  function handleStart() {
    router.push("/student/exam");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <EsameLogo height={24} />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        {/* Countdown */}
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest text-navy-900 mb-4">
            {isReady ? "STARTING NOW" : "STARTING IN"}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <TimeBox value={hours} label="HOURS" />
            <span className="text-2xl font-bold text-slate-300">:</span>
            <TimeBox value={minutes} label="MINUTES" />
            <span className="text-2xl font-bold text-slate-300">:</span>
            <TimeBox value={seconds} label="SECONDS" />
          </div>
        </div>

        {/* Exam Details */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">
            EXAM DETAILS
          </h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Candidate</p>
              <p className="font-semibold text-navy-900">{candidateName || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Duration</p>
              <p className="font-semibold text-navy-900">
                {session.durationMinutes} minutes
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Sections</p>
              <p className="font-semibold text-navy-900">
                {session.sectionsCount} sections, {session.questionTypesCount} question
                types
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Attempts</p>
              <p className="font-semibold text-navy-900">
                {session.attempts} attempt only
              </p>
            </div>
          </div>
        </div>

        {/* System Check */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">
            SYSTEM CHECK
          </h2>
          <div className="space-y-4">
            <SystemCheckItem
              title="Internet connection"
              subtitle="Stable, low latency"
            />
            <SystemCheckItem
              title="Browser tab focus"
              subtitle="Tab switching will be logged"
            />
            <SystemCheckItem
              title="Autosave"
              subtitle="Answers save every 10 seconds"
            />
          </div>
        </div>

        {/* Before You Begin */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">
            BEFORE YOU BEGIN
          </h2>
          <div className="space-y-3">
            <RuleItem number={1}>
              Once started, the timer cannot be paused. Stay on this tab for the
              full duration.
            </RuleItem>
            <RuleItem number={2}>
              Each section autosaves as you go — you can move between sections
              freely.
            </RuleItem>
            <RuleItem number={3}>
              Submit before the timer ends; unanswered questions are scored as
              zero.
            </RuleItem>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={!isReady}
          className={`w-full py-3.5 rounded-full text-sm font-semibold transition ${
            isReady
              ? "bg-navy-900 text-white hover:bg-navy-800"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isReady ? "Start Exam" : "waiting for start time ..."}
        </button>
      </main>
    </div>
  );
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="w-20 rounded-2xl border border-slate-200 bg-white shadow-sm py-3 flex flex-col items-center">
      <span className="text-2xl font-bold text-navy-900">{value}</span>
      <span className="text-[10px] tracking-widest text-slate-400 mt-1">
        {label}
      </span>
    </div>
  );
}

function SystemCheckItem({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-navy-900">{title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        READY
      </span>
    </div>
  );
}

function RuleItem({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
        {number}
      </span>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}