"use client";

import { useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";

export function useTeacherExamRealtime(enabled = true, intervalMs = 2000) {
  const fetchExams = useExamStore((s) => s.fetchExams);

  useEffect(() => {
    if (!enabled) return;

    fetchExams(true);

    const interval = window.setInterval(() => {
      fetchExams(true);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [enabled, intervalMs, fetchExams]);
}