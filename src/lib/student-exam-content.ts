// src/lib/student-exam-content.ts
//
// Mirrors the question types teachers can build in the exam builder
// (app/teacher/exams/new/page.tsx). Each section here holds exactly one
// question type — matching how a teacher's "part" has a single allowedType.

export type QuestionType =
  | "mcq"
  | "multi_select"
  | "true_false"
  | "short_answer"
  | "long_answer"
  | "coding"
  | "fill_blank"
  | "matching"
  | "ordering";

interface QuestionBase {
  id: string;
  type: QuestionType;
  prompt: string;
}

export interface McqQuestion extends QuestionBase {
  type: "mcq";
  options: { id: string; label: string; text: string }[];
  correctOptionId: string;
}

export interface MultiSelectQuestion extends QuestionBase {
  type: "multi_select";
  options: { id: string; label: string; text: string }[];
  correctOptionIds: string[];
}

export interface TrueFalseQuestion extends QuestionBase {
  type: "true_false";
  correctValue: "true" | "false";
}

export interface ShortAnswerQuestion extends QuestionBase {
  type: "short_answer";
}

export interface LongAnswerQuestion extends QuestionBase {
  type: "long_answer";
  marks: number;
}

export interface CodingQuestion extends QuestionBase {
  type: "coding";
  marks: number;
  language?: string;
}

export interface FillBlankQuestion extends QuestionBase {
  type: "fill_blank";
  correctAnswer: string;
}

export interface MatchingQuestion extends QuestionBase {
  type: "matching";
  left: { id: string; text: string }[];
  right: { id: string; text: string }[];
  correctPairs: Record<string, string>; // leftId -> rightId
}

export interface OrderingQuestion extends QuestionBase {
  type: "ordering";
  items: { id: string; text: string }[];
  correctOrder: string[]; // item ids in correct order
}

export type ExamQuestion =
  | McqQuestion
  | MultiSelectQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | LongAnswerQuestion
  | CodingQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | OrderingQuestion;

// Types that require a teacher to review, rather than being auto-graded.
const MANUAL_GRADE_TYPES: QuestionType[] = ["short_answer", "long_answer", "coding"];

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

function buildPage(id: string, questions: ExamQuestion[]): ExamPage {
  return { id, questions };
}

export function getMockExamContent(): MockExamContent {
  const sections: ExamSection[] = [
    {
      id: "section-mcq",
      title: "Multiple Choice",
      pages: [
        buildPage("s-mcq-p1", [
          {
            id: "q-mcq-1",
            type: "mcq",
            prompt: "Which planet is known as the Red Planet?",
            options: [
              { id: "a", label: "A", text: "Mars" },
              { id: "b", label: "B", text: "Venus" },
              { id: "c", label: "C", text: "Jupiter" },
            ],
            correctOptionId: "a",
          },
          {
            id: "q-mcq-2",
            type: "mcq",
            prompt: "What is the value of 12 × 8?",
            options: [
              { id: "a", label: "A", text: "96" },
              { id: "b", label: "B", text: "88" },
              { id: "c", label: "C", text: "104" },
            ],
            correctOptionId: "a",
          },
        ]),
      ],
    },
    {
      id: "section-multi-select",
      title: "Multiple Select",
      pages: [
        buildPage("s-multi-p1", [
          {
            id: "q-multi-1",
            type: "multi_select",
            prompt: "Which of the following are prime numbers? Select all that apply.",
            options: [
              { id: "a", label: "A", text: "2" },
              { id: "b", label: "B", text: "4" },
              { id: "c", label: "C", text: "7" },
              { id: "d", label: "D", text: "9" },
            ],
            correctOptionIds: ["a", "c"],
          },
        ]),
      ],
    },
    {
      id: "section-tf",
      title: "True / False",
      pages: [
        buildPage("s-tf-p1", [
          {
            id: "q-tf-1",
            type: "true_false",
            prompt: "The Great Wall of China is visible from space with the naked eye.",
            correctValue: "false",
          },
          {
            id: "q-tf-2",
            type: "true_false",
            prompt: "A right angle measures exactly 90 degrees.",
            correctValue: "true",
          },
        ]),
      ],
    },
    {
      id: "section-fill-blank",
      title: "Fill in the Blank",
      pages: [
        buildPage("s-fill-p1", [
          {
            id: "q-fill-1",
            type: "fill_blank",
            prompt: "The capital of France is ______.",
            correctAnswer: "Paris",
          },
        ]),
      ],
    },
    {
      id: "section-matching",
      title: "Matching Pairs",
      pages: [
        buildPage("s-match-p1", [
          {
            id: "q-match-1",
            type: "matching",
            prompt: "Match each country to its capital city.",
            left: [
              { id: "l1", text: "Japan" },
              { id: "l2", text: "Cambodia" },
              { id: "l3", text: "Italy" },
            ],
            right: [
              { id: "r1", text: "Phnom Penh" },
              { id: "r2", text: "Tokyo" },
              { id: "r3", text: "Rome" },
            ],
            correctPairs: { l1: "r2", l2: "r1", l3: "r3" },
          },
        ]),
      ],
    },
    {
      id: "section-ordering",
      title: "Sequence / Ordering",
      pages: [
        buildPage("s-order-p1", [
          {
            id: "q-order-1",
            type: "ordering",
            prompt: "Arrange the steps of the water cycle in the correct order.",
            items: [
              { id: "i1", text: "Precipitation" },
              { id: "i2", text: "Evaporation" },
              { id: "i3", text: "Condensation" },
            ],
            correctOrder: ["i2", "i3", "i1"],
          },
        ]),
      ],
    },
    {
      id: "section-short-answer",
      title: "Short Answer",
      pages: [
        buildPage("s-short-p1", [
          {
            id: "q-short-1",
            type: "short_answer",
            prompt: "In one sentence, define photosynthesis.",
          },
        ]),
      ],
    },
    {
      id: "section-coding",
      title: "Coding Challenge",
      pages: [
        buildPage("s-code-p1", [
          {
            id: "q-code-1",
            type: "coding",
            prompt: "Write a function that returns the reverse of a given string.",
            marks: 15,
            language: "JavaScript",
          },
        ]),
      ],
    },
    {
      id: "section-long-answer",
      title: "Long Answer",
      pages: [
        buildPage("s-long-p1", [
          {
            id: "q-long-1",
            type: "long_answer",
            prompt: "Describe a challenge you faced recently and how you resolved it.",
            marks: 20,
          },
        ]),
      ],
    },
  ];

  return {
    title: "Midterm Assessment",
    sections,
  };
}

