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
const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || "qwen3:8b";

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  options: { provider?: string; temperature?: number; think?: boolean } = {}
) {
  // Track how many tokens we've sent to the UI
  let sentTokens = 0;
  const wrapped: StreamCallbacks = {
    ...callbacks,
    onToken: (t) => { sentTokens++; callbacks.onToken(t); },
  };

  try {
    // Try the primary 27B model first
    await streamOllama(messages, { name: "ollama", model: OLLAMA_MODEL, maxTokens: 8192 }, wrapped, options.temperature, options.think);
  } catch (error: any) {
    const errMsg = String(error?.message || "");
    const isOOM = /500|memory|oom|out of memory|killed|fetch failed/i.test(errMsg);
    
    // ONLY retry with the 8B model if we haven't sent ANY tokens to the UI yet
    if (isOOM && sentTokens === 0 && OLLAMA_MODEL !== OLLAMA_FALLBACK_MODEL) {
      try {
        await streamOllama(messages, { name: "ollama", model: OLLAMA_FALLBACK_MODEL, maxTokens: 8192 }, callbacks, options.temperature, options.think);
        return;
      } catch (retryError: any) {
        callbacks.onError(retryError instanceof Error ? retryError : new Error(String(retryError)));
        return;
      }
    } 
    
    // If the model crashed MID-STREAM (sentTokens > 0), gracefully finish 
    // the message instead of throwing an error and appending a second response
    if (sentTokens > 0) {
      callbacks.onEnd({ provider: "ollama", model: OLLAMA_MODEL, tokens: sentTokens });
      return;
    }

    // If it failed before sending anything and wasn't an OOM, show the error
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
    const model = hasImages && provider.model === OLLAMA_MODEL ? OLLAMA_VISION_MODEL : provider.model;

  const ollamaMessages = messages.map((m) => {
    const imgs = (m.attachments ?? [])
      .filter((a) => a.dataUrl?.startsWith("data:image/"))
      .map((a) => a.dataUrl!.split(",")[1]);
    const msg: any = { role: m.role, content: m.content };
    if (imgs.length) msg.images = imgs;
    return msg;
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: ollamaMessages,
        stream: true,
        options: { temperature, num_ctx: 8192 },
        ...(think ? { think: true } : {}),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Ollama took too long to respond (120s). It might be loading the model into memory. Please try again.");
    }
    throw err;
  }

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