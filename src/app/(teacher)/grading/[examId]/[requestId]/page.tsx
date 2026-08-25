"use client";
import { useState, useEffect, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Award, FileText, AlertTriangle } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { useExamStore, GradedAnswer } from "@/store/useExamStore";
import { scoreSummary, effectiveGradingStatus } from "@/lib/grading-utils";
import { GradingAnswerView } from "@/components/teacher/GradingAnswerView";

type QuestionDefWithSection = {
  def: any;
  sectionTitle: string;
};

// ✅ Memoized card — only re-renders when its own props change (prevents auto-scroll/flicker)
const GradingCard = memo(function GradingCard({
  q,
  i,
  mapEntry,
  manualScore,
  onScoreChange,
}: {
  q: GradedAnswer;
  i: number;
  mapEntry: QuestionDefWithSection | undefined;
  manualScore: number | "";
  onScoreChange: (id: string, value: number | "") => void;
}) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Question {i + 1}
        </span>
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
          Max {q.maxPoints} pts
        </span>
      </div>

      {mapEntry ? (
        <GradingAnswerView
          def={mapEntry.def}
          answer={q.studentAnswer}
          sectionTitle={mapEntry.sectionTitle}
          index={i + 1}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-navy-900">{q.questionText}</p>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-sm">
            <p className="text-slate-500 mb-1">Student answer</p>
            <p className="text-navy-900 whitespace-pre-wrap">
              {q.studentAnswer || <em className="text-slate-400">No answer</em>}
            </p>
          </div>
        </div>
      )}

      {q.correctAnswer && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-sm">
          <p className="text-emerald-700 font-semibold text-[11px] uppercase tracking-wider mb-1">
            Correct answer
          </p>
          <p className="text-emerald-900 font-medium">{q.correctAnswer}</p>
        </div>
      )}

      {q.autoScore !== undefined && (
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-sky-50 border border-sky-100">
          <span className="text-sky-700 font-semibold">Auto-graded</span>
          <span className={`font-bold ${q.autoScore === q.maxPoints ? "text-emerald-700" : "text-rose-600"}`}>
            {q.autoScore} / {q.maxPoints} pts
          </span>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <label className="text-sm font-semibold text-navy-900 mb-1.5 block">
          {q.type === "mcq" ? "Override score (optional)" : `Manual score (max ${q.maxPoints} pts)`}
        </label>
        <input
          type="number"
          placeholder={q.type === "mcq" ? "Auto-graded — leave blank to keep auto score" : "Enter manual score"}
          min={0}
          max={q.maxPoints}
          value={manualScore}
          onChange={(e) =>
            onScoreChange(
              q.id,
              e.target.value === ""
                ? ""
                : Math.min(q.maxPoints, Math.max(0, Number(e.target.value)))
            )
          }
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        {manualScore !== "" && (
          <p className="text-[11px] text-sky-600 mt-1.5 font-medium">
            Teacher mark: {manualScore} / {q.maxPoints} pts
            {q.autoScore !== undefined && " (overrides auto grade)"}
          </p>
        )}
      </div>
    </Card>
  );
});

