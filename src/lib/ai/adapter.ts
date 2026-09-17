// ============================================================
// ESAME AI Adapter — Smart routing with task classification
// ============================================================

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3.8:27b-mlx";
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || OLLAMA_MODEL;
const OLLAMA_FAST_MODEL = process.env.OLLAMA_FAST_MODEL || "qwen3:8b";
const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL || "qwen3:8b";

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

// ---------- TASK CLASSIFICATION ----------
type TaskType = "simple" | "complex" | "code" | "creative" | "translate";

interface TaskConfig {
  model: string;
  temperature: number;
  think: boolean;
  reason: string;
}

function classifyTask(messages: ChatMessage[]): TaskConfig {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return { model: OLLAMA_FAST_MODEL, temperature: 0.7, think: false, reason: "no user message" };
  
  const text = (lastUser.content || "").toLowerCase();
  
  // 1. Code tasks → 27B, low temp, think mode
  if (/\b(code|program|debug|refactor|function|algorithm|sql|regex|python|java|javascript|typescript|html|css|api|compile|syntax|script)\b/.test(text)) {
    return { model: OLLAMA_MODEL, temperature: 0.2, think: true, reason: "code" };
  }
  
  // 2. Complex tasks → 27B, low temp, think mode
  if (/\b(exam|quiz|test|grade|grading|rubric|analyz|analyse|analysis|summar|summary|essay|lesson|curriculum|plan|design|architect|math|calculat|solve|prove|proof|compare|contrast|research|thesis|report|step.by.step|complex|why|how does|explain in detail)\b/.test(text)) {
    return { model: OLLAMA_MODEL, temperature: 0.3, think: true, reason: "complex" };
  }
  
  // 3. Creative writing → 27B, high temp, no think
  if (/\b(story|poem|creative|imagine|fiction|write a|compose|invent|brainstorm)\b/.test(text)) {
    return { model: OLLAMA_MODEL, temperature: 0.9, think: false, reason: "creative" };
  }
  
  // 4. Translation → 8B, low temp, no think (fast + precise)
  if (/\b(translate|translation|in khmer|in english|to khmer|to english)\b/.test(text)) {
    return { model: OLLAMA_FAST_MODEL, temperature: 0.3, think: false, reason: "translate" };
  }
  
  // 5. Simple chat/questions → 8B, moderate temp, no think (fast lane)
  return { model: OLLAMA_FAST_MODEL, temperature: 0.7, think: false, reason: "simple" };
}

// ---------- main entry ----------
export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  options: { provider?: string; temperature?: number; think?: boolean; forceModel?: string } = {}
) {
  // Classify the task to determine optimal model + settings
  const task = classifyTask(messages);
  
  // Use explicit options if provided (for manual Deep Think toggle), otherwise use classifier
  const model = options.forceModel || task.model;
  const temperature = options.temperature ?? task.temperature;
  const think = options.think ?? task.think;
  
  console.log(`[AI-ROUTER] Task: ${task.reason} → ${model} (temp: ${temperature}, think: ${think})`);
  
  // Track how many tokens we've sent to the UI
  let sentTokens = 0;
  const wrapped: StreamCallbacks = {
    ...callbacks,
    onToken: (t) => { sentTokens++; callbacks.onToken(t); },
  };

  try {
    // Try the selected model first
    await streamOllama(messages, { name: "ollama", model, maxTokens: 8192 }, wrapped, temperature, think);
  } catch (error: any) {
    const errMsg = String(error?.message || "");
    const isOOM = /500|memory|oom|out of memory|killed|fetch failed/i.test(errMsg);
    
    // ONLY retry with the fallback model if we haven't sent ANY tokens to the UI yet
    if (isOOM && sentTokens === 0 && model !== OLLAMA_FALLBACK_MODEL) {
      console.log(`[AI-ROUTER] OOM detected, falling back to ${OLLAMA_FALLBACK_MODEL}`);
      try {
        await streamOllama(messages, { name: "ollama", model: OLLAMA_FALLBACK_MODEL, maxTokens: 8192 }, callbacks, temperature, think);
        return;
      } catch (retryError: any) {
        callbacks.onError(retryError instanceof Error ? retryError : new Error(String(retryError)));
        return;
      }
    } 
    
    // If the model crashed MID-STREAM (sentTokens > 0), gracefully finish 
    // the message instead of throwing an error and appending a second response
    if (sentTokens > 0) {
      callbacks.onEnd({ provider: "ollama", model, tokens: sentTokens });
      return;
    }

    // If it failed before sending anything and wasn't an OOM, show the error
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ---------- LOCAL OLLAMA (unlimited, private, vision-native) ----------
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