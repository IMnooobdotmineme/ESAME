import { db } from "@/db";
import { proctorEvents } from "@/db/schema";

export async function insertProctorEvent(
  examStudentId: string,
  type: string,
  severity: string,
  details: Record<string, unknown> = {}
) {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  await db.insert(proctorEvents).values({ id, examStudentId, type, severity, details });
  
}
