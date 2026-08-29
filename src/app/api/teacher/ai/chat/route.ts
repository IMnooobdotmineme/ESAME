import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  aiChats, aiMessages, teachers,
  exams, examSections, examPages, examQuestions, examQuestionOptions,
  examStudents, studentExamAttempts, studentAnswers,
} from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";
import { streamChat } from "@/lib/ai/adapter";
import { checkQuota, incrementQuota } from "@/lib/ai/quota";

export const maxDuration = 300;

// ✅ AI grades ANY question type (MCQ, fill-blank, short, long, coding, matching, ordering)
async function aiGradeQuestion(params: {
  questionType: string;
  questionText: string;
  options?: any[];
  payload?: any;
  explanation?: string | null;
  maxPoints: number;
  studentAnswerText?: string | null;
  selectedOptionIds?: string[];
}) {
  const {
    questionType,
    questionText,
    options = [],
    payload = {},
    explanation,
    maxPoints,
    studentAnswerText,
    selectedOptionIds = [],
  } = params;

  const correctOptions = options
    .filter((o: any) => o.isCorrect)
    .map((o: any) => ({
      id: o.id,
      text: o.optionText,
      order: o.optionOrder,
    }));

  const selectedOptions = options
    .filter((o: any) => selectedOptionIds.includes(o.id))
    .map((o: any) => ({
      id: o.id,
      text: o.optionText,
      order: o.optionOrder,
    }));

  const gradingPrompt = [
    "You are an AI exam grader inside ESAME.",
    "Grade this ONE student answer without human help.",
    "",
    "Return ONLY valid JSON. No markdown. No explanation outside JSON.",
    "",
    `Question type: ${questionType}`,
    `Maximum points: ${maxPoints}`,
    "",
    `Question:`,
    questionText,
    "",
    explanation ? `Teacher explanation / rubric:\n${explanation}` : "",
    "",
    options.length
      ? `Options:\n${JSON.stringify(
          options.map((o: any) => ({
            id: o.id,
            text: o.optionText,
            isCorrect: o.isCorrect,
            order: o.optionOrder,
          })),
          null,
          2
        )}`
      : "",
    "",
    correctOptions.length
      ? `Correct options:\n${JSON.stringify(correctOptions, null, 2)}`
      : "",
    "",
    Object.keys(payload || {}).length
      ? `Question payload / answer key / matching data / ordering data:\n${JSON.stringify(payload, null, 2)}`
      : "",
    "",
    selectedOptions.length
      ? `Student selected options:\n${JSON.stringify(selectedOptions, null, 2)}`
      : "",
    "",
    `Student written answer:`,
    studentAnswerText || "(empty)",
    "",
    "Grading rules:",
    "- Award a whole-number score from 0 to maxPoints.",
    "- For MCQ, true/false, and multiple select, compare selected options with correct options.",
    "- For fill blank, compare meaning, spelling tolerance, and expected answer key.",
    "- For short answer and long answer, grade meaning, correctness, completeness, and clarity.",
    "- For coding, grade logic, correctness, syntax, and expected output.",
    "- For matching, grade each correct pair and give partial credit.",
    "- For ordering, grade each correct position and give partial credit.",
    "- If the student answer is empty, give 0.",
    "",
    `Return exactly this JSON shape:`,
    `{"points":0,"isCorrect":false,"feedback":"short feedback for student"}`,
  ]
    .filter(Boolean)
    .join("\n");

  let raw = "";

  try {
    await streamChat([{ role: "user" as const, content: gradingPrompt }], {
      onToken: (t: string) => {
        raw += t;
      },
      onEnd: async () => {},
      onError: () => {},
    });
  } catch (err) {
    console.error("[AI-GRADING] aiGradeQuestion failed:", err);
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    const points = Math.max(
      0,
      Math.min(maxPoints, Math.round(Number(parsed.points) || 0))
    );

    return {
      points,
      isCorrect: Boolean(parsed.isCorrect ?? points >= maxPoints),
      feedback: String(parsed.feedback || "AI graded.").slice(0, 500),
    };
  } catch {
    return {
      points: 0,
      isCorrect: false,
      feedback: "AI could not confidently grade this answer.",
    };
  }
}

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let { chatId, message, history, attachments = [], projectId = null, editFromId = null } = await req.json();

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

  // ✅ edit-resend REPLACES the old conversation from this point (no duplicates)
  if (editFromId && currentChatId) {
    const [target] = await db
      .select({ createdAt: aiMessages.createdAt })
      .from(aiMessages)
      .where(eq(aiMessages.id, editFromId));
    if (target) {
      await db
        .delete(aiMessages)
        .where(and(eq(aiMessages.chatId, currentChatId), gte(aiMessages.createdAt, target.createdAt)));
    }
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
    "- Guide teachers on how to use auto-grading (explain that they need to use the grading interface)",
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
    "",
    "AUTO-GRADING: When a teacher asks to grade an exam (any phrasing like 'grade exam X', 'grading this exam id: X', 'auto grade X'), the system has ALREADY run the grading and injected the raw results into this message. Format those results as a clean table (Student Name, Email, Score/Max, Percentage) ordered by percentage descending, give the class average, and note which questions still need manual review. If the message says the exam wasn't found or has no submissions, tell the teacher that clearly instead of explaining steps.",
  ].join("\n");

  // ✅ Detect grading requests (any phrasing) and execute server-side
  const wantsGrading = /grad|\bscore\b|\bmark\b|auto[- ]?grade|\bresult/i.test(message);
  const codeMatch = message.match(/\b([A-Z][A-Z0-9]{5})\b/); // 6-char code like HZARYU / PTKMJ9
  const gradeMatch = wantsGrading && codeMatch ? codeMatch : null;

  if (gradeMatch) {
    try {
      const examCode = gradeMatch[1].toUpperCase();
      console.log("[AI-GRADING] requested code:", examCode);

      const [exam] = await db
        .select()
        .from(exams)
        .where(and(eq(exams.examCode, examCode), eq(exams.teacherId, session.userId)));

      if (!exam) {
        console.log("[AI-GRADING] exam NOT found");
        message = `I could not find exam ${examCode} in your account.`;
      } else {
        console.log("[AI-GRADING] exam found:", exam.id, exam.title);

        // sections -> pages -> questions (sequential, no join)
        const sections = (await db.select().from(examSections).where(eq(examSections.examId, exam.id))) as any[];
        const sectionIds = sections.map((s: any) => s.id);
        const allPages = (await db.select().from(examPages)) as any[];
        const pages = allPages.filter((p: any) => sectionIds.includes(p.sectionId));
        const pageIds = pages.map((p: any) => p.id);
        const allQuestions = (await db.select().from(examQuestions)) as any[];
        const questions = allQuestions.filter((q: any) => pageIds.includes(q.pageId));
        console.log("[AI-GRADING] questions:", questions.length);

        const questionMap = new Map<string, any>(questions.map((q: any) => [q.id, q]));

        const allOptions = (await db.select().from(examQuestionOptions)) as any[];
        const optionsByQ = new Map<string, any[]>();
        for (const o of allOptions) {
          const list = optionsByQ.get(o.questionId) || [];
          list.push(o);
          optionsByQ.set(o.questionId, list);
        }

        const students = (await db.select().from(examStudents).where(eq(examStudents.examId, exam.id))) as any[];
        console.log("[AI-GRADING] students:", students.length);

        const results: any[] = [];
        for (const student of students) {
          const sAttempts = (await db.select().from(studentExamAttempts).where(eq(studentExamAttempts.examStudentId, student.id))) as any[];
          for (const attempt of sAttempts) {
            const answers = (await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attempt.id))) as any[];
            console.log("[AI-GRADING] student", student.studentName, "answers:", answers.length);

            let autoScore = 0, maxScore = 0, autoGraded = 0, needsManual = 0;
            const details: any[] = [];

            for (const ans of answers) {
              const q = questionMap.get(ans.questionId);
              if (!q) {
                needsManual++;
                continue;
              }
              maxScore += q.points;
              const opts = optionsByQ.get(q.id) || [];

              // ✅ AI grades EVERY question type
              const aiGrade = await aiGradeQuestion({
                questionType: q.questionType,
                questionText: q.questionText,
                options: opts,
                payload: q.payload || {},
                explanation: q.explanation || null,
                maxPoints: q.points,
                studentAnswerText: ans.answerText || "",
                selectedOptionIds: ans.selectedOptionIds || [],
              });

              const points = aiGrade.points;
              const isCorrect = aiGrade.isCorrect;
              const feedback = aiGrade.feedback;

              autoScore += points;
              autoGraded++;

              details.push({
                question: q.questionText.slice(0, 120),
                type: q.questionType,
                points,
                max: q.points,
                feedback,
              });

              await db
                .update(studentAnswers)
                .set({
                  autoPoints: points,
                  markedCorrect: isCorrect,
                  feedback,
                })
                .where(eq(studentAnswers.id, ans.id));
            }

            await db
              .update(studentExamAttempts)
              .set({
                autoPoints: autoScore,
                maxPoints: maxScore,
              })
              .where(eq(studentExamAttempts.id, attempt.id));

            results.push({
              studentName: student.studentName || student.studentId,
              studentEmail: student.studentEmail || "-",
              autoScore,
              maxScore,
              percentage: maxScore > 0 ? Math.round((autoScore / maxScore) * 100) : 0,
              aiGradedQuestions: autoGraded,
              needsManual: 0,
              details,
            });
          }
        }

        console.log("[AI-GRADING] results:", results.length);
        if (!results.length) {
          message = `Exam ${examCode} (${exam.title}) has no student submissions yet.`;
        } else {
          const avg = Math.round(results.reduce((s: number, r: any) => s + r.percentage, 0) / results.length);
          message = `AI grading completed for exam room code ${examCode} (${exam.title}). The system accessed the exam, read all student submissions, AI-graded every question type, saved the marks into the database, and generated these raw results:\n\n${JSON.stringify(
            {
              examCode,
              title: exam.title,
              totalStudents: results.length,
              classAverage: avg + "%",
              results,
            },
            null,
            2
          )}\n\nFormat this as a clean grading report. Include a table with Student, Email, Score/Max, Percentage, and AI-Graded Questions. Then include short feedback per student using the details array. Do not say anything about manual review unless needsManual is greater than 0.`;
        }
      }
    } catch (gradeError: any) {
      console.error("[AI-GRADING] error:", gradeError);
    }
  }

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