import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgSession } from "../../../../lib/session";
import { sendInviteEmail } from "../../../../lib/email";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET() {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await db
    .select({
      id: teachers.id,
      name: teachers.name,
      email: teachers.email,
      status: teachers.status,
      createdAt: teachers.createdAt,
    })
    .from(teachers)
    .where(eq(teachers.orgId, session.userId));

  return NextResponse.json({ teachers: list });
}

export async function POST(req: Request) {
  try {
    const session = await requireOrgSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const emailLower = String(email).toLowerCase().trim();

    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, emailLower));
    const [existingTeacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.email, emailLower));

    if (existingOrg || existingTeacher) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.userId));

    const inviteToken = crypto.randomBytes(32).toString("hex");

    const [teacher] = await db
      .insert(teachers)
      .values({
        orgId: session.userId,
        email: emailLower,
        name: name || null,
        status: "invited",
        inviteToken,
        inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
      })
      .returning();

    const link = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`;
    await sendInviteEmail(emailLower, link, org?.name || "your organization");

    return NextResponse.json({
      ok: true,
      teacher: { id: teacher.id, email: teacher.email, status: teacher.status },
    });
  } catch (err) {
    console.error("invite teacher error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
