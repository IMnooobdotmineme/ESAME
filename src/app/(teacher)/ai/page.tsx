"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Send, MessageSquare, Trash2, Sparkles, Paperclip, X,
  FolderPlus, Folder, Loader2, PanelLeftClose, PanelLeftOpen,
  Search, SquarePen, ChevronDown, Copy, Check, Pencil, Square, RefreshCw,
  FileText, Eye, Mic,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { TeacherTopbar } from "@/components/teacher/TeacherTopbar";
import { Dialog, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EsameLogo } from "@/components/organization/EsameLogo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast, ToastHost } from "@/components/ui/toast";
import { normalizeExamDraft } from "@/lib/ai-exam";

interface Chat { id: string; title: string; isPinned: boolean; projectId: string | null; updatedAt: string; }
interface Message { id: string; role: "user" | "assistant"; content: string; createdAt: string; provider?: string; attachments?: any[]; }
interface Project { id: string; name: string; }
interface Attachment { id: string; name: string; kind: "image" | "text"; dataUrl?: string; text?: string; }

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple Choice", multi_select: "Multiple Select", true_false: "True / False",
  short_answer: "Short Answer", long_answer: "Long Question", coding: "Coding",
  fill_blank: "Fill in the Blank", matching: "Matching", ordering: "Ordering",
};

const QUICK_PROMPTS = [
  "Generate a 10-question multiple choice exam about C++ loops",
  "Create a fill-in-the-blank quiz about World War II",
  "Explain photosynthesis in Khmer",
  "Show a Python example for reading a CSV file",
];

// ---------- code block with language header + copy ----------
function CodeBlock({ children, ...rest }: any) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  let lang = "";
  try {
    const codeEl = Array.isArray(children) ? children[0] : children;
    lang = String(codeEl?.props?.className || "").replace("language-", "").trim();
  } catch {}
  return (
    <div className="my-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-700/60 bg-slate-800/80 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{lang || "code"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(ref.current?.innerText ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre ref={ref} {...rest} className="overflow-x-auto p-4 text-xs leading-5 text-slate-100">{children}</pre>
    </div>
  );
}
const MD_COMPONENTS = { pre: CodeBlock } as any;
// ---------- user message with visible attachments ----------
function UserBubble({ msg }: { msg: any }) {
  const imgs = (msg.attachments ?? []).filter((a: any) => a.dataUrl);
  const files = (msg.attachments ?? []).filter((a: any) => !a.dataUrl);
  const text = String(msg.content ?? "").split("\n\n--- Attached file:")[0];
  return (
    <div className="flex flex-col items-end gap-2">
      {(imgs.length > 0 || files.length > 0) && (
        <div className="flex flex-wrap justify-end gap-2">
          {imgs.map((a: any, i: number) => (
            <img key={i} src={a.dataUrl} alt={a.name} className="h-24 w-24 rounded-xl border border-white/20 object-cover" />
          ))}
          {files.map((a: any, i: number) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <Paperclip size={12} /> {a.name}
            </span>
          ))}
        </div>
      )}
      {text.trim() && <p className="whitespace-pre-wrap text-sm">{text}</p>}
    </div>
  );
}

// ---------- exam JSON extraction ----------
function extractExamDraft(content: string): { clean: string; draft: any | null } {
  const re = /\[\[EXAM_JSON\]\]([\s\S]*?)\[\[\/EXAM_JSON\]\]/;
  const m = content.match(re);
  if (!m) return { clean: content, draft: null };
  const clean = content.replace(re, "").trim();
  try {
    return { clean, draft: normalizeExamDraft(JSON.parse(m[1])) };
  } catch {
    return { clean, draft: null };
  }
}

// ---------- file helpers ----------
function bufToBase64(buf: ArrayBuffer) {
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function xlsxToText(file: File): Promise<string> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const lines: string[] = [];
  wb.eachSheet((ws) => {
    lines.push(`[Sheet: ${ws.name}]`);
    let count = 0;
    ws.eachRow((row) => {
      if (count++ > 100) return;
      const vals: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => vals.push(String(cell.value ?? "")));
      lines.push(vals.join(" | "));
    });
  });
  return lines.join("\n").slice(0, 20000);
}

