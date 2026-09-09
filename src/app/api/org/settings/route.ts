import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, passwordHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";
import { verifyPassword, hashPassword, isPasswordReused, validatePasswordStrength } from "@/lib/password";
export async function PUT(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new passwords are required." }, { status: 400 });
  }

    const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }
  const [org] = await db
    .select({
      id: organizations.id,
      passwordHash: organizations.passwordHash,
    })
    .from(organizations)
    .where(eq(organizations.id, session.userId));

  if (!org) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, org.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const sameAsCurrent = await verifyPassword(newPassword, org.passwordHash);
  if (sameAsCurrent) {
    return NextResponse.json({ error: "New password must be different from your current password." }, { status: 400 });
  }

  const reused = await isPasswordReused("org", org.id, newPassword);
  if (reused) {
    return NextResponse.json({ error: "This password has already been used before." }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(organizations)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(organizations.id, org.id));
  await db.insert(passwordHistory).values({
    userType: "org",
    userId: org.id,
    passwordHash,
  });

  return NextResponse.json({ ok: true });
}
