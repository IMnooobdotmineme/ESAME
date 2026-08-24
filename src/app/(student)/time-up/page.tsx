// src/app/(student)/time-up/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { EsameLogo } from "@/components/organization/EsameLogo";

const REDIRECT_SECONDS = 5;

export default function TimeUpPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

    useEffect(() => {
    const raw = sessionStorage.getItem("esame_student_session");
    if (!raw) router.replace("/join");
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) {
      router.replace("/score");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8 bg-white/95 rounded-xl px-4 py-2">
        <EsameLogo height={24} />
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="relative w-20 h-20 mx-auto mb-5">
          <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
          <div className="relative w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center border-2 border-red-100">
            <Clock3 size={34} />
          </div>
        </div>

        <span className="inline-block text-[10px] font-black tracking-widest text-red-600 mb-1.5">
          TIME EXPIRED
        </span>
        <h1 className="text-xl font-bold text-navy-900">Your Exam Was Submitted</h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          The time limit for this exam has ended. Your answers were
          automatically saved and submitted — no further changes are possible.
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
          Taking you to your results in{" "}
          <span className="font-bold text-navy-900">{countdown}</span> second
          {countdown !== 1 ? "s" : ""}...
        </div>

        <button
          onClick={() => router.replace("/score")}
          className="w-full mt-4 py-3 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
        >
          View Results Now
        </button>
      </div>
    </div>
  );
}