"use client";

import { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Send, MessageSquare, Trash2, Sparkles, Paperclip, X,
  FolderPlus, Folder, Loader2, PanelLeftClose, PanelLeftOpen,
  Search, SquarePen, ChevronDown, Copy, Check, Pencil, Square, RefreshCw,
    FileText, Eye, Mic, Pin, MoreHorizontal, ArrowDown, Volume2, Download,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
const FOLLOWUPS = [
  { label: "🌐 Translate to Khmer", prompt: "Translate your previous answer into Khmer." },
  { label: "🧒 Explain simpler", prompt: "Explain your previous answer more simply, for a beginner." },
  { label: "✂️ Summarize", prompt: "Summarize your previous answer in 3-5 bullet points." },
  { label: "📝 Make a quiz", prompt: "Turn your previous answer into a 5-question quiz with answers." },
];



function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


// ---------- code block with language header + copy ----------
function CodeBlock({ children, ...rest }: any) {
  const [copied, setCopied] = useState(false);
  let lang = "";
  let code = "";
  try {
    const codeEl = Array.isArray(children) ? children[0] : children;
    lang = String(codeEl?.props?.className || "").replace("language-", "").trim();
    code = String(codeEl?.props?.children ?? "");
  } catch {}
  if (!code) {
    try { code = String(children ?? ""); } catch { code = ""; }
  }

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-slate-700/60 bg-[#282c34]">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{lang || "code"}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
            {code.length > 5000 ? (
        <pre className="overflow-x-auto p-4 text-xs text-slate-100">{code}</pre>
      ) : (
        <SyntaxHighlighter
          language={lang || "text"}
          
        style={oneDark}
        showLineNumbers
        lineNumberStyle={{ color: "#5b6472", fontSize: 11, minWidth: "2.25em" }}
        customStyle={{ margin: 0, padding: "0.9rem 0.75rem", background: "transparent", fontSize: 12, lineHeight: 1.7 }}
        codeTagProps={{ style: { fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } }}
      >
        {code}
              </SyntaxHighlighter>
      )}
    </div>
  );
}


function TableBlock({ children, ...rest }: any) {
  const ref = useRef<HTMLTableElement>(null);
  const [copied, setCopied] = useState(false);

  function copyTable() {
    const table = ref.current;
    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tr")).map((tr) =>
      Array.from((tr as HTMLTableRowElement).querySelectorAll("th,td")).map(
        (cell) => (cell as HTMLElement).innerText.trim()
      )
    );

    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const tsv = rows.map((r) => r.join("\t")).join("\n");
    const html =
      "<table>" +
      rows
        .map((r, i) => "<tr>" + r.map((c) => (i === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("") + "</tr>")
        .join("") +
      "</table>";

    try {
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([tsv], { type: "text/plain" }),
        }),
      ]);
    } catch {
      navigator.clipboard.writeText(tsv);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Table</span>
        <button
          type="button"
          onClick={copyTable}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm transition hover:text-navy-900"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table ref={ref} {...rest} className="w-full min-w-[560px] border-collapse text-sm">
          {children}
        </table>
      </div>
    </div>
  );
}

const MD_COMPONENTS = {
  pre: CodeBlock,
  table: TableBlock,
  thead: ({ children, ...props }: any) => (
    <thead {...props} className="bg-slate-50">{children}</thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody {...props} className="divide-y divide-slate-100 bg-white">{children}</tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr {...props} className="transition hover:bg-slate-50/70">{children}</tr>
  ),
  th: ({ children, ...props }: any) => (
    <th {...props} className="border-b border-slate-200 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className="px-4 py-3 align-top text-sm text-slate-700">{children}</td>
  ),
} as any;