async function fileToAttachment(file: File): Promise<Attachment | null> {
  if (file.type.startsWith("image/")) {
    if (file.size > 4 * 1024 * 1024) { toast("Image too large (max 4MB).", "error"); return null; }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return { id: crypto.randomUUID(), name: file.name, kind: "image", dataUrl };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["txt", "md", "csv"].includes(ext)) {
    return { id: crypto.randomUUID(), name: file.name, kind: "text", text: (await file.text()).slice(0, 20000) };
  }
  if (["xlsx", "xls"].includes(ext)) {
    return { id: crypto.randomUUID(), name: file.name, kind: "text", text: await xlsxToText(file) };
  }
  if (["pdf", "docx", "doc"].includes(ext)) {
    if (file.size > 15 * 1024 * 1024) { toast("File too large (max 15MB).", "error"); return null; }
    const base64 = bufToBase64(await file.arrayBuffer());
    const res = await fetch("/api/teacher/ai/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, dataBase64: base64 }),
    });
    const data = await res.json();
    if (!res.ok) { toast(data?.error || "Could not read this file.", "error"); return null; }
    return { id: crypto.randomUUID(), name: file.name, kind: "text", text: data.text };
  }
  toast(`".${ext}" is not supported. Use images, PDF, Word, Excel, txt, csv or md.`, "error");
  return null;
}

function groupLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startToday) return "Today";
  if (t >= startToday - 7 * 86400000) return "Previous 7 days";
  return d.toLocaleString("en", { month: "long" });
}

function groupChats(list: Chat[]) {
  const groups: { label: string; items: Chat[] }[] = [];
  for (const chat of list) {
    const label = groupLabel(chat.updatedAt);
    let g = groups.find((x) => x.label === label);
    if (!g) { g = { label, items: [] }; groups.push(g); }
    g.items.push(chat);
  }
  return groups;
}

