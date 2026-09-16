// Safe PDF text extraction for browser AND Node/SSR contexts.
// pdfjs-dist references DOM globals (DOMMatrix/DOMPoint) that are missing
// in Node or some worker scopes — polyfill them BEFORE pdfjs loads.

if (typeof (globalThis as any).DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true; isIdentity = true;
    constructor(init?: any) {
      if (Array.isArray(init)) {
        this.a = init[0] ?? 1; this.b = init[1] ?? 0; this.c = init[2] ?? 0;
        this.d = init[3] ?? 1; this.e = init[4] ?? 0; this.f = init[5] ?? 0;
      }
    }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    multiply() { return this; }
    inverse() { return this; }
    transformPoint(p: any) { return p ?? { x: 0, y: 0, z: 0, w: 1 }; }
    toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`; }
  };
}
if (typeof (globalThis as any).DOMPoint === "undefined") {
  (globalThis as any).DOMPoint = class {
    x: number; y: number; z: number; w: number;
    constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
  };
}
if (typeof (globalThis as any).Path2D === "undefined") {
  (globalThis as any).Path2D = class { moveTo() {} lineTo() {} closePath() {} rect() {} };
}

export async function extractPdfText(buf: ArrayBuffer | Uint8Array): Promise<string> {
    // @ts-ignore — legacy build ships without bundled types
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Run the PDF worker on the main thread (works in Node AND browser, no workerSrc needed)
  if (!(globalThis as any).pdfjsWorker) {
    // @ts-ignore
    (globalThis as any).pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  }
    // pdfjs rejects Node Buffer — normalize to a plain Uint8Array copy
  const bytes = new Uint8Array(buf);
  const doc = await pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str).join(" ") + "\n";
    try { page.cleanup?.(); } catch {}
  }
  try {
    if (typeof doc.destroy === "function") await doc.destroy();
    else if (doc.loadingTask) await doc.loadingTask.destroy();
  } catch {}
  return text.trim();
}