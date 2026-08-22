"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Download } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExamStore, GradedAnswer } from "@/store/useExamStore";
import { scoreSummary, effectiveGradingStatus } from "@/lib/grading-utils";

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
  const [isExporting, setIsExporting] = useState(false);

  // Initialize score inputs once the submission loads from the API
  useEffect(() => {
    if (request?.answers) {
      const scores: Record<string, number | ""> = {};
      request.answers.forEach((a) => {
        scores[a.id] = a.manualScore ?? "";
      });
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
            <p className="text-sm text-slate-500">
              This student submission couldn&apos;t be located.
            </p>
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
  const totalCount = (request.answers || []).length;
  const gradedCount = (request.answers || []).filter(
    (a) => a.autoScore !== undefined || a.manualScore !== undefined
  ).length;

  async function handleSaveGrades() {
    if (!currentExam || !request) return;
    const grades = (request.answers || [])
      .filter((a) => a.type !== "mcq")
      .map((a) => ({
        questionId: a.id,
        score: Number(manualScores[a.id] || 0),
      }));
    await saveManualGrades(currentExam.id, request.id, grades);
    router.push(`/grading/${examId}`);
  }

  async function handleDownloadPDF() {
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const container = document.createElement("div");
      container.style.padding = "30px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#14213d";
      container.style.backgroundColor = "#ffffff";
      container.style.width = "780px";
      container.innerHTML = `
        <h1 style="margin:0;font-size:20px;font-weight:800;">${currentExam!.title} (${currentExam!.courseCode})</h1>
        <p style="margin:6px 0 14px 0;color:#475569;font-size:13px;">
          <strong>Student:</strong> ${request!.name} (${request!.studentId}) &nbsp;|&nbsp; <strong>Submitted:</strong> ${request!.submittedAt || "-"}
        </p>
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#64748b;font-weight:bold;">TOTAL SCORE</div>
            <div style="font-size:18px;font-weight:800;margin-top:2px;">${s.total} / ${s.max}</div>
          </div>
          <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#64748b;font-weight:bold;">PERCENTAGE</div>
            <div style="font-size:18px;font-weight:800;margin-top:2px;">${s.percentage}%</div>
          </div>
          <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;">
            <div style="font-size:10px;color:#64748b;font-weight:bold;">RESULT</div>
            <div style="font-size:18px;font-weight:800;margin-top:2px;color:${s.pass ? "#059669" : "#dc2626"};">${
        gradingStatus === "complete" ? (s.pass ? "PASS" : "FAIL") : "PENDING"
      }</div>
          </div>
        </div>
        ${(request!.answers || [])
          .map(
            (a, i) => `
          <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:12px;">
            <div style="font-size:11px;font-weight:bold;color:#64748b;">QUESTION ${i + 1}</div>
            <div style="font-weight:700;font-size:13px;margin:6px 0;">${a.questionText}</div>
            <div style="background:#f8fafc;padding:10px;border-radius:6px;font-size:12px;white-space:pre-wrap;">${a.studentAnswer}</div>
            <p style="font-size:11px;margin-top:6px;"><strong>Score:</strong> ${a.autoScore ?? a.manualScore ?? 0} / ${a.maxPoints} pts</p>
          </div>`
          )
          .join("")}
      `;
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
      document.body.removeChild(container);
      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }
      pdf.save(`${request!.name.replace(/\s+/g, "_")}_Result.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Failed to download PDF script.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <TeacherTopbar
        title={`${request.name} (${request.studentId})`}
        description={
          gradingStatus === "complete"
            ? `Submitted ${request.submittedAt || "-"} · ${s.total} / ${s.max} pts (${s.percentage}%)`
            : `Submitted ${request.submittedAt || "-"} · ${gradedCount} of ${totalCount} questions scored — mark Complete once finished`
        }
      />
      <main className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/grading/${examId}`)}
            className="text-sm font-medium text-slate-600 hover:text-navy-900 inline-flex items-center gap-1"
          >
            <ArrowLeft size={15} /> Back to roster
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isExporting} onClick={handleDownloadPDF}>
              <Download size={13} />
              {isExporting ? "Exporting..." : "Download PDF"}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {(request.answers || []).map((q: GradedAnswer, i: number) => (
            <Card key={q.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase">Question {i + 1}</span>
                <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Max {q.maxPoints} pts
                </span>
              </div>
              <p className="text-sm font-semibold text-navy-900">{q.questionText}</p>
              {q.type === "mcq" ? (
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student answer</span>
                    <span
                      className={
                        q.autoScore === q.maxPoints ? "font-semibold text-emerald-700" : "font-semibold text-red-600"
                      }
                    >
                      {q.studentAnswer}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500">Auto score</span>
                    <span className="font-semibold text-navy-900">
                      {q.autoScore}/{q.maxPoints} pts
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-sm text-slate-800 whitespace-pre-wrap">
                    {q.studentAnswer}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium text-navy-900 mb-1.5 block">
                        Score (max {q.maxPoints})
                      </label>
                      <input
                        type="number"
                        placeholder="Not graded yet"
                        min={0}
                        max={q.maxPoints}
                        value={manualScores[q.id] ?? ""}
                        onChange={(e) =>
                          setManualScores({
                            ...manualScores,
                            [q.id]: e.target.value === "" ? "" : Math.min(q.maxPoints, Math.max(0, Number(e.target.value))),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      />
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2 pb-6">
          <Button variant="outline" onClick={() => router.push(`/grading/${examId}`)}>
            Cancel
          </Button>
          <Button onClick={handleSaveGrades}>
            <Check size={15} />
            Save Evaluation
          </Button>
        </div>
      </main>
    </>
  );
}