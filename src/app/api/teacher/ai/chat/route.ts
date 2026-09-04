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
        "WHEN THE USER ASKS TO CREATE/GENERATE AN EXAM:",
    "The app renders the exam ONLY from the JSON block below. Your prose is NEVER used. If the block is missing, short, or invalid, the exam is BROKEN.",
    "1. Output the [[EXAM_JSON]] block FIRST, before any explanation. Keep the explanation after it under 5 lines.",
    "2. The block MUST contain EXACTLY the sections and types the user asked for. Example: user says 'three part mcq true false long answer' → the block MUST have 3 sections with types mcq, true_false, long_answer.",
    "3. Every section MUST contain its FULL questions array — never empty, never abbreviated, no placeholders.",
    "4. Keep each questionText under 20 words so the block stays small. 8-14 questions total.",
    "5. The closing tag MUST be exactly [[/EXAM_JSON]] — single slash, no extra characters.",
    '{"title":"...","department":"...","subject":"...","sections":[{"title":"Section A: Multiple Choice","type":"mcq","questions":[{"questionText":"...","points":5,"options":[{"optionText":"...","isCorrect":true},{"optionText":"...","isCorrect":false}]}]},{"title":"Section B: True / False","type":"true_false","questions":[{"questionText":"...","points":4,"options":[{"optionText":"True","isCorrect":true},{"optionText":"False","isCorrect":false}]}]},{"title":"Section C: Long Answer","type":"long_answer","questions":[{"questionText":"...","points":15}]}]}',
    "No markdown inside the block.",
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
    "",
    "You MUST use a MIX of question types across sections. Available types:",
    "- **mcq** (Multiple Choice): one correct option",
    "- **multi_select** (Multiple Select): multiple correct options",
    "- **true_false** (True/False): two options (True/False or Yes/No)",
    "- **short_answer** (Short Answer): no options, student writes brief text",
    "- **long_answer** (Essay): no options, student writes detailed response",
    "- **coding** (Coding): code question with expected output",
    "- **fill_blank** (Fill in the Blank): sentence with blanks to fill",
    "- **matching** (Matching): pairs of terms and definitions",
    "- **ordering** (Ordering): items to arrange in correct sequence",
    "",
    "Example JSON structure showing ALL types:",
    '{"title":"...","department":"...","subject":"...","sections":[',
    '{"title":"Section A: Multiple Choice","type":"mcq","questions":[{"questionText":"What is 2+2?","points":5,"options":[{"optionText":"3","isCorrect":false},{"optionText":"4","isCorrect":true},{"optionText":"5","isCorrect":false}]}]},',
    '{"title":"Section B: Multiple Select","type":"multi_select","questions":[{"questionText":"Select all prime numbers","points":10,"options":[{"optionText":"2","isCorrect":true},{"optionText":"4","isCorrect":false},{"optionText":"5","isCorrect":true},{"optionText":"6","isCorrect":false}]}]},',
    '{"title":"Section C: True/False","type":"true_false","questions":[{"questionText":"Water boils at 100°C","points":3,"options":[{"optionText":"True","isCorrect":true},{"optionText":"False","isCorrect":false}]}]},',
    '{"title":"Section D: Short Answer","type":"short_answer","questions":[{"questionText":"Define photosynthesis","points":8}]},',
    '{"title":"Section E: Essay","type":"long_answer","questions":[{"questionText":"Explain the water cycle","points":15}]},',
    '{"title":"Section F: Fill in the Blank","type":"fill_blank","questions":[{"questionText":"The capital of France is ____","points":4,"payload":{"answerKey":["Paris"]}}]},',
    '{"title":"Section G: Matching","type":"matching","questions":[{"questionText":"Match each country with its capital","points":12,"payload":{"pairs":[{"term":"France","definition":"Paris"},{"term":"Japan","definition":"Tokyo"},{"term":"Egypt","definition":"Cairo"}]}}]},',
    '{"title":"Section H: Ordering","type":"ordering","questions":[{"questionText":"Arrange in order of size: small, medium, large","points":6,"payload":{"items":["small","medium","large"]}}]},',
    '{"title":"Section I: Coding","type":"coding","questions":[{"questionText":"Write a function to reverse a string","points":20,"payload":{"expectedOutput":"Reverse of input"}}]}',
    ']}',
    "",
    "Use 2-4 sections and 8-15 questions total. Distribute question types based on subject (e.g., math → more MCQ, literature → more essay). No markdown inside the block.",
    "Use 2-4 sections and 8-15 questions total. No markdown inside the block.",
    "",
    "AI GRADING: when the teacher asks to grade an exam by room code, the AI has ALREADY evaluated every student's answer like a human teacher — scoring each question fairly (MCQ/T/F/fill-blank against the answer key, short/long/coding/matching/ordering by reasoning) — and SAVED the marks as the TEACHER'S score (manualPoints). The attempt is automatically finalized to Pass or Fail based on score. Format a clean report table (Student, Score/Max, Percentage, Status) ordered by percentage descending, add per-student feedback from details, and state clearly that marks are SAVED and visible under Grading & Results.",
  ].join("\n");

    const wantsGrading = /grad|\bscore\b|\bmark\b|auto[- ]?grade|\bresult/i.test(message);
  const codeMatch = message.match(/\b([A-Z0-9]{6})\b/);
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

                            // ✅ Write AI score ONLY — never mutate student's answerText or selectedOptionIds
              await db.update(studentAnswers).set({
                manualPoints: points,
                markedCorrect: points > 0,
                feedback,
                // ❌ NEVER set: answerText, selectedOptionIds (those are the student's original submission)
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

    // ✅ Cap history so local Ollama never runs out of memory
  const trimmedHistory = history
    .slice(-6)
    .map((h: any) => ({ role: h.role, content: String(h.content || "").slice(0, 1500) }));

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...trimmedHistory,
    { role: "user" as const, content: message, attachments },
  ];

  const encoder = new TextEncoder();
  let fullResponse = "";
  // ✅ EXAM GENERATION: dedicated JSON-only call so the exam card ALWAYS renders
    const combined = [...history.map((h: any) => h.content), message].join("\n");
  const wantsExam =
    /(generate|create|make|build|write|do it)/i.test(combined) &&
    /(exam|paper|test|quiz)/i.test(combined);

      // ✅ Detect dept/subject with word boundaries, from the MOST RECENT message that mentions a subject
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matchByName = (list: any[], lowerText: string) =>
    list.find((item: any) => {
      const name = String(item.name).toLowerCase();
      return new RegExp(`(^|[^a-z0-9])${escapeRegExp(name)}($|[^a-z0-9])`).test(lowerText);
    });

  const userMsgs = [
    ...history.filter((h: any) => h.role === "user").map((h: any) => h.content),
    message,
  ];

  let foundSubj: any = null;
  let foundDept: any = null;
  for (let i = userMsgs.length - 1; i >= 0 && !foundSubj; i--) {
    const t = String(userMsgs[i] || "").toLowerCase();
    const subj = matchByName(teacherSubjs, t);
    if (subj) {
      foundSubj = subj;
      foundDept = matchByName(teacherDepts, t) || null;
    }
  }

  let deptSubjectNote = "";
  if (foundSubj) {
    if (!foundDept) {
      // subject without department → use the subject's own department
      foundDept = teacherDepts.find((d: any) => d.name === foundSubj.deptName);
    } else if (foundDept.name !== foundSubj.deptName) {
      // ❗ only warn when the SAME message really mismatches
      deptSubjectNote = `⚠️ Note: "${foundSubj.name}" belongs to **${foundSubj.deptName}**, not ${foundDept.name} — I generated it under ${foundSubj.deptName}.`;
      foundDept = teacherDepts.find((d: any) => d.name === foundSubj.deptName);
    }
  }

    // ✅ Grading requests ALWAYS win over generation
  const gradeIntentNow =
    /grad|\bscore\b|\bmark\b|\bresult/i.test(message) && /\b[A-Z][A-Z0-9]{5}\b/.test(message);

  if (wantsExam && !gradeIntentNow && foundDept && foundSubj) {
    const recentUser = [
      ...history.filter((h: any) => h.role === "user").slice(-3).map((h: any) => h.content),
      message,
    ].join("\n");
    const examOnlyPrompt = [
            "You are an exam paper generator. Your ENTIRE response must be ONLY valid JSON. Do NOT use markdown code blocks like ```json. Do NOT include explanations, greetings, or any text outside the JSON object. Just the raw { ... } JSON.",
      `Teacher request: ${recentUser}`,
            `Use department: ${foundDept.name}. Use subject: ${foundSubj.name}.`,
            'JSON schema: {"title":string,"department":string,"subject":string,"durationMinutes":number,"sections":[{"title":string,"type":"mcq|multi_select|true_false|short_answer|long_answer|coding|fill_blank|matching|ordering","questions":[{"questionText":string,"points":number,"options":[{"optionText":string,"isCorrect":boolean}],"payload":{"pairs":[{"term":string,"definition":string}],"items":[string],"answerKey":[string]}}]}]}',
      "Rules: include exactly the section types the user asked for; mcq/true_false/multi_select questions MUST include options with the correct flag(s); short_answer/long_answer questions MUST NOT include options; 8-14 questions total; keep questionText under 20 words.",
    ].join("\n");

    const examStream = new ReadableStream({
      async start(controller) {
        let raw = "";
        let metadata: any = { provider: "local", model: "exam-gen", tokens: 0 };
        try {
          await streamChat([{ role: "user" as const, content: examOnlyPrompt }], {
            onToken: (t: string) => { raw += t; },
            onEnd: async (m: any) => { metadata = m; },
            onError: () => {},
          });
        } catch (e) {
          console.error("[EXAM-GEN] call failed:", e);
        }

                let reply = "";
        try {
          let jsonStr = "";
          
          // 1. Look for our custom tags
          const tagged = raw.match(/\[\[EXAM_JSON\]\]([\s\S]*?)\[\[\/?EXAM_JSON\]\]/);
          if (tagged) jsonStr = tagged[1].trim();
          
          // 2. Look for markdown ```json ... ``` blocks
          if (!jsonStr) {
            const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (codeBlock) jsonStr = codeBlock[1].trim();
          }
          
          // 3. Fallback: grab the biggest { ... } block
          if (!jsonStr) {
            const brackets = raw.match(/\{[\s\S]*\}/);
            if (brackets) jsonStr = brackets[0];
          }
          
          if (!jsonStr) throw new Error("no json found");
          
          // 4. Fix common LLM mistakes (trailing commas before } or ])
          jsonStr = jsonStr.replace(/,\s*([\]}])/g, "$1");
          
          const parsed = JSON.parse(jsonStr);
          if (!Array.isArray(parsed.sections) || !parsed.sections.length) throw new Error("no sections");
          const totalQ = parsed.sections.reduce((s: number, sec: any) => s + (sec.questions?.length || 0), 0);
          const totalPts = parsed.sections.reduce(
            (s: number, sec: any) => s + (sec.questions || []).reduce((a: number, q: any) => a + (q.points || 0), 0),
            0
          );
                    const sectionLines = parsed.sections
            .map((sec: any, i: number) => {
              const qs = sec.questions?.length || 0;
              const pts = (sec.questions || []).reduce((a: number, q: any) => a + (q.points || 0), 0);
              // Strip redundant "Section X:" prefix from title
              const cleanTitle = (sec.title || sec.type || "").replace(/^Section [A-Z]:\s*/i, "").trim();
              return `• **Section ${String.fromCharCode(65 + i)} — ${cleanTitle}**: ${qs} questions, ${pts} points`;
            })
            .join("\n");
                    reply =
            (deptSubjectNote ? deptSubjectNote + "\n\n" : "") +
            `Here is your exam paper — **${parsed.title}** (${parsed.department} / ${parsed.subject}, ${parsed.durationMinutes || 60} min, ${totalQ} questions, ${totalPts} points).\n\n` +
            `${sectionLines}\n\n` +
            `You can **View** the full paper, **Download** it as PDF, or **Save Exam** to publish it. ` +
            `Want changes? Just ask: "make it harder", "only MCQ", "add 5 questions"…\n\n` +
            `[[EXAM_JSON]]${JSON.stringify(parsed)}[[/EXAM_JSON]]`;
                } catch (e: any) {
          console.error("[EXAM-GEN] parse failed. Raw output was:", raw.slice(0, 800));
          reply = "I could not format the exam paper correctly this time. The AI output was not valid JSON. Please try rephrasing your request (e.g., 'generate 3 parts: mcq, true false, long answer').";
        }

        await db.insert(aiMessages).values({
          chatId: currentChatId,
          role: "assistant",
          content: reply,
          provider: metadata.provider,
          model: metadata.model,
          tokensUsed: metadata.tokens,
        });
        await incrementQuota(session.userId, orgId, metadata.tokens || 0);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", text: reply })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", chatId: currentChatId, messageId: userMsg.id, metadata })}\n\n`));
        controller.close();
      },
    });

    return new Response(examStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

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