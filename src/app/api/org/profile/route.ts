import { NextResponse } from "next/server";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";

export const runtime = "nodejs";

async function persistAvatar(orgId: string, avatarUrl: string | null) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("/uploads/org-avatars/")) return avatarUrl;
  if (!avatarUrl.startsWith("data:image/")) {
    throw new Error("Profile image must be an uploaded image.");
  }
  if (avatarUrl.length > 1_500_000) {
    throw new Error("Profile image is too large. Please crop or choose a smaller image.");
  }

  const match = avatarUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) {
    throw new Error("Profile image must be a PNG, JPG, or WebP image.");
  }

  const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  const buffer = Buffer.from(match[2], "base64");
  const uploadDir = path.join(process.cwd(), "public", "uploads", "org-avatars");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${orgId}-${crypto.randomBytes(8).toString("hex")}.${extension}`;
  await writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/org-avatars/${fileName}`;
}

export async function GET() {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      email: organizations.email,
      description: organizations.description,
      avatarUrl: organizations.avatarUrl,
    })
    .from(organizations)
    .where(eq(organizations.id, session.userId));

  return NextResponse.json({
    org: org ?? null,
  });
}

export async function PUT(req: Request) {
  const session = await requireOrgSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : null;

  if (!name) {
    return NextResponse.json({ error: "Organization name is required." }, { status: 400 });
  }

  let storedAvatarUrl: string | null;
  try {
    storedAvatarUrl = await persistAvatar(session.userId, avatarUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Profile image could not be saved." },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(organizations)
    .set({
      name,
      description: description || null,
      avatarUrl: storedAvatarUrl,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, session.userId))
    .returning({
      id: organizations.id,
      name: organizations.name,
      email: organizations.email,
      description: organizations.description,
      avatarUrl: organizations.avatarUrl,
    });

  return NextResponse.json({ ok: true, org: updated ?? null });
}
