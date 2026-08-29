import { NextRequest } from "next/server";
import { db } from "@/db";
import { aiChats, aiMessages, teachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";
import { streamChat } from "@/lib/ai/adapter";
import { checkQuota, incrementQuota } from "@/lib/ai/quota";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { chatId, message, history, attachments = [], projectId = null } = await req.json();

  const [teacher] = await db
    .select({ orgId: teachers.orgId })
    .from(teachers)
    .where(eq(teachers.id, session.userId));
  if (!teacher) {
    return new Response("Teacher not found", { status: 404 });
  }
  const orgId = teacher.orgId;

  const quota = await checkQuota(session.userId, orgId);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: `Daily limit reached (${quota.used}/${quota.limit}). Resets tomorrow.` }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let currentChatId = chatId;
  if (!currentChatId) {
    const [newChat] = await db
      .insert(aiChats)
      .values({
        orgId,
        teacherId: session.userId,
        title: "New chat",
        projectId,
      })
      .returning();
    currentChatId = newChat.id;
  }

  const [userMsg] = await db
    .insert(aiMessages)
    .values({
      chatId: currentChatId,
      role: "user",
      content: message,
      attachments: attachments.length ? attachments : null,
    })
    .returning();
  // ✅ bump the chat so it jumps to the top of the sidebar instantly
  await db
    .update(aiChats)
    .set({ updatedAt: new Date() })
    .where(eq(aiChats.id, currentChatId));
  const systemPrompt = [
    "You are ESAME AI, a helpful assistant for teachers in Cambodia. You can:",
    "- Answer questions in English or Khmer (auto-detect which language the user is using)",
    "- Help generate exam questions",
    "- Analyze uploaded files and images (image content and file text are included in the user message)",
    "- Provide educational content",
    "",
    "FORMATTING RULES (always): structure answers with short paragraphs separated by blank lines, ## headings, bullet lists and numbered steps. Only use a markdown table when the user explicitly asks for one, and then write it with NO blank lines between rows. NEVER dump question lists or raw JSON in the text — the structured exam appears automatically in a beautiful exam card, so in text just give a short modern summary (sections, counts, topics). When providing code, ALWAYS use fenced code blocks with the language tag (cpp, js, python, java, bash).",
    "",
    "WHEN MAKING TABLES: ALWAYS use valid GitHub-flavored markdown table syntax with a header row, separator row (|---|---|), and body rows. Example:",
    "| Name | Score | Status |",
    "|---|---|---|",
    "| Dara | 90 | Pass |",
    "| Sokha | 82 | Pass |",
    "",
    "EXAM GENERATION RULE: if the user asks to generate an exam but does NOT state department AND subject, first ask them to provide both (from their organization's departments/subjects) and wait. Only output the exam + [[EXAM_JSON]] block once both are known.",
    "",
    "WHEN THE USER ASKS TO CREATE/GENERATE AN EXAM, QUIZ OR EXAM PAPER: after your explanation, output exactly ONE block starting with [[EXAM_JSON]] and ending with [[/EXAM_JSON]] containing valid JSON:",
    '{"title":"...","department":"...","subject":"...","sections":[{"title":"Section A: Multiple Choice","type":"mcq","questions":[{...question objects using the shapes above...}]}]}',
    "Use 2-4 sections and 8-15 questions total. No markdown inside the block.",
  ].join("\n");

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
    { role: "user" as const, content: message, attachments },
  ];

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamChat(messages, {
          onToken: (text) => {
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", text })}\n\n`));
          },
          onEnd: async (metadata) => {
            await db.insert(aiMessages).values({
              chatId: currentChatId,
              role: "assistant",
              content: fullResponse,
              provider: metadata.provider,
              model: metadata.model,
              tokensUsed: metadata.tokens,
            });

            await incrementQuota(session.userId, orgId, metadata.tokens);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  chatId: currentChatId,
                  messageId: userMsg.id,
                  metadata,
                })}\n\n`
              )
            );
            controller.close();
          },
          onError: (error) => {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
              )
            );
            controller.close();
          },
        });
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}