"use client";

import React from "react";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useRouter } from "next/navigation";

export default function NotificationToastContainer() {
  const router = useRouter();
  const { notifications, markAsRead, removeNotification } = useNotificationStore();

  // Displays up to 2 active unread alerts as floating toasts
  const activeToasts = notifications.filter((n) => !n.read).slice(0, 2);

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full font-sans pointer-events-none">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-navy-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start gap-3 transition-all animate-bounce-short"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "violation" ? (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            )}
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black tracking-wide text-white">{toast.title}</p>
              <span className="text-[9px] text-slate-400 font-mono">{toast.timestamp}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
              {toast.message}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  markAsRead(toast.id);
                  if (toast.type === "violation") {
                    router.push("/teacher/monitor");
                  } else if (toast.roomCode) {
                    router.push(`/teacher/exams/${toast.roomCode}`);
                  }
                }}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 transition-all cursor-pointer underline"
              >
                View Details →
              </button>
              <button
                onClick={() => markAsRead(toast.id)}
                className="text-[10px] font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            onClick={() => removeNotification(toast.id)}
            className="text-slate-500 hover:text-slate-300 cursor-pointer text-xs p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}