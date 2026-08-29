import { NextRequest } from "next/server";
import { db } from "@/db";
import { aiChats, aiMessages, teachers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";
import { streamChat } from "@/lib/ai/adapter";
import { checkQuota, incrementQuota } from "@/lib/ai/quota";

export const maxDuration = 300; // 5 minutes for long responses

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

    const { chatId, message, history, attachments = [], projectId = null, think = false } = await req.json();

  const [teacher] = await db
    .select({ orgId: teachers.orgId })
    .from(teachers)
    .where(eq(teachers.id, session.userId));
  if (!teacher) {
    return new Response("Teacher not found", { status: 404 });
  }
  const orgId = teacher.orgId;

  // Check quota
  const quota = await checkQuota(session.userId, orgId);
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({ error: `Daily limit reached (${quota.used}/${quota.limit}). Resets tomorrow.` }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create or get chat
  let currentChatId = chatId;
  if (!currentChatId) {
    const [newChat] = await db
      .insert(aiChats)   // ✅ FIX 1: this was missing
      .values({
        orgId,
        teacherId: session.userId,
        title: "New chat",
        projectId,
      })
      .returning();
    currentChatId = newChat.id;
  }

  // Save user message
  const [userMsg] = await db
    .insert(aiMessages)
    .values({
      chatId: currentChatId,
      role: "user",
      content: message,
      attachments: attachments.length ? attachments : null, // ✅ FIX 2: save attachments
    })
    .returning();

     // Build message history for the AI
  const systemPrompt = [
    "You are ESAME AI, a helpful assistant for teachers in Cambodia. You can:",
    "- Answer questions in English or Khmer (auto-detect which language the user is using)",
    "- Help generate exam questions",
    "- Analyze uploaded files and images (image content and file text are included in the user message)",
    "- Provide educational content",
    "",
        "FORMATTING RULES (always): structure answers with short paragraphs separated by blank lines. Use ## headings, bullet lists, numbered steps and tables when helpful. NEVER write one long wall-of-text paragraph. When providing code, ALWAYS use fenced code blocks with the language tag (cpp, js, python, java).",
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

  // Stream response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamChat(messages, {
                    onThinking: (text) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thinking", text })}\n\n`));
          },
          onToken: (text) => {
            fullResponse += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", text })}\n\n`));
          },
          onEnd: async (metadata) => {
            // Save assistant message
            await db.insert(aiMessages).values({
              chatId: currentChatId,
              role: "assistant",
              content: fullResponse,
              provider: metadata.provider,
              model: metadata.model,
              tokensUsed: metadata.tokens,
            });

            // Increment quota
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
        }, { think });
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