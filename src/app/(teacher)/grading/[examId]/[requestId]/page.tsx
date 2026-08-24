"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Download } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExamStore, GradedAnswer } from "@/store/useExamStore";
import { scoreSummary, effectiveGradingStatus, effectivePoints } from "@/lib/grading-utils";
import { useTeacherExamRealtime } from "@/hooks/useTeacherExamRealtime";
export default function GradeStudentPage() {
  const router = useRouter();
  useTeacherExamRealtime(true, 2000);
  const params = useParams();
  const examId = params.examId as string;
  const requestId = params.requestId as string;
  const exams = useExamStore((s) => s.exams);
  const saveManualGrades = useExamStore((s) => s.saveManualGrades);
  const fetchExams = useExamStore((s) => s.fetchExams);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const currentExam = exams.find((e) => e.id === examId) || null;
  const request = currentExam?.requests.find((r) => r.id === requestId) || null;

  const [manualScores, setManualScores] = useState<Record<string, number | "">>({});
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (request?.answers) {
      const scores: Record<string, number | ""> = {};
      request.answers.forEach((a) => { scores[a.id] = a.manualScore ?? ""; });
      setManualScores(scores);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  if (!currentExam || !request) {
    return (
      <>
        <TeacherTopbar title="Grading & Results" />
        <main className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <h2 className="text-lg font-semibold text-navy-900">Submission Not Found</h2>
            <Button className="w-full" onClick={() => router.push("/grading")}>Back to All Exams</Button>
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
        description={gradingStatus === "complete" ? `Submitted ${request.submittedAt || "-"} · ${s.total} / ${s.max} pts (${s.percentage}%)` : `Submitted ${request.submittedAt || "-"} · grading in progress`}
      />
      <main className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push(`/grading/${examId}`)} className="text-sm font-medium text-slate-600 hover:text-navy-900 inline-flex items-center gap-1">
            <ArrowLeft size={15} /> Back to roster
          </button>
          <Badge variant={gradingStatus === "complete" ? "success" : "warning"}>
            {gradingStatus === "complete" ? (s.pass ? "Pass" : "Fail") : "Pending Review"}
          </Badge>
        </div>

        <div className="space-y-4">
          {(request.answers || []).map((q: GradedAnswer, i: number) => (
            <Card key={q.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Question {i + 1}</span>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">Max {q.maxPoints} pts</span>
              </div>
              <p className="text-sm font-semibold text-navy-900">{q.questionText}</p>

              {/* What the student submitted */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-sm space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">Student answer</span>
                  <span className="text-navy-900 text-right whitespace-pre-wrap">{q.studentAnswer || <em className="text-slate-400">No answer</em>}</span>
                </div>
                {q.type === "mcq" && q.correctAnswer && (
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500">Correct answer</span>
                    <span className="font-semibold text-emerald-700">{q.correctAnswer}</span>
                  </div>
                )}
                {q.autoScore !== undefined && (
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500">Auto score</span>
                    <span className={`font-semibold ${q.autoScore === q.maxPoints ? "text-emerald-700" : "text-red-600"}`}>{q.autoScore}/{q.maxPoints} pts</span>
                  </div>
                )}
              </div>

              {/* Teacher mark for EVERY question */}
              <div>
                <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                  {q.type === "mcq" ? "Override score (optional)" : `Score (max ${q.maxPoints})`}
                </label>
                <input
                  type="number"
                  placeholder={q.type === "mcq" ? "Auto-graded" : "Not graded yet"}
                  min={0}
                  max={q.maxPoints}
                  value={manualScores[q.id] ?? ""}
                  onChange={(e) => setManualScores({ ...manualScores, [q.id]: e.target.value === "" ? "" : Math.min(q.maxPoints, Math.max(0, Number(e.target.value))) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                />
                {manualScores[q.id] !== "" && manualScores[q.id] !== undefined && (
                  <p className="text-[11px] text-sky-600 mt-1">Teacher mark: {manualScores[q.id]}/{q.maxPoints} pts (overrides auto grade)</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 pb-6">
          <Button variant="outline" onClick={() => router.push(`/grading/${examId}`)}>Cancel</Button>
          <Button onClick={handleSaveGrades}><Check size={15} /> Save Evaluation</Button>
        </div>
      </main>
    </>
  );
}