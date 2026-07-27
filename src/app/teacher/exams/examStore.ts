export interface Question {
  id: string;
  type: 'mcq' | 'essay' | 'coding' | 'true_false' | 'short_answer';
  questionText: string;
  points: number;
  isMandatory: boolean;
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  courseCode: string;
  accessCode: string;
  durationMinutes: number;
  status: 'active' | 'scheduled' | 'completed';
  activeStreams: string;
  questions: Question[];
  createdAt: string;
}

const STORAGE_KEY = 'esame_teacher_exams_v1';

const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'Introduction to Computer Science (Midterm)',
    courseCode: 'CS101',
    accessCode: 'X8K29P',
    durationMinutes: 60,
    status: 'active',
    activeStreams: '45/50 Active',
    createdAt: new Date().toISOString(),
    questions: [
      { id: 'q1', type: 'mcq', questionText: 'What is the time complexity of binary search?', points: 5, isMandatory: true, explanation: 'Binary search halves search space.' },
      { id: 'q2', type: 'essay', questionText: 'Explain the difference between process and thread.', points: 10, isMandatory: true, explanation: '' }
    ]
  },
  {
    id: 'exam-2',
    title: 'Data Structures & Algorithms Quiz 3',
    courseCode: 'CS204',
    accessCode: '7M4R9L',
    durationMinutes: 45,
    status: 'active',
    activeStreams: '22/25 Active',
    createdAt: new Date().toISOString(),
    questions: [
      { id: 'q3', type: 'coding', questionText: 'Implement a Stack using two Queues.', points: 15, isMandatory: true, explanation: '' }
    ]
  }
];

export const getStoredExams = (): Exam[] => {
  if (typeof window === 'undefined') return DEFAULT_EXAMS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXAMS));
    return DEFAULT_EXAMS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_EXAMS;
  }
};

export const getExamById = (id: string): Exam | undefined => {
  const exams = getStoredExams();
  return exams.find(e => e.id === id);
};

export const saveExam = (newExam: Exam): void => {
  const exams = getStoredExams();
  const updated = [newExam, ...exams];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const updateExam = (updatedExam: Exam): void => {
  const exams = getStoredExams();
  const index = exams.findIndex(e => e.id === updatedExam.id);
  if (index !== -1) {
    exams[index] = updatedExam;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  }
};

export const deleteExam = (examId: string): void => {
  const exams = getStoredExams();
  const updated = exams.filter(e => e.id !== examId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const generate6DigitCode = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};