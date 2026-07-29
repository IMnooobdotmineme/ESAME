"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  X,
  Check,
  Edit3
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
              questionText: "Explain the difference between Object-Oriented Programming (OOP) and Functional Programming.",
              maxPoints: 40,
              studentAnswer:
                "Object-Oriented Programming (OOP) organizes code around objects containing data fields and methods. Functional Programming treats computation as the evaluation of mathematical functions and avoids mutable data.",
              manualScore: 38,
              feedback: "Great summary! Clear distinction made regarding state mutability.",
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
              questionText: "Explain the difference between Object-Oriented Programming (OOP) and Functional Programming.",
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
              questionText: "Detail the time complexity of QuickSort in best, average, and worst cases.",
              maxPoints: 30,
              studentAnswer: "Best case is O(n log n), Average is O(n log n), and Worst case is O(n^2) when the pivot is poorly chosen.",
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

        const pendingCount = updatedSubmissions.filter((s) => s.status === "pending_review").length;

        // Recalculate Class Average
        const evaluatedSubs = updatedSubmissions.filter((s) => s.status === "evaluated");
        const totalPct = evaluatedSubs.reduce((acc, curr) => {
          const score = (curr.autoPoints || 0) + (curr.manualPoints || 0);
          return acc + (score / curr.totalMaxPoints) * 100;
        }, 0);
        const newAverage = evaluatedSubs.length > 0 ? Math.round(totalPct / evaluatedSubs.length) : exam.classAverage;

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

  // Export PDF Script Functionality
  const handleDownloadPDF = async (submission: StudentSubmission) => {
    setIsExporting(true);

    try {
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PDF library"));
          document.head.appendChild(script);
        });
      }

      const computedManualPoints = submission.answers.reduce((acc, q) => {
        if (q.type === "essay") {
          const currentVal = manualScores[q.id];
          const score = typeof currentVal === "number" ? currentVal : (q.manualScore ?? 0);
          return acc + score;
        }
        return acc;
      }, 0);

      const totalCalculatedScore = (submission.autoPoints || 0) + computedManualPoints;

      const container = document.createElement("div");
      container.style.padding = "30px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#395886";
      container.style.backgroundColor = "#ffffff";

      container.innerHTML = `
        <table style="width: 100%; border-bottom: 3px solid #395886; padding-bottom: 15px; margin-bottom: 20px;">
          <tr>
            <td style="vertical-align: top;">
              <h1 style="margin: 0; color: #395886; font-size: 24px; font-weight: 800;">Official Examination Script</h1>
              <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;"><strong>Exam Title:</strong> ${currentExam?.title || "Examination"} (${currentExam?.code || ""})</p>
              <p style="margin: 2px 0 0 0; color: #475569; font-size: 13px;"><strong>Student:</strong> ${submission.studentName} &nbsp;|&nbsp; <strong>ID:</strong> ${submission.studentId}</p>
              <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px;"><strong>Submission Date:</strong> ${submission.submittedAt}</p>
            </td>
            <td style="vertical-align: top; text-align: right;">
              <span style="display: inline-block; padding: 6px 14px; background-color: #395886; color: white; font-size: 11px; font-weight: bold; border-radius: 6px; text-transform: uppercase;">
                ${submission.status.replace("_", " ")}
              </span>
            </td>
          </tr>
        </table>

        <table style="width: 100%; background: #F0F3FA; border: 1px solid #D5DEEF; border-radius: 10px; margin-bottom: 25px; text-align: center; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px; width: 33%;">
              <div style="font-size: 10px; text-transform: uppercase; color: #8AAEE0; font-weight: bold;">Auto MCQ Score</div>
              <div style="font-size: 18px; font-weight: 800; color: #395886; margin-top: 2px;">${submission.autoPoints} pts</div>
            </td>
            <td style="padding: 15px; width: 33%; border-left: 1px solid #D5DEEF; border-right: 1px solid #D5DEEF;">
              <div style="font-size: 10px; text-transform: uppercase; color: #8AAEE0; font-weight: bold;">Manual Essay Score</div>
              <div style="font-size: 18px; font-weight: 800; color: #395886; margin-top: 2px;">${computedManualPoints} pts</div>
            </td>
            <td style="padding: 15px; width: 33%;">
              <div style="font-size: 10px; text-transform: uppercase; color: #8AAEE0; font-weight: bold;">Total Final Mark</div>
              <div style="font-size: 18px; font-weight: 800; color: #395886; margin-top: 2px;">${totalCalculatedScore} / ${submission.totalMaxPoints}</div>
            </td>
          </tr>
        </table>

        <h3 style="font-size: 15px; font-weight: 800; color: #395886; margin-bottom: 15px; border-bottom: 1px solid #F0F3FA; padding-bottom: 8px;">Detailed Evaluation</h3>

        ${submission.answers
          .map((q, idx) => {
            const assignedScore =
              q.type === "mcq"
                ? q.autoScore
                : (manualScores[q.id] !== undefined && manualScores[q.id] !== ""
                    ? manualScores[q.id]
                    : (q.manualScore ?? 0));

            const remarkText = feedbacks[q.id] || q.feedback;

            return `
              <div style="border: 1px solid #D5DEEF; border-radius: 10px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
                <table style="width: 100%; margin-bottom: 10px;">
                  <tr>
                    <td style="font-size: 11px; font-weight: bold; color: #64748b;">QUESTION ${idx + 1} (${q.type.toUpperCase()})</td>
                    <td style="text-align: right;">
                      <span style="color: #395886; background: #D5DEEF; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        Assigned: ${assignedScore} / ${q.maxPoints} pts
                      </span>
                    </td>
                  </tr>
                </table>

                <div style="font-weight: 700; font-size: 14px; color: #395886; margin-bottom: 10px;">${q.questionText}</div>
                
                <div style="font-size: 10px; font-weight: bold; color: #8AAEE0; text-transform: uppercase; margin-bottom: 4px;">Student Answer:</div>
                <div style="background: #F0F3FA; color: #395886; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap; border: 1px solid #D5DEEF;">${q.studentAnswer}</div>

                ${
                  q.type === "mcq"
                    ? `<p style="font-size:11px; color:#395886; font-weight: bold; margin-top: 6px;">Correct Answer: ${q.correctAnswer}</p>`
                    : ""
                }

                ${
                  remarkText
                    ? `
                  <div style="background: #F0F3FA; border: 1px solid #B1C9EF; color: #395886; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 12px;">
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

      const cleanFileName = `${submission.studentName.replace(/\s+/g, "_")}_${submission.studentId}_Result.pdf`;
      const options = {
        margin: 10,
        filename: cleanFileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await (window as any).html2pdf().set(options).from(container).save();
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to download PDF script.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans bg-[#F0F3FA]/30 p-6 rounded-3xl">
      {/* LEVEL 1: EXAMS LIST VIEW */}
      {!selectedExamId && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#D5DEEF] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black tracking-wider text-[#638ECB] uppercase block mb-1">
                EVALUATION DESK
              </span>
              <h1 className="text-2xl font-black text-[#395886] tracking-tight">
                Grading & Results
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Select an exam session below to review student scripts and score manual essay questions.
              </p>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className="bg-white p-6 rounded-2xl border border-[#D5DEEF] hover:border-[#8AAEE0] transition-all shadow-sm hover:shadow-md cursor-pointer group space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-[#395886] bg-[#D5DEEF] px-2.5 py-1 rounded-md tracking-wide uppercase inline-block">
                      {exam.code}
                    </span>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#395886] transition-colors pt-1">
                      {exam.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400">{exam.department}</p>
                  </div>

                  {exam.pendingReviews > 0 ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shrink-0">
                      {exam.pendingReviews} NEEDS REVIEW
                    </span>
                  ) : (
                    <span className="bg-[#D5DEEF] text-[#395886] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shrink-0">
                      ALL GRADED
                    </span>
                  )}
                </div>

                {/* Exam Quick Stats Boxes */}
                <div className="grid grid-cols-3 gap-3 pt-3">
                  <div className="bg-[#F0F3FA] p-3 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">SUBMISSIONS</p>
                    <p className="text-base font-black text-[#395886] mt-0.5">{exam.totalSubmissions}</p>
                  </div>
                  <div className="bg-[#F0F3FA] p-3 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">PENDING ESSAYS</p>
                    <p className="text-base font-black text-amber-600 mt-0.5">{exam.pendingReviews}</p>
                  </div>
                  <div className="bg-[#F0F3FA] p-3 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">CLASS AVG.</p>
                    <p className="text-base font-black text-[#395886] mt-0.5">{exam.classAverage}%</p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex items-center justify-end gap-1 text-xs font-bold text-[#395886] group-hover:translate-x-1 transition-transform pt-1">
                  <span>Open Student Submissions</span>
                  <ChevronRight className="w-4 h-4 text-[#638ECB]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: STUDENT ROSTER VIEW */}
      {selectedExamId && currentExam && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-[#D5DEEF] shadow-sm">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedExamId(null)}
                className="text-xs font-bold text-[#395886] hover:text-[#638ECB] hover:underline flex items-center gap-1 mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-[#395886]" />
                <span>Back to All Exams</span>
              </button>
              <h1 className="text-2xl font-black text-[#395886] tracking-tight">
                {currentExam.title}
              </h1>
              <p className="text-xs font-medium text-slate-400 font-mono">Exam Code: {currentExam.code}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#F0F3FA] border border-[#D5DEEF] px-4 py-2.5 rounded-xl text-right">
                <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider">Pending Essays</p>
                <p className="text-sm font-black text-amber-600">{currentExam.pendingReviews} Students</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#D5DEEF] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D5DEEF] bg-[#F0F3FA] text-[10px] font-black text-[#8AAEE0] uppercase tracking-wider">
                    <th className="p-4 pl-6">Student Meta</th>
                    <th className="p-4">Submission Time</th>
                    <th className="p-4">Auto Points (MCQ)</th>
                    <th className="p-4">Manual Points (Essay)</th>
                    <th className="p-4">Net Score Weight</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5DEEF]/60 text-xs font-medium text-slate-700">
                  {currentExam.submissions.map((sub) => {
                    const isEvaluated = sub.status === "evaluated";
                    const totalScore = (sub.autoPoints || 0) + (sub.manualPoints || 0);

                    return (
                      <tr key={sub.id} className="hover:bg-[#F0F3FA]/50 transition-colors">
                        <td className="p-4 pl-6">
                          <p className="font-black text-[#395886]">{sub.studentName}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-400">{sub.studentId}</p>
                        </td>
                        <td className="p-4 text-slate-500 font-medium">{sub.submittedAt}</td>
                        <td className="p-4 font-bold text-slate-700">{sub.autoPoints} pts</td>
                        <td className="p-4">
                          {sub.manualPoints !== null ? (
                            <span className="font-bold text-slate-700">{sub.manualPoints} pts</span>
                          ) : (
                            <span className="italic text-amber-600 font-bold">Ungraded</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEvaluated ? (
                            <span className="font-black text-[#395886] text-xs">
                              {totalScore} / {sub.totalMaxPoints} (
                              {Math.round((totalScore / sub.totalMaxPoints) * 100)}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-medium">Incomplete</span>
                          )}
                        </td>
                        <td className="p-4">
                          {isEvaluated ? (
                            <span className="bg-[#D5DEEF] text-[#395886] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                              EVALUATED
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                              REVIEW NEEDED
                            </span>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right space-x-2 shrink-0">
                          <button
                            onClick={() => handleDownloadPDF(sub)}
                            disabled={isExporting}
                            className="py-2 px-3 bg-[#F0F3FA] hover:bg-[#D5DEEF] text-[#395886] rounded-xl text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5 text-[#638ECB]" />
                            <span>{isExporting ? "Exporting..." : "PDF"}</span>
                          </button>
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                              isEvaluated
                                ? "bg-[#F0F3FA] hover:bg-[#D5DEEF] text-[#395886]"
                                : "bg-[#395886] hover:bg-[#2e476d] text-white shadow-sm active:scale-[0.98]"
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isEvaluated ? "Review Score" : "Grade Script"}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#395886]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-[#D5DEEF]">
            {/* Header */}
            <div className="p-6 bg-[#395886] text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#B1C9EF] uppercase font-mono block mb-0.5">
                  Script Review Desk
                </span>
                <h3 className="text-lg font-black">{gradingSubmission.studentName}</h3>
                <p className="text-xs text-[#B1C9EF] font-mono">{gradingSubmission.studentId}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPDF(gradingSubmission)}
                  disabled={isExporting}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 transition-colors border border-white/10 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-[#B1C9EF]" />
                  <span>{isExporting ? "Saving PDF..." : "Download PDF"}</span>
                </button>

                <button
                  onClick={() => setGradingSubmission(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-xl bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Questions Answer Review Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#F0F3FA]/50">
              {gradingSubmission.answers.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white p-5 rounded-2xl border border-[#D5DEEF] shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[#D5DEEF] pb-3">
                    <span className="text-[10px] font-black text-[#8AAEE0] uppercase tracking-wider">
                      Question {index + 1} ({question.type.toUpperCase()})
                    </span>
                    <span className="text-xs font-bold text-[#395886] bg-[#D5DEEF] px-2.5 py-0.5 rounded-lg">
                      Max: {question.maxPoints} pts
                    </span>
                  </div>

                  <p className="text-xs font-black text-[#395886]">{question.questionText}</p>

                  {/* MCQ View */}
                  {question.type === "mcq" && (
                    <div className="bg-[#F0F3FA] p-4 rounded-xl space-y-2 border border-[#D5DEEF]">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Student Answer:</span>
                        <span
                          className={`font-bold ${
                            question.autoScore === question.maxPoints
                              ? "text-[#395886]"
                              : "text-rose-600"
                          }`}
                        >
                          {question.studentAnswer}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-medium border-t border-[#D5DEEF] pt-2">
                        <span className="text-slate-500">Correct Answer:</span>
                        <span className="font-bold text-[#395886]">{question.correctAnswer}</span>
                      </div>
                    </div>
                  )}

                  {/* Essay View */}
                  {question.type === "essay" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#8AAEE0] uppercase tracking-wider mb-1.5">
                          Student Written Response:
                        </p>
                        <div className="p-4 bg-[#395886] text-white text-xs leading-relaxed rounded-xl font-mono whitespace-pre-wrap border border-[#395886]">
                          {question.studentAnswer}
                        </div>
                      </div>

                      {/* Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-[#395886] mb-1">
                            Assign Score (0 - {question.maxPoints} pts)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={question.maxPoints}
                            value={manualScores[question.id] ?? ""}
                            onChange={(e) => {
                              const rawVal = e.target.value;
                              if (rawVal === "") {
                                setManualScores({ ...manualScores, [question.id]: "" });
                              } else {
                                const val = Number(rawVal);
                                setManualScores({
                                  ...manualScores,
                                  [question.id]: Math.min(question.maxPoints, Math.max(0, val)),
                                });
                              }
                            }}
                            className="w-full p-2.5 bg-white border border-[#D5DEEF] rounded-xl text-xs font-black text-[#395886] focus:outline-none focus:ring-2 focus:ring-[#638ECB]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-[#395886] mb-1">
                            Teacher Remarks / Feedback
                          </label>
                          <input
                            type="text"
                            placeholder="Optional feedback for student..."
                            value={feedbacks[question.id] ?? ""}
                            onChange={(e) =>
                              setFeedbacks({
                                ...feedbacks,
                                [question.id]: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-white border border-[#D5DEEF] rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#638ECB]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 bg-white border-t border-[#D5DEEF] flex items-center justify-between shrink-0">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-5 py-2.5 bg-[#F0F3FA] hover:bg-[#D5DEEF] text-[#395886] font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrades}
                className="px-6 py-2.5 bg-[#395886] hover:bg-[#2e476d] text-white font-bold text-xs rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save Grades & Mark Evaluated</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}