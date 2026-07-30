<<<<<<< HEAD
// src/app/student/join/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EsameLogo } from "@/components/organization/EsameLogo";

export default function StudentJoinPage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const isComplete =
    studentName.trim() !== "" &&
    studentId.trim() !== "" &&
    roomCode.trim() !== "";

  function handleConfirm() {
    if (!isComplete) {
      setError("Please fill in all fields to continue.");
      return;
    }

    setError("");

    const session = {
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      roomCode: roomCode.trim().toUpperCase(),
      submittedAt: new Date().toISOString(),
    };

    sessionStorage.setItem("esame_student_session", JSON.stringify(session));

    router.push("/student/waiting-approval");
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-16">
      {/* Card */}
      <div className="w-full max-w-[450px] rounded-2xl bg-white shadow-sm p-10">
        <div className="flex flex-col items-center mb-6">
          <EsameLogo height={32} />
          <p className="mt-2 text-sm text-slate-500">Welcome To Esame</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Student Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-900 mb-1.5">
              Student ID
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-navy-900 mb-1.5">
            Enter Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder=""
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-2">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          className="w-full mt-4 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
        >
          Confirm
        </button>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="mt-10 px-8 py-2.5 rounded-full bg-white text-navy-900 text-sm font-semibold hover:bg-slate-50 transition"
      >
        Back
      </button>
=======
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useExamStore } from "@/store/useExamStore";

export default function StudentJoinPage() {
  const router = useRouter();
  const requestToJoin = useExamStore((state) => state.requestToJoin);
  const getStudentStatus = useExamStore((state) => state.getStudentStatus);

  const [studentName, setStudentName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Poll approval status every 2 seconds when student is waiting in lobby
  useEffect(() => {
    if (!requestId || !roomCode) return;

    const interval = setInterval(() => {
      const status = getStudentStatus(roomCode, requestId);

      if (status === "approved") {
        clearInterval(interval);
        router.push(`/student/exam/${roomCode}`);
      } else if (status === "rejected") {
        clearInterval(interval);
        setError("Your request to join this exam session was declined by the instructor.");
        setRequestId(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [requestId, roomCode, getStudentStatus, router]);

  const handleJoinRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!studentName.trim() || !roomCode.trim()) {
      setError("Please enter both your full name and the access code.");
      return;
    }

    const res = requestToJoin(roomCode, studentName);
    if (!res.success) {
      setError(res.message || "Unable to join assessment. Please try again.");
      return;
    }

    if (res.requestId) {
      setRequestId(res.requestId);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-6 text-slate-900">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#0B7A93]/10 text-[#0B7A93] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Join Assessment</h2>
          <p className="text-xs text-slate-400">
            Enter your details to request entry into the exam room.
          </p>
        </div>

        {!requestId ? (
          /* FORM STATE */
          <form onSubmit={handleJoinRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Room / Access Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DEMO123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold tracking-widest uppercase outline-none focus:border-[#0B7A93] focus:ring-1 focus:ring-[#0B7A93]"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#0B7A93] hover:bg-[#09667c] text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md mt-2"
            >
              Request Entry
            </button>
          </form>
        ) : (
          /* WAITING LOBBY STATE */
          <div className="text-center py-6 space-y-5">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-[#0B7A93] rounded-full animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Waiting for Instructor Approval
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Hello <span className="font-bold text-slate-800">{studentName}</span>, your entry request for room <span className="font-mono font-bold text-[#0B7A93]">{roomCode}</span> has been sent.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-400">
              You will automatically enter the exam room as soon as your teacher approves your request.
            </div>

            <button
              type="button"
              onClick={() => setRequestId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold underline transition-all"
            >
              Cancel & Try Again
            </button>
          </div>
        )}
      </div>
>>>>>>> origin/TESTING
    </div>
  );
}