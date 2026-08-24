import type { Exam,GradingStatus, StudentRequest, GradedAnswer } from "@/store/useExamStore";

export function effectivePoints(a: GradedAnswer): number {
  if (a.manualScore !== undefined && a.manualScore !== null) return a.manualScore;
  return a.autoScore ?? 0;
}

export function scoreSummary(req: StudentRequest) {
  const answers = req.answers || [];
  const max = answers.reduce((s, a) => s + a.maxPoints, 0) || req.totalMaxPoints || 0;
  const total = answers.reduce((s, a) => s + effectivePoints(a), 0);
  const percentage = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, percentage, pass: percentage >= 50 };
}

export function effectiveGradingStatus(req: StudentRequest): "in-progress" | "complete" {
  if (req.gradingStatus) return req.gradingStatus;
  return (req.answers || []).some((a) => a.needsManualGrading) ? "in-progress" : "complete";
}
export function gradingStatusMeta(status: GradingStatus): {
  label: string;
  variant: "info" | "success" | "warning" | "danger" | "neutral";
} {
  return status === "complete"
    ? { label: "Complete", variant: "success" }
    : { label: "In Progress", variant: "warning" };
}
export function examStats(exam: Exam) {
  const approved = exam.requests.filter((r) => r.status === "approved");
  const submitted = approved.filter((r) => r.isSubmitted || r.isForcedSubmit);
  const pending = submitted.filter((r) => effectiveGradingStatus(r) !== "complete").length;
  const forced = approved.filter((r) => r.isForcedSubmit).length;
  return { examinees: approved.length, submitted: submitted.length, pending, forced };
}

export function submissionStatus(req: StudentRequest): { label: string; variant: "info" | "success" | "warning" | "danger" } {
  if (req.isRejectedLive) return { label: "Rejected", variant: "danger" };
  if (req.isForcedSubmit) return { label: "Force Submitted", variant: "warning" };
  if (req.isSubmitted) return { label: "Submitted", variant: "success" };
  if (req.isLocked) return { label: "Locked", variant: "danger" };
  return { label: "In Progress", variant: "info" };
}

export function formatExamDate(iso?: string) {
  if (!iso) return "Not scheduled";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Not scheduled";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}