// ---------- user bubble (white text on navy) ----------
function UserBubble({ msg }: { msg: any }) {
  const imgs = (msg.attachments ?? []).filter((a: any) => a.dataUrl);
  const files = (msg.attachments ?? []).filter((a: any) => !a.dataUrl);
  const text = String(msg.content ?? "").split("\n\n--- Attached file:")[0];
  return (
    <div className="flex max-w-[80%] flex-col items-end gap-2">
      {imgs.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
                    {imgs.map((a: any, i: number) => (
            <div key={a.name + i} className="h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
              <img src={a.dataUrl} alt={a.name} className="h-full w-full rounded-xl object-cover" />
            </div>
          ))}
        </div>
      )}
            {files.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2">
          {files.map((a: any, i: number) => (
            <div key={a.name + i} className="flex w-40 flex-col justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="line-clamp-2 break-all text-sm text-slate-700">{a.name}</p>
              <span className="w-fit rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {String(a.name).split(".").pop()}
              </span>
            </div>
          ))}
        </div>
      )}
      {text.trim() && (
        <div className="rounded-3xl rounded-br-lg bg-navy-900 px-5 py-3 text-white shadow-sm">
          <p className="whitespace-pre-wrap text-sm text-white">{text}</p>
        </div>
      )}
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
function renderMarkdownText(text: string) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n");
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
    const sorted = [...list].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || +new Date(b.updatedAt) - +new Date(a.updatedAt));
  const groups: { label: string; items: Chat[] }[] = [];
  for (const chat of sorted) {
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
      <div className="mt-3 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
  const [searchOpen, setSearchOpen] = useState(false);
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
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
    const [showJump, setShowJump] = useState(false);
    const [creatingProject, setCreatingProject] = useState(false);
      const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [editFromId, setEditFromId] = useState<string | null>(null);
  const [streamFor, setStreamFor] = useState<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
    const streamRef = useRef("");
  const rafPending = useRef(false);
  const tokenCountRef = useRef(0);
  const streamingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<any>(null);
// ---------- memoized assistant content (keeps the page fast) ----------
const AssistantContent = memo(function AssistantContent({ content }: { content: string }) {
  const ex = extractExamDraft(content);
  return (
    <>
      <div className="md-body w-full">
        <ReactMarkdown components={MD_COMPONENTS} remarkPlugins={[remarkGfm, remarkBreaks]}>{renderMarkdownText(ex.clean)}</ReactMarkdown>
      </div>
      {ex.draft && <ExamDraftCard draft={ex.draft} />}
    </>
  );
});

  useEffect(() => {
    fetch("/api/teacher/ai/chats").then((r) => r.json()).then((d) => setChats(d.chats || []));
    fetch("/api/teacher/ai/projects").then((r) => r.json()).then((d) => setProjects(d.projects || []));
  }, []);

      useEffect(() => {
    activeChatIdRef.current = activeChatId;
    stickRef.current = true; // ✅ open chats at the latest message (bottom), like ChatGPT/Qwen
    setShowJump(false);
    if (!activeChatId) { setMessages([]); return; }
    fetch(`/api/teacher/ai/chats?chatId=${activeChatId}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        requestAnimationFrame(() => {
          const el = scrollBoxRef.current;
          if (el) el.scrollTop = el.scrollHeight; // instant jump to bottom
        });
      });
  }, [activeChatId]);

  useEffect(() => {
    if (stickRef.current) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // ✅ input auto-expands as you type
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  function onScrollBox() {
    const el = scrollBoxRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickRef.current = near;
    setShowJump(!near);
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
    function toggleSpeak(msg: Message) {
    try {
      if (speakingId === msg.id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const clean = msg.content
        .replace(/```[\s\S]*?```/g, " (code block) ")
        .replace(/[#*|>`_]/g, "")
        .slice(0, 3000);
            const u = new SpeechSynthesisUtterance(clean);
      u.lang = /[\u1780-\u17FF]/.test(clean) ? "km-KH" : "en-US";
      const match = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(u.lang.split("-")[0]));
      if (match) u.voice = match;
      u.onend = () => setSpeakingId(null);
      u.onerror = () => setSpeakingId(null);
      setSpeakingId(msg.id);
      window.speechSynthesis.speak(u);
    } catch {}
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

    async function runChat(userText: string, imageAtts: any[], baseHistory: Message[], displayAtts: any[] = [], editFromId: string | null = null) {
        setIsStreaming(true);
    streamingRef.current = true;
    stickRef.current = true;
    try { window.speechSynthesis.cancel(); } catch {}
    setStreamingText("");
    streamRef.current = "";
    const controller = new AbortController();
    abortRef.current = controller;
        const hadChat = !!activeChatId;
    const originKey = activeChatId ?? "new";
    setStreamFor(originKey);

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
          editFromId,
          history: baseHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

            refreshChats(); // ✅ sidebar re-orders immediately, no manual refresh
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No response stream");
      if (!response.ok) {
        throw new Error(`Server error (${response.status}) — please try again.`);
      }
      const handleLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        let json: any;
        try { json = JSON.parse(line.slice(6)); } catch { return; }
                    if (json.type === "token") {
          streamRef.current += json.text;
          tokenCountRef.current = (tokenCountRef.current || 0) + 1;
          if (!rafPending.current && tokenCountRef.current % 3 === 0) {
            rafPending.current = true;
            requestAnimationFrame(() => {
              rafPending.current = false;
              setStreamingText(streamRef.current);
            });
          }
        } else if (json.type === "done") {
          gotDone = true;
          newChatId = json.chatId;
        } else if (json.type === "error") {
          toast(json.message || "AI error", "error");
        }
      };

      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          handleLine(line);
        }
      }
      if (buf.trim()) for (const line of buf.split("\n")) handleLine(line);

      streamRef.current = "";
      setStreamingText("");
      setIsStreaming(false);
      streamingRef.current = false;

      if (!hadChat && newChatId) {
        await fetch("/api/teacher/ai/chats", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId: newChatId, title: userText.slice(0, 40) || "New chat" }),
        });
      }

            // ✅ resync from DB — only update the view if user is still on the originating chat
      const viewKey = activeChatIdRef.current ?? "new";
      if (viewKey === originKey) {
        const list = await fetch("/api/teacher/ai/chats").then((r) => r.json()).then((d) => d.chats || []);
        const target = activeChatIdRef.current
          ? list.find((c: Chat) => c.id === activeChatIdRef.current)
          : newChatId
          ? list.find((c: Chat) => c.id === newChatId)
          : list[0];
        if (target) {
          const d = await fetch(`/api/teacher/ai/chats?chatId=${target.id}`).then((r) => r.json());
          if (d.messages?.length) {
            setMessages(d.messages);
            setActiveChatId(target.id);
          }
        }
      }
      setStreamFor(null);
      await refreshChats();
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
      setStreamFor(null);
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
    const editId = editFromId;
    setInput("");
    setAttachments([]);
    setEditFromId(null);
    await runChat(userText, imageAtts, base, displayAtts, editId);
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
    if (isStreaming) stopGeneration();
    const msg = messages[index];
    setMessages(messages.slice(0, index));

    // ✅ restore attachments so you can add more / delete before resending
    const restored: Attachment[] = [];
    (msg.attachments ?? []).forEach((a: any) => {
      if (a.dataUrl) restored.push({ id: crypto.randomUUID(), name: a.name, kind: "image", dataUrl: a.dataUrl });
    });

    const parts = String(msg.content ?? "").split("\n\n--- Attached file: ");
    const userText = parts[0] ?? "";
    for (let i = 1; i < parts.length; i++) {
      const block = parts[i];
      const nl = block.indexOf("\n");
      const header = block.slice(0, nl).replace(/ ---$/, "").trim();
      const text = block.slice(nl + 1);
      restored.push({ id: crypto.randomUUID(), name: header, kind: "text", text });
    }

        setAttachments(restored);
    setInput(userText);
    setEditFromId(msg.id);
    inputRef.current?.focus();
  }

    async function createProject() {
    const name = newProjectName.trim();
    if (!name || creatingProject) return; 
    setCreatingProject(true);
    try {
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
    } finally {
      setCreatingProject(false);
    }
  }

  function newChatInProject(p: Project) {
    setExpandedProjectId(p.id);
    setActiveChatId(null);
    setMessages([]);
    inputRef.current?.focus();
    toast(`New chat in "${p.name}"`, "info");
  }

  async function confirmDeleteProject() {
    if (!deleteProjectId) return;
    const id = deleteProjectId;
    setDeleteProjectId(null);
    await fetch("/api/teacher/ai/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (expandedProjectId === id) setExpandedProjectId(null);
    await refreshChats();
    toast("Project deleted — its chats moved to All chats.", "success");
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

  async function pinChat(chatId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const target = chats.find((c) => c.id === chatId);
    if (!target) return;
    const isPinned = !target.isPinned;
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, isPinned } : c)));
    await fetch("/api/teacher/ai/chats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, isPinned }),
    });
    toast(isPinned ? "Chat pinned." : "Chat unpinned.", "success");
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

    const MAX_ATTACHMENTS = 10; // ✅ max 10 files per message — send again for more

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files);
    const room = MAX_ATTACHMENTS - attachments.length;

    if (room <= 0) {
      toast(`Max ${MAX_ATTACHMENTS} files per message. Send this one first, then attach more.`, "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (list.length > room) {
      toast(`Only ${room} more file(s) fit in this message (max ${MAX_ATTACHMENTS}) — extras were skipped.`, "info");
    }

    for (const file of list.slice(0, room)) {
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
      <div
        onClick={() => setActiveChatId(chat.id)}
        className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
          activeChatId === chat.id ? "bg-slate-200/70 font-medium text-navy-900" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <MessageSquare size={14} className="shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-sm">{chat.title}</span>
        <span className={`${chat.isPinned ? "flex" : "hidden group-hover:flex"} items-center`}>
          <span className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuChatId(menuChatId === chat.id ? null : chat.id); }}
              className={`rounded-md p-1 hover:bg-white hover:text-navy-900 ${chat.isPinned ? "text-sky-600" : "text-slate-400"}`}
              title="Chat options"
            >
              {chat.isPinned ? <Pin size={12} /> : <MoreHorizontal size={13} />}
            </button>
            {menuChatId === chat.id && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuChatId(null); }} />
                <div className="absolute right-0 top-6 z-50 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <button onClick={(e) => { e.stopPropagation(); setMenuChatId(null); pinChat(chat.id, e as any); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">
                    <Pin size={12} /> {chat.isPinned ? "Unpin" : "Pin"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuChatId(null); setRenamingId(chat.id); setRenameValue(chat.title); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">
                    <Pencil size={12} /> Rename
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuChatId(null); setDeleteTarget(chat.id); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
                  </span>
        </span>
      </div>
    );
  }

      function MsgActions({ msg, index, alwaysShow }: { msg: Message; index: number; alwaysShow?: boolean }) {
    return (
            <div className="mt-1 flex translate-y-1 items-center gap-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <button onClick={() => copyMsg(msg.id, msg.content)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title="Copy">
          {copiedId === msg.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
          {copiedId === msg.id ? "Copied" : "Copy"}
        </button>
        {msg.role === "user" && (
          <button onClick={() => editUser(index)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title="Edit & resend">
            <Pencil size={12} /> Edit
          </button>
        )}
        {msg.role === "assistant" && (
          <button onClick={() => toggleSpeak(msg)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title={speakingId === msg.id ? "Stop reading" : "Read aloud"}>
            {speakingId === msg.id ? <Square size={12} className="text-rose-500" /> : <Volume2 size={12} />}
            {speakingId === msg.id ? "Stop" : "Listen"}
          </button>
        )}
        {msg.role === "assistant" && index === lastAssistantIdx && (
          <button onClick={regenerate} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-slate-100 hover:text-navy-900" title="Regenerate">
            <RefreshCw size={12} /> Regenerate
          </button>
        )}
        {msg.role === "assistant" && (
          <span className="ml-1 text-[10px] text-slate-400">
            {new Date(msg.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
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
              {searchOpen ? (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => { if (!search.trim()) setSearchOpen(false); }}
                    placeholder="Search chats"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-8 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                  <button onClick={() => { setSearch(""); setSearchOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900"><X size={13} /></button>

                  {/* ✅ quick-find dropdown — see old conversations instantly */}
                  <div className="absolute left-0 right-0 top-11 z-50 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {(q ? searchResults : chats).slice(0, 30).map((c) => (
                      <button
                        key={c.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setActiveChatId(c.id);
                          setSearch("");
                          setSearchOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                          activeChatId === c.id ? "bg-slate-200/70 font-medium text-navy-900" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <MessageSquare size={13} className="shrink-0 text-slate-400" />
                        <span className="flex-1 truncate">{c.title}</span>
                      </button>
                    ))}
                    {(q ? searchResults : chats).length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">No chats found.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setActiveChatId(null); inputRef.current?.focus(); }} className="flex flex-1 items-center gap-3 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
                    <SquarePen size={15} /> New Chat
                  </button>
                  <button onClick={() => setSearchOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-navy-900" title="Search chats">
                    <Search size={16} />
                  </button>
                </div>
              )}
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
                                                const pChats = chats.filter((c) => c.projectId === p.id).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || +new Date(b.updatedAt) - +new Date(a.updatedAt));
                        return (
                          <div key={p.id}>
                            <div className={`group flex w-full items-center rounded-lg transition ${open ? "bg-slate-200/70" : "hover:bg-slate-100"}`}>
                              <button onClick={() => setExpandedProjectId(open ? null : p.id)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm">
                                <Folder size={14} className={open ? "text-sky-500" : "text-slate-400"} />
                                <span className={`flex-1 truncate text-left ${open ? "font-medium text-navy-900" : "text-slate-600"}`}>{p.name}</span>
                                <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`} />
                              </button>
                              <span className="relative mr-1 hidden shrink-0 group-hover:block">
                                <button onClick={() => setMenuProjectId(menuProjectId === p.id ? null : p.id)} className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-navy-900" title="Project options">
                                  <MoreHorizontal size={13} />
                                </button>
                                {menuProjectId === p.id && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setMenuProjectId(null)} />
                                    <div className="absolute right-0 top-6 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                                      <button onClick={() => { setMenuProjectId(null); newChatInProject(p); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">
                                        <SquarePen size={12} /> New chat here
                                      </button>
                                      <button onClick={() => { setMenuProjectId(null); setDeleteProjectId(p.id); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50">
                                        <Trash2 size={12} /> Delete project
                                      </button>
                                    </div>
                                  </>
                                )}
                              </span>
                            </div>
                            {open && (
                              <div className="ml-4 space-y-0.5 border-l border-slate-200 py-0.5 pl-3">
                                {pChats.map((c) => <ChatRow key={c.id} chat={c} />)}
                                {pChats.length === 0 && <p className="px-3 py-1 text-xs text-slate-400">No chats yet — use ⋯ → New chat here.</p>}
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
        <div className="relative flex flex-1 flex-col">
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
            {activeChatId && messages.length > 0 && (
              <button
                onClick={() => {
                  const title = chats.find((c) => c.id === activeChatId)?.title || "chat";
                  const md = messages.map((m) => `**${m.role === "user" ? "You" : "ESAME AI"}:**\n\n${m.content}`).join("\n\n---\n\n");
                  downloadText(`${title.slice(0, 30) || "chat"}.md`, `# ${title}\n\n${md}`);
                  toast("Chat exported as Markdown.", "success");
                }}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-navy-900"
                title="Export chat as Markdown"
              >
                <Download size={15} />
              </button>
            )}
          </div>

                    <div ref={scrollBoxRef} onScroll={onScrollBox} className="flex-1 space-y-6 overflow-y-auto px-6 py-6 md:px-12">
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
                <div key={msg.id} className="msg-in group mx-auto w-full max-w-3xl">
                                    {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <UserBubble msg={msg} />
                    </div>
                                    ) : (
                    <AssistantContent content={msg.content} />
                  )}
                  <div className={msg.role === "user" ? "flex justify-end" : ""}>
                      <MsgActions msg={msg} index={i} alwaysShow={msg.role === "assistant" && i === lastAssistantIdx} />
                  </div>
                  
                </div>
              );
            })}

                        {isStreaming && streamFor === (activeChatId ?? "new") && streamingText && (
              <div className="msg-in mx-auto w-full max-w-3xl">
                <div className="md-body w-full">
                  <ReactMarkdown components={MD_COMPONENTS} remarkPlugins={[remarkGfm, remarkBreaks]}>{renderMarkdownText(extractExamDraft(streamingText).clean)}</ReactMarkdown>
                </div>
              </div>
            )}
                        {isStreaming && streamFor === (activeChatId ?? "new") && !streamingText && (
              <div className="mx-auto w-full max-w-3xl">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

                    {showJump && (
            <button
              onClick={() => { stickRef.current = true; setShowJump(false); messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                            className="absolute bottom-24 left-1/2 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200/60 bg-white/70 text-slate-400 opacity-60 shadow-sm backdrop-blur transition hover:opacity-100 hover:text-navy-900"
              title="Scroll to bottom"
            >
              <ArrowDown size={16} />
            </button>
          )}

          {/* ===== INPUT ===== */}
          <div className="p-4">
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

              <div className="flex items-end gap-1 rounded-2xl bg-white p-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy-900 disabled:opacity-40"
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
                  placeholder="Ask anything"
                  className="flex-1 resize-none overflow-y-auto bg-transparent px-2 py-2 text-sm text-navy-900 placeholder-slate-400 outline-none"
                />

                <button
                  onClick={toggleMic}
                  disabled={isStreaming}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 ${
                    listening ? "animate-pulse bg-rose-50 text-rose-600" : "text-slate-500 hover:bg-slate-100 hover:text-navy-900"
                  }`}
                  title="Voice input (auto English / Khmer)"
                >
                  <Mic size={17} />
                </button>

                {isStreaming ? (
                  <button
                    onClick={stopGeneration}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white transition hover:bg-rose-600"
                    title="Stop generating"
                  >
                    <Square size={15} />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() && attachments.length === 0}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white transition hover:bg-navy-800 disabled:bg-slate-200 disabled:text-slate-400"
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
                        <Button onClick={createProject} disabled={!newProjectName.trim() || creatingProject}><FolderPlus size={14} /> {creatingProject ? "Creating..." : "Create"}</Button>
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

      {/* Delete project confirm */}
      <ConfirmDialog
        open={!!deleteProjectId}
        onClose={() => setDeleteProjectId(null)}
        onConfirm={confirmDeleteProject}
        title="Delete this project?"
        description="Chats inside will move to All chats (they won't be deleted)."
        confirmLabel="Delete"
      />

      <ToastHost />
    </>
  );
}