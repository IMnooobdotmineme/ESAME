import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params; // Next.js 15/16 requires awaiting params
    const body = await req.json();
    const { archived } = body;

    if (typeof archived !== "boolean") {
      return NextResponse.json({ error: "Invalid archived value" }, { status: 400 });
    }

    const updated = await db
      .update(notifications)
      .set({ isArchived: archived })
      .where(eq(notifications.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive notification error:", error);
    return NextResponse.json({ error: "Failed to archive notification" }, { status: 500 });
  }
}