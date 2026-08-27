"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EsameLogo } from "@/components/organization/EsameLogo";

interface StudentSession {
  studentName: string;
  studentId: string;
  roomCode: string;
  requestId: string;
}

interface ExamDetails {
  title: string;
  department: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  totalSections: number;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const [session, setSession] = useState<StudentSession | null>(null);
  const [details, setDetails] = useState<ExamDetails | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("esame_student_session");
    if (!raw) {
      router.replace("/join");
      return;
    }
    setSession(JSON.parse(raw));
  }, [router]);

  // ✅ Load exam details once (works even before start — reads the 409 body)
  useEffect(() => {
    if (!session?.requestId || !session.roomCode) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/student/exam?roomCode=${encodeURIComponent(session.roomCode)}&requestId=${encodeURIComponent(session.requestId)}`
        );
        const data = await res.json().catch(() => ({}));
        if (data && (data.title || data.department || data.subject)) {
          setDetails({
            title: data.title ?? "",
            department: data.department ?? "",
            subject: data.subject ?? "",
            durationMinutes: data.durationMinutes ?? 0,
            totalQuestions: data.totalQuestions ?? 0,
            totalSections: data.totalSections ?? 0,
          });
        }
        if (res.ok) setStarted(true);
      } catch {
        /* ignore */
      }
    })();
  }, [session]);

  // ✅ Poll only for start / end
  useEffect(() => {
    if (!session?.requestId || !session.roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/student/status?roomCode=${encodeURIComponent(session.roomCode)}&requestId=${encodeURIComponent(session.requestId)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setEnded(!!data.examEnded);
        setStarted(!!data.examStarted);
        if (data.examEnded) {
          clearInterval(interval);
          router.replace("/score");
        } else if (data.examStarted) {
          clearInterval(interval);
          router.replace(`/exam/${session.roomCode}`);
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [session, router]);

  if (!session) return null;
  const isStarted = Boolean(started && !ended);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <EsameLogo height={24} />
      </div>
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-5">
        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest text-navy-900 mb-3">
            {isStarted ? "EXAM IS LIVE" : "WAITING FOR TEACHER TO START"}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isStarted ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
            <p className="text-xs text-slate-500">
              {isStarted
                ? "Your teacher has started the exam. Joining now..."
                : "This exam has not been started by your teacher yet. This page will update automatically."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">EXAM DETAILS</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="col-span-2">
              <p className="text-slate-400 text-xs mb-1">Exam Name</p>
              <p className="font-semibold text-navy-900">{details?.title || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Department</p>
              <p className="font-semibold text-navy-900">{details?.department || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Subject</p>
              <p className="font-semibold text-navy-900">{details?.subject || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Candidate</p>
              <p className="font-semibold text-navy-900">{session.studentName || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Duration</p>
              <p className="font-semibold text-navy-900">{details?.durationMinutes ?? "—"} minutes</p>
            </div>
                        <div>
              <p className="text-slate-400 text-xs mb-1">Sections</p>
              <p className="font-semibold text-navy-900">
                {details
                  ? `${details.totalSections} section${details.totalSections === 1 ? "" : "s"}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">SYSTEM CHECK</h2>
          <div className="space-y-4">
            <SystemCheckItem title="Internet connection" subtitle="Stable, low latency" />
            <SystemCheckItem title="Browser tab focus" subtitle="Tab switching will be logged" />
            <SystemCheckItem title="Autosave" subtitle="Answers save as you type" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-xs font-bold tracking-widest text-navy-900 mb-4">BEFORE YOU BEGIN</h2>
          <div className="space-y-3">
            <RuleItem number={1}>Once started, the timer cannot be paused. Stay on this tab for the full duration.</RuleItem>
            <RuleItem number={2}>Each section autosaves as you go — you can move between sections freely.</RuleItem>
            <RuleItem number={3}>Submit before the timer ends; unanswered questions are scored as zero.</RuleItem>
          </div>
        </div>

        <button
          onClick={() => router.push(`/exam/${session.roomCode}`)}
          disabled={!isStarted}
          className={`w-full py-3.5 rounded-full text-sm font-semibold transition ${
            isStarted ? "bg-navy-900 text-white hover:bg-navy-800" : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          {isStarted ? "Join the Exam" : "Waiting for teacher to start..."}
        </button>
      </main>
    </div>
  );
}

function SystemCheckItem({ title, subtitle }: { title: string; subtitle: string }) {
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

function RuleItem({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
        {number}
      </span>
      <p className="text-sm text-slate-600 leading-relaxed">{children}</p>
    </div>
  );
}