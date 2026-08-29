import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import { requireTeacherSession } from "@/lib/session";

export const maxDuration = 60;
const require = createRequire(import.meta.url);

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, dataBase64 } = await req.json().catch(() => ({}));
  if (!name || !dataBase64) return NextResponse.json({ error: "Missing file data" }, { status: 400 });

  const buf = Buffer.from(dataBase64, "base64");
  if (buf.length > 15 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 15MB)." }, { status: 413 });

  const ext = String(name).toLowerCase().split(".").pop();
  try {
    let text = "";
    if (ext === "pdf") {
      const pdfParse = require("pdf-parse");
      const res = await pdfParse(buf);
      text = res.text || "";
    } else if (ext === "docx" || ext === "doc") {
      const mammoth = require("mammoth");
      const res = await mammoth.extractRawText({ buffer: buf });
      text = res.value || "";
    } else {
      return NextResponse.json({ error: "Unsupported file type for extraction." }, { status: 400 });
    }

    text = String(text).trim().slice(0, 30000);
    if (!text) {
      return NextResponse.json({ error: "No readable text found (scanned/image-only files are not supported yet)." }, { status: 422 });
    }
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: `Could not read file: ${String(e?.message || e).slice(0, 150)}` }, { status: 500 });
  }
}