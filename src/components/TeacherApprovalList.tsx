"use client";

import React from "react";
import { useExamStore } from "@/store/useExamStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

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
      <Card className="p-6 text-center">
        <p className="text-xs text-slate-400 font-semibold">
          No active exam session found for room code: <span className="font-mono text-slate-700">{roomCode}</span>
        </p>
      </Card>
    );
  }

  const pendingRequests = exam.requests.filter((r) => r.status === "pending");
  const approvedRequests = exam.requests.filter((r) => r.status === "approved");
  const rejectedRequests = exam.requests.filter((r) => r.status === "rejected");

  return (
    <Card className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900">Student Access Queue</h3>
            <p className="text-xs text-slate-400">
              Room Code: <span className="font-mono font-semibold text-slate-600">{exam.roomCode}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral">{exam.requests.length} Total</Badge>
          <Badge variant="warning">{pendingRequests.length} Pending</Badge>
          <Badge variant="success">{approvedRequests.length} Approved</Badge>
        </div>
      </div>

      {/* Pending Requests Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200"
              >
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {req.name}
                    <span className="ml-1.5 text-xs font-mono font-medium text-slate-400">
                      ({req.studentId})
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Requested at {req.timestamp}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => rejectStudent(exam.roomCode, req.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveStudent(exam.roomCode, req.id)}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log (Approved & Rejected) */}
      {(approvedRequests.length > 0 || rejectedRequests.length > 0) && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Processed Requests
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {approvedRequests.map((req) => (
              <div key={req.id} className="flex justify-between items-center text-sm py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-navy-900">
                  {req.name} <span className="text-xs font-mono font-normal text-slate-400">({req.studentId})</span>
                </span>
                <Badge variant="success">Approved</Badge>
              </div>
            ))}
            {rejectedRequests.map((req) => (
              <div key={req.id} className="flex justify-between items-center text-sm py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-navy-900">
                  {req.name} <span className="text-xs font-mono font-normal text-slate-400">({req.studentId})</span>
                </span>
                <Badge variant="danger">Rejected</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}