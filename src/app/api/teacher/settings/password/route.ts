import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/session";
import { db } from "@/db";
import { teachers, passwordHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function PUT(req: NextRequest) {
  const session = await requireTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacherId = session.userId;
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Please provide both current and new password." },
        { status: 400 }
      );
    }

    const [teacher] = await db
      .select()
      .from(teachers)
      .where(eq(teachers.id, teacherId));

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // 1. Verify the current password is correct
    if (teacher.passwordHash) {
      const isValid = await verifyPassword(currentPassword, teacher.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      // 2. New password must be DIFFERENT from the current one
      const sameAsCurrent = await verifyPassword(newPassword, teacher.passwordHash);
      if (sameAsCurrent) {
        return NextResponse.json(
          { error: "New password must be different from your current password." },
          { status: 400 }
        );
      }
    }

    // 3. Block reuse of the last 3 passwords
    const history = await db
      .select()
      .from(passwordHistory)
      .where(eq(passwordHistory.userId, teacherId))
      .orderBy(desc(passwordHistory.createdAt))
      .limit(3);

    for (const h of history) {
      const isSame = await verifyPassword(newPassword, h.passwordHash);
      if (isSame) {
        return NextResponse.json(
          { error: "Cannot reuse any of your last 3 passwords. Please choose a different one." },
          { status: 400 }
        );
      }
    }

    // 4. Hash and save the new password
    const newHash = await hashPassword(newPassword);
    await db
      .update(teachers)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(teachers.id, teacherId));

    // 5. Record it in history
    await db.insert(passwordHistory).values({
      userType: "teacher",
      userId: teacherId,
      passwordHash: newHash,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}