"use client";

import React from "react";
import { useExamStore } from "@/store/useExamStore";

interface TeacherApprovalListProps {
  roomCode: string;
}

export default function TeacherApprovalList({ roomCode }: TeacherApprovalListProps) {
  const exam = useExamStore((state) =>
    state.exams.find((e) => e.roomCode.toUpperCase() === roomCode.toUpperCase())
  );
  const approveStudent = useExamStore((state) => state.approveStudent);
  const rejectStudent = useExamStore((state) => state.rejectStudent);

  if (!exam) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
        <p className="text-xs text-slate-400 font-semibold">
          No active exam session found for room code: <span className="font-mono text-slate-700">{roomCode}</span>
        </p>
      </div>
    );
  }

  const pendingRequests = exam.requests.filter((r) => r.status === "pending");
  const approvedRequests = exam.requests.filter((r) => r.status === "approved");
  const rejectedRequests = exam.requests.filter((r) => r.status === "rejected");

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-sky-700 tracking-wider">
            Live Classroom Management
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            Student Access Queue
          </h3>
          <p className="text-xs text-slate-400">
            Room Code: <span className="font-mono font-bold text-sky-700">{exam.roomCode}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg">
            {pendingRequests.length} Pending
          </span>
          <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg">
            {approvedRequests.length} Approved
          </span>
        </div>
      </div>

      {/* Pending Requests Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Pending Requests ({pendingRequests.length})
        </h4>

        {pendingRequests.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
            <p className="text-xs text-slate-400 font-medium">
              No students waiting in the lobby right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-sm"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{req.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Requested at {req.timestamp}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rejectStudent(exam.roomCode, req.id)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => approveStudent(exam.roomCode, req.id)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log (Approved & Rejected) */}
      {(approvedRequests.length > 0 || rejectedRequests.length > 0) && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Processed Requests
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {approvedRequests.map((req) => (
              <div key={req.id} className="flex justify-between items-center text-xs py-2 px-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                <span className="font-bold text-slate-800">{req.name}</span>
                <span className="font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded text-[10px]">Approved</span>
              </div>
            ))}
            {rejectedRequests.map((req) => (
              <div key={req.id} className="flex justify-between items-center text-xs py-2 px-3 bg-rose-50/50 rounded-lg border border-rose-100">
                <span className="font-bold text-slate-800">{req.name}</span>
                <span className="font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded text-[10px]">Rejected</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}