import type { Exam, StudentRequest, GradingStatus } from "@/store/useExamStore";

export const PASS_THRESHOLD = 50; // percent

/**
 * The grading status to treat a submission as, even if the teacher hasn't
 * explicitly set one yet: submissions with nothing left needing manual
 * grading default to "complete", everything else defaults to "in-progress".
 * An explicit teacher-set status always wins.
 */
export function effectiveGradingStatus(req: StudentRequest): GradingStatus {
  if (req.gradingStatus) return req.gradingStatus;
  const needsReview = (req.answers || []).some((a) => a.needsManualGrading);
  return needsReview ? "in-progress" : "complete";
}

export function gradingStatusMeta(
  status: GradingStatus
): { label: string; variant: "success" | "info" } {
  if (status === "complete") return { label: "Complete", variant: "success" };
  return { label: "In Progress", variant: "info" };
}

export function examStats(exam: Exam) {
  const submitted = exam.requests.filter((r) => r.isSubmitted);
  const forced = exam.requests.filter((r) => r.isForcedSubmit);
  const pending = submitted.filter((r) => effectiveGradingStatus(r) !== "complete");
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