// Normalizes AI exam JSON into the exact shapes your exam builder uses

export type AIQuestionType =
  | "mcq" | "multi_select" | "true_false" | "short_answer" | "long_answer"
  | "coding" | "fill_blank" | "matching" | "ordering";

export const AI_TYPES: AIQuestionType[] = [
  "mcq", "multi_select", "true_false", "short_answer", "long_answer",
  "coding", "fill_blank", "matching", "ordering",
];

let uid = 0;
function newId() { uid += 1; return `ai-q-${Date.now()}-${uid}`; }
function clampInt(v: any, min: number, max: number) {
  const n = parseInt(String(v), 10);
  return isNaN(n) ? min : Math.min(max, Math.max(min, n));
}
function extractMarkers(t: string): string[] {
  const out: string[] = [];
  const re = /\[\s*(\d+)\s*\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) if (!out.includes(m[1])) out.push(m[1]);
  return out.sort((a, b) => Number(a) - Number(b));
}

export function normalizeQuestion(raw: any, fallback: AIQuestionType): any | null {
  if (!raw || typeof raw !== "object") return null;
  const type: AIQuestionType = AI_TYPES.includes(raw.type) ? raw.type : fallback;
  const text = String(raw.text ?? raw.question ?? "").trim();
  if (!text) return null;

  const q: any = {
    id: newId(), type, text,
    marks: clampInt(raw.marks ?? raw.points ?? 5, 1, 100),
    autoGrade: raw.autoGrade !== false,
    mediaType: "none",
  };

  switch (type) {
    case "mcq": {
      const opts = (Array.isArray(raw.mcqOptions) ? raw.mcqOptions : Array.isArray(raw.options) ? raw.options : [])
        .map(String).filter((o: string) => o.trim()).slice(0, 8);
      if (opts.length < 2) return null;
      let correct = parseInt(String(raw.mcqCorrect ?? raw.correct ?? 0), 10);
      if (isNaN(correct) || correct < 0 || correct >= opts.length) correct = 0;
      q.mcqOptions = opts; q.mcqCorrect = correct;
      break;
    }
    case "multi_select": {
      const opts = (Array.isArray(raw.multiOptions) ? raw.multiOptions : Array.isArray(raw.options) ? raw.options : [])
        .map(String).filter((o: string) => o.trim()).slice(0, 8);
      if (opts.length < 2) return null;
      let flags: boolean[];
      if (Array.isArray(raw.multiCorrect) && raw.multiCorrect.length === opts.length) flags = raw.multiCorrect.map(Boolean);
        else if (Array.isArray(raw.correctIndexes)) flags = opts.map((_: string, i: number) => raw.correctIndexes.includes(i));
      else flags = opts.map((_: string, i: number) => i === 0);
      if (!flags.some(Boolean)) flags[0] = true;
      q.multiOptions = opts; q.multiCorrect = flags;
      break;
    }
    case "true_false":
      q.tfCorrect = String(raw.tfCorrect ?? raw.correct ?? "true").toLowerCase() !== "false";
      break;
    case "fill_blank": {
      const blanksText = String(raw.blanksText ?? raw.template ?? "").trim();
      const nums = extractMarkers(blanksText);
      if (!blanksText || nums.length === 0) return null;
      const keyIn = Array.isArray(raw.answerKey) ? raw.answerKey : [];
      q.blanksText = blanksText;
      q.answerKey = nums.map((n) => {
        const found = keyIn.find((k: any) => String(k?.number) === n);
        return { number: n, answer: String(found?.answer ?? "").trim() };
      });
      q.blankChoices = Array.isArray(raw.blankChoices) ? raw.blankChoices.map(String).filter((c: string) => c.trim()) : [];
      break;
    }
    case "matching": {
      const left = (Array.isArray(raw.matchLeft) ? raw.matchLeft : []).map(String).filter((s: string) => s.trim());
      const right = (Array.isArray(raw.matchRight) ? raw.matchRight : []).map(String).filter((s: string) => s.trim());
      if (left.length < 2 || right.length < 2) return null;
            const letters = right.map((_: string, i: number) => String.fromCharCode(65 + i));
      let pairs = (Array.isArray(raw.matchAnswers) ? raw.matchAnswers : [])
        .map((p: any) => ({ left: String(p?.left ?? ""), right: String(p?.right ?? "").toUpperCase() }))
        .filter((p: any) => /^\d+$/.test(p.left) && Number(p.left) >= 1 && Number(p.left) <= left.length && letters.includes(p.right));
            if (pairs.length !== left.length) pairs = left.map((_: string, i: number) => ({ left: String(i + 1), right: String.fromCharCode(65 + i) }));
      q.matchLeft = left; q.matchRight = right; q.matchAnswers = pairs;
      break;
    }
    case "ordering": {
      const items = (Array.isArray(raw.orderingItems) ? raw.orderingItems : Array.isArray(raw.items) ? raw.items : [])
        .map(String).filter((s: string) => s.trim());
      if (items.length < 2) return null;
      q.orderingItems = items;
      break;
    }
    default: break;
  }
  return q;
}

export interface ExamDraft {
  title: string;
  department: string;
  subject: string;
  sections: any[];
}

export function normalizeExamDraft(parsed: any): ExamDraft | null {
  const sectionsIn = Array.isArray(parsed?.sections) ? parsed.sections : [];
  const sections = sectionsIn
    .map((s: any, si: number) => {
      const t: AIQuestionType = AI_TYPES.includes(s?.type) ? s.type : "mcq";
      const qs = (Array.isArray(s?.questions) ? s.questions : [])
        .map((r: any) => normalizeQuestion(r, t))
        .filter(Boolean);
      return {
        id: `ai-sec-${Date.now()}-${si}`,
        title: String(s?.title ?? `Section ${String.fromCharCode(65 + si)}`),
        description: `AI generated — format restricted to ${t}.`,
        allowedType: t,
        marks: qs.reduce((a: number, q: any) => a + q.marks, 0) || 10,
        questions: qs,
      };
    })
    .filter((s: any) => s.questions.length > 0);

  if (!sections.length) return null;
  return {
    title: String(parsed?.title ?? "AI Generated Exam").slice(0, 120),
    department: String(parsed?.department ?? ""),
    subject: String(parsed?.subject ?? ""),
    sections,
  };
}