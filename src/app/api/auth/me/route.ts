import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookie } from "../../../../lib/session";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  if (session.userType === "org") {
    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        email: organizations.email,
        status: organizations.status,
      })
      .from(organizations)
      .where(eq(organizations.id, session.userId));
    return NextResponse.json({
      user: org ? { ...org, userType: "org" as const } : null,
    });
  }

  const [teacher] = await db
    .select({
      id: teachers.id,
      name: teachers.name,
      email: teachers.email,
      status: teachers.status,
      orgId: teachers.orgId,
    })
    .from(teachers)
    .where(eq(teachers.id, session.userId));

  return NextResponse.json({
    user: teacher ? { ...teacher, userType: "teacher" as const } : null,
  });
}
