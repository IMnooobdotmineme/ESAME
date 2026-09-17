import { db } from "@/db";
import { aiMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

// Pulls every text attachment ever uploaded in this chat (not just this turn)
// and returns a compact reference block the AI can use for follow-up questions
// like "what did that document say about X" — even messages later.
export async function getChatDocumentContext(chatId: string, excludeMessageId?: string): Promise<string> {
  const rows = await db
    .select({ id: aiMessages.id, attachments: aiMessages.attachments, createdAt: aiMessages.createdAt })
    .from(aiMessages)
    .where(eq(aiMessages.chatId, chatId));

  const seen = new Map<string, string>(); // filename -> latest text (dedupe re-uploads)
  for (const row of rows) {
    if (row.id === excludeMessageId) continue;
    const atts = (row.attachments as any[]) || [];
    for (const a of atts) {
      if (a?.text && a?.name) seen.set(a.name, String(a.text).slice(0, 6000));
    }
  }

  if (seen.size === 0) return "";

  const blocks = Array.from(seen.entries()).map(
    ([name, text]) => `### Document: ${name}\n${text}`
  );
  return `PREVIOUSLY UPLOADED DOCUMENTS IN THIS CONVERSATION:\n\n${blocks.join("\n\n")}`.slice(0, 20000);
}