import { NextRequest, NextResponse } from "next/server";

import { users, type User } from "../../../../db/schema";
import { getDb } from "../../../../lib/auth/db";
import { sendTeacherInvitationEmail } from "../../../../lib/auth/email";
import {
  createTeacherInvitation,
  findOrganizationById,
  findUserByEmail,
  getAuthenticatedUser,
  getBaseUrl,
  jsonError,
  normalizeEmail,
} from "../../../../lib/auth/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || auth.user.role !== "organization" || !auth.user.orgId) {
      return jsonError("Only an organization account can invite teachers.", 403);
    }

    const body = await request.json();
    const email = normalizeEmail(String(body.email || ""));
    const name = String(body.name || "").trim();

    if (!email) {
      return jsonError("Teacher email is required.");
    }

    const organization = await findOrganizationById(auth.user.orgId);
    if (!organization || organization.status !== "active") {
      return jsonError("Organization is not active.", 403);
    }

    const db = getDb();
    const existingUser = await findUserByEmail(email);
    let teacher: User;

    if (existingUser) {
      if (existingUser.role !== "teacher" || existingUser.orgId !== auth.user.orgId) {
        return jsonError("This email already belongs to another account.", 409);
      }

      if (existingUser.status === "active") {
        return jsonError("This teacher already accepted the invitation.", 409);
      }

      teacher = existingUser;
    } else {
      const [createdTeacher] = await db
        .insert(users)
        .values({
          orgId: auth.user.orgId,
          role: "teacher",
          email,
          name: name || null,
          status: "invited",
          authProvider: "password",
        })
        .returning();

      teacher = createdTeacher;
    }

    const token = await createTeacherInvitation({
      orgId: auth.user.orgId,
      teacherId: teacher.id,
      invitedByUserId: auth.user.id,
      email,
    });

    const inviteUrl = `${getBaseUrl(request)}/reset-password?token=${encodeURIComponent(
      token,
    )}&mode=invite&email=${encodeURIComponent(email)}`;

    await sendTeacherInvitationEmail(email, organization.name, inviteUrl);

    return NextResponse.json({
      message: "Teacher invitation sent.",
      teacher: {
        id: teacher.id,
        email: teacher.email,
        role: teacher.role,
        status: teacher.status,
        orgId: teacher.orgId,
      },
    });
  } catch (error) {
    console.error("Teacher invite failed:", error);
    return jsonError("Unable to invite teacher.", 500);
  }
}
