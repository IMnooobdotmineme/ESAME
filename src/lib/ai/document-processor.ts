import { streamChat } from "@/lib/ai/adapter";

const CHUNK_SIZE = 4000;
const SUMMARIZE_THRESHOLD = 14000; // below this, just return as-is

export async function processLargeDocument(text: string): Promise<{ text: string; wasSummarized: boolean }> {
  if (text.length <= SUMMARIZE_THRESHOLD) return { text, wasSummarized: false };

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) chunks.push(text.slice(i, i + CHUNK_SIZE));

  const chunkSummaries: string[] = [];
  for (const chunk of chunks) {
    let out = "";
    try {
      await streamChat(
        [{ role: "user" as const, content: `Summarize this document excerpt, preserving all specific facts, numbers, names, and key terms:\n\n${chunk}` }],
        { onToken: (t) => { out += t; }, onEnd: async () => {}, onError: () => {} }
      );
    } catch {
      out = chunk.slice(0, 400); // fallback: raw excerpt
    }
    chunkSummaries.push(out);
  }

  const combined = chunkSummaries.join("\n\n");
  return { text: combined.slice(0, 20000), wasSummarized: true };
}