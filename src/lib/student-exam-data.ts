// src/lib/student-exam-data.ts

export interface StudentExamSession {
  examTitle: string;
  durationMinutes: number;
  sectionsCount: number;
  questionTypesCount: number;
  attempts: number;
  // DEV NOTE: in the real backend this will come from the server (teacher's
  // scheduled start time for the room). Defaulting to a few seconds from now
  // so the countdown can be tested quickly — replace with real target time
  // once the backend exists.
  startAt: string; // ISO timestamp
}

export function getMockExamSession(): StudentExamSession {
  const startAt = new Date(Date.now() + 15 * 1000).toISOString(); // 15s from now, for dev testing

  return {
    examTitle: "Midterm Assessment",
    durationMinutes: 45,
    sectionsCount: 3,
    questionTypesCount: 4,
    attempts: 1,
    startAt,
  };
}