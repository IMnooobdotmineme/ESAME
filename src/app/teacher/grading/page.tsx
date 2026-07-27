"use client";

import React, { useState } from "react";

// Types
interface QuestionAnswer {
  id: string;
  type: "mcq" | "essay";
  questionText: string;
  maxPoints: number;
  studentAnswer: string;
  correctAnswer?: string; // For MCQ
  autoScore?: number; // For MCQ
  manualScore?: number; // For Essay
  feedback?: string; // For Essay
}

interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  autoPoints: number;
  manualPoints: number | null; // null if ungraded
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
  // Mock Data: Exams with Student Submissions
  const [exams, setExams] = useState<ExamGroup[]>([
    {
      id: "exam-101",
      title: "Introduction to Computer Science",
      code: "CS101-MD",
      department: "Computer Science",
      totalSubmissions: 3,
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

  // Navigation / Selection State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Temporary state inside the Essay Grading Modal
  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});

  const currentExam = exams.find((e) => e.id === selectedExamId);

  // Open Grading Drawer / Modal
  const handleOpenGrading = (submission: StudentSubmission) => {
    setGradingSubmission(submission);
    const initialScores: Record<string, number> = {};
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

        return {
          ...exam,
          pendingReviews: pendingCount,
          submissions: updatedSubmissions,
        };
      })
    );

    setGradingSubmission(null);
  };

  // DIRECT PDF FILE DOWNLOAD FUNCTIONALITY
  const handleDownloadPDF = async (submission: StudentSubmission) => {
    setIsExporting(true);

    try {
      // 1. Dynamically load html2pdf script if not present
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PDF library"));
          document.head.appendChild(script);
        });
      }

      const totalCalculatedScore = (submission.autoPoints || 0) + (submission.manualPoints || 0);

      // 2. Build off-screen template
      const container = document.createElement("div");
      container.style.padding = "30px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#0f172a";
      container.style.backgroundColor = "#ffffff";

      container.innerHTML = `
        <div style="border-bottom: 3px solid #0B7A93; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="margin: 0; color: #0B7A93; font-size: 24px; font-weight: 800;">Official Examination Script</h1>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 13px;"><strong>Exam Title:</strong> ${currentExam?.title || "Examination"} (${currentExam?.code || ""})</p>
            <p style="margin: 2px 0 0 0; color: #475569; font-size: 13px;"><strong>Student:</strong> ${submission.studentName} &nbsp;|&nbsp; <strong>ID:</strong> ${submission.studentId}</p>
            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 12px;"><strong>Submission Date:</strong> ${submission.submittedAt}</p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 6px 14px; background-color: #0B7A93; color: white; font-size: 11px; font-weight: bold; border-radius: 6px; text-transform: uppercase;">
              ${submission.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div style="display: flex; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; margin-bottom: 25px;">
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Auto MCQ Score</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${submission.autoPoints} pts</div>
          </div>
          <div style="flex: 1; text-align: center; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
            <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Manual Essay Score</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 2px;">${submission.manualPoints ?? manualScores[submission.answers[0]?.id] ?? 0} pts</div>
          </div>
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Total Final Mark</div>
            <div style="font-size: 18px; font-weight: 800; color: #0B7A93; margin-top: 2px;">${totalCalculatedScore} / ${submission.totalMaxPoints}</div>
          </div>
        </div>

        <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Detailed Questions & Script Evaluation</h3>

        ${submission.answers
          .map(
            (q, idx) => `
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px; font-weight: bold; color: #64748b;">
              <span>QUESTION ${idx + 1} (${q.type.toUpperCase()})</span>
              <span style="color: #0B7A93; background: #f0fdfa; padding: 2px 8px; border-radius: 4px; border: 1px solid #ccfbf1;">
                Assigned: ${q.type === "mcq" ? q.autoScore : (manualScores[q.id] ?? q.manualScore ?? 0)} / ${q.maxPoints} pts
              </span>
            </div>
            <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 10px;">${q.questionText}</div>
            
            <div style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Student Answer:</div>
            <div style="background: #f1f5f9; color: #0f172a; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap; border: 1px solid #cbd5e1;">${q.studentAnswer}</div>

            ${
              q.type === "mcq"
                ? `<p style="font-size:11px; color:#16a34a; font-weight: bold; margin-top: 6px;">Correct Answer: ${q.correctAnswer}</p>`
                : ""
            }

            ${
              feedbacks[q.id] || q.feedback
                ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 12px;">
                <strong>Teacher Remarks:</strong> ${feedbacks[q.id] || q.feedback}
              </div>
            `
                : ""
            }
          </div>
        `
          )
          .join("")}
      `;

      // 3. Configure PDF Options
      const cleanFileName = `${submission.studentName.replace(/\s+/g, "_")}_${submission.studentId}_Result.pdf`;
      const options = {
        margin: 10,
        filename: cleanFileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // 4. Save/Download File
      await (window as any).html2pdf().set(options).from(container).save();
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      {/* LEVEL 1: EXAMS LIST VIEW */}
      {!selectedExamId && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-xs font-black tracking-widest text-[#0B7A93] uppercase">
                Evaluation Desk
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mt-1">
                Grading & Results
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Select an exam session below to review student scripts and score manual essay questions.
              </p>
            </div>
          </div>

          {/* Exam Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-[#0B7A93] transition-all shadow-sm hover:shadow-md cursor-pointer group space-y-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-black font-mono text-[#0B7A93] bg-teal-50 px-2.5 py-1 rounded-lg">
                      {exam.code}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-[#0B7A93] transition-colors mt-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">{exam.department}</p>
                  </div>

                  {exam.pendingReviews > 0 ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      {exam.pendingReviews} Needs Review
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      All Graded
                    </span>
                  )}
                </div>

                {/* Exam Quick Stats */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Submissions</p>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{exam.totalSubmissions}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pending Essays</p>
                    <p className="text-lg font-black text-amber-600 mt-0.5">{exam.pendingReviews}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Class Avg.</p>
                    <p className="text-lg font-black text-[#0B7A93] mt-0.5">{exam.classAverage}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1 text-xs font-bold text-[#0B7A93] group-hover:translate-x-1 transition-transform">
                  <span>Open Student Submissions</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 2: STUDENT ROSTER FOR SELECTED EXAM */}
      {selectedExamId && currentExam && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedExamId(null)}
                className="text-xs font-bold text-[#0B7A93] hover:underline flex items-center gap-1 mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back to All Exams
              </button>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {currentExam.title}
              </h2>
              <p className="text-xs text-gray-500 font-mono">Exam Code: {currentExam.code}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-100 px-4 py-2 rounded-xl text-right">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase">Pending Essays</p>
                <p className="text-base font-black text-amber-600">{currentExam.pendingReviews} Students</p>
              </div>
            </div>
          </div>

          {/* Student Submissions Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/70 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Student Meta</th>
                  <th className="p-4">Submission Time</th>
                  <th className="p-4">Auto Points (MCQ)</th>
                  <th className="p-4">Manual Points (Essay)</th>
                  <th className="p-4">Net Score Weight</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                {currentExam.submissions.map((sub) => {
                  const isEvaluated = sub.status === "evaluated";
                  const totalScore = (sub.autoPoints || 0) + (sub.manualPoints || 0);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="font-extrabold text-gray-900">{sub.studentName}</p>
                        <p className="text-[11px] font-mono text-gray-400">{sub.studentId}</p>
                      </td>
                      <td className="p-4 text-gray-500">{sub.submittedAt}</td>
                      <td className="p-4 font-bold text-slate-700">{sub.autoPoints} pts</td>
                      <td className="p-4">
                        {sub.manualPoints !== null ? (
                          <span className="font-bold text-slate-700">{sub.manualPoints} pts</span>
                        ) : (
                          <span className="italic text-amber-600 font-semibold">Ungraded</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEvaluated ? (
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {totalScore} / {sub.totalMaxPoints} (
                            {Math.round((totalScore / sub.totalMaxPoints) * 100)}%)
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Incomplete</span>
                        )}
                      </td>
                      <td className="p-4">
                        {isEvaluated ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
                            EVALUATED
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
                            REVIEW NEEDED
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        {/* Download PDF Button */}
                        <button
                          onClick={() => handleDownloadPDF(sub)}
                          disabled={isExporting}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {isExporting ? "Generating..." : "Download PDF"}
                        </button>
                        <button
                          onClick={() => handleOpenGrading(sub)}
                          className={`py-2 px-4 rounded-xl text-xs font-black transition-all ${
                            isEvaluated
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-slate-900 hover:bg-slate-800 text-white shadow-md"
                          }`}
                        >
                          {isEvaluated ? "Review Score" : "Grade Script"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEVEL 3: CENTERED SCRIPT & ESSAY GRADING MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-[#0B7A93] uppercase font-mono">
                  Script Review Desk
                </span>
                <h3 className="text-xl font-black">{gradingSubmission.studentName}</h3>
                <p className="text-xs text-slate-400 font-mono">{gradingSubmission.studentId}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Download PDF File Button in Modal Header */}
                <button
                  onClick={() => handleDownloadPDF(gradingSubmission)}
                  disabled={isExporting}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 text-[#0B7A93]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>{isExporting ? "Saving PDF..." : "Download PDF File"}</span>
                </button>

                <button
                  onClick={() => setGradingSubmission(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Questions Answer Review Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {gradingSubmission.answers.map((question, index) => (
                <div
                  key={question.id}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                      Question {index + 1} ({question.type.toUpperCase()})
                    </span>
                    <span className="text-xs font-extrabold text-[#0B7A93] bg-teal-50 px-2.5 py-1 rounded-lg">
                      Max: {question.maxPoints} pts
                    </span>
                  </div>

                  <p className="text-sm font-extrabold text-gray-900">{question.questionText}</p>

                  {/* MCQ View */}
                  {question.type === "mcq" && (
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">Student Answer:</span>
                        <span
                          className={`font-bold ${
                            question.autoScore === question.maxPoints
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {question.studentAnswer}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-medium border-t border-slate-200/60 pt-2">
                        <span className="text-gray-500">Correct Answer:</span>
                        <span className="font-bold text-gray-800">{question.correctAnswer}</span>
                      </div>
                    </div>
                  )}

                  {/* Essay View */}
                  {question.type === "essay" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">
                          Student Written Response:
                        </p>
                        <div className="p-4 bg-slate-900 text-slate-100 text-xs leading-relaxed rounded-xl font-mono whitespace-pre-wrap">
                          {question.studentAnswer}
                        </div>
                      </div>

                      {/* Score Input & Feedback */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Assign Score (0 - {question.maxPoints} pts)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={question.maxPoints}
                            value={manualScores[question.id] ?? 0}
                            onChange={(e) =>
                              setManualScores({
                                ...manualScores,
                                [question.id]: Math.min(
                                  question.maxPoints,
                                  Math.max(0, Number(e.target.value))
                                ),
                              })
                            }
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B7A93]"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">
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
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B7A93]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-5 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGrades}
                className="px-6 py-3 bg-[#0B7A93] hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>Save Grades & Mark Evaluated</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}