export default function GradeStudentPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const requestId = params.requestId as string;
  const exams = useExamStore((s) => s.exams);
  const saveManualGrades = useExamStore((s) => s.saveManualGrades);
  const fetchExams = useExamStore((s) => s.fetchExams);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const currentExam = exams.find((e) => e.id === examId) || null;
  const request = currentExam?.requests.find((r) => r.id === requestId) || null;

  const [manualScores, setManualScores] = useState<Record<string, number | "">>({});
  const [initialScores, setInitialScores] = useState<Record<string, number | "">>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (request?.answers) {
      const scores: Record<string, number | ""> = {};
      request.answers.forEach((a) => {
        scores[a.id] = a.manualScore ?? "";
      });
      setManualScores(scores);
      setInitialScores(scores);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  // ✅ Walk exam.parts to map question TEXT → { def, sectionTitle }
  const questionMap = useMemo<Record<string, QuestionDefWithSection>>(() => {
    const map: Record<string, QuestionDefWithSection> = {};
    const parts: any[] = (currentExam as any)?.parts ?? [];
    parts.forEach((sec) => {
      const title = sec?.title ?? "Untitled Section";
      (sec?.questions ?? []).forEach((q: any) => {
        const key = String(q?.text ?? "").trim();
        if (key) map[key] = { def: q, sectionTitle: title };
      });
    });
    return map;
  }, [currentExam]);

  // ✅ Stable callback — passed to every GradingCard so memo works correctly
  const handleScoreChange = (id: string, value: number | "") => {
    setManualScores((prev) => ({ ...prev, [id]: value }));
  };

  // ✅ Detect unsaved grading changes
  const hasChanges = useMemo(
    () => JSON.stringify(manualScores) !== JSON.stringify(initialScores),
    [manualScores, initialScores]
  );

    // ✅ Cancel ALWAYS double-checks before leaving
  function handleCancel() {
    setShowCancelConfirm(true);
  }

  // ✅ Discard — restore original scores and go back
  function handleDiscard() {
    setShowCancelConfirm(false);
    setManualScores(initialScores);
    router.push(`/grading/${examId}`);
  }

  if (!currentExam || !request) {
    return (
      <>
        <TeacherTopbar title="Grading & Results" />
        <main className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <h2 className="text-lg font-semibold text-navy-900">Submission Not Found</h2>
            <Button className="w-full" onClick={() => router.push("/grading")}>
              Back to All Exams
            </Button>
          </Card>
        </main>
      </>
    );
  }

  const s = scoreSummary(request);
  const gradingStatus = effectiveGradingStatus(request);

  async function handleSaveGrades() {
    if (!currentExam || !request) return;
    const grades = (request.answers || [])
      .filter((a) => manualScores[a.id] !== "" && manualScores[a.id] !== undefined)
      .map((a) => ({ questionId: a.id, score: Number(manualScores[a.id]) }));
    await saveManualGrades(currentExam.id, request.id, grades);
    router.push(`/grading/${examId}`);
  }

  return (
    <>
      <TeacherTopbar
        title={`${request.name} (${request.studentId})`}
        description={
          gradingStatus === "complete"
            ? `Submitted ${request.submittedAt || "-"} · ${s.total} / ${s.max} pts (${s.percentage}%)`
            : `Submitted ${request.submittedAt || "-"} · grading in progress`
        }
      />
      <main className="p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={handleCancel}
            className="text-sm font-medium text-slate-600 hover:text-navy-900 inline-flex items-center gap-1"
          >
            <ArrowLeft size={15} /> Back to roster
          </button>
          <div className="flex items-center gap-2">
            <Badge variant="neutral">{currentExam.title}</Badge>
            <Badge variant={gradingStatus === "complete" ? "success" : "warning"}>
              {gradingStatus === "complete" ? (s.pass ? "Pass" : "Fail") : "Pending Review"}
            </Badge>
          </div>
        </div>

        {/* Summary card */}
        <Card className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Answered</p>
              <p className="text-sm font-bold text-navy-900">{request.answers?.length ?? 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Score</p>
              <p className="text-sm font-bold text-navy-900">{s.total} / {s.max}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Check size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage</p>
              <p className="text-sm font-bold text-navy-900">{s.percentage}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                gradingStatus === "complete"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}
            >
              <Award size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</p>
              <p className="text-sm font-bold text-navy-900">
                {gradingStatus === "complete" ? (s.pass ? "Pass" : "Fail") : "In Progress"}
              </p>
            </div>
          </div>
        </Card>

        {/* Questions — memoized, stable, no flicker */}
        <div className="space-y-6">
          {(request.answers || []).map((q: GradedAnswer, i: number) => {
            const mapEntry = questionMap[String(q.questionText ?? "").trim()];
            return (
              <GradingCard
                key={q.id}
                q={q}
                i={i}
                mapEntry={mapEntry}
                manualScore={manualScores[q.id] ?? ""}
                onScoreChange={handleScoreChange}
              />
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2 pb-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSaveGrades}>
            <Check size={15} /> Save Evaluation
          </Button>
        </div>
      </main>

      {/* ✅ Discard-changes confirmation (same style as exam creation page) */}
      <Dialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
        <DialogHeader
          title={hasChanges ? "Discard grading changes?" : "Leave grading page?"}
          onClose={() => setShowCancelConfirm(false)}
        />
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
            <div className="w-10 h-10 rounded-xl bg-white border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
                        <div className="space-y-1">
              <p className="text-sm font-bold text-navy-900">
                {hasChanges
                  ? "You have unsaved grading changes."
                  : "Are you sure you want to leave?"}
              </p>
              <p className="text-xs leading-5 text-slate-500 font-medium">
                {hasChanges
                  ? "If you discard, the original scores will remain unchanged and you will return to the roster without saving anything."
                  : "You will return to the roster. Any unsaved changes will be lost."}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              className="bg-white border-sky-500 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
            >
              Keep editing
            </Button>
                        <Button
              variant="outline"
              onClick={handleDiscard}
              className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              {hasChanges ? "Discard" : "Discard"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}