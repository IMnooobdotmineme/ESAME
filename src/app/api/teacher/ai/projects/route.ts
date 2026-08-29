import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiChats, aiProjects, teachers } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireTeacherSession } from "@/lib/session";

export async function GET() {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db
    .select()
    .from(aiProjects)
    .where(eq(aiProjects.teacherId, session.userId))
    .orderBy(desc(aiProjects.createdAt));

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await req.json();

  const [teacher] = await db
    .select({ orgId: teachers.orgId })
    .from(teachers)
    .where(eq(teachers.id, session.userId));
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  const [project] = await db
    .insert(aiProjects)
    .values({
      orgId: teacher.orgId,
      teacherId: session.userId,
      name,
      description,
    })
    .returning();

  return NextResponse.json({ project });
}

export async function DELETE(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  await db
    .update(aiChats)
    .set({ projectId: null })
    .where(and(eq(aiChats.projectId, projectId), eq(aiChats.teacherId, session.userId)));

  await db
    .delete(aiProjects)
    .where(and(eq(aiProjects.id, projectId), eq(aiProjects.teacherId, session.userId)));

  return NextResponse.json({ success: true });
}
