import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/session";
import { toggleArchive, deleteLogPermanently } from "@/lib/logs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const updated = await toggleArchive(id);

    if (!updated) {
      return NextResponse.json({ error: "Log entry not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, log: updated });
  } catch (error) {
    console.error("Admin logs PATCH (toggle archive) error:", error);
    return NextResponse.json(
      { error: "Failed to update log entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const result = await deleteLogPermanently(id);

    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Log entry not found." }, { status: 404 });
      }
      // reason === "not_archived" — matches the UI, which only shows the delete
      // button on already-archived rows, so this only fires on a stale/direct call.
      return NextResponse.json(
        { error: "Only archived log entries can be permanently deleted." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin logs DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete log entry." },
      { status: 500 }
    );
  }
}