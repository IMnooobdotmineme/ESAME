"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  X,
  Check,
  Edit3,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";

// Types
interface QuestionAnswer {
  id: string;
  type: "mcq" | "essay";
  questionText: string;
  maxPoints: number;
  studentAnswer: string;
  correctAnswer?: string;
  autoScore?: number;
  manualScore?: number;
  feedback?: string;
}

interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  autoPoints: number;
  manualPoints: number | null;
  totalMaxPoints: number;
  status: "pending_review" | "evaluated";
  answers: QuestionAnswer[];
}

interface ExamGroup {
  id: string;
  title: string;
  code: string;
  department: string;
  totalSubmissions: number;
  pendingReviews: number;
  classAverage: number;
  submissions: StudentSubmission[];
}

type Html2PdfInstance = {
  set: (options: Record<string, unknown>) => {
    from: (container: HTMLElement) => { save: () => Promise<void> };
  };
};

type Html2PdfWindow = Window & {
  html2pdf?: () => Html2PdfInstance;
};

export default function GradingPage() {
  // Mock Data
  const [exams, setExams] = useState<ExamGroup[]>([
    {
      id: "exam-101",
      title: "Introduction to Computer Science",
      code: "CS101-MD",
      department: "Computer Science",
      totalSubmissions: 2,
      pendingReviews: 1,
      classAverage: 84,
      submissions: [
        {
          id: "sub-1",
          studentName: "Alexander Wright",
          studentId: "CS-2026-0042",
          submittedAt: "2:15 PM, Jul 22",
          autoPoints: 45,
          manualPoints: 38,
          totalMaxPoints: 100,
          status: "evaluated",
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Stack",
              correctAnswer: "Stack",
              autoScore: 10,
            },
            {
              id: "q2",
              type: "essay",
              questionText:
                "Explain the difference between Object-Oriented Programming (OOP) and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "Object-Oriented Programming (OOP) organizes code around objects containing data fields and methods. Functional Programming treats computation as the evaluation of mathematical functions and avoids mutable data.",
              manualScore: 38,
              feedback:
                "Great summary! Clear distinction made regarding state mutability.",
            },
          ],
        },
        {
          id: "sub-2",
          studentName: "Sarah Jenkins",
          studentId: "CS-2026-0115",
          submittedAt: "2:20 PM, Jul 22",
          autoPoints: 30,
          manualPoints: null,
          totalMaxPoints: 100,
          status: "pending_review",
          answers: [
            {
              id: "q1",
              type: "mcq",
              questionText: "Which data structure uses LIFO (Last In, First Out)?",
              maxPoints: 10,
              studentAnswer: "Queue",
              correctAnswer: "Stack",
              autoScore: 0,
            },
            {
              id: "q2",
              type: "essay",
              questionText:
                "Explain the difference between Object-Oriented Programming (OOP) and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "OOP uses classes and objects to bundle data and functionality together. Functional programming focuses on pure functions and immutability.",
              manualScore: undefined,
              feedback: "",
            },
          ],
        },
      ],
    },
    {
      id: "exam-302",
      title: "Advanced Data Structures Lab",
      code: "CS302-LN",
      department: "Software Engineering",
      totalSubmissions: 1,
      pendingReviews: 1,
      classAverage: 78,
      submissions: [
        {
          id: "sub-4",
          studentName: "Emily Ross",
          studentId: "CS-2026-0201",
          submittedAt: "11:45 AM, Jul 21",
          autoPoints: 20,
          manualPoints: null,
          totalMaxPoints: 100,
          status: "pending_review",
          answers: [
            {
              id: "q101",
              type: "essay",
              questionText:
                "Detail the time complexity of QuickSort in best, average, and worst cases.",
              maxPoints: 30,
              studentAnswer:
                "Best case is O(n log n), Average is O(n log n), and Worst case is O(n^2) when the pivot is poorly chosen.",
              manualScore: 0,
              feedback: "",
            },
          ],
        },
      ],
    },
  ]);

  // Navigation & Selection State
  const [selectedExamId, setSelectedExamId] = useState<string | null>("exam-101");
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Score & Feedback State for Modal
  const [manualScores, setManualScores] = useState<Record<string, number | "">>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const currentExam = exams.find((e) => e.id === selectedExamId);

  // Open Grading Modal
  const handleOpenGrading = (submission: StudentSubmission) => {
    setGradingSubmission(submission);
    const initialScores: Record<string, number | ""> = {};
    const initialFeedbacks: Record<string, string> = {};

    submission.answers.forEach((q) => {
      if (q.type === "essay") {
        initialScores[q.id] = q.manualScore ?? 0;
        initialFeedbacks[q.id] = q.feedback ?? "";
      }
    });

    setManualScores(initialScores);
    setFeedbacks(initialFeedbacks);
  };

  // Save Grades Handler
  const handleSaveGrades = () => {
    if (!selectedExamId || !gradingSubmission) return;

    let totalEssayScore = 0;

    const updatedAnswers = gradingSubmission.answers.map((q) => {
      if (q.type === "essay") {
        const score = Number(manualScores[q.id] || 0);
        totalEssayScore += score;
        return {
          ...q,
          manualScore: score,
          feedback: feedbacks[q.id] || "",
        };
      }
      return q;
    });

    setExams((prevExams) =>
      prevExams.map((exam) => {
        if (exam.id !== selectedExamId) return exam;

        const updatedSubmissions = exam.submissions.map((sub) => {
          if (sub.id !== gradingSubmission.id) return sub;
          return {
            ...sub,
            manualPoints: totalEssayScore,
            status: "evaluated" as const,
            answers: updatedAnswers,
          };
        });

        const pendingCount = updatedSubmissions.filter(
          (s) => s.status === "pending_review"
        ).length;

        // Recalculate Class Average
        const evaluatedSubs = updatedSubmissions.filter(
          (s) => s.status === "evaluated"
        );
        const totalPct = evaluatedSubs.reduce((acc, curr) => {
          const score = (curr.autoPoints || 0) + (curr.manualPoints || 0);
          return acc + (score / curr.totalMaxPoints) * 100;
        }, 0);
        const newAverage =
          evaluatedSubs.length > 0
            ? Math.round(totalPct / evaluatedSubs.length)
            : exam.classAverage;

        return {
          ...exam,
          pendingReviews: pendingCount,
          classAverage: newAverage,
          submissions: updatedSubmissions,
        };
      })
    );

    setGradingSubmission(null);
  };

  // Export Excel / CSV Functionality
  const handleExportExcel = (exam: ExamGroup) => {
    const headers = [
      "Student ID",
      "Student Name",
      "Submission Time",
      "Auto Points (MCQ)",
      "Manual Points (Essay)",
      "Net Score Weight",
      "Status",
    ];

    const rows = exam.submissions.map((sub) => {
      const totalScore = (sub.autoPoints || 0) + (sub.manualPoints || 0);
      const netScore =
        sub.status === "evaluated"
          ? `${totalScore} / ${sub.totalMaxPoints} (${Math.round(
              (totalScore / sub.totalMaxPoints) * 100
            )}%)`
          : "Incomplete";

      return [
        sub.studentId,
        `"${sub.studentName}"`,
        `"${sub.submittedAt}"`,
        `${sub.autoPoints} pts`,
        sub.manualPoints !== null ? `${sub.manualPoints} pts` : "Ungraded",
        `"${netScore}"`,
        sub.status === "evaluated" ? "EVALUATED" : "REVIEW NEEDED",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${exam.code}_${exam.title.replace(/[^a-zA-Z0-9]/g, "_")}_Results.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF Script Functionality
  const handleDownloadPDF = async (submission: StudentSubmission) => {
    setIsExporting(true);

    try {
      const pdfWindow = window as Html2PdfWindow;
      if (!pdfWindow.html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PDF library"));
          document.head.appendChild(script);
        });
      }

      const computedManualPoints = submission.answers.reduce((acc, q) => {
        if (q.type === "essay") {
          const currentVal = manualScores[q.id];
          const score =
            typeof currentVal === "number" ? currentVal : q.manualScore ?? 0;
          return acc + score;
        }
        return acc;
      }, 0);

      const totalCalculatedScore =
        (submission.autoPoints || 0) + computedManualPoints;

      const container = document.createElement("div");
      container.style.padding = "30px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#0f172a";
      container.style.backgroundColor = "#ffffff";

      container.innerHTML = `
        <table style="width: 100%; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: top;">
              <h1 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 800;">Official Examination Script</h1>
              <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;"><strong>Exam Title:</strong> ${
                currentExam?.title || "Examination"
              } (${currentExam?.code || ""})</p>
              <p style="margin: 2px 0 0 0; color: #475569; font-size: 13px;"><strong>Student:</strong> ${
                submission.studentName
              } &nbsp;|&nbsp; <strong>ID:</strong> ${submission.studentId}</p>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px;"><strong>Submission Date:</strong> ${
                submission.submittedAt
              }</p>
            </td>
            <td style="vertical-align: top; text-align: right;">
              <span style="display: inline-block; padding: 6px 14px; background-color: #0f172a; color: white; font-size: 11px; font-weight: bold; border-radius: 6px; text-transform: uppercase;">
                ${submission.status.replace("_", " ")}
              </span>
            </td>
          </tr>
        </table>

        <table style="width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px; text-align: center; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px; width: 33%;">
              <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold;">Auto MCQ Score</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${
                submission.autoPoints
              } pts</div>
            </td>
            <td style="padding: 15px; width: 33%; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold;">Manual Essay Score</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${computedManualPoints} pts</div>
            </td>
            <td style="padding: 15px; width: 33%;">
              <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Final Mark</div>
              <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${totalCalculatedScore} / ${
        submission.totalMaxPoints
      }</div>
            </td>
          </tr>
        </table>

        <h3 style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Detailed Evaluation</h3>

        ${submission.answers
          .map((q, idx) => {
            const assignedScore =
              q.type === "mcq"
                ? q.autoScore
                : manualScores[q.id] !== undefined &&
                  manualScores[q.id] !== ""
                ? manualScores[q.id]
                : q.manualScore ?? 0;

            const remarkText = feedbacks[q.id] || q.feedback;

            return `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
                <table style="width: 100%; margin-bottom: 10px;">
                  <tr>
                    <td style="font-size: 11px; font-weight: bold; color: #64748b;">QUESTION ${
                      idx + 1
                    } (${q.type.toUpperCase()})</td>
                    <td style="text-align: right;">
                      <span style="color: #0f172a; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        Assigned: ${assignedScore} / ${q.maxPoints} pts
                      </span>
                    </td>
                  </tr>
                </table>

                <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 10px;">${
                  q.questionText
                }</div>
                
                <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Student Answer:</div>
                <div style="background: #f8fafc; color: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; white-space: pre-wrap; border: 1px solid #e2e8f0;">${
                  q.studentAnswer
                }</div>

                ${
                  q.type === "mcq"
                    ? `<p style="font-size:11px; color:#0f172a; font-weight: bold; margin-top: 6px;">Correct Answer: ${q.correctAnswer}</p>`
                    : ""
                }

                ${
                  remarkText
                    ? `
                  <div style="background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 12px;">
                    <strong>Teacher Remarks:</strong> ${remarkText}
                  </div>
                `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      `;

      const cleanFileName = `${submission.studentName.replace(
        /\s+/g,
        "_"
      )}_${submission.studentId}_Result.pdf`;
      const options = {
        margin: 10,
        filename: cleanFileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await pdfWindow.html2pdf!().set(options).from(container).save();
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to download PDF script.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* LEVEL 1: EXAMS LIST VIEW */}
      {!selectedExamId && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                Evaluation Desk
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Grading & Results
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select an exam session below to review student scripts and score manual essay questions.
              </p>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded border border-slate-200 uppercase inline-block">
                      {exam.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors pt-0.5">
                      {exam.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      {exam.department}
                    </p>
                  </div>

                  {exam.pendingReviews > 0 ? (
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      {exam.pendingReviews} Needs Review
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                      All Graded
                    </span>
                  )}
                </div>

                {/* Exam Quick Stats Boxes */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Submissions
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {exam.totalSubmissions}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pending Essays
                    </p>
                    <p className="text-sm font-extrabold text-amber-700 mt-0.5">
                      {exam.pendingReviews}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Class Avg.
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {exam.classAverage}%
                    </p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-600 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all pt-1">
                  <span>Open Student Submissions</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: STUDENT ROSTER VIEW */}
      {selectedExamId && currentExam && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedExamId(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 mb-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to All Exams</span>
              </button>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentExam.title}
              </h1>
              <p className="text-xs font-medium text-slate-500 font-mono">
                Exam Code: {currentExam.code}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Excel Export Button */}
              <button
                onClick={() => handleExportExcel(currentExam)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>

              <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pending Essays
                </p>
                <p className="text-xs font-extrabold text-amber-700">
                  {currentExam.pendingReviews} Students
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Student Meta</th>
                    <th className="p-4">Submission Time</th>
                    <th className="p-4">Auto Points (MCQ)</th>
                    <th className="p-4">Manual Points (Essay)</th>
                    <th className="p-4">Net Score Weight</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-700">
                  {currentExam.submissions.map((sub) => {
                    const isEvaluated = sub.status === "evaluated";
                    const totalScore =
                      (sub.autoPoints || 0) + (sub.manualPoints || 0);

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <p className="font-bold text-slate-900">
                            {sub.studentName}
                          </p>
                          <p className="text-[10px] font-mono font-bold text-slate-400">
                            {sub.studentId}
                          </p>
                        </td>
                        <td className="p-4 text-slate-500 font-medium">
                          {sub.submittedAt}
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {sub.autoPoints} pts
                        </td>
                        <td className="p-4">
                          {sub.manualPoints !== null ? (
                            <span className="font-bold text-slate-800">
                              {sub.manualPoints} pts
                            </span>
                          ) : (
                            <span className="italic text-amber-700 font-bold">
                              Ungraded
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEvaluated ? (
                            <span className="font-bold text-slate-900 text-xs">
                              {totalScore} / {sub.totalMaxPoints} (
                              {Math.round((totalScore / sub.totalMaxPoints) * 100)}
                              %)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-medium">
                              Incomplete
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEvaluated ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Evaluated
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Review Needed
                            </span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => handleDownloadPDF(sub)}
                            disabled={isExporting}
                            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            <span>{isExporting ? "Exporting..." : "PDF"}</span>
                          </button>
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                              isEvaluated
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                : "bg-navy-900 hover:bg-slate-800 text-white shadow-2xs"
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>
                              {isEvaluated ? "Review Score" : "Grade Script"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 3: SCRIPT EVALUATION MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 bg-navy-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase font-mono block mb-0.5">
                  Script Review Desk
                </span>
                <h3 className="text-base font-bold">
                  {gradingSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  {gradingSubmission.studentId}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleDownloadPDF(gradingSubmission)}
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 transition-colors border border-white/10 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>{isExporting ? "Saving PDF..." : "Download PDF"}</span>
                </button>

                <button
                  onClick={() => setGradingSubmission(null)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-xl bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Questions Answer Review Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
              {gradingSubmission.answers.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Question {index + 1} ({question.type.toUpperCase()})
                    </span>
                    <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      Max: {question.maxPoints} pts
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900">
                    {question.questionText}
                  </p>

                  {/* MCQ View */}
                  {question.type === "mcq" && (
                    <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-200">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Student Answer:</span>
                        <span
                          className={`font-bold ${
                            question.autoScore === question.maxPoints
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {question.studentAnswer}
                        </span>
                      </div>
                      {question.correctAnswer && (
                        <div className="flex justify-between text-xs font-medium border-t border-slate-200/60 pt-2">
                          <span className="text-slate-500">Correct Answer:</span>
                          <span className="font-bold text-slate-900">
                            {question.correctAnswer}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-bold pt-1 text-slate-900">
                        <span>Auto Score:</span>
                        <span>
                          {question.autoScore} / {question.maxPoints} pts
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Essay View */}
                  {question.type === "essay" && (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Student Submission
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                          {question.studentAnswer}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1 space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                            Assign Score (Max {question.maxPoints})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={question.maxPoints}
                            value={manualScores[question.id] ?? ""}
                            onChange={(e) => {
                              const val =
                                e.target.value === ""
                                  ? ""
                                  : Math.min(
                                      question.maxPoints,
                                      Math.max(0, Number(e.target.value))
                                    );
                              setManualScores({
                                ...manualScores,
                                [question.id]: val,
                              });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-sky-400 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all"
                            placeholder={`0 - ${question.maxPoints}`}
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                            Teacher Feedback / Remarks
                          </label>
                          <textarea
                            rows={2}
                            value={feedbacks[question.id] || ""}
                            onChange={(e) =>
                              setFeedbacks({
                                ...feedbacks,
                                [question.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-sky-400 rounded-xl text-xs font-medium text-slate-900 outline-none transition-all resize-none placeholder:text-slate-400"
                            placeholder="Add constructive feedback for the student..."
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrades}
                className="px-4 py-2 bg-navy-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Evaluation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}