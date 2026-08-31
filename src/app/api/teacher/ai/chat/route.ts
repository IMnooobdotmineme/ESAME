import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  aiChats, aiMessages, teachers,
  exams, examSections, examPages, examQuestions, examQuestionOptions,
  examStudents, studentExamAttempts, studentAnswers,
  departments, subjects,
} from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";
import { streamChat } from "@/lib/ai/adapter";
import { checkQuota, incrementQuota } from "@/lib/ai/quota";

export const maxDuration = 300;

// ✅ AI judge — acts as a human teacher grading each question
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
    questionType, questionText, options = [], payload = {},
    explanation, maxPoints, studentAnswerText, selectedOptionIds = [],
  } = params;

  const correctOptions = options.filter((o: any) => o.isCorrect).map((o: any) => ({ id: o.id, text: o.optionText, order: o.optionOrder }));
  const selectedOptions = options.filter((o: any) => selectedOptionIds.includes(o.id)).map((o: any) => ({ id: o.id, text: o.optionText, order: o.optionOrder }));

  const gradingPrompt = [
    "You are a human teacher grading a student's exam answer inside ESAME.",
    "Grade this ONE student answer carefully and fairly.",
    "",
    "Return ONLY valid JSON. No markdown.",
    "",
    `Question type: ${questionType}`,
    `Maximum points: ${maxPoints}`,
    "",
    `Question:`,
    questionText,
    "",
    explanation ? `Teacher rubric / explanation:\n${explanation}` : "",
    "",
    options.length ? `Options:\n${JSON.stringify(options.map((o: any) => ({ id: o.id, text: o.optionText, isCorrect: o.isCorrect, order: o.optionOrder })))}` : "",
    "",
    correctOptions.length ? `Correct options:\n${JSON.stringify(correctOptions)}` : "",
    "",
    Object.keys(payload || {}).length ? `Correct data (answer key / pairs / order):\n${JSON.stringify(payload)}` : "",
    "",
    selectedOptions.length ? `Student selected options:\n${JSON.stringify(selectedOptions)}` : "",
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
    `Return exactly: {"points":0,"feedback":"short feedback for student"}`,
  ].filter(Boolean).join("\n");

  let raw = "";
  try {
    await streamChat([{ role: "user" as const, content: gradingPrompt }], {
      onToken: (t: string) => { raw += t; },
      onEnd: async () => {},
      onError: () => {},
    });
  } catch (err) {
    console.error("[AI-GRADING] aiGradeQuestion failed:", err);
  }

  try {
    const m = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : raw);
    const points = Math.max(0, Math.min(maxPoints, Math.round(Number(parsed.points) || 0)));
    return { points, feedback: String(parsed.feedback || "AI graded.").slice(0, 500) };
  } catch {
    return { points: 0, feedback: "AI could not grade this answer." };
  }
}

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let { chatId, message, history, attachments = [], projectId = null, editFromId = null } = await req.json();

  const [teacher] = await db.select({ orgId: teachers.orgId }).from(teachers).where(eq(teachers.id, session.userId));
  if (!teacher) return new Response("Teacher not found", { status: 404 });
  const orgId = teacher.orgId;

  const quota = await checkQuota(session.userId, orgId);
  if (!quota.allowed) {
    return new Response(JSON.stringify({ error: `Daily limit reached (${quota.used}/${quota.limit}). Resets tomorrow.` }), { status: 429, headers: { "Content-Type": "application/json" } });
  }

  let currentChatId = chatId;
  if (!currentChatId) {
    const [newChat] = await db.insert(aiChats).values({ orgId, teacherId: session.userId, title: "New chat", projectId }).returning();
    currentChatId = newChat.id;
  }

  if (editFromId && currentChatId) {
    const [target] = await db.select({ createdAt: aiMessages.createdAt }).from(aiMessages).where(eq(aiMessages.id, editFromId));
    if (target) {
      await db.delete(aiMessages).where(and(eq(aiMessages.chatId, currentChatId), gte(aiMessages.createdAt, target.createdAt)));
    }
  }

  const [userMsg] = await db.insert(aiMessages).values({ chatId: currentChatId, role: "user", content: message, attachments: attachments.length ? attachments : null }).returning();

  await db.update(aiChats).set({ updatedAt: new Date() }).where(eq(aiChats.id, currentChatId));

    // ✅ Fetch teacher's departments and subjects for context
  const teacherDepts = teacher
    ? await db.select({ name: departments.name }).from(departments).where(eq(departments.orgId, teacher.orgId))
    : [];
  const teacherSubjs = teacherDepts.length > 0
    ? await db
        .select({ name: subjects.name, departmentId: subjects.departmentId, deptName: departments.name })
        .from(subjects)
        .innerJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(departments.orgId, teacher.orgId))
    : [];

  const deptList = teacherDepts.map((d: any) => d.name).join(", ") || "none";
  const subjList = teacherSubjs.map((s: any) => `${s.deptName} → ${s.name}`).join(", ") || "none";

  const systemPrompt = [
    "You are ESAME AI, a helpful assistant for teachers in Cambodia. You can:",
    "- Answer questions in English or Khmer (auto-detect language)",
    "- Help generate exam questions",
    "- Analyze uploaded files and images",
    "- Provide educational content",
    "",
    "FORMATTING RULES (always): structure answers with short paragraphs separated by blank lines, ## headings, bullet lists and numbered steps. Only use a markdown table when the user explicitly asks for one. When providing code, ALWAYS use fenced code blocks with the language tag (cpp, js, python, java, bash).",
    "",
    "WHEN MAKING TABLES: ALWAYS use valid GitHub-flavored markdown table syntax.",
    "",
    `TEACHER CONTEXT: This teacher teaches in these departments: ${deptList}. Their subjects are: ${subjList}.`,
    "",
    "EXAM GENERATION RULE: When the user asks to generate/create an exam, you MUST first ask for:",
    "1. **Department** (REQUIRED) — must be one of the teacher's departments listed above",
    "2. **Subject** (REQUIRED) — must be one of the teacher's subjects listed above",
    "3. **Title** (optional) — if not provided, you will auto-generate one",
    "4. **Date** (optional)",
    "5. **Duration in minutes** (optional, default 60)",
    "6. **Instructions** (optional)",
    "",
    "If the user does NOT provide department AND subject, ask them to provide both and wait. Do NOT generate the exam until both are given.",
    "",
    "WHEN THE USER ASKS TO CREATE/GENERATE AN EXAM: after your explanation, output exactly ONE block starting with [[EXAM_JSON]] and ending with [[/EXAM_JSON]] containing valid JSON:",
        "CRITICAL: The closing tag MUST be exactly [[/EXAM_JSON]] — with a single forward slash, no spaces, no extra characters. Never write [[//EXAM_JSON]] or [[EXAM_JSON] (missing bracket).",
    '{"title":"...","department":"...","subject":"...","sections":[{"title":"Section A: Multiple Choice","type":"mcq","questions":[{...}]}]}',
    "Use 2-4 sections and 8-15 questions total. No markdown inside the block.",
    "",
    "AI GRADING: when the teacher asks to grade an exam by room code, the AI has ALREADY evaluated every student's answer like a human teacher — scoring each question fairly (MCQ/T/F/fill-blank against the answer key, short/long/coding/matching/ordering by reasoning) — and SAVED the marks as the TEACHER'S score (manualPoints). The attempt is automatically finalized to Pass or Fail based on score. Format a clean report table (Student, Score/Max, Percentage, Status) ordered by percentage descending, add per-student feedback from details, and state clearly that marks are SAVED and visible under Grading & Results.",
  ].join("\n");

  const wantsGrading = /grad|\bscore\b|\bmark\b|auto[- ]?grade|\bresult/i.test(message);
  const codeMatch = message.match(/\b([A-Z][A-Z0-9]{5})\b/);
  const gradeMatch = wantsGrading && codeMatch ? codeMatch : null;

  if (gradeMatch) {
    try {
      const examCode = gradeMatch[1].toUpperCase();
      console.log("[AI-GRADING] requested code:", examCode);

      const [exam] = await db.select().from(exams).where(and(eq(exams.examCode, examCode), eq(exams.teacherId, session.userId)));

      if (!exam) {
        message = `I could not find exam ${examCode} in your account.`;
      } else {
        console.log("[AI-GRADING] exam found:", exam.id, exam.title);

        const sections = (await db.select().from(examSections).where(eq(examSections.examId, exam.id))) as any[];
        const sectionIds = sections.map((s: any) => s.id);
        const allPages = (await db.select().from(examPages)) as any[];
        const pages = allPages.filter((p: any) => sectionIds.includes(p.sectionId));
        const pageIds = pages.map((p: any) => p.id);
        const allQuestions = (await db.select().from(examQuestions)) as any[];
        const questions = allQuestions.filter((q: any) => pageIds.includes(q.pageId));
        const questionMap = new Map<string, any>(questions.map((q: any) => [q.id, q]));

        const allOptions = (await db.select().from(examQuestionOptions)) as any[];
        const optionsByQ = new Map<string, any[]>();
        for (const o of allOptions) {
          const list = optionsByQ.get(o.questionId) || [];
          list.push(o);
          optionsByQ.set(o.questionId, list);
        }

        const students = (await db.select().from(examStudents).where(eq(examStudents.examId, exam.id))) as any[];
        const results: any[] = [];

        for (const student of students) {
          const sAttempts = (await db.select().from(studentExamAttempts).where(eq(studentExamAttempts.examStudentId, student.id))) as any[];

          for (const attempt of sAttempts) {
            const answers = (await db.select().from(studentAnswers).where(eq(studentAnswers.attemptId, attempt.id))) as any[];
            console.log("[AI-GRADING] grading", student.studentName, "—", answers.length, "answers");

            const details: any[] = [];

            // ✅ AI grades each question like a human teacher, saves to manualPoints
            for (const ans of answers) {
              const q = questionMap.get(ans.questionId);
              if (!q) continue;
              const opts = optionsByQ.get(q.id) || [];

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
              const feedback = aiGrade.feedback;

              details.push({
                question: q.questionText.slice(0, 120),
                type: q.questionType,
                points,
                max: q.points,
                feedback,
              });

              // ✅ Write AI score to manualPoints (teacher mark) — same as human "Save Evaluation"
              await db.update(studentAnswers).set({
                manualPoints: points,
                markedCorrect: points > 0,
                feedback,
              }).where(eq(studentAnswers.id, ans.id));
            }

            // ✅ Recalculate totals the SAME way save-grades does
            const allRows = await db
              .select({ answer: studentAnswers, question: examQuestions })
              .from(studentAnswers)
              .leftJoin(examQuestions, eq(studentAnswers.questionId, examQuestions.id))
              .where(eq(studentAnswers.attemptId, attempt.id));

            let autoTotal = 0, manualTotal = 0, maxTotal = 0, needsManual = false;
            for (const { answer, question } of allRows as any[]) {
              const qType = question?.questionType;
              const isAuto = qType === "mcq" || qType === "multiple_select" || qType === "true_false" || qType === "fill_in_blank";
              maxTotal += question?.points || 0;
              if (isAuto && answer.markedCorrect !== null) {
                // system auto-graded (or overridden by teacher/AI)
                autoTotal += answer.manualPoints;
              } else if (isAuto) {
                autoTotal += answer.autoPoints;
              } else {
                manualTotal += answer.manualPoints;
                if (answer.markedCorrect === null) needsManual = true;
              }
            }

            // ✅ Finalize attempt — Pass/Fail, no more "Pending Review"
            await db.update(studentExamAttempts).set({
              autoPoints: autoTotal,
              manualPoints: manualTotal,
              maxPoints: maxTotal,
              gradingStatus: "complete",
              status: "reviewed",
            }).where(eq(studentExamAttempts.id, attempt.id));

            const totalScore = autoTotal + manualTotal;
            const percentage = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

            results.push({
              studentName: student.studentName || student.studentId,
              studentEmail: student.studentEmail || "-",
              score: totalScore,
              maxScore: maxTotal,
              percentage,
              status: percentage >= 50 ? "Pass" : "Fail",
              details,
            });
          }
        }

        console.log("[AI-GRADING] results:", results.length);
        if (!results.length) {
          message = `Exam ${examCode} (${exam.title}) has no student submissions yet.`;
        } else {
          const avg = Math.round(results.reduce((s: number, r: any) => s + r.percentage, 0) / results.length);
          message = `AI grading COMPLETED for exam ${examCode} (${exam.title}). The AI evaluated every student's answer like a human teacher, saved marks as teacher scores (manualPoints), and finalized each attempt to Pass or Fail. Raw results:\n\n${JSON.stringify(
            { examCode, title: exam.title, totalStudents: results.length, classAverage: avg + "%", results },
            null,
            2
          )}\n\nFormat a clean report: table (Student, Score/Max, Percentage, Status) ordered descending, then per-student feedback from details. State clearly that marks are SAVED and visible under Grading & Results.`;
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
            await db.insert(aiMessages).values({ chatId: currentChatId, role: "assistant", content: fullResponse, provider: metadata.provider, model: metadata.model, tokensUsed: metadata.tokens });
            await incrementQuota(session.userId, orgId, metadata.tokens);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", chatId: currentChatId, messageId: userMsg.id, metadata })}\n\n`));
            controller.close();
          },
          onError: (error) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`));
            controller.close();
          },
        });
      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}