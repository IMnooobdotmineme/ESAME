import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, teachers, exams, activityLogs } from "@/db/schema";
import { desc, eq, ne, sql } from "drizzle-orm";
import { formatRelativeTime } from "@/lib/org-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      [totalOrgsResult],
      [totalTeachersResult],
      [liveExamsResult],
      [totalExamsResult],
      recentLogRows,
      recentOrgs,
      recentTeachers,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(organizations),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(teachers)
        .where(ne(teachers.status, "deleted")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(exams)
        .where(eq(exams.status, "in_progress")),
      db.select({ count: sql<number>`count(*)::int` }).from(exams),
      db
        .select({
          id: activityLogs.id,
          orgId: activityLogs.orgId,
          userId: activityLogs.userId,
          userType: activityLogs.userType,
          action: activityLogs.action,
          entityType: activityLogs.entityType,
          entityId: activityLogs.entityId,
          details: activityLogs.details,
          createdAt: activityLogs.createdAt,
        })
        .from(activityLogs)
        .orderBy(desc(activityLogs.createdAt))
        .limit(10),
      db
        .select({ id: organizations.id, name: organizations.name, createdAt: organizations.createdAt })
        .from(organizations)
        .orderBy(desc(organizations.createdAt))
        .limit(3),
      db
        .select({
          id: teachers.id,
          name: teachers.name,
          email: teachers.email,
          createdAt: teachers.createdAt,
          orgId: teachers.orgId,
        })
        .from(teachers)
        .where(ne(teachers.status, "deleted"))
        .orderBy(desc(teachers.createdAt))
        .limit(3),
    ]);

    // Map logs to frontend structure
    const logs = recentLogRows.map((log: any) => {
      const details = (log.details as Record<string, any>) || {};
      const actor = details.actor || (log.userType === "admin" ? "Platform Admin" : "System");
      const category = (log.userType === "system" ? "system" : "user") as "user" | "system";
      const organization = details.organizationName || details.orgName;
      const event = details.event || details.message || log.action.replace(/_/g, " ");
      return {
        id: log.id,
        category,
        organization,
        actor,
        event,
        timestamp: formatRelativeTime(new Date(log.createdAt)),
      };
    });

    // Fallback if logs table is sparse
    if (logs.length === 0) {
      for (const org of recentOrgs) {
        logs.push({
          id: `org-${org.id}`,
          category: "user",
          organization: org.name,
          actor: "Org Admin",
          event: `Organization "${org.name}" joined the platform`,
          timestamp: formatRelativeTime(new Date(org.createdAt)),
        });
      }
      for (const t of recentTeachers) {
        logs.push({
          id: `tch-${t.id}`,
          category: "user",
          actor: t.name || t.email,
          event: `Teacher account was created`,
          timestamp: formatRelativeTime(new Date(t.createdAt)),
        });
      }
    }

    return NextResponse.json({
      stats: {
        totalOrganizations: Number(totalOrgsResult?.count ?? 0),
        totalTeachers: Number(totalTeachersResult?.count ?? 0),
        liveExams: Number(liveExamsResult?.count ?? 0),
        totalExaminations: Number(totalExamsResult?.count ?? 0),
      },
      recentLogs: logs.slice(0, 8),
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load admin dashboard statistics." },
      { status: 500 }
    );
  }
}