export function examHasManualGrading(exam: MockExamContent): boolean {
  return exam.sections.some((section) =>
    section.pages.some((page) =>
      page.questions.some((q) => MANUAL_GRADE_TYPES.includes(q.type))
    )
  );
}

// --- Mock answer key + scoring (swap for real backend grading later) ---

export interface ScoreResult {
  totalQuestions: number;
  autoGradedQuestions: number;
  correctCount: number;
  manualGradeCount: number;
  percentage: number; // out of auto-graded questions only
}

function isAnswerCorrect(question: ExamQuestion, given: string | undefined): boolean {
  if (given === undefined || given === "") return false;

  switch (question.type) {
    case "mcq":
      return given === question.correctOptionId;
    case "true_false":
      return given === question.correctValue;
    case "fill_blank":
      return given.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    case "multi_select": {
      const givenIds = given.split(",").filter(Boolean).sort();
      const correctIds = [...question.correctOptionIds].sort();
      return (
        givenIds.length === correctIds.length &&
        givenIds.every((id, i) => id === correctIds[i])
      );
    }
    case "matching": {
      try {
        const givenPairs = JSON.parse(given) as Record<string, string>;
        return Object.entries(question.correctPairs).every(
          ([leftId, rightId]) => givenPairs[leftId] === rightId
        );
      } catch {
        return false;
      }
    }
    case "ordering": {
      const givenOrder = given.split(",").filter(Boolean);
      return (
        givenOrder.length === question.correctOrder.length &&
        givenOrder.every((id, i) => id === question.correctOrder[i])
      );
    }
    default:
      return false;
  }
}

export function computeMockScore(
  exam: MockExamContent,
  answers: Record<string, string>
): ScoreResult {
  let totalQuestions = 0;
  let autoGradedQuestions = 0;
  let correctCount = 0;
  let manualGradeCount = 0;

  for (const section of exam.sections) {
    for (const page of section.pages) {
      for (const q of page.questions) {
        totalQuestions++;
        if (MANUAL_GRADE_TYPES.includes(q.type)) {
          manualGradeCount++;
          continue;
        }
        autoGradedQuestions++;
        if (isAnswerCorrect(q, answers[q.id])) correctCount++;
      }
    }
  }

  const percentage =
    autoGradedQuestions > 0
      ? Math.round((correctCount / autoGradedQuestions) * 100)
      : 0;

  return { totalQuestions, autoGradedQuestions, correctCount, manualGradeCount, percentage };
}
