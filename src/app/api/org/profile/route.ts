import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOrgSession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 1_500_000;
const AVATAR_DATA_URL_RE = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([a-zA-Z0-9+/=]+)$/;

function normalizeAvatar(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null;

  const match = avatarUrl.match(AVATAR_DATA_URL_RE);
  if (!match) {
    throw new Error("Profile image must be a PNG, JPG, or WebP image.");
  }

  const base64Payload = match[2];
  const decodedSize = Math.ceil((base64Payload.length * 3) / 4);
  if (decodedSize > MAX_AVATAR_BYTES) {
    throw new Error("Profile image is too large. Please crop or choose a smaller image.");
  }

  // Stored as-is (data URL) directly in the database — no filesystem writes.
  return avatarUrl;
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
    storedAvatarUrl = normalizeAvatar(avatarUrl);
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