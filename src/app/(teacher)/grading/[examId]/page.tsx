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

// ✅ Escape user content so it renders safely inside the PDF HTML
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ✅ Human-readable question type labels for the PDF
function typeLabel(t?: string): string {
  switch (t) {
    case "mcq": return "Multiple Choice";
    case "multi_select": return "Multiple Select";
    case "true_false": return "True / False";
    case "short_answer": return "Short Answer";
    case "long_answer": return "Long Answer";
    case "long": return "Written Answer";
    case "coding": return "Coding";
    case "fill_blank": return "Fill in the Blank";
    case "matching": return "Matching";
    case "ordering": return "Ordering";
    default: return (t || "Question").replace(/_/g, " ");
  }
}

export default function GradingDetailPage() {
  useTeacherExamRealtime(true, 2000);

  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  type StoreState = ReturnType<typeof useExamStore.getState>;
  const exams = useExamStore((s: StoreState) => s.exams);
  const fetchExams = useExamStore((s: StoreState) => s.fetchExams);

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

    async function handleExportExcel(examIn: Exam) {
    setIsExportingExcel(true);
    try {
      const exam = (await getFreshExam(examIn.id)) ?? examIn;
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "ESAME";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Results", {
        views: [{ state: "frozen", ySplit: 8 }],
        pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      const BLACK = "FF000000";
      const GRAY = "FFD9D9D9";
      const RED = "FFCC0000";
      const thin = { style: "thin" as const, color: { argb: BLACK } };
      const border = { top: thin, left: thin, bottom: thin, right: thin };
      const COLS = 6;
      const center = { horizontal: "center" as const, vertical: "middle" as const };

      const today = new Date().toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // ✅ Title block: plain text, NO cell manipulation, just set values on merged ranges
      const titleData = [
        { row: 1, text: "ESAME", size: 13, bold: true, height: 20 },
        { row: 2, text: (exam as any).orgName || "Organization", size: 11, bold: false, height: 18 },
        { row: 3, text: exam.title, size: 18, bold: true, height: 28 },
        { row: 4, text: `Department: ${exam.department || "—"}   •   Subject: ${exam.subject || "—"}`, size: 11, bold: false, height: 18 },
        { row: 5, text: `Teacher: ${(exam as any).teacherName || "—"}`, size: 11, bold: false, height: 18 },
        { row: 6, text: `Date: ${today}`, size: 11, bold: false, height: 18 },
      ];

      titleData.forEach(({ row, text, size, bold, height }) => {
        sheet.mergeCells(row, 1, row, COLS);
        const cell = sheet.getCell(row, 1);
        cell.value = text;
        cell.font = { name: "Calibri", size, bold, color: { argb: BLACK } };
        cell.alignment = center;
        // ✅ NO border property — keep it plain
        sheet.getRow(row).height = height;
      });

      sheet.getRow(7).height = 10;

      // ✅ Table header (row 8) — THIS is where borders start
      const HEADER_ROW = 8;
      const headers = ["Student ID", "Student Name", "Score", "Percentage", "Result", "Rank"];
      const headerRow = sheet.getRow(HEADER_ROW);
      headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: BLACK } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY } };
        cell.alignment = center;
        cell.border = border;
      });
      headerRow.height = 22;

      // ✅ Data rows
      const submissions = exam.requests.filter((r) => r.isSubmitted);
      const ranked = submissions
        .map((r) => ({ r, s: scoreSummary(r) }))
        .sort((a, b) => b.s.total - a.s.total || b.s.percentage - a.s.percentage);

      let prevTotal = -1;
      let prevRank = 0;

      ranked.forEach(({ r, s }, idx) => {
        const rank = s.total === prevTotal ? prevRank : idx + 1;
        prevTotal = s.total;
        prevRank = rank;

        const gradingStatus = effectiveGradingStatus(r);
        const resultLabel = gradingStatus !== "complete" ? "Pending" : s.pass ? "Pass" : "Fail";

        const row = sheet.getRow(HEADER_ROW + 1 + idx);
        const values = [r.studentId, r.name, `${s.total} / ${s.max}`, s.percentage / 100, resultLabel, rank];

        values.forEach((v, i) => {
          const cell = row.getCell(i + 1);
          cell.value = v;
          cell.border = border;
          cell.alignment = { horizontal: i === 1 ? "left" : "center", vertical: "middle" };
          const isRed = i >= 3;
          cell.font = { name: "Calibri", size: 10.5, bold: isRed, color: { argb: isRed ? RED : BLACK } };
        });
        row.getCell(4).numFmt = "0.00%";
        row.height = 20;
      });

      if (ranked.length === 0) {
        const emptyRow = sheet.getRow(HEADER_ROW + 1);
        sheet.mergeCells(HEADER_ROW + 1, 1, HEADER_ROW + 1, COLS);
        emptyRow.getCell(1).value = "No submissions yet for this exam.";
        emptyRow.getCell(1).font = { name: "Calibri", size: 10.5, italic: true, color: { argb: BLACK } };
        emptyRow.getCell(1).alignment = center;
        emptyRow.getCell(1).border = border;
        emptyRow.height = 24;
      }

      // ✅ Footer: plain text, no borders
      const footerStart = HEADER_ROW + ranked.length + 3;
      sheet.mergeCells(footerStart, 4, footerStart, COLS);
      const f1 = sheet.getCell(footerStart, 4);
      f1.value = `Date: ${today}`;
      f1.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: BLACK } };
      f1.alignment = { horizontal: "right", vertical: "middle" };

      sheet.mergeCells(footerStart + 1, 4, footerStart + 1, COLS);
      const f2 = sheet.getCell(footerStart + 1, 4);
      f2.value = `Prepared by: ${(exam as any).teacherName || ""}`;
      f2.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: BLACK } };
      f2.alignment = { horizontal: "right", vertical: "middle" };

      sheet.columns = [
        { width: 16 },
        { width: 28 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 10 },
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
  function buildQuestionMap(exam: Exam) {
    const map: Record<string, any> = {};
    const parts: any[] = (exam as any)?.parts ?? [];
    parts.forEach((sec: any) => {
      (sec?.questions ?? []).forEach((q: any) => {
        const key = String(q?.text ?? "").trim();
        if (key) map[key] = q;
      });
    });
    return map;
  }

  async function handleDownloadPDF(examIn: Exam, req: StudentRequest) {
    setIsExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      // ✅ Fresh backend data
      const exam = (await getFreshExam(examIn.id)) ?? examIn;

      const s = scoreSummary(req);
      const gradingStatus = effectiveGradingStatus(req);
      const resultLabel = gradingStatus !== "complete" ? "PENDING" : s.pass ? "PASS" : "FAIL";
      const resultColor = gradingStatus !== "complete" ? "#F59E0B" : s.pass ? "#10B981" : "#EF4444";

      const startedAtMs = (exam as any).startedAt ? new Date((exam as any).startedAt).getTime() : 0;
      const durationMin =
        req.submittedAt && startedAtMs
          ? Math.max(0, Math.round((new Date(req.submittedAt).getTime() - startedAtMs) / 60000))
          : 0;

      // question text → teacher definition (options, blanks, items…)
      const qMap: Record<string, any> = {};
      (((exam as any)?.parts ?? []) as any[]).forEach((sec) => {
        ((sec?.questions ?? []) as any[]).forEach((q) => {
          const key = String(q?.text ?? "").trim();
          if (key) qMap[key] = q;
        });
      });

      const idxFromId = (id: any): number => {
        const digits = String(id ?? "").replace(/[^0-9]/g, "");
        const n = parseInt(digits, 10);
        return isNaN(n) ? -1 : n - 1;
      };

      function optionRow(label: string, text: string, selected: boolean, checkbox: boolean, isCorrect: boolean) {
        const border = selected ? "#0EA5E9" : isCorrect ? "#10B981" : "#E2E8F0";
        const bg = selected ? "#F0F9FF" : isCorrect ? "#F0FDF4" : "#FFFFFF";
        const icon = checkbox
          ? `<div style="width:16px;height:16px;border-radius:4px;border:2px solid ${selected ? "#0EA5E9" : "#CBD5E1"};background:${selected ? "#0EA5E9" : "transparent"};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${selected ? '<div style="width:8px;height:8px;border-radius:2px;background:#fff;"></div>' : ""}</div>`
          : `<div style="width:16px;height:16px;border-radius:50%;border:2px solid ${selected ? "#0EA5E9" : "#CBD5E1"};display:flex;align-items:center;justify-content:center;flex-shrink:0;">${selected ? '<div style="width:8px;height:8px;border-radius:50%;background:#0EA5E9;"></div>' : ""}</div>`;
        const tag = isCorrect ? `<span style="font-size:10px;font-weight:700;color:#10B981;background:#D1FAE5;padding:2px 8px;border-radius:9999px;">✓</span>` : "";
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:12px;border:2px solid ${border};background:${bg};margin-bottom:8px;">${icon}<span style="font-weight:600;color:#0F172A;min-width:20px;">${escapeHtml(label)}</span><span style="flex:1;color:#0F172A;font-size:14px;">${escapeHtml(text)}</span>${tag}</div>`;
      }

      function renderQuestion(a: any, i: number): string {
        const def = qMap[String(a.questionText ?? "").trim()] ?? null;
        const qType = String(def?.type ?? a.type ?? "").toLowerCase();
        const score = a.manualScore ?? a.autoScore ?? 0;
        const isFull = score === a.maxPoints;
        const scoreColor = isFull ? "#10B981" : score > 0 ? "#F59E0B" : "#EF4444";
        const scoreBg = isFull ? "#D1FAE5" : score > 0 ? "#FEF3C7" : "#FEE2E2";

        let body = "";
        let correctText = typeof a.correctAnswer === "string" ? a.correctAnswer : "";

        if (qType === "mcq") {
          const options: string[] = Array.isArray(def?.mcqOptions) ? def.mcqOptions : [];
          const pick = String(a.studentAnswer ?? "").trim();
          const correctIdx = typeof def?.mcqCorrect === "number" ? def.mcqCorrect : -1;
          if (correctIdx >= 0 && options[correctIdx]) correctText = `${String.fromCharCode(65 + correctIdx)}. ${options[correctIdx]}`;
          body = options.length
            ? options.map((text, idx) => optionRow(String.fromCharCode(65 + idx), text, text.trim() === pick, false, idx === correctIdx)).join("")
            : `<div style="background:#fff;border:2px solid #E2E8F0;border-radius:12px;padding:14px;font-size:14px;">${escapeHtml(a.studentAnswer || "No answer")}</div>`;
        } else if (qType === "multi_select") {
          const options: string[] = Array.isArray(def?.multiOptions) ? def.multiOptions : [];
          const picks = String(a.studentAnswer ?? "").split(",").map((t: string) => t.trim());
          const flags: boolean[] = Array.isArray(def?.multiCorrect) ? def.multiCorrect : [];
          if (flags.some(Boolean)) correctText = options.filter((_, idx) => flags[idx]).join(", ");
          body = options.length
            ? options.map((text, idx) => optionRow(String.fromCharCode(65 + idx), text, picks.includes(text.trim()), true, !!flags[idx])).join("")
            : `<div style="background:#fff;border:2px solid #E2E8F0;border-radius:12px;padding:14px;font-size:14px;">${escapeHtml(a.studentAnswer || "No selection")}</div>`;
        } else if (qType === "true_false") {
          const pick = String(a.studentAnswer ?? "").toLowerCase();
          correctText = def?.tfCorrect === false ? "False" : def?.tfCorrect === true ? "True" : correctText;
          body = `<div style="display:flex;gap:12px;">${(["true", "false"] as const)
            .map((v) => `<div style="flex:1;padding:12px;border-radius:12px;text-align:center;font-weight:600;font-size:14px;border:2px solid ${pick === v ? "#0EA5E9" : "#E2E8F0"};background:${pick === v ? "#F0F9FF" : "#fff"};color:${pick === v ? "#0F172A" : "#64748B"};">${v === "true" ? "True" : "False"}</div>`)
            .join("")}</div>`;
        } else if (qType === "fill_blank") {
          const rawText = String(def?.blanksText ?? "");
          const segments: string[] = [];
          const nums: string[] = [];
          const re = /\[\s*(\d+)\s*\]/g;
          let last = 0;
          let m: RegExpExecArray | null;
          while ((m = re.exec(rawText))) {
            segments.push(rawText.slice(last, m.index));
            nums.push(m[1]);
            last = m.index + m[0].length;
          }
          segments.push(rawText.slice(last));
          let values: Record<string, string> = {};
          try { values = JSON.parse(a.studentAnswer || "{}"); } catch { values = {}; }
          const choices: string[] = Array.isArray(def?.blankChoices) ? def.blankChoices.filter((c: string) => String(c).trim()) : [];
          correctText = (def?.answerKey ?? []).map((r: any) => `[${r.number}] ${r.answer}`).join("   ");
          let html = "";
          if (choices.length > 0) {
            html += `<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Choices</div><div style="display:flex;flex-wrap:wrap;gap:8px;">${choices
              .map((c: string, idx: number) => `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;background:#F0F9FF;border:1px solid #BAE6FD;font-size:12px;font-weight:600;color:#0369A1;"><span style="width:16px;height:16px;border-radius:50%;background:#0EA5E9;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">${idx + 1}</span>${escapeHtml(c)}</span>`)
              .join("")}</div></div>`;
          }
          html += `<div style="font-size:14px;color:#0F172A;line-height:2.4;">`;
          segments.forEach((seg, idx) => {
            html += `<span>${escapeHtml(seg)}</span>`;
            if (idx < nums.length) {
              const n = nums[idx];
              const val = values[n] ?? values[`b${n}`] ?? "";
              html += `<span style="display:inline-block;min-width:110px;padding:4px 12px;margin:0 8px;border-radius:8px;border:1px solid #CBD5E1;background:#fff;text-align:center;font-size:14px;color:#0F172A;">${escapeHtml(val || "—")}</span>`;
            }
          });
          html += `</div>`;
          body = html;
        } else if (qType === "matching") {
          const left: string[] = Array.isArray(def?.matchLeft) ? def.matchLeft : [];
          const right: string[] = Array.isArray(def?.matchRight) ? def.matchRight : [];
          let pairs: Record<string, string> = {};
          try { pairs = JSON.parse(a.studentAnswer || "{}"); } catch { pairs = {}; }
          correctText = (def?.matchAnswers ?? []).map((r: any) => `${r.left} → ${r.right}`).join(", ");
          const chips = Object.entries(pairs).map(([k, v]) => {
            const li = idxFromId(k); const ri = idxFromId(v);
            if (li < 0 || ri < 0 || li >= left.length || ri >= right.length) return "";
            return `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:9999px;background:#F1F5F9;border:1px solid #E2E8F0;font-size:12px;font-weight:600;color:#0F172A;">${li + 1} → ${String.fromCharCode(65 + ri)}</span>`;
          }).join("");
          body = `<div style="display:flex;gap:40px;"><div style="flex:1;display:flex;flex-direction:column;gap:8px;">${left
            .map((text, idx) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;border:2px solid #E2E8F0;background:#fff;"><span style="width:24px;height:24px;border-radius:50%;background:#0F172A;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${idx + 1}</span><span style="flex:1;color:#0F172A;font-size:14px;">${escapeHtml(text)}</span></div>`)
            .join("")}</div><div style="flex:1;display:flex;flex-direction:column;gap:8px;">${right
            .map((text, idx) => `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;border:2px solid #E2E8F0;background:#fff;"><span style="width:24px;height:24px;border-radius:50%;background:#475569;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${String.fromCharCode(65 + idx)}</span><span style="flex:1;color:#0F172A;font-size:14px;">${escapeHtml(text)}</span></div>`)
            .join("")}</div></div>${chips ? `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;">${chips}</div>` : ""}`;
        } else if (qType === "ordering") {
          const items: string[] = Array.isArray(def?.orderingItems) ? def.orderingItems : [];
          correctText = items.join(" → ");
          const orderIds = String(a.studentAnswer ?? "").split(",").map((t: string) => t.trim()).filter(Boolean);
          body = orderIds.length
            ? `<div style="display:flex;flex-direction:column;gap:8px;">${orderIds
                .map((id, pos) => {
                  const idx = idxFromId(id);
                  const text = idx >= 0 && idx < items.length ? items[idx] : id;
                  return `<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:12px;border:2px solid #E2E8F0;background:#fff;"><span style="width:24px;height:24px;border-radius:50%;background:#0F172A;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${pos + 1}</span><span style="flex:1;color:#0F172A;font-size:14px;">${escapeHtml(text)}</span></div>`;
                })
                .join("")}</div>`
            : `<div style="background:#fff;border:2px solid #E2E8F0;border-radius:12px;padding:14px;font-size:14px;">${escapeHtml(a.studentAnswer || "No order")}</div>`;
        } else if (qType === "coding") {
          body = `<div style="border-radius:12px;border:2px solid #333;overflow:hidden;"><div style="background:#252526;padding:8px 16px;"><span style="font-size:12px;font-weight:600;color:#94A3B8;">${escapeHtml(def?.language || "JavaScript")}</span></div><pre style="background:#1E1E1E;color:#D4D4D4;padding:16px;margin:0;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;min-height:160px;">${escapeHtml(a.studentAnswer || "")}</pre></div>`;
        } else {
          body = `<div style="background:#fff;border:2px solid #E2E8F0;border-radius:12px;padding:14px;"><div style="font-size:14px;color:#0F172A;white-space:pre-wrap;line-height:1.6;">${escapeHtml(a.studentAnswer || "No answer provided")}</div></div>`;
        }

                // ✅ No separate correct block — correct answers are already highlighted inline in the options
        const correctBlock = "";
        const feedbackBlock = a.feedback
          ? `<div style="margin-top:12px;background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:12px;"><div style="font-size:11px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Teacher Feedback</div><div style="font-size:13px;color:#92400E;line-height:1.5;">${escapeHtml(a.feedback)}</div></div>`
          : "";

        return `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:20px;position:relative;"><div style="position:absolute;top:16px;right:16px;background:${scoreBg};padding:6px 14px;border-radius:9999px;"><span style="font-size:12px;font-weight:700;color:${scoreColor};">${score} / ${a.maxPoints}</span></div><div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;"><div style="width:32px;height:32px;border-radius:50%;background:#0F172A;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;">${i + 1}</div><div style="flex:1;font-size:15px;font-weight:700;color:#0F172A;padding-right:80px;">${escapeHtml(a.questionText)}</div></div>${body}${correctBlock}${feedbackBlock}</div>`;
      }

      // ---------- Build separate page blocks ----------
      const headerHtml = `<div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #E2E8F0;"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(exam.department || "")}${exam.subject ? " • " + escapeHtml(exam.subject) : ""}</div><h1 style="margin:6px 0 0 0;font-size:26px;font-weight:800;color:#0F172A;">${escapeHtml(exam.title)}</h1><div style="margin-top:6px;font-size:13px;color:#64748B;">${escapeHtml(exam.courseCode)}</div></div><div style="text-align:right;"><div style="font-size:12px;font-weight:700;color:#64748B;text-transform:uppercase;">Report</div><div style="font-size:16px;font-weight:800;color:#0F172A;">ESAME</div></div></div></div>`;

      const studentHtml = `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:20px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div><div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Student Name</div><div style="font-size:16px;font-weight:700;margin-top:4px;">${escapeHtml(req.name)}</div></div><div><div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Student ID</div><div style="font-size:16px;font-weight:700;margin-top:4px;font-family:monospace;">${escapeHtml(req.studentId)}</div></div><div><div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Submitted</div><div style="font-size:15px;font-weight:600;margin-top:4px;">${req.submittedAt ? escapeHtml(new Date(req.submittedAt).toLocaleString()) : "—"}</div></div><div><div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Time Taken</div><div style="font-size:15px;font-weight:600;margin-top:4px;">${durationMin > 0 ? durationMin + " minutes" : "—"}</div></div></div></div>`;

      const summaryHtml = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;"><div style="background:linear-gradient(135deg,#0F172A,#0EA5E9);border-radius:16px;padding:20px;text-align:center;color:#fff;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;opacity:0.9;">Total Score</div><div style="font-size:32px;font-weight:800;margin-top:8px;">${s.total}</div><div style="font-size:13px;opacity:0.9;margin-top:4px;">out of ${s.max}</div></div><div style="background:#fff;border:2px solid #E2E8F0;border-radius:16px;padding:20px;text-align:center;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;">Percentage</div><div style="font-size:32px;font-weight:800;margin-top:8px;color:#0F172A;">${s.percentage}%</div><div style="margin-top:8px;height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${s.percentage}%;background:${s.percentage >= 70 ? "#10B981" : s.percentage >= 50 ? "#F59E0B" : "#EF4444"};"></div></div></div><div style="background:${resultColor}15;border:2px solid ${resultColor};border-radius:16px;padding:20px;text-align:center;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748B;">Result</div><div style="font-size:30px;font-weight:800;margin-top:8px;color:${resultColor};">${resultLabel}</div><div style="font-size:12px;color:#64748B;margin-top:4px;">${gradingStatus !== "complete" ? "In progress" : "Final grade"}</div></div></div>`;

      const footerHtml = `<div style="background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#94A3B8;"><div>Generated ${escapeHtml(new Date().toLocaleString())}</div><div style="text-align:right;"><div style="font-weight:700;color:#0F172A;">ESAME Exam Platform</div><div>Confidential — for academic use only</div></div></div>`;

      const blocks: string[] = [
        headerHtml,
        studentHtml,
        summaryHtml,
        ...(req.answers || []).map((a, i) => renderQuestion(a, i)),
        footerHtml,
      ];

      // ---------- Paginate with margins on every page ----------
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const M = { top: 12, bottom: 12, left: 10, right: 10 }; // ✅ margins on all sides
      const contentW = pageW - M.left - M.right;
      const GAP = 5; // space between blocks
      let cursorY = M.top;

      for (const html of blocks) {
        const el = document.createElement("div");
        el.style.cssText = `position:fixed;left:-9999px;top:0;width:800px;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#0F172A;background:transparent;line-height:1.5;`;
        el.innerHTML = html;
        document.body.appendChild(el);
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#FFFFFF", logging: false });
        document.body.removeChild(el);

        const imgH = (canvas.height * contentW) / canvas.width;
        const maxH = pageH - M.top - M.bottom;
        const pxPerMm = canvas.width / contentW;

        // Very tall block → slice it cleanly across pages
        if (imgH > maxH) {
          if (pageH - M.bottom - cursorY < 30) {
            pdf.addPage();
            cursorY = M.top;
          }
          let remaining = imgH;
          let srcYpx = 0;
          while (remaining > 0.5) {
            const spaceLeft = pageH - M.bottom - cursorY;
            const drawH = Math.min(spaceLeft, remaining);
            const sliceHpx = Math.max(1, Math.min(Math.round(drawH * pxPerMm), canvas.height - srcYpx));
            const portion = document.createElement("canvas");
            portion.width = canvas.width;
            portion.height = sliceHpx;
            const ctx = portion.getContext("2d")!;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, portion.width, portion.height);
            ctx.drawImage(canvas, 0, srcYpx, canvas.width, sliceHpx, 0, 0, canvas.width, sliceHpx);
            const drawnMm = sliceHpx / pxPerMm;
            pdf.addImage(portion.toDataURL("image/jpeg", 0.95), "JPEG", M.left, cursorY, contentW, drawnMm);
            srcYpx += sliceHpx;
            remaining -= drawnMm;
            cursorY += drawnMm;
            if (remaining > 0.5) {
              pdf.addPage();
              cursorY = M.top;
            }
          }
          cursorY += GAP;
          continue;
        }

        // Normal block → never split; move to next page if it doesn't fit
        if (cursorY + imgH > pageH - M.bottom) {
          pdf.addPage();
          cursorY = M.top;
        }
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", M.left, cursorY, contentW, imgH);
        cursorY += imgH + GAP;
      }

      pdf.save(`${req.name.replace(/\s+/g, "_")}_${exam.courseCode}_Result.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }
  async function getFreshExam(examId: string): Promise<Exam | null> {
    try {
      const res = await fetch("/api/teacher/exams", { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return ((data as any).exams || []).find((e: any) => e.id === examId) ?? null;
    } catch {
      return null;
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
      <TeacherTopbar title={currentExam.title} description={`Course code: ${currentExam.courseCode}`} />
      <main className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button onClick={() => router.push("/grading")} className="text-sm font-medium text-slate-600 hover:text-navy-900 inline-flex items-center gap-1">
            <ArrowLeft size={15} /> Back to all exams
          </button>
          <Button variant="secondary" size="sm" disabled={isExportingExcel} onClick={() => handleExportExcel(currentExam)}>
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
                      <span className="ml-1.5 text-xs font-mono font-normal text-slate-400">({req.studentId})</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{formatSubmitted(req.submittedAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.isSubmitted ? `${s.total} / ${s.max}` : "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.isSubmitted ? `${s.percentage}%` : "—"}</td>
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
                      <Button size="sm" variant="outline" disabled={!req.isSubmitted || isExporting} onClick={() => handleDownloadPDF(currentExam, req)}>
                        <Download size={13} />
                        PDF
                      </Button>
                      <Button size="sm" variant={req.isSubmitted ? "primary" : "ghost"} disabled={!req.isSubmitted} onClick={() => router.push(`/grading/${examId}/${req.id}`)}>
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