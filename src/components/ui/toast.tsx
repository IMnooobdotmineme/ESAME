"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastItem = { id: number; msg: string; type: "success" | "error" | "info" };
let pushFn: ((t: ToastItem) => void) | null = null;

export function toast(msg: string, type: ToastItem["type"] = "info") {
  pushFn?.({ id: Date.now() + Math.random(), msg, type });
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    pushFn = (t) => {
      setItems((p) => [...p, t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 4200);
    };
    return () => { pushFn = null; };
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast-in flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : t.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-slate-200 bg-white text-navy-900"
          }`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            : t.type === "error" ? <XCircle size={16} className="mt-0.5 shrink-0" />
            : <Info size={16} className="mt-0.5 shrink-0" />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}