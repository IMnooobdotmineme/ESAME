import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examStudents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = String(body.requestId ?? "");
    const message = String(body.message ?? "").slice(0, 200);
    if (!requestId || !message) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    await db.update(examStudents).set({ violationMessage: message }).where(eq(examStudents.id, requestId));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}