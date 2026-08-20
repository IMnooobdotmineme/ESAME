import { NextResponse } from "next/server";
import { db } from "@/db";
import { admins, passwordHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminSession } from "@/lib/session";
import { hashPassword, verifyPassword, isPasswordReused } from "@/lib/password";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [admin] = await db
    .select({ email: admins.email })
    .from(admins)
    .where(eq(admins.id, session.userId));

  if (!admin) {
    return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
  }

  return NextResponse.json({
    name: "System Admin",
    email: admin.email,
  });
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required." },
        { status: 400 }
      );
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, session.userId));

    if (!admin) {
      return NextResponse.json({ error: "Admin account not found." }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    // Checks the new password against every password this admin has used
    // before (current one included, via password_history), not just the
    // single current hash — same reuse-prevention org/teacher already have.
    const reused = await isPasswordReused("admin", admin.id, newPassword);
    if (reused) {
      return NextResponse.json(
        { error: "You can't reuse a previous password. Please choose a new one." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await db
      .update(admins)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(admins.id, admin.id));

    await db
      .insert(passwordHistory)
      .values({ userType: "admin", userId: admin.id, passwordHash: newHash });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin profile PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 }
    );
  }
}