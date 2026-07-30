"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNotificationStore, NotificationItem } from "@/store/useNotificationStore";
import { useRouter } from "next/navigation";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { notifications, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotificationStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.type === "violation") {
      router.push("/teacher/monitor");
    } else if (item.type === "request" && item.roomCode) {
      router.push(`/teacher/exams/${item.roomCode}`);
    }
    setIsOpen(false);
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "violation":
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "request":
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border border-slate-100 shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden font-sans">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-rose-100 text-rose-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#0B7A93] hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* List Items */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[10px] text-slate-400">No active alerts or requests right now.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 transition-all flex items-start gap-3 cursor-pointer hover:bg-slate-50/80 ${
                    !item.read ? "bg-slate-50/40" : ""
                  }`}
                >
                  {getIcon(item.type)}

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold truncate ${!item.read ? "text-slate-900" : "text-slate-600"}`}>
                        {item.title}
                      </p>
                      <span className="text-[9px] font-medium text-slate-400">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {item.roomCode && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {item.roomCode}
                        </span>
                        {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-[#0B7A93]" />}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(item.id);
                    }}
                    className="text-slate-300 hover:text-slate-500 p-1 rounded-md transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}