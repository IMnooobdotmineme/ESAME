import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { departments, subjects, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [teacher] = await db.select({ orgId: teachers.orgId }).from(teachers).where(eq(teachers.id, session.userId));
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    const depts = await db
      .select({ id: departments.id, name: departments.name })
      .from(departments)
      .where(eq(departments.orgId, teacher.orgId));

    const subjs = await db
      .select({ id: subjects.id, name: subjects.name, departmentId: subjects.departmentId, deptName: departments.name })
      .from(subjects)
      .innerJoin(departments, eq(subjects.departmentId, departments.id))
      .where(eq(departments.orgId, teacher.orgId));

    return NextResponse.json({ departments: depts, subjects: subjs });
  } catch (error) {
    console.error("Fetch departments error:", error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}