import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiChats, aiMessages } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get("chatId");

  if (chatId) {
    // Get specific chat with messages
    const [chat] = await db
      .select()
      .from(aiChats)
      .where(and(eq(aiChats.id, chatId), eq(aiChats.teacherId, session.userId)))
      .limit(1);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.chatId, chatId))
      .orderBy(aiMessages.createdAt);

    return NextResponse.json({ chat, messages });
  }

  // List all chats for this teacher
  const chats = await db
    .select()
    .from(aiChats)
    .where(eq(aiChats.teacherId, session.userId))
    .orderBy(desc(aiChats.updatedAt));

  return NextResponse.json({ chats });
}

export async function DELETE(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId } = await req.json();

  await db
    .delete(aiChats)
    .where(and(eq(aiChats.id, chatId), eq(aiChats.teacherId, session.userId)));

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { chatId, title, isPinned } = await req.json();

  await db
    .update(aiChats)
    .set({
      title: title !== undefined ? title : undefined,
      isPinned: isPinned !== undefined ? isPinned : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(aiChats.id, chatId), eq(aiChats.teacherId, session.userId)));

  return NextResponse.json({ success: true });
}