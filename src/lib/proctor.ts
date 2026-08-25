import { getFingerprint } from "./fingerprint";

export type ProctorEventType =
  | "tab_switch" | "window_blur" | "fullscreen_exit" | "copy_attempt" | "cut_attempt"
  | "paste_attempt" | "right_click" | "blocked_key" | "devtools_key" | "devtools_open"
  | "second_display" | "navigation_attempt" | "dom_tamper" | "uniform_typing" | "no_mouse_movement";

export function startProctor(opts: {
  requestId: string;
  onLock?: () => void;
  getLocked?: () => boolean;
  getQuestion?: () => { questionId: string | null; startedAt: number | null };
  getIdle?: () => number;
}) {
  let stopped = false;

  function post(payload: Record<string, unknown>) {
    if (stopped) return;
    fetch("/api/student/proctor-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

    function lockNow(type: ProctorEventType, details?: Record<string, unknown>) {
    if (stopped) return;
    // ✅ Retry until the server actually saves the lock
    const send = (retries = 4) => {
      fetch("/api/student/proctor-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: opts.requestId, type, severity: "lock", details: details ?? {} }),
      })
        .then((r) => { if (!r.ok && retries > 0) setTimeout(() => send(retries - 1), 1500); })
        .catch(() => { if (retries > 0) setTimeout(() => send(retries - 1), 1500); });
    };
    send();
    opts.onLock?.();
  }

  function flagNow(type: ProctorEventType, details?: Record<string, unknown>) {
    post({ requestId: opts.requestId, type, severity: "flag", details: details ?? {} });
  }

  let fingerprint = "";
  getFingerprint().then((fp) => (fingerprint = fp));

  // Heartbeat
  const heartbeat = setInterval(async () => {
    if (stopped) return;
    const q = opts.getQuestion?.() ?? { questionId: null, startedAt: null };
    try {
      const res = await fetch("/api/student/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: opts.requestId,
          fingerprint,
          questionId: q.questionId,
          questionStartedAt: q.startedAt,
          idleSeconds: opts.getIdle?.() ?? 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.lock) opts.onLock?.();
    } catch { /* ignore */ }
  }, 5000);

  // ✅ 1. Tab switch (within browser) → LOCK immediately
  const onVisibility = () => {
    if (document.hidden) lockNow("tab_switch");
  };
  document.addEventListener("visibilitychange", onVisibility);

  // ✅ 1b. Window/app focus loss → LOCK immediately (no delay!)
  const onBlur = () => { lockNow("window_blur"); };
  window.addEventListener("blur", onBlur);

  // ✅ Catch pointer leaving the browser window (app switch indicator)
  const onPointerLeave = (e: PointerEvent) => {
    if (e.clientX <= 0 || e.clientY <= 0) lockNow("window_blur", { kind: "pointer_leave" });
  };
  window.addEventListener("pointerleave", onPointerLeave);

  // ✅ 2. Fullscreen exit → LOCK
  const onFullscreen = () => {
    if (!document.fullscreenElement) lockNow("fullscreen_exit");
  };
  document.addEventListener("fullscreenchange", onFullscreen);

  // ✅ 3/4. Copy / cut / paste → blocked + flag
  const onCopy = (e: Event) => { e.preventDefault(); flagNow("copy_attempt"); };
  const onCut = (e: Event) => { e.preventDefault(); flagNow("cut_attempt"); };
  const onPaste = (e: Event) => { e.preventDefault(); flagNow("paste_attempt"); };
  document.addEventListener("copy", onCopy);
  document.addEventListener("cut", onCut);
  document.addEventListener("paste", onPaste);

  // ✅ Right-click → blocked + flag
  const onContext = (e: Event) => { e.preventDefault(); flagNow("right_click"); };
  document.addEventListener("contextmenu", onContext);

  // ✅ Blocked keys
  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    const mod = e.ctrlKey || e.metaKey;
    if (k === "F11" || k === "Escape" || k === "PrintScreen") {
      e.preventDefault(); flagNow("blocked_key", { key: k });
    } else if (mod && ["t", "n", "w", "p", "u", "s"].includes(k.toLowerCase())) {
      e.preventDefault(); flagNow("blocked_key", { key: k });
    } else if (mod && e.shiftKey && ["k", "i", "j", "c"].includes(k.toLowerCase())) {
      e.preventDefault(); flagNow("devtools_key", { key: k });
    }
  };
  window.addEventListener("keydown", onKey);

  // Second monitor best-effort
  if ((screen as unknown as { isExtended?: boolean }).isExtended) flagNow("second_display");

  // Devtools heuristic
  const devtools = setInterval(() => {
    if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200)
      flagNow("devtools_open");
  }, 3000);

  // Back/forward
  history.pushState(null, "", location.href);
  const onPop = () => { history.pushState(null, "", location.href); flagNow("navigation_attempt"); };
  window.addEventListener("popstate", onPop);

  // Refresh/close
  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    (e as unknown as { returnValue: string }).returnValue = "";
    flagNow("navigation_attempt", { kind: "refresh" });
  };
  window.addEventListener("beforeunload", onBeforeUnload);

  // Uniform typing
  let keyTimes: number[] = [];
  const onType = (e: KeyboardEvent) => {
    if (e.key.length !== 1) return;
    keyTimes.push(Date.now());
    if (keyTimes.length > 30) keyTimes.shift();
    if (keyTimes.length >= 20) {
      const iv: number[] = [];
      for (let i = 1; i < keyTimes.length; i++) iv.push(keyTimes[i] - keyTimes[i - 1]);
      const mean = iv.reduce((a, b) => a + b, 0) / iv.length;
      const sd = Math.sqrt(iv.reduce((a, b) => a + (b - mean) ** 2, 0) / iv.length);
      if (mean < 8 && sd < 4) flagNow("uniform_typing", { mean, sd });
    }
  };
  window.addEventListener("keydown", onType);

  // No mouse
  let lastMouseMove = Date.now();
  const onMove = () => { lastMouseMove = Date.now(); };
  window.addEventListener("mousemove", onMove);
  const noMouse = setInterval(() => {
    if (Date.now() - lastMouseMove > 90000) flagNow("no_mouse_movement");
  }, 10000);

  // DOM tamper
  const domTamper = setInterval(() => {
    if (opts.getLocked?.() && !document.querySelector("[data-lock-overlay]")) {
      lockNow("dom_tamper");
    }
  }, 2000);

  return () => {
    stopped = true;
    clearInterval(heartbeat); clearInterval(devtools); clearInterval(noMouse); clearInterval(domTamper);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("fullscreenchange", onFullscreen);
    document.removeEventListener("copy", onCopy);
    document.removeEventListener("cut", onCut);
    document.removeEventListener("paste", onPaste);
    document.removeEventListener("contextmenu", onContext);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keydown", onType);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("popstate", onPop);
    window.removeEventListener("beforeunload", onBeforeUnload);
  };
}