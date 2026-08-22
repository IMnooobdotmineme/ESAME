// src/app/api/teacher/assignments/route.ts
import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [teacher] = await db.select({ assignments: teachers.assignments }).from(teachers).where(eq(teachers.id, session.userId));
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const assignments = (teacher.assignments || []) as Array<{ department: string; subject: string }>;
    const grouped: Array<{ department: string; subjects: string[] }> = [];
    
    for (const a of assignments) {
      const existing = grouped.find((g) => g.department === a.department);
      if (existing) {
        if (!existing.subjects.includes(a.subject)) existing.subjects.push(a.subject);
      } else {
        grouped.push({ department: a.department, subjects: [a.subject] });
      }
    }
    
    return NextResponse.json({ assignments: grouped });
  } catch (error) {
    console.error("Assignments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}