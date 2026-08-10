"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { useExamStore } from "@/store/useExamStore";

interface StudentSession {
  studentName: string;
  studentId: string;
  roomCode: string;
  requestId?: string;
  submittedAt: string;
}

export default function WaitingApprovalPage() {
  const router = useRouter();
  const getStudentStatus = useExamStore((state) => state.getStudentStatus);

  const [session, setSession] = useState<StudentSession | null>(null);
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("esame_student_session");
    if (!raw) {
      router.replace("/student/join");
      return;
    }
    setSession(JSON.parse(raw));
  }, [router]);

  // Real approval polling against the shared exam store.
  useEffect(() => {
    if (!session?.requestId || !session.roomCode) return;

    const interval = setInterval(() => {
      const status = getStudentStatus(session.roomCode, session.requestId!);

      if (status === "approved") {
        clearInterval(interval);
        router.push("/student/waiting-room");
      } else if (status === "rejected") {
        clearInterval(interval);
        setRejected(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, getStudentStatus, router]);

  function handleBack() {
    sessionStorage.removeItem("esame_student_session");
    router.push("/student/join");
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-[450px] min-h-[397px] rounded-2xl bg-white shadow-sm p-10 flex flex-col items-center justify-center text-center">
        <EsameLogo height={32} />
        {rejected ? (
          <p className="mt-6 text-sm text-red-600 font-medium">
            Your request to join this exam session was declined by the teacher.
          </p>
        ) : (
          <p className="mt-6 text-sm text-navy-900 animate-pulse">
            Waiting For Teacher Approval...
          </p>
        )}
      </div>
      <button
        onClick={handleBack}
        className="mt-10 px-8 py-2.5 rounded-full bg-white text-navy-900 text-sm font-semibold hover:bg-slate-50 transition"
      >
        Back
      </button>
    </div>
  );
}