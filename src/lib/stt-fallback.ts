let pipePromise: Promise<any> | null = null;

async function toMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuf = await blob.arrayBuffer();
  const AudioCtx: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  const ch = decoded.getChannelData(0);
  if (decoded.sampleRate === 16000) {
    ctx.close();
    return ch;
  }
  const offline = new OfflineAudioContext(
    1,
    Math.max(1, Math.ceil((ch.length * 16000) / decoded.sampleRate)),
    16000
  );
  const srcBuf = offline.createBuffer(1, ch.length, decoded.sampleRate);
  srcBuf.copyToChannel(ch, 0);
  const src = offline.createBufferSource();
  src.buffer = srcBuf;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  ctx.close();
  return rendered.getChannelData(0);
}

async function createPipe(onStatus?: (s: string) => void): Promise<any> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;

  if (typeof (navigator as any).gpu !== "undefined") {
    try {
      onStatus?.("Loading voice model (GPU mode, one-time ~80 MB)…");
      return await pipeline("automatic-speech-recognition", "Xenova/whisper-base", {
        device: "webgpu",
        dtype: "q8",
      });
    } catch (e) {
      console.warn("[STT] WebGPU pipeline failed, falling back to CPU mode:", e);
    }
  }

  onStatus?.("Loading voice model (CPU mode, one-time download)…");
  return await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
    device: "wasm",
    dtype: "fp32",
  });
}

export async function transcribeBlob(
  blob: Blob,
  onStatus?: (s: string) => void,
  lang?: "en" | "km" | null
): Promise<string> {
  if (!pipePromise) {
    pipePromise = createPipe(onStatus).catch((e) => {
      pipePromise = null;
      throw e;
    });
  }
  const pipe = await pipePromise;
  onStatus?.("Transcribing on device…");
  const raw = await toMono16k(blob);

  let peak = 0;
  for (let i = 0; i < raw.length; i++) peak = Math.max(peak, Math.abs(raw[i]));
  if (peak < 0.002) return "";

  const gain = Math.min(8, 0.9 / peak);
  const norm = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) norm[i] = raw[i] * gain;

  const padded = new Float32Array(norm.length + 24000);
  padded.set(norm, 8000);

  const out: any = await pipe(padded, { language: lang ?? null, task: "transcribe" });
  return String(out?.text ?? "").trim();
}

export function pcmToWavBlob(chunks: Float32Array[], sampleRate: number): Blob {
  let len = 0;
  for (const c of chunks) len += c.length;
  const pcm16 = new Int16Array(len);
  let o = 0;
  for (const c of chunks) {
    for (let i = 0; i < c.length; i++) {
      const s = Math.max(-1, Math.min(1, c[i]));
      pcm16[o++] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }
  const buf = new ArrayBuffer(44);
  const header = new DataView(buf);
  const wstr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) header.setUint8(off + i, s.charCodeAt(i)); };
  wstr(0, "RIFF"); header.setUint32(4, 36 + len * 2, true); wstr(8, "WAVE");
  wstr(12, "fmt "); header.setUint32(16, 16, true); header.setUint16(20, 1, true); header.setUint16(22, 1, true);
  header.setUint32(24, sampleRate, true); header.setUint32(28, sampleRate * 2, true);
  header.setUint16(32, 2, true); header.setUint16(34, 16, true);
  wstr(36, "data"); header.setUint32(40, len * 2, true);
  return new Blob([buf, pcm16.buffer], { type: "audio/wav" });
}