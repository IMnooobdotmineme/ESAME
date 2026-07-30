export type ExamStatus = "Scheduled" | "In Progress" | "Completed" | "Locked";
export type ReviewStatus = "Reviewed" | "Needs Review";

export interface ExamQuestion {
  id: string;
  text: string;
  type: "MCQ" | "Multiple Select" | "True/False" | "Short Answer" | "Essay" | "Coding" | "Fill in the Blank";
  points: number;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  autoPoints: number;
  manualPoints: number;
  maxPoints: number;
  status: ReviewStatus;
}

export interface ExamRecord {
  id: string;
  examCode: string;
  title: string;
  department: string;
  subject: string;
  teacher: string;
  academicYear: string;
  semester: string;
  date: string;
  time: string;
  duration: string;
  status: ExamStatus;
  totalQuestions: number;
  totalStudents: number;
  questions: ExamQuestion[];
  results: StudentResult[];
}

const NAMES = [
  "Sok Pisey", "Chan Bopha", "Ly Sokha", "Ros Kimheng", "Heng Chanthou",
  "Pich Vuthy", "Sam Ratha", "Kem Sreynich", "Yem Vibol", "Meas Sokunthea",
  "Nou Sophal", "Chea Dalin", "Tep Vannak", "Ung Chanreaksmey", "Ky Sotheara",
];

function makeResults(count: number, maxPoints: number): StudentResult[] {
  return Array.from({ length: count }, (_, i) => {
    const auto = Math.round(maxPoints * 0.5 * (0.5 + Math.random() * 0.5));
    const manual = Math.round(maxPoints * 0.5 * (0.4 + Math.random() * 0.6));
    return {
      studentId: `STU-${(1000 + i).toString()}`,
      studentName: NAMES[i % NAMES.length],
      autoPoints: auto,
      manualPoints: manual,
      maxPoints,
      status: Math.random() > 0.35 ? "Reviewed" : "Needs Review",
    };
  });
}

const SAMPLE_QUESTIONS: ExamQuestion[] = [
  { id: "q1", text: "Define a binary search tree and state its key properties.", type: "Short Answer", points: 5 },
  { id: "q2", text: "Which of the following data structures uses LIFO order?", type: "MCQ", points: 2 },
  { id: "q3", text: "A hash table can have collisions.", type: "True/False", points: 1 },
  { id: "q4", text: "Implement a function to reverse a singly linked list.", type: "Coding", points: 10 },
  { id: "q5", text: "Select all valid time complexities for binary search.", type: "Multiple Select", points: 3 },
  { id: "q6", text: "Explain the trade-offs between arrays and linked lists.", type: "Essay", points: 8 },
];

export const EXAMS: ExamRecord[] = [
  {
    id: "1", examCode: "EXAM-2026-001", title: "Data Structures Midterm",
    department: "Computer Science", subject: "Data Structures", teacher: "Sok Dara",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 14, 2026", time: "09:00 AM - 11:00 AM", duration: "2h 00m",
    status: "In Progress", totalQuestions: 6, totalStudents: 42,
    questions: SAMPLE_QUESTIONS, results: makeResults(42, 29),
  },
  {
    id: "2", examCode: "EXAM-2026-002", title: "IoT Sensor Fundamentals Quiz",
    department: "Internet of Things", subject: "Sensor Technology", teacher: "Chan Sopheak",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 12, 2026", time: "01:00 PM - 02:30 PM", duration: "1h 30m",
    status: "Completed", totalQuestions: 5, totalStudents: 38,
    questions: SAMPLE_QUESTIONS.slice(0, 5), results: makeResults(38, 24),
  },
  {
    id: "3", examCode: "EXAM-2026-003", title: "Database Systems Final",
    department: "Computer Science", subject: "Database Systems", teacher: "Ly Vannak",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 25, 2026", time: "09:00 AM - 12:00 PM", duration: "3h 00m",
    status: "Scheduled", totalQuestions: 8, totalStudents: 51,
    questions: SAMPLE_QUESTIONS, results: [],
  },
  {
    id: "4", examCode: "EXAM-2026-004", title: "Networking Basics Test",
    department: "Information Technology", subject: "Networking Basics", teacher: "Ros Chenda",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 10, 2026", time: "10:00 AM - 11:30 AM", duration: "1h 30m",
    status: "Completed", totalQuestions: 6, totalStudents: 51,
    questions: SAMPLE_QUESTIONS, results: makeResults(51, 29),
  },
  {
    id: "5", examCode: "EXAM-2026-005", title: "Software Engineering Essay",
    department: "Software Engineering", subject: "Software Engineering", teacher: "Sok Dara",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 13, 2026", time: "02:00 PM - 04:00 PM", duration: "2h 00m",
    status: "Locked", totalQuestions: 4, totalStudents: 12,
    questions: SAMPLE_QUESTIONS.slice(2, 6), results: makeResults(12, 25),
  },
  {
    id: "6", examCode: "EXAM-2026-006", title: "Cloud Computing Basics",
    department: "Computer Science", subject: "Cloud Computing", teacher: "Heng Sreymom",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 28, 2026", time: "09:00 AM - 10:30 AM", duration: "1h 30m",
    status: "Scheduled", totalQuestions: 5, totalStudents: 33,
    questions: SAMPLE_QUESTIONS.slice(0, 5), results: [],
  },
  {
    id: "7", examCode: "EXAM-2026-007", title: "Algorithms Weekly Quiz",
    department: "Computer Science", subject: "Data Structures", teacher: "Sok Dara",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 8, 2026", time: "08:00 AM - 08:45 AM", duration: "45m",
    status: "Completed", totalQuestions: 4, totalStudents: 40,
    questions: SAMPLE_QUESTIONS.slice(0, 4), results: makeResults(40, 16),
  },
  {
    id: "8", examCode: "EXAM-2026-008", title: "IoT Final Project Defense",
    department: "Internet of Things", subject: "Sensor Technology", teacher: "Chan Sopheak",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Aug 2, 2026", time: "09:00 AM - 05:00 PM", duration: "8h 00m",
    status: "Scheduled", totalQuestions: 3, totalStudents: 19,
    questions: SAMPLE_QUESTIONS.slice(3, 6), results: [],
  },
  {
    id: "9", examCode: "EXAM-2026-009", title: "IT Support Fundamentals",
    department: "Information Technology", subject: "Networking Basics", teacher: "Ros Chenda",
    academicYear: "2025-2026", semester: "Semester 1",
    date: "Jun 20, 2026", time: "10:00 AM - 11:00 AM", duration: "1h 00m",
    status: "Completed", totalQuestions: 5, totalStudents: 45,
    questions: SAMPLE_QUESTIONS.slice(0, 5), results: makeResults(45, 22),
  },
  {
    id: "10", examCode: "EXAM-2026-010", title: "Software Design Patterns",
    department: "Software Engineering", subject: "Software Engineering", teacher: "Sok Dara",
    academicYear: "2025-2026", semester: "Semester 2",
    date: "Jul 30, 2026", time: "01:00 PM - 03:00 PM", duration: "2h 00m",
    status: "Scheduled", totalQuestions: 6, totalStudents: 28,
    questions: SAMPLE_QUESTIONS, results: [],
  },
];

export function getExamById(id: string): ExamRecord | undefined {
  return EXAMS.find((e) => e.id === id);

}

