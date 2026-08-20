import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/session";
import { getArchivedCount, listUserLogs } from "@/lib/logs";

export async function GET(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const archived = searchParams.get("archived") === "true";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "50");

  const [{ logs, total }, archivedCount] = await Promise.all([
    listUserLogs({ search, archived, page, pageSize }),
    getArchivedCount("user"),
  ]);

  return NextResponse.json({ logs, total, archivedCount, page, pageSize });
}