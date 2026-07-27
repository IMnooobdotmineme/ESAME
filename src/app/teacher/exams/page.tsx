"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Exam {
  id: string;
  courseCode: string;
  title: string;
  duration: number;
  questionCount: number;
  accessCode: string;
}

export default function MyExamsPage() {
  const router = useRouter();

  // Active Exams State
  const [exams, setExams] = useState<Exam[]>([
    {
      id: "1",
      courseCode: "COURSE",
      title: "tyuiho",
      duration: 60,
      questionCount: 1,
      accessCode: "SEN79Z",
    },
    {
      id: "2",
      courseCode: "CS101",
      title: "Introduction to Computer Science (Midterm)",
      duration: 60,
      questionCount: 2,
      accessCode: "X8K29P",
    },
    {
      id: "3",
      courseCode: "CS204",
      title: "Data Structures & Algorithms Quiz 3",
      duration: 45,
      questionCount: 1,
      accessCode: "7M4R9L",
    },
  ]);

  // Modal State for Access Code Pop-up
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle Copying Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Delete Exam Handler
  const handleDeleteExam = (id: string) => {
    setExams((prev) => prev.filter((exam) => exam.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Examination Repository</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review live feeds, coordinate test schedules, or edit existing exam questions.
          </p>
        </div>
        <button className="bg-[#0B7A93] hover:bg-[#086277] text-white font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Create New Exam</span>
        </button>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 flex gap-8">
        <button className="pb-3 text-sm font-bold text-[#0B7A93] border-b-2 border-[#0B7A93]">
          Active Exams ({exams.length})
        </button>
        <button className="pb-3 text-sm font-semibold text-gray-400 hover:text-gray-600">
          Scheduled Exams (0)
        </button>
        <button className="pb-3 text-sm font-semibold text-gray-400 hover:text-gray-600">
          Completed Exams (0)
        </button>
      </div>

      {/* EXAMS LIST */}
      <div className="space-y-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all"
          >
            {/* Exam Information */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <span className="bg-slate-100 font-bold px-2.5 py-1 rounded-md text-slate-700 uppercase">
                  {exam.courseCode}
                </span>
                <span>Duration: {exam.duration} mins</span>
                <span>•</span>
                <span>{exam.questionCount} Questions</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <span>Edit Exam & Questions</span>
              </button>

              {/* Clicking Launch Live Monitor opens the Access Code Modal */}
              <button
                onClick={() => setSelectedExam(exam)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0B7A93] hover:bg-[#086277] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-6-3v3m-6.9-12a3 3 0 013-3h11.8a3 3 0 013 3v6a3 3 0 01-3 3H6.1a3 3 0 01-3-3v-6z" />
                </svg>
                <span>Launch Live Monitor</span>
              </button>

              <button
                onClick={() => handleDeleteExam(exam.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Delete Exam"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* POPUP MODAL: ACCESS JOIN CODE & LIVE MONITOR LAUNCH */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0B7A93]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714zm0 11.036h.008v.008H12v-.008z" />
                </svg>
                <span className="text-xs font-extrabold uppercase tracking-wider">Exam Access Session</span>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Details */}
            <div>
              <h3 className="text-xl font-extrabold text-gray-900">{selectedExam.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                Share this Access Join Code with your students to let them start the examination.
              </p>
            </div>

            {/* Access Code Display */}
            <div className="bg-slate-50 border-2 border-dashed border-[#0B7A93]/30 p-6 rounded-2xl text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Student Access Join Code</span>
              <div className="text-4xl font-black text-[#0B7A93] tracking-widest font-mono">
                {selectedExam.accessCode}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCopyCode(selectedExam.accessCode)}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v9.25c0 .621-.504 1.125-1.125 1.125z" />
                  </svg>
                )}
                <span>{copied ? "Code Copied!" : "Copy Access Code"}</span>
              </button>

              <button
                onClick={() => {
                  const code = selectedExam.accessCode;
                  setSelectedExam(null);
                  router.push(`/teacher/monitor?code=${code}`);
                }}
                className="w-full py-3.5 px-4 bg-[#0B7A93] hover:bg-[#086277] text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-6-3v3m-6.9-12a3 3 0 013-3h11.8a3 3 0 013 3v6a3 3 0 01-3 3H6.1a3 3 0 01-3-3v-6z" />
                </svg>
                <span>Enter Live Monitoring Room</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}