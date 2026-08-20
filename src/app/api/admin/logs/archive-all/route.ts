import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/session";
import { archiveAllVisible, type LogGroup } from "@/lib/logs";

export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const group = body.group as LogGroup;
  const search = (body.search as string) ?? "";

  if (group !== "user" && group !== "system") {
    return NextResponse.json({ error: "group must be 'user' or 'system'" }, { status: 400 });
  }

  const archivedCount = await archiveAllVisible(group, search);
  return NextResponse.json({ archivedCount });
}