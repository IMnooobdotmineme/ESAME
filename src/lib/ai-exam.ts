// Normalizes AI exam JSON into the exact shapes your exam builder uses

export type AIQuestionType =
  | "mcq" | "multi_select" | "true_false" | "short_answer" | "long_answer"
  | "coding" | "fill_blank" | "matching" | "ordering";

// ✅ Accept DB/other aliases so sections NEVER get dropped
const TYPE_ALIAS: Record<string, AIQuestionType> = {
  mcq: "mcq",
  multiple_choice: "mcq",
  multi_select: "multi_select",
  multiple_select: "multi_select",
  true_false: "true_false",
  short_answer: "short_answer",
  long_answer: "long_answer",
  essay: "long_answer",
  coding: "coding",
  fill_blank: "fill_blank",
  fill_in_blank: "fill_blank",
  matching: "matching",
  ordering: "ordering",
};

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
    const type: AIQuestionType = TYPE_ALIAS[String(raw?.type)] ?? fallback;
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
      let blanksText = String(raw.blanksText ?? raw.template ?? text ?? "").trim();
      const payload = raw.payload || {};
      const keyIn = Array.isArray(raw.answerKey) ? raw.answerKey : Array.isArray(payload.answerKey) ? payload.answerKey : [];
      
      // ✅ Auto-fix: if no [1] markers, add them
      if (!blanksText || !extractMarkers(blanksText).length) {
        const answers = (Array.isArray(keyIn) ? keyIn : []).map((a: any) => 
          typeof a === "string" ? a : a?.answer || a?.text || ""
        ).filter(Boolean);
        if (answers.length > 0 || /_{2,}/.test(blanksText)) {
          let idx = 0;
          blanksText = blanksText.replace(/_{2,}/g, () => `[${++idx}]`);
          if (!extractMarkers(blanksText).length) {
            blanksText = `${blanksText} [1]`;
          }
        } else {
          // Fallback: add a single blank at the end
          blanksText = `${blanksText} [1]`;
        }
      }
      
      const nums = extractMarkers(blanksText);
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
function preprocessQuestion(q: any): any {
  const text = q.text || q.question || q.questionText || "";
  const opts = Array.isArray(q.options) ? q.options : [];
  const payload = q.payload || {};

  if (opts.length > 0) {
    const optionTexts = opts.map((o: any) => o.optionText || o.text || String(o)).filter(Boolean);
    const correctIndexes = opts
      .map((o: any, i: number) => (o.isCorrect === true ? i : -1))
      .filter((i: number) => i >= 0);

    return {
      ...q,
      text,
      mcqOptions: optionTexts,
      mcqCorrect: correctIndexes[0] ?? 0,
      multiOptions: optionTexts,
      multiCorrect: opts.map((o: any) => o.isCorrect === true),
      tfCorrect: correctIndexes[0] === 0,
    };
  }

  // ✅ MATCHING — payload lives on the question
  const pairs = payload.pairs || payload.matches || [];
  if (pairs.length > 0) {
    const normalized = pairs
      .map((p: any) => ({
        term: String(p?.term || p?.left || p?.a || p?.key || "").trim(),
        definition: String(p?.definition || p?.right || p?.b || p?.value || "").trim(),
      }))
      .filter((p: any) => p.term && p.definition);
    if (normalized.length >= 2) {
      return {
        ...q,
        text,
        matchLeft: normalized.map((p: any) => p.term),
        matchRight: normalized.map((p: any) => p.definition),
        matchAnswers: normalized.map((_: any, i: number) => ({
          left: String(i + 1),
          right: String.fromCharCode(65 + i),
        })),
      };
    }
  }

  // ✅ ORDERING — payload lives on the question
  const items = payload.items || payload.order || payload.sequence || [];
  if (items.length >= 2) {
    return { ...q, text, orderingItems: items.map(String).filter(Boolean) };
  }

  // ✅ FILL BLANK — convert "____" into [1] markers the normalizer requires
  const answers = payload.answerKey || payload.answers || payload.blanks || [];
  const answerStrings = (Array.isArray(answers) ? answers : [])
    .map((a: any) => (typeof a === "string" ? a : a?.answer || a?.text || ""))
    .filter(Boolean);

  if (answerStrings.length > 0 || /_{2,}/.test(text)) {
    let idx = 0;
    let template = text.replace(/_{2,}/g, () => `[${++idx}]`);
    let markers = (template.match(/\[\d+\]/g) || []).length;
    if (markers === 0) {
      template = `${template} [1]`;
      markers = 1;
    }
    return {
      ...q,
      text: template,
      blanksText: template,
      answerKey: Array.from({ length: markers }, (_, i) => ({
        number: String(i + 1),
        answer: answerStrings[i] || "",
      })),
    };
  }

  return { ...q, text };
}

function preprocessMatching(s: any): any {
  const payload = s.payload || {};
  const pairs = payload.pairs || payload.matches || payload.items || [];
  
  if (pairs.length > 0) {
    // Handle various formats: [{term, definition}], [{left, right}], [{a, b}]
    const normalized = pairs.map((p: any) => {
      const term = p.term || p.left || p.a || p.key || String(p[0] || "");
      const def = p.definition || p.right || p.b || p.value || String(p[1] || "");
      return { term, definition: def };
    });
    
    return {
      ...s,
      matchLeft: normalized.map((p: any) => p.term).filter(Boolean),
      matchRight: normalized.map((p: any) => p.definition).filter(Boolean),
      matchAnswers: normalized.map((p: any, i: number) => ({
        left: String(i + 1),
        right: String.fromCharCode(65 + i),
      })),
    };
  }
  return s;
}
function preprocessOrdering(s: any): any {
  const payload = s.payload || {};
  const items = payload.items || payload.order || payload.sequence || payload.elements || [];
  
  if (items.length > 0) {
    return { ...s, orderingItems: items.map(String).filter(Boolean) };
  }
  return s;
}
export function normalizeExamDraft(parsed: any): ExamDraft | null {
  const sectionsIn = Array.isArray(parsed?.sections) ? parsed.sections : [];
  const sections = sectionsIn
    .map((s: any, si: number) => {
      // Preprocess section-level data for matching/ordering
      const processedSection = s.type === "matching" ? preprocessMatching(s) : s.type === "ordering" ? preprocessOrdering(s) : s;
            const t: AIQuestionType = TYPE_ALIAS[String(s?.type)] ?? "mcq";
            const qs = (Array.isArray(processedSection?.questions) ? processedSection.questions : [])
        .map((r: any) => normalizeQuestion(preprocessQuestion(r), t))
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