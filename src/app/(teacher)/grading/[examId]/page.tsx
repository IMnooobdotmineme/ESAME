"use client";
import { useTeacherExamRealtime } from "@/hooks/useTeacherExamRealtime";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Download, FileSpreadsheet, Users, FileCheck2, ShieldAlert } from "lucide-react";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useExamStore, StudentRequest, Exam } from "@/store/useExamStore";
import { examStats, submissionStatus, scoreSummary, effectiveGradingStatus } from "@/lib/grading-utils";
function formatSubmitted(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
export default function GradingDetailPage() {
  useTeacherExamRealtime(true, 2000);

  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  const exams = useExamStore((s) => s.exams);
  const fetchExams = useExamStore((s) => s.fetchExams);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const currentExam = exams.find((e) => e.id === examId) || null;
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  if (!currentExam) {
    return (
      <>
        <TeacherTopbar title="Grading & Results" />
        <main className="min-h-[60vh] flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <h2 className="text-lg font-semibold text-navy-900">Exam Not Found</h2>
            <p className="text-sm text-slate-500">
              This exam couldn&apos;t be located. It may have been deleted.
            </p>
            <Button className="w-full" onClick={() => router.push("/grading")}>
              Back to All Exams
            </Button>
          </Card>
        </main>
      </>
    );
  }

  async function handleExportExcel(exam: Exam) {
    setIsExportingExcel(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ESAME";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Results", {
        views: [{ state: "frozen", ySplit: 4 }],
        pageSetup: { orientation: "landscape", fitToPage: true },
      });
      const COLUMN_COUNT = 6;
      const NAVY = "FF1F4E78";
      const PEACH = "FF6AA84F";
      const BORDER_COLOR = "FF64748B";
      const PASS_TEXT = "FF047857";
      const FAIL_TEXT = "FFDC2626";
      const PENDING_TEXT = "FFB45309";
      const thinBorder = {
        top: { style: "thin" as const, color: { argb: BORDER_COLOR } },
        left: { style: "thin" as const, color: { argb: BORDER_COLOR } },
        bottom: { style: "thin" as const, color: { argb: BORDER_COLOR } },
        right: { style: "thin" as const, color: { argb: BORDER_COLOR } },
      };
      sheet.mergeCells(1, 1, 2, COLUMN_COUNT);
      const titleCell = sheet.getCell("A1");
      titleCell.value = `${exam.title} (${exam.courseCode})`;
      titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      sheet.getRow(1).height = 20;
      sheet.getRow(2).height = 20;
      sheet.getRow(3).height = 8;
      const headerRow = sheet.getRow(4);
      const headers = ["Student ID", "Student Name", "Submitted At", "Total Score", "Percentage", "Result"];
      headers.forEach((label, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = label;
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PEACH } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = thinBorder;
      });
      headerRow.height = 22;
      const submissions = exam.requests.filter((r) => r.isSubmitted);
      submissions.forEach((r, idx) => {
        const s = scoreSummary(r);
        const rowNumber = 5 + idx;
        const row = sheet.getRow(rowNumber);
        const resultLabel = effectiveGradingStatus(r) !== "complete" ? "Pending" : s.pass ? "Pass" : "Fail";
        const values = [r.studentId, r.name, r.submittedAt || "—", `${s.total} / ${s.max}`, s.percentage / 100, resultLabel];
        values.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.font = { name: "Calibri", size: 10.5, color: { argb: "FF14213D" } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = thinBorder;
        });
        row.getCell(5).numFmt = "0%";
        const resultCell = row.getCell(6);
        const textColor = resultLabel === "Pass" ? PASS_TEXT : resultLabel === "Fail" ? FAIL_TEXT : PENDING_TEXT;
        resultCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: textColor } };
        row.height = 20;
      });
      if (submissions.length === 0) {
        const emptyRow = sheet.getRow(5);
        sheet.mergeCells(5, 1, 5, COLUMN_COUNT);
        emptyRow.getCell(1).value = "No submissions yet for this exam.";
        emptyRow.getCell(1).font = { name: "Calibri", size: 10.5, italic: true, color: { argb: "FF94A3B8" } };
        emptyRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
        emptyRow.getCell(1).border = thinBorder;
        emptyRow.height = 24;
      }
      sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLUMN_COUNT } };
      sheet.columns = [
        { width: 16 },
        { width: 26 },
        { width: 18 },
        { width: 14 },
        { width: 13 },
        { width: 16 },
      ];
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exam.courseCode}_${exam.title.replace(/[^a-zA-Z0-9]/g, "_")}_Results.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export failed", err);
      alert("Failed to generate the Excel file.");
    } finally {
      setIsExportingExcel(false);
    }
  }

  async function handleDownloadPDF(exam: Exam, req: StudentRequest) {
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const s = scoreSummary(req);
      const container = document.createElement("div");
      container.style.padding = "30px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#14213d";
      container.style.backgroundColor = "#ffffff";
      container.style.width = "780px";
      container.innerHTML = `
        <h1 style="margin:0;font-size:20px;font-weight:800;">${exam.title} (${exam.courseCode})</h1>
        <p style="margin:6px 0 14px 0;color:#475569;font-size:13px;">
          <strong>Student:</strong> ${req.name} (${req.studentId}) &nbsp;|&nbsp; <strong>Submitted:</strong> ${req.submittedAt || "-"}
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
        effectiveGradingStatus(req) === "complete" ? (s.pass ? "PASS" : "FAIL") : "PENDING"
      }</div>
          </div>
        </div>
        ${(req.answers || [])
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
      pdf.save(`${req.name.replace(/\s+/g, "_")}_Result.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Failed to download PDF script.");
    } finally {
      setIsExporting(false);
    }
  }

  const approvedRequests = currentExam.requests.filter((r) => r.status === "approved");
  const filteredRequests = approvedRequests.filter((r) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q);
  });

  return (
    <>
      <TeacherTopbar
        title={currentExam.title}
        description={`Course code: ${currentExam.courseCode}`}
      />
      <main className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button
            onClick={() => router.push("/grading")}
            className="text-sm font-medium text-slate-600 hover:text-navy-900 inline-flex items-center gap-1"
          >
            <ArrowLeft size={15} /> Back to all exams
          </button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isExportingExcel}
            onClick={() => handleExportExcel(currentExam)}
          >
            <FileSpreadsheet size={15} />
            {isExportingExcel ? "Generating Excel..." : "Export All Students"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Users size={15} /> Examinees
            </div>
            <p className="mt-1 text-2xl font-semibold text-navy-900">{examStats(currentExam).examinees}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <FileCheck2 size={15} /> Total Submitted
            </div>
            <p className="mt-1 text-2xl font-semibold text-navy-900">{examStats(currentExam).submitted}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <ShieldAlert size={15} /> Force Submitted
            </div>
            <p className="mt-1 text-2xl font-semibold text-navy-900">{examStats(currentExam).forced}</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name or ID..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 pl-10 pr-4 py-2 text-sm text-navy-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Time Submitted</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total Points</th>
                <th className="px-5 py-3 font-medium">Percentage</th>
                <th className="px-5 py-3 font-medium">Result</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => {
                const status = submissionStatus(req);
                const s = scoreSummary(req);
                return (
                  <tr key={req.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-medium text-navy-900">
                      {req.name}
                      <span className="ml-1.5 text-xs font-mono font-normal text-slate-400">
                        ({req.studentId})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
  {formatSubmitted(req.submittedAt)}
</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {req.isSubmitted ? `${s.total} / ${s.max}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {req.isSubmitted ? `${s.percentage}%` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {!req.isSubmitted ? (
                        <span className="text-slate-300">—</span>
                      ) : effectiveGradingStatus(req) !== "complete" ? (
                        <Badge variant="info">Pending</Badge>
                      ) : (
                        <Badge variant={s.pass ? "success" : "danger"}>{s.pass ? "Pass" : "Fail"}</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!req.isSubmitted || isExporting}
                        onClick={() => handleDownloadPDF(currentExam, req)}
                      >
                        <Download size={13} />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant={req.isSubmitted ? "primary" : "ghost"}
                        disabled={!req.isSubmitted}
                        onClick={() => router.push(`/grading/${examId}/${req.id}`)}
                      >
                        Grade Student
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {approvedRequests.length > 0 && filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                    No students match &quot;{studentSearch}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </main>
    </>
  );
}