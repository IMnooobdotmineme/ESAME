import type { Exam, StudentRequest } from "@/store/useExamStore";

export const PASS_THRESHOLD = 50; // percent

export function examStats(exam: Exam) {
  const submitted = exam.requests.filter((r) => r.isSubmitted);
  const forced = exam.requests.filter((r) => r.isForcedSubmit);
  const pending = submitted.filter((r) => r.answers?.some((a) => a.needsManualGrading));
  return {
    examinees: exam.requests.filter((r) => r.status === "approved").length,
    submitted: submitted.length,
    forced: forced.length,
    pending: pending.length,
  };
}

export function submissionStatus(
  req: StudentRequest
): { label: string; variant: "success" | "warning" | "danger" | "neutral" } {
  if (!req.isSubmitted) return { label: "In Progress", variant: "neutral" };
  if (req.isForcedSubmit) return { label: "Forced Submit", variant: "danger" };
  return { label: "Submitted", variant: "success" };
}

export function formatExamDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function scoreSummary(req: StudentRequest) {
  const total = (req.answers || []).reduce((sum, a) => sum + (a.autoScore ?? a.manualScore ?? 0), 0);
  const max = req.totalMaxPoints ?? (req.answers || []).reduce((sum, a) => sum + a.maxPoints, 0);
  const percentage = max > 0 ? Math.round((total / max) * 100) : 0;
  const fullyGraded = !(req.answers || []).some((a) => a.needsManualGrading);
  return { total, max, percentage, pass: percentage >= PASS_THRESHOLD, fullyGraded };
}