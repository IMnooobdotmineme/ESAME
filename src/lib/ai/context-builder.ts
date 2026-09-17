import { db } from "@/db";
import { aiMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { streamChat } from "@/lib/ai/adapter";

const RECENT_TURNS_FULL = 8;

export async function buildSmartHistory(chatId: string) {
  const rows = await db
    .select({ role: aiMessages.role, content: aiMessages.content, createdAt: aiMessages.createdAt })
    .from(aiMessages)
    .where(eq(aiMessages.chatId, chatId))
    .orderBy(aiMessages.createdAt);

  if (rows.length <= RECENT_TURNS_FULL) {
    return rows.map((r: any) => ({ role: r.role as "user" | "assistant", content: String(r.content).slice(0, 3000) }));
  }

  const older = rows.slice(0, rows.length - RECENT_TURNS_FULL);
  const recent = rows.slice(rows.length - RECENT_TURNS_FULL);

  const olderText = older
    .map((r: any) => `${r.role === "user" ? "Teacher" : "AI"}: ${String(r.content).slice(0, 500)}`)
    .join("\n");

  let summary = "";
  try {
    await streamChat(
      [{ role: "user" as const, content: `Summarize this conversation history in 5-8 bullet points, keeping names, numbers, department/subject names, and decisions made. Be concise.\n\n${olderText}` }],
      { onToken: (t: any) => { summary += t; }, onEnd: async () => {}, onError: () => {} }
    );
  } catch {
    summary = olderText.slice(0, 1000); // fallback: raw truncated text
  }

  return [
    { role: "user" as const, content: `[Earlier conversation summary]\n${summary}` },
    ...recent.map((r: any) => ({ role: r.role as "user" | "assistant", content: String(r.content).slice(0, 3000) })),
  ];
}