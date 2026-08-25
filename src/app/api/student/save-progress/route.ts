import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    const answers = (body.answers ?? {}) as Record<string, string>;
    if (!requestId) return NextResponse.json({ error: "Missing session" }, { status: 400 });

    const rows = await db
      .update(examStudents)
      .set({ progress: answers, progressUpdatedAt: new Date() })
      .where(and(eq(examStudents.id, requestId), isNull(examStudents.completedAt)))
      .returning({ id: examStudents.id });

    if (rows.length === 0) return NextResponse.json({ error: "Not active" }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save progress error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}