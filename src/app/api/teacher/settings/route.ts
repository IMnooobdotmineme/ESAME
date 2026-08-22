// src/app/api/teacher/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, session.userId));
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        name: teacher.name || "",
        email: teacher.email,
        avatarUrl: teacher.avatarUrl || null,
        assignments: teacher.assignments || [],
      },
    });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updateData: any = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    await db.update(teachers).set(updateData).where(eq(teachers.id, session.userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}