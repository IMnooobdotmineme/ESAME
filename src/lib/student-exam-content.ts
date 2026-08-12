// src/lib/student-exam-content.ts

export type QuestionType = "multiple_choice" | "true_false" | "essay";

interface QuestionBase {
  id: string;
  type: QuestionType;
  prompt: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: { id: string; label: string; text: string }[];
}

export interface TrueFalseQuestion extends QuestionBase {
  type: "true_false";
}

export interface EssayQuestion extends QuestionBase {
  type: "essay";
  marks: number;
}

export type ExamQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | EssayQuestion;

export interface ExamPage {
  id: string;
  questions: ExamQuestion[];
}

export interface ExamSection {
  id: string;
  title: string;
  pages: ExamPage[];
}

export interface MockExamContent {
  title: string;
  sections: ExamSection[];
}

// Builds one page containing 1 MCQ + 1 True/False + 1 Essay,
// matching the Figma reference. Swap for real API data later —
// the shape (sections -> pages -> questions) stays the same.
function buildPage(pageNumber: number, sectionNumber: number): ExamPage {
  return {
    id: `s${sectionNumber}-p${pageNumber}`,
    questions: [
      {
        id: `s${sectionNumber}-p${pageNumber}-mcq`,
        type: "multiple_choice",
        prompt: "KIT the goat",
        options: [
          { id: "a", label: "A", text: "Yes" },
          { id: "b", label: "B", text: "Maybe" },
          { id: "c", label: "C", text: "A" },
        ],
      },
      {
        id: `s${sectionNumber}-p${pageNumber}-tf`,
        type: "true_false",
        prompt: "Earth is Flat",
      },
      {
        id: `s${sectionNumber}-p${pageNumber}-essay`,
        type: "essay",
        prompt: "Write About Me",
        marks: 20,
      },
    ],
  };
}

export function getMockExamContent(): MockExamContent {
  const sections: ExamSection[] = [1, 2, 3].map((sectionNumber) => ({
    id: `section-${sectionNumber}`,
    title: `Section ${sectionNumber}`,
    pages: [1, 2, 3].map((pageNumber) => buildPage(pageNumber, sectionNumber)),
  }));

  return {
    title: "Midterm Assessment",
    sections,
  };
}

export function examHasEssayQuestions(exam: MockExamContent): boolean {
  return exam.sections.some((section) =>
    section.pages.some((page) =>
      page.questions.some((q) => q.type === "essay")
    )
  );
}

// --- Mock answer key + scoring (swap for real backend grading later) ---

export interface ScoreResult {
  totalQuestions: number;
  autoGradedQuestions: number;
  correctCount: number;
  essayCount: number;
  percentage: number; // out of auto-graded questions only
}

// Deterministic mock "correct answer" for demo purposes:
// - multiple_choice correct answer is always option "a"
// - true_false correct answer is always "true"
// Replace with real answer keys once backend exists.
export function computeMockScore(
  exam: MockExamContent,
  answers: Record<string, string>
): ScoreResult {
  let totalQuestions = 0;
  let autoGradedQuestions = 0;
  let correctCount = 0;
  let essayCount = 0;

  for (const section of exam.sections) {
    for (const page of section.pages) {
      for (const q of page.questions) {
        totalQuestions++;
        if (q.type === "essay") {
          essayCount++;
          continue;
        }
        autoGradedQuestions++;
        const given = answers[q.id];
        const correctValue = q.type === "multiple_choice" ? "a" : "true";
        if (given === correctValue) correctCount++;
      }
    }
  }

  const percentage =
    autoGradedQuestions > 0
      ? Math.round((correctCount / autoGradedQuestions) * 100)
      : 0;

  return { totalQuestions, autoGradedQuestions, correctCount, essayCount, percentage };
}