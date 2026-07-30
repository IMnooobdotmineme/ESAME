// src/app/student/waiting-approval/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EsameLogo } from "@/components/organization/EsameLogo";

export default function WaitingApprovalPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("esame_student_session");
    if (!session) {
      router.replace("/student/join");
      return;
    }
    setHasSession(true);
  }, [router]);

  function handleBack() {
    sessionStorage.removeItem("esame_student_session");
    router.push("/student/join");
  }

  // TEMP: simulates the teacher approving the request.
  // Remove this once the real approval flow (backend/websocket) exists.
  function handleSimulateApproval() {
    router.push("/student/waiting-room");
  }

  if (!hasSession) return null;

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-16">
      {/* Card — same footprint as the join page card (max-w-[450px], fixed height) */}
      <div className="w-full max-w-[450px] h-[397px] rounded-2xl bg-white shadow-sm p-10 flex flex-col items-center justify-center text-center">
        <EsameLogo height={32} />
        <p className="mt-6 text-sm text-navy-900 animate-pulse">
          Waiting For Teacher Approval...
        </p>
      </div>

      {/* Back button */}
      <button
        onClick={handleBack}
        className="mt-10 px-8 py-2.5 rounded-full bg-white text-navy-900 text-sm font-semibold hover:bg-slate-50 transition"
      >
        Back
      </button>

      {/* TEMP DEV CONTROL — remove once real teacher-approval flow exists */}
      <button
        onClick={handleSimulateApproval}
        className="mt-4 px-6 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium hover:bg-amber-200 transition"
      >
        [DEV] Simulate Approval →
      </button>
    </div>
  );
}