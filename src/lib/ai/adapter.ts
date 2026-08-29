// ============================================================
// ESAME AI Adapter — Ollama only (local or self-hosted)
// ============================================================

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.8:27b-mlx";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || OLLAMA_MODEL;

// ---------- types ----------
export interface AIProvider {
  name: string;
  model: string;
  maxTokens: number;
}

export interface AIAttachment {
  type: string;
  name: string;
  dataUrl?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: AIAttachment[];
}

export interface StreamCallbacks {
  onThinking?: (text: string) => void;
  onToken: (text: string) => void;
  onEnd: (metadata: { provider: string; model: string; tokens: number }) => void;
  onError: (error: Error) => void;
}

export function getAvailableProviders(): AIProvider[] {
  return [{ name: "ollama", model: OLLAMA_MODEL, maxTokens: 8192 }];
}

// ---------- main entry ----------
export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
    options: { provider?: string; temperature?: number; think?: boolean } = {}
) {
  try {
    await streamOllama(messages, { name: "ollama", model: OLLAMA_MODEL, maxTokens: 8192 }, callbacks, options.temperature, options.think);
  } catch (error: any) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ---------- ✅ LOCAL OLLAMA (unlimited, private, vision-native) ----------
async function streamOllama(
  messages: ChatMessage[],
  provider: AIProvider,
  callbacks: StreamCallbacks,
  temperature = 0.7,
  think = false
) {
  const hasImages = messages.some((m) =>
    (m.attachments ?? []).some((a) => a.dataUrl?.startsWith("data:image/"))
  );
  const model = hasImages ? OLLAMA_VISION_MODEL : OLLAMA_MODEL;

  const ollamaMessages = messages.map((m) => {
    const imgs = (m.attachments ?? [])
      .filter((a) => a.dataUrl?.startsWith("data:image/"))
      .map((a) => a.dataUrl!.split(",")[1]);
    const msg: any = { role: m.role, content: m.content };
    if (imgs.length) msg.images = imgs;
    return msg;
  });

  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: ollamaMessages,
      stream: true,
            options: { temperature, num_ctx: 8192 },
      ...(think ? { think: true } : {}),
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Ollama ${res.status}: ${t.slice(0, 200)} — make sure the model "${model}" is pulled and Ollama is running at ${OLLAMA_BASE_URL}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let tokens = 0;
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
                const json = JSON.parse(line);
        const th = json?.message?.thinking;
        if (th) callbacks.onThinking?.(th);
        const text = json?.message?.content;
        if (text) {
          callbacks.onToken(text);
          tokens += text.split(/\s+/).length;
        }
      } catch {}
    }
  }

  callbacks.onEnd({ provider: "ollama", model, tokens });
}