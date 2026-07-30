"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { useExamStore } from "@/store/useExamStore";

export default function StudentJoinPage() {
  const router = useRouter();
  const requestToJoin = useExamStore((state) => state.requestToJoin);

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

    const trimmedRoomCode = roomCode.trim().toUpperCase();
    const res = requestToJoin(trimmedRoomCode, studentName.trim());

    if (!res.success) {
      setError(res.message || "Unable to join assessment. Please try again.");
      return;
    }

    setError("");
    const session = {
      studentName: studentName.trim(),
      studentId: studentId.trim(),
      roomCode: trimmedRoomCode,
      requestId: res.requestId,
      submittedAt: new Date().toISOString(),
    };

    sessionStorage.setItem("esame_student_session", JSON.stringify(session));
    router.push("/student/waiting-approval");
  }

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center px-4 py-16">
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
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

        <button
          onClick={handleConfirm}
          className="w-full mt-4 py-2.5 rounded-full bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 transition"
        >
          Confirm
        </button>
      </div>

      <button
        onClick={() => router.push("/")}
        className="mt-10 px-8 py-2.5 rounded-full bg-white text-navy-900 text-sm font-semibold hover:bg-slate-50 transition"
      >
        Back
      </button>
    </div>
  );
}