// ---------- question viewer ----------
function QuestionView({ q, index }: { q: any; index: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-navy-900">{index + 1}. {q.text}</p>
        <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">{q.marks} pts</span>
      </div>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{TYPE_LABELS[q.type] ?? q.type}</p>

      {q.type === "mcq" && Array.isArray(q.mcqOptions) && (
        <ul className="mt-2 space-y-1">
          {q.mcqOptions.map((o: string, i: number) => (
            <li key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${i === q.mcqCorrect ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-transparent bg-slate-50 text-slate-600"}`}>
              <span className="font-bold">{String.fromCharCode(65 + i)}.</span>
              <span className="flex-1">{o}</span>
              {i === q.mcqCorrect && <Check size={13} />}
            </li>
          ))}
        </ul>
      )}

      {q.type === "multi_select" && Array.isArray(q.multiOptions) && (
        <ul className="mt-2 space-y-1">
          {q.multiOptions.map((o: string, i: number) => (
            <li key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${q.multiCorrect?.[i] ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-transparent bg-slate-50 text-slate-600"}`}>
              <span className="flex-1">{o}</span>
              {q.multiCorrect?.[i] && <Check size={13} />}
            </li>
          ))}
        </ul>
      )}

      {q.type === "true_false" && (
        <div className="mt-2 flex gap-2">
          {[true, false].map((v) => (
            <span key={String(v)} className={`rounded-lg border px-3 py-1 text-sm font-semibold ${q.tfCorrect === v ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-transparent bg-slate-50 text-slate-500"}`}>
              {v ? "True" : "False"}{q.tfCorrect === v ? " ✓" : ""}
            </span>
          ))}
        </div>
      )}

      {q.type === "fill_blank" && q.blanksText && (
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {q.blanksText}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(q.answerKey ?? []).map((a: any) => (
              <span key={a.number} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">[{a.number}] {a.answer}</span>
            ))}
          </div>
        </div>
      )}

      {q.type === "matching" && Array.isArray(q.matchLeft) && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div className="space-y-1">{q.matchLeft.map((l: string, i: number) => <div key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">{i + 1}. {l}</div>)}</div>
          <div className="space-y-1">{q.matchRight.map((r: string, i: number) => <div key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">{String.fromCharCode(65 + i)}. {r}</div>)}</div>
          <div className="col-span-2 flex flex-wrap gap-1.5">
            {(q.matchAnswers ?? []).map((p: any, i: number) => (
              <span key={i} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{p.left}→{p.right}</span>
            ))}
          </div>
        </div>
      )}

      {q.type === "ordering" && Array.isArray(q.orderingItems) && (
        <ol className="mt-2 space-y-1">
          {q.orderingItems.map((it: string, i: number) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{i + 1}. {it}</li>
          ))}
        </ol>
      )}

      {(q.type === "short_answer" || q.type === "long_answer" || q.type === "coding") && (
        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">Manual grading — teacher reviews the student&apos;s answer.</p>
      )}
    </div>
  );
}

// ---------- Claude-style exam card ----------
function ExamDraftCard({ draft }: { draft: any }) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const totalQ = draft.sections.reduce((a: number, s: any) => a + s.questions.length, 0);
  const totalMarks = draft.sections.reduce((a: number, s: any) => a + s.marks, 0);

  function addToExamPage() {
    sessionStorage.setItem("esai_ai_exam_draft", JSON.stringify(draft));
    toast("Exam draft ready — review and save it in the builder.", "success");
    router.push("/teacher-exams/new?from=ai");
  }

  return (
    <>
      <div className="mt-3 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sky-400 to-sky-600">
            <FileText size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy-900">{draft.title}</p>
            <p className="text-[11px] text-slate-400">Exam paper • {draft.sections.length} sections • {totalQ} questions • {totalMarks} marks</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewOpen(true)}>
            <Eye size={13} /> View
          </Button>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-2.5">
          <p className="text-[11px] text-slate-400">Want changes? Just ask: &quot;make it harder&quot;, &quot;only MCQ&quot;, &quot;add 5 questions&quot;…</p>
          <Button size="sm" onClick={addToExamPage}>
            <Plus size={13} /> Add to Exam Page
          </Button>
        </div>
      </div>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} className="max-w-3xl">
        <DialogHeader title={draft.title} onClose={() => setViewOpen(false)} />
        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
          {draft.sections.map((s: any) => (
            <div key={s.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white">{s.title}</span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                  {TYPE_LABELS[s.allowedType] ?? s.allowedType}
                </span>
                <span className="text-[11px] text-slate-400">{s.marks} marks</span>
              </div>
              <div className="space-y-2">
                {s.questions.map((q: any, i: number) => <QuestionView key={q.id} q={q} index={i} />)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          <Button onClick={addToExamPage}><Plus size={14} /> Add to Exam Page</Button>
        </div>
      </Dialog>
    </>
  );
}

// ================= PAGE =================
export default function AIAssistantPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [allChatsOpen, setAllChatsOpen] = useState(true);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef("");
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/teacher/ai/chats").then((r) => r.json()).then((d) => setChats(d.chats || []));
    fetch("/api/teacher/ai/projects").then((r) => r.json()).then((d) => setProjects(d.projects || []));
  }, []);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    fetch(`/api/teacher/ai/chats?chatId=${activeChatId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []));
  }, [activeChatId]);

    useEffect(() => {
    if (stickRef.current) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  
  function onScrollBox() {
    const el = scrollBoxRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  const q = search.trim().toLowerCase();
  const searchResults = q ? chats.filter((c) => c.title.toLowerCase().includes(q)) : [];
  const standaloneChats = chats.filter((c) => !c.projectId);
  const activeProject = projects.find((p) => p.id === expandedProjectId) || null;
  const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf("assistant");

  async function refreshChats() {
    const r = await fetch("/api/teacher/ai/chats").then((x) => x.json());
    setChats(r.chats || []);
  }

  function copyMsg(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function stopGeneration() {
    abortRef.current?.abort();
  }

  function toggleMic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast("Voice input is not supported in this browser.", "error"); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = /[\u1780-\u17FF]/.test(input) ? "km-KH" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let t = "";
      for (const r of e.results) t += r[0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); toast("Microphone error — check browser permissions.", "error"); };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

    async function runChat(userText: string, imageAtts: any[], baseHistory: Message[], displayAtts: any[] = []) {
        setIsStreaming(true);
    streamingRef.current = true;
    stickRef.current = true;
    setStreamingText("");
    streamRef.current = "";
    const controller = new AbortController();
    abortRef.current = controller;
    const hadChat = !!activeChatId;

        setMessages((prev) => [
      ...prev,
      { id: `temp-u-${Date.now()}`, role: "user", content: userText, createdAt: new Date().toISOString(), attachments: displayAtts.length ? displayAtts : undefined },
    ]);
    let newChatId: string | null = null;
    let gotDone = false;

    try {
      const response = await fetch("/api/teacher/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          chatId: activeChatId,
          message: userText,
          attachments: imageAtts,
          projectId: expandedProjectId,
          history: baseHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");

      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (!line.startsWith("data: ")) continue;
          let json: any;
          try { json = JSON.parse(line.slice(6)); } catch { continue; }
          if (json.type === "token") {
            streamRef.current += json.text;
            setStreamingText(streamRef.current);
          } else if (json.type === "done") {
            gotDone = true;
            newChatId = json.chatId;
            setMessages((prev) => [
              ...prev,
              { id: `msg-${Date.now()}`, role: "assistant", content: streamRef.current, createdAt: new Date().toISOString(), provider: json.metadata?.provider },
            ]);
            streamRef.current = "";
            setStreamingText("");
            setIsStreaming(false);
            streamingRef.current = false;
          } else if (json.type === "error") {
            toast(json.message || "AI error", "error");
            setIsStreaming(false);
            streamingRef.current = false;
          }
        }
      }

      if (!gotDone && streamRef.current) {
        setMessages((prev) => [
          ...prev,
          { id: `msg-${Date.now()}`, role: "assistant", content: streamRef.current, createdAt: new Date().toISOString() },
        ]);
        streamRef.current = "";
        setStreamingText("");
      }
      setIsStreaming(false);
      streamingRef.current = false;

            await refreshChats();
      // ✅ if the live stream missed the answer, load it from DB — no manual refresh needed
      if (!gotDone) {
        const list = await fetch("/api/teacher/ai/chats").then((r) => r.json()).then((d) => d.chats || []);
        const target = activeChatId ? list.find((c: Chat) => c.id === activeChatId) : list[0];
        if (target) {
          const d = await fetch(`/api/teacher/ai/chats?chatId=${target.id}`).then((r) => r.json());
          if (d.messages?.length) {
            setMessages(d.messages);
            setActiveChatId(target.id);
          }
        }
        setIsStreaming(false);
        streamingRef.current = false;
        setStreamingText("");
      }
      if (!hadChat && newChatId) {
        setActiveChatId(newChatId);
        await fetch("/api/teacher/ai/chats", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: newChatId, title: userText.slice(0, 40) || "New chat" }),
        });
        await refreshChats();
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        if (streamRef.current) {
          setMessages((prev) => [
            ...prev,
            { id: `msg-${Date.now()}`, role: "assistant", content: streamRef.current, createdAt: new Date().toISOString(), provider: "stopped" },
          ]);
        }
        streamRef.current = "";
        setStreamingText("");
        toast("Generation stopped.", "info");
      } else {
        toast(error.message || "Failed to send message.", "error");
      }
      setIsStreaming(false);
      streamingRef.current = false;
    }
  }

  async function sendMessage() {
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;
    const userText =
      input.trim() +
      attachments
        .filter((a) => a.kind === "text" && a.text)
        .map((a) => `\n\n--- Attached file: ${a.name} ---\n${a.text}`)
        .join("");
        const imageAtts = attachments
      .filter((a) => a.kind === "image")
      .map((a) => ({ type: "image", name: a.name, dataUrl: a.dataUrl }));
    const displayAtts = attachments.map((a) => ({ name: a.name, dataUrl: a.dataUrl }));
    const base = messages;
    setInput("");
    setAttachments([]);
    await runChat(userText, imageAtts, base, displayAtts);
  }

  function regenerate() {
    if (isStreaming) return;
    const idx = messages.map((m) => m.role).lastIndexOf("user");
    if (idx === -1) return;
        const userMsg = messages[idx];
    const base = messages.slice(0, idx);
    setMessages(base);
    const imgs = (userMsg.attachments ?? []).filter((a: any) => a.dataUrl);
    runChat(userMsg.content, imgs, base, userMsg.attachments ?? []);
  }

  function editUser(index: number) {
    if (isStreaming) return;
    const msg = messages[index];
    setMessages(messages.slice(0, index));
    setInput(msg.content);
    inputRef.current?.focus();
  }

  async function createProject() {
    const name = newProjectName.trim();
    if (!name) return;
    const res = await fetch("/api/teacher/ai/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.project) {
      setProjects((p) => [data.project, ...p]);
      setExpandedProjectId(data.project.id);
      setProjectsOpen(true);
      toast(`Project "${name}" created.`, "success");
    }
    setNewProjectName("");
    setProjectDialogOpen(false);
  }

  function newChatInProject(p: Project) {
    setExpandedProjectId(p.id);
    setActiveChatId(null);
    setMessages([]);
    inputRef.current?.focus();
    toast(`New chat in "${p.name}"`, "info");
  }

  async function confirmDeleteChat() {
    if (!deleteTarget) return;
    const chatId = deleteTarget;
    setDeleteTarget(null);
    await fetch("/api/teacher/ai/chats", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId }),
    });
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) { setActiveChatId(null); setMessages([]); }
    toast("Chat deleted.", "success");
  }

  async function saveRename(chatId: string) {
    const title = renameValue.trim();
    setRenamingId(null);
    if (!title) return;
    await fetch("/api/teacher/ai/chats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, title }),
    });
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const att = await fileToAttachment(file);
      if (att) setAttachments((prev) => [...prev, att]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function ChatRow({ chat }: { chat: Chat }) {
    if (renamingId === chat.id) {
      return (
        <div className="flex w-full items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename(chat.id);
              if (e.key === "Escape") setRenamingId(null);
            }}
            onBlur={() => saveRename(chat.id)}
            className="min-w-0 flex-1 rounded border border-sky-300 bg-white px-1.5 py-0.5 text-sm outline-none"
          />
        </div>
      );
    }
    return (
      <button
        onClick={() => setActiveChatId(chat.id)}
        className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
          activeChatId === chat.id ? "bg-slate-200/70 font-medium text-navy-900" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <MessageSquare size={14} className="shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-sm">{chat.title}</span>
        <span className="hidden items-center gap-1 group-hover:flex">
          <span role="button" onClick={(e) => { e.stopPropagation(); setRenamingId(chat.id); setRenameValue(chat.title); }} className="text-slate-400 hover:text-sky-600" title="Rename">
            <Pencil size={12} />
          </span>
          <span role="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget(chat.id); }} className="text-slate-400 hover:text-rose-500" title="Delete">
            <Trash2 size={12} />
          </span>
        </span>
      </button>
    );
  }

  function MsgActions({ msg, index }: { msg: Message; index: number }) {
    return (
      <div className="mt-1 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <button onClick={() => copyMsg(msg.id, msg.content)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title="Copy">
          {copiedId === msg.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          {copiedId === msg.id ? "Copied" : "Copy"}
        </button>
        {msg.role === "user" && (
          <button onClick={() => editUser(index)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title="Edit & resend">
            <Pencil size={12} /> Edit
          </button>
        )}
        {msg.role === "assistant" && index === lastAssistantIdx && (
          <button onClick={regenerate} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title="Regenerate">
            <RefreshCw size={12} /> Regenerate
          </button>
        )}
        {msg.provider && <span className="ml-1 text-[10px] text-slate-400">via {msg.provider}</span>}
      </div>
    );
  }

  return (
    <>
      <TeacherTopbar title="AI Assistant" description="Chat with AI to get help with your exams" />
      <div className="flex h-[calc(100vh-80px)]">
        {/* ===== SIDEBAR ===== */}
        {sidebarOpen && (
          <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
              <EsameLogo height={24} />
              <button onClick={() => setSidebarOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-900" title="Hide sidebar">
                <PanelLeftClose size={16} />
              </button>
            </div>

            <div className="space-y-2 p-3">
              <button onClick={() => { setActiveChatId(null); inputRef.current?.focus(); }} className="flex w-full items-center gap-3 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
                <SquarePen size={15} /> New Chat
              </button>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {q ? (
                <div className="space-y-0.5">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Results</p>
                  {searchResults.map((c) => <ChatRow key={c.id} chat={c} />)}
                  {searchResults.length === 0 && <p className="px-3 py-2 text-xs text-slate-400">No chats match &quot;{search}&quot;</p>}
                </div>
              ) : (
                <>
                  <button onClick={() => setProjectsOpen((v) => !v)} className="flex w-full items-center justify-between px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600">
                    Projects <ChevronDown size={13} className={`transition-transform ${projectsOpen ? "" : "-rotate-90"}`} />
                  </button>
                  {projectsOpen && (
                    <div className="space-y-0.5">
                      <button onClick={() => setProjectDialogOpen(true)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100">
                        <FolderPlus size={14} className="text-slate-400" /> New Project
                      </button>
                      {projects.map((p) => {
                        const open = expandedProjectId === p.id;
                        const pChats = chats.filter((c) => c.projectId === p.id);
                        return (
                          <div key={p.id}>
                            <div className={`group flex w-full items-center rounded-lg transition ${open ? "bg-slate-200/70" : "hover:bg-slate-100"}`}>
                              <button onClick={() => setExpandedProjectId(open ? null : p.id)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm">
                                <Folder size={14} className={open ? "text-sky-500" : "text-slate-400"} />
                                <span className={`flex-1 truncate text-left ${open ? "font-medium text-navy-900" : "text-slate-600"}`}>{p.name}</span>
                                <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`} />
                              </button>
                              <button onClick={() => newChatInProject(p)} className="mr-2 hidden shrink-0 rounded-md p-1 text-slate-400 hover:bg-white hover:text-sky-600 group-hover:block" title={`New chat in ${p.name}`}>
                                <SquarePen size={13} />
                              </button>
                            </div>
                            {open && (
                              <div className="ml-4 space-y-0.5 border-l border-slate-200 py-0.5 pl-3">
                                {pChats.map((c) => <ChatRow key={c.id} chat={c} />)}
                                {pChats.length === 0 && <p className="px-3 py-1 text-xs text-slate-400">No chats yet — click the pen icon to start one.</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {projects.length === 0 && <p className="px-3 py-1 text-xs text-slate-400">No projects yet</p>}
                    </div>
                  )}

                  <button onClick={() => setAllChatsOpen((v) => !v)} className="flex w-full items-center justify-between px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600">
                    All chats <ChevronDown size={13} className={`transition-transform ${allChatsOpen ? "" : "-rotate-90"}`} />
                  </button>
                  {allChatsOpen && groupChats(standaloneChats).map((g) => (
                    <div key={g.label}>
                      <p className="px-3 pb-1 pt-2 text-[11px] text-slate-400">{g.label}</p>
                      <div className="space-y-0.5">{g.items.map((c) => <ChatRow key={c.id} chat={c} />)}</div>
                    </div>
                  ))}
                  {allChatsOpen && standaloneChats.length === 0 && <p className="px-3 py-1 text-xs text-slate-400">No chats yet</p>}
                </>
              )}
            </div>
          </div>
        )}

        {/* ===== CHAT AREA ===== */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy-900" title="Show sidebar">
                <PanelLeftOpen size={16} />
              </button>
            )}
            <span className="truncate text-sm font-semibold text-navy-900">
              {activeChatId ? chats.find((c) => c.id === activeChatId)?.title ?? "Chat" : "New chat"}
            </span>
            {activeProject && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                <Folder size={11} /> {activeProject.name}
              </span>
            )}
          </div>

                    <div ref={scrollBoxRef} onScroll={onScrollBox} className="flex-1 space-y-5 overflow-y-auto p-6">
            {messages.length === 0 && !isStreaming && (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-lg text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-sky-400 to-sky-600">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-navy-900">Welcome to ESAME AI</h2>
                  <p className="mb-5 text-slate-500">Ask anything in English or Khmer, attach images / PDF / Word / Excel, generate exams, and more.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p} onClick={() => { setInput(p); inputRef.current?.focus(); }} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:text-sky-700">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const ex = msg.role === "assistant" ? extractExamDraft(msg.content) : null;
              return (
                <div key={msg.id} className={`group flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-3xl rounded-2xl px-5 py-3 ${msg.role === "user" ? "bg-navy-900 text-white" : "border border-slate-200 bg-white"}`}>
                                        {msg.role === "assistant" ? (
                      <div className="md-body max-w-none"><ReactMarkdown components={MD_COMPONENTS} remarkPlugins={[remarkBreaks]}>{ex!.clean}</ReactMarkdown></div>
                    ) : (
                      <UserBubble msg={msg} />
                    )}
                  </div>
                  {ex?.draft && <ExamDraftCard draft={ex.draft} />}
                  <MsgActions msg={msg} index={i} />
                </div>
              );
            })}

            {isStreaming && streamingText && (
              <div className="flex flex-col items-start">
                <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-3">
                                    <div className="md-body max-w-none"><ReactMarkdown components={MD_COMPONENTS} remarkPlugins={[remarkBreaks]}>{extractExamDraft(streamingText).clean}</ReactMarkdown></div>
                </div>
              </div>
            )}
            {isStreaming && !streamingText && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ===== INPUT (white theme pill bar) ===== */}
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mx-auto max-w-3xl">
              {attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {a.kind === "image" && a.dataUrl ? <img src={a.dataUrl} alt="" className="h-4 w-4 rounded object-cover" /> : <Paperclip size={12} />}
                      <span className="max-w-[140px] truncate">{a.name}</span>
                      <button onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))} className="hover:text-rose-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}

              <input ref={fileInputRef} type="file" multiple accept="image/*,.txt,.md,.csv,.xlsx,.xls,.pdf,.docx,.doc" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

              <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-navy-900 disabled:opacity-40"
                  title="Attach image / PDF / Word / Excel"
                >
                  <Plus size={18} />
                </button>

                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask anything in English or Khmer..."
                  disabled={isStreaming}
                  className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-navy-900 placeholder-slate-400 outline-none disabled:opacity-50"
                />

                <button
                  onClick={toggleMic}
                  disabled={isStreaming}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition disabled:opacity-40 ${
                    listening ? "animate-pulse bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-100 hover:text-navy-900"
                  }`}
                  title="Voice input (auto English / Khmer)"
                >
                  <Mic size={17} />
                </button>

                {isStreaming ? (
                  <button
                    onClick={stopGeneration}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600"
                    title="Stop generating"
                  >
                    <Square size={15} />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() && attachments.length === 0}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white transition hover:bg-navy-800 disabled:bg-slate-200 disabled:text-slate-400"
                    title="Send"
                  >
                    <Send size={15} />
                  </button>
                )}
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-400">AI can make mistakes. Check important info.</p>
            </div>
          </div>
        </div>
      </div>

      {/* New project dialog */}
      <Dialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} className="max-w-sm">
        <DialogHeader title="New project" onClose={() => setProjectDialogOpen(false)} />
        <div className="space-y-4 px-6 py-5">
          <input autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createProject()} placeholder="e.g. Grade 12 Physics, Midterm prep..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={createProject} disabled={!newProjectName.trim()}><FolderPlus size={14} /> Create</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete chat confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteChat}
        title="Delete this chat?"
        description="All messages in this chat will be permanently removed."
        confirmLabel="Delete"
      />

      <ToastHost />
    </>
  );
}