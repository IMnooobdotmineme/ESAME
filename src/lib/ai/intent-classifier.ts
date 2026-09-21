import { streamChat } from "@/lib/ai/adapter";

export type Intent = {
  intent: "exam_generate" | "grading" | "document_qa" | "general";
  examCode?: string;
};

export async function classifyIntent(message: string, hasAttachment: boolean): Promise<Intent> {
  const prompt = [
    "Classify the teacher's message into exactly one category. Return ONLY JSON, no markdown.",
    hasAttachment ? "Note: the teacher attached a document with this message." : "",
    "Categories:",
    '- "exam_generate": wants a new exam/quiz/test paper created',
    '- "grading": wants student answers graded, usually mentions a room/exam code',
    '- "document_qa": wants something done WITH an attached document (summarize, rewrite, explain, translate, extract) — NOT create an exam',
    '- "general": anything else (questions, chat, explanations)',
    "",
    `Message: "${message.slice(0, 500)}"`,
    'Return exactly: {"intent":"...","examCode":"ABC123 or null"}',
  ].filter(Boolean).join("\n");

  let raw = "";
  try {
    await streamChat([{ role: "user" as const, content: prompt }], {
      onToken: (t) => { raw += t; },
      onEnd: async () => {},
      onError: () => {},
    });
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : raw);
    return { intent: parsed.intent || "general", examCode: parsed.examCode && parsed.examCode !== "null" ? parsed.examCode : undefined };
  } catch {
    return { intent: "general" }; // safe fallback — never blocks the request
  }
}