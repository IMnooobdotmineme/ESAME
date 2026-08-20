import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";

// ============================================================================
// ACTION CATALOG
// ----------------------------------------------------------------------------
// Every place in the codebase that writes a log entry should use one of these
// action constants (instead of a raw string) so severity/group stay consistent.
// Add new actions here as the product grows — everything else in this file
// derives from this table.
// ============================================================================

export type LogGroup = "user" | "system";
export type LogSeverity = "info" | "warning" | "critical";

interface ActionMeta {
  group: LogGroup;
  severity: LogSeverity;
  /** Human-readable template. {actor} / {org} / {target} are filled from `details`. */
  template: string;
}

export const ACTIVITY_LOG_ACTIONS = {
  // ---------------- USER LOGS: Organizations ----------------
  org_signup: {
    group: "user",
    severity: "info",
    template: "Organization account created",
  },
  org_email_verified: {
    group: "user",
    severity: "info",
    template: "Organization email verified",
  },
  org_login_success: {
    group: "user",
    severity: "info",
    template: "Successful organization portal authentication",
  },
  org_login_failed: {
    group: "user",
    severity: "warning",
    template: "Failed login attempt - invalid password credential",
  },
  org_activated: {
    group: "user",
    severity: "info",
    template: "Organization account activated by platform admin",
  },
  org_suspended: {
    group: "user",
    severity: "warning",
    template: "Organization account suspended by platform admin",
  },
  org_reactivated: {
    group: "user",
    severity: "info",
    template: "Organization account reactivated by platform admin",
  },
  org_deleted: {
    group: "user",
    severity: "critical",
    template: "Organization account deleted by platform admin",
  },
  org_profile_updated: {
    group: "user",
    severity: "info",
    template: "Organization profile information updated",
  },
  org_password_reset: {
    group: "user",
    severity: "info",
    template: "Organization password was reset",
  },

  // ---------------- USER LOGS: Teachers ----------------
  teacher_invited: {
    group: "user",
    severity: "info",
    template: "Teacher invited by organization",
  },
  teacher_invite_accepted: {
    group: "user",
    severity: "info",
    template: "Teacher account created (invite accepted)",
  },
  teacher_activated: {
    group: "user",
    severity: "info",
    template: "Account activated by platform admin",
  },
  teacher_activated_by_org: {
    group: "user",
    severity: "info",
    template: "Account activated by organization",
  },
  teacher_suspended: {
    group: "user",
    severity: "warning",
    template: "Account suspended by platform admin",
  },
  teacher_suspended_by_org: {
    group: "user",
    severity: "warning",
    template: "Account suspended by organization",
  },
  teacher_reactivated: {
    group: "user",
    severity: "info",
    template: "Account reactivated",
  },
  teacher_deleted: {
    group: "user",
    severity: "critical",
    template: "Account deleted by platform admin",
  },
  teacher_deleted_by_org: {
    group: "user",
    severity: "critical",
    template: "Account deleted by organization",
  },
  teacher_login_success: {
    group: "user",
    severity: "info",
    template: "Successful teacher portal authentication",
  },
  teacher_login_failed: {
    group: "user",
    severity: "warning",
    template: "Failed login attempt - invalid password credential",
  },
  teacher_password_reset: {
    group: "user",
    severity: "info",
    template: "Teacher password was reset",
  },

  // ---------------- USER LOGS: Platform admin auth ----------------
  admin_login_success: {
    group: "user",
    severity: "info",
    template: "Successful platform admin authentication",
  },
  admin_login_failed: {
    group: "user",
    severity: "warning",
    template: "Failed platform admin login attempt",
  },

  // ---------------- SYSTEM LOGS ----------------
  db_backup_completed: {
    group: "system",
    severity: "info",
    template: "Scheduled database backup completed successfully",
  },
  db_backup_failed: {
    group: "system",
    severity: "critical",
    template: "Scheduled database backup failed",
  },
  rate_limit_triggered: {
    group: "system",
    severity: "warning",
    template: "Rate-limiting triggered due to rapid requests",
  },
  webhook_timeout: {
    group: "system",
    severity: "critical",
    template: "Webhook timeout while syncing asset",
  },
  webhook_failed: {
    group: "system",
    severity: "critical",
    template: "Webhook delivery failed",
  },
  maintenance_window_started: {
    group: "system",
    severity: "warning",
    template: "Platform maintenance window opened",
  },
  maintenance_window_ended: {
    group: "system",
    severity: "info",
    template: "Platform maintenance window closed",
  },
  cron_job_completed: {
    group: "system",
    severity: "info",
    template: "Scheduled job completed successfully",
  },
  cron_job_failed: {
    group: "system",
    severity: "critical",
    template: "Scheduled job failed",
  },
  email_delivery_failed: {
    group: "system",
    severity: "warning",
    template: "Outbound email delivery failed",
  },
  storage_quota_warning: {
    group: "system",
    severity: "warning",
    template: "Storage usage approaching quota limit",
  },
  api_error_spike: {
    group: "system",
    severity: "critical",
    template: "Elevated error rate detected on API endpoint",
  },
  account_lockout: {
    group: "system",
    severity: "critical",
    template: "Account temporarily locked after repeated failed logins",
  },
  integration_sync_failed: {
    group: "system",
    severity: "warning",
    template: "Third-party integration sync failed",
  },
  server_restart: {
    group: "system",
    severity: "info",
    template: "Application server restarted",
  },
} as const satisfies Record<string, ActionMeta>;

export type ActivityLogAction = keyof typeof ACTIVITY_LOG_ACTIONS;

// ============================================================================
// WRITE PATH
// ============================================================================

export interface RecordLogInput {
  action: ActivityLogAction;
  entityType: "org" | "teacher" | "exam" | "question" | "submission" | "system" | "admin";
  entityId?: string | null;
  orgId?: string | null;
  userId?: string | null;
  userType?: "admin" | "org" | "teacher" | "system";
  /** Overrides the auto-generated template, e.g. "Ly Vannak (Teacher)" failed login (2/5). */
  message?: string;
  /** Display name shown in the "User" column, e.g. "r.chen@university.edu (Teacher)". Required for group="user". */
  actorLabel?: string | null;
  /** Display name shown in the "Organization" column. */
  orgLabel?: string | null;
  /** Bump severity above the action's default (e.g. escalate a 3rd failed login to "critical"). */
  severityOverride?: LogSeverity;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Central place to write an activity/audit log row. Call this from auth flows,
 * admin actions, org actions, and background jobs instead of inserting into
 * `activityLogs` directly, so group/severity stay consistent with the catalog.
 */
export async function recordLog(input: RecordLogInput) {
  const meta = ACTIVITY_LOG_ACTIONS[input.action];

  await db.insert(activityLogs).values({
    orgId: input.orgId ?? null,
    userId: input.userId ?? null,
    userType: input.userType ?? (meta.group === "system" ? "system" : "org"),
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    details: input.details ?? null,
    group: meta.group,
    severity: input.severityOverride ?? meta.severity,
    actorLabel: input.actorLabel ?? null,
    orgLabel: input.orgLabel ?? null,
    ipAddress: input.ipAddress ?? null,
  });
}

// Thin convenience wrappers for the most common events (optional sugar).
export const logOrgSignup = (orgId: string, orgLabel: string) =>
  recordLog({ action: "org_signup", entityType: "org", entityId: orgId, orgId, actorLabel: `${orgLabel} (Org Admin)`, orgLabel });

export const logOrgSuspended = (orgId: string, orgLabel: string, adminUserId: string) =>
  recordLog({ action: "org_suspended", entityType: "org", entityId: orgId, orgId, userId: adminUserId, userType: "admin", actorLabel: "Platform Admin", orgLabel });

export const logOrgActivated = (orgId: string, orgLabel: string, adminUserId: string) =>
  recordLog({ action: "org_activated", entityType: "org", entityId: orgId, orgId, userId: adminUserId, userType: "admin", actorLabel: "Platform Admin", orgLabel });

export const logOrgDeleted = (orgId: string, orgLabel: string, adminUserId: string) =>
  recordLog({ action: "org_deleted", entityType: "org", entityId: orgId, orgId, userId: adminUserId, userType: "admin", actorLabel: "Platform Admin", orgLabel });

export const logTeacherSuspended = (
  teacherId: string,
  teacherLabel: string,
  orgId: string,
  orgLabel: string,
  suspendedBy: "admin" | "org"
) =>
  recordLog({
    action: suspendedBy === "admin" ? "teacher_suspended" : "teacher_suspended_by_org",
    entityType: "teacher",
    entityId: teacherId,
    orgId,
    userType: suspendedBy === "admin" ? "admin" : "org",
    actorLabel: teacherLabel,
    orgLabel,
  });

export const logTeacherActivated = (
  teacherId: string,
  teacherLabel: string,
  orgId: string,
  orgLabel: string,
  activatedBy: "admin" | "org"
) =>
  recordLog({
    action: activatedBy === "admin" ? "teacher_activated" : "teacher_activated_by_org",
    entityType: "teacher",
    entityId: teacherId,
    orgId,
    userType: activatedBy === "admin" ? "admin" : "org",
    actorLabel: teacherLabel,
    orgLabel,
  });

export const logTeacherDeleted = (
  teacherId: string,
  teacherLabel: string,
  orgId: string,
  orgLabel: string,
  deletedBy: "admin" | "org"
) =>
  recordLog({
    action: deletedBy === "admin" ? "teacher_deleted" : "teacher_deleted_by_org",
    entityType: "teacher",
    entityId: teacherId,
    orgId,
    userType: deletedBy === "admin" ? "admin" : "org",
    actorLabel: teacherLabel,
    orgLabel,
  });

export const logLoginFailed = (
  who: "org" | "teacher" | "admin",
  actorLabel: string,
  orgId: string | null,
  orgLabel: string | null,
  attemptCount: number,
  maxAttempts = 5
) =>
  recordLog({
    action: who === "org" ? "org_login_failed" : who === "teacher" ? "teacher_login_failed" : "admin_login_failed",
    entityType: who === "admin" ? "admin" : who,
    orgId,
    actorLabel,
    orgLabel,
    message: `Failed login attempt (${attemptCount}/${maxAttempts}) - Invalid password credential`,
    severityOverride: attemptCount >= maxAttempts ? "critical" : "warning",
    details: { attemptCount, maxAttempts },
  });

export const logSystemEvent = (
  action: Extract<ActivityLogAction, keyof typeof ACTIVITY_LOG_ACTIONS>,
  opts?: { message?: string; details?: Record<string, unknown>; severityOverride?: LogSeverity }
) =>
  recordLog({
    action,
    entityType: "system",
    userType: "system",
    message: opts?.message,
    details: opts?.details,
    severityOverride: opts?.severityOverride,
  });

// ============================================================================
// READ PATH (used by the admin Logs API routes)
// ============================================================================

export interface ListLogsParams {
  search?: string;
  archived?: boolean;
  page?: number;
  pageSize?: number;
}

function buildLogRow(row: typeof activityLogs.$inferSelect) {
  const meta = ACTIVITY_LOG_ACTIONS[row.action as ActivityLogAction];
  const event =
    (row.details as { message?: string } | null)?.message ?? meta?.template ?? row.action;

  return {
    id: row.id,
    actor: row.actorLabel ?? undefined,
    organization: row.orgLabel ?? undefined,
    event,
    timestamp: row.createdAt,
    severity: row.severity,
    archived: row.isArchived,
  };
}

export async function listUserLogs({ search = "", archived = false, page = 1, pageSize = 50 }: ListLogsParams) {
  const searchClause = search
    ? or(
        ilike(activityLogs.actorLabel, `%${search}%`),
        ilike(activityLogs.orgLabel, `%${search}%`),
        ilike(activityLogs.action, `%${search}%`)
      )
    : undefined;

  const where = and(eq(activityLogs.group, "user"), eq(activityLogs.isArchived, archived), searchClause);

  const rows = await db
    .select()
    .from(activityLogs)
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLogs)
    .where(where);

  return { logs: rows.map(buildLogRow), total: count };
}

export async function listSystemLogs({ search = "", archived = false, page = 1, pageSize = 50 }: ListLogsParams) {
  const searchClause = search ? ilike(activityLogs.action, `%${search}%`) : undefined;
  const where = and(eq(activityLogs.group, "system"), eq(activityLogs.isArchived, archived), searchClause);

  const rows = await db
    .select()
    .from(activityLogs)
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLogs)
    .where(where);

  return { logs: rows.map(buildLogRow), total: count };
}

export async function getArchivedCount(group: LogGroup) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activityLogs)
    .where(and(eq(activityLogs.group, group), eq(activityLogs.isArchived, true)));
  return count;
}

export async function toggleArchive(id: string) {
  const [existing] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
  if (!existing) return null;

  const [updated] = await db
    .update(activityLogs)
    .set({ isArchived: !existing.isArchived, archivedAt: !existing.isArchived ? new Date() : null })
    .where(eq(activityLogs.id, id))
    .returning();

  return buildLogRow(updated);
}

export async function archiveAllVisible(group: LogGroup, search = "") {
  const searchClause = search
    ? group === "user"
      ? or(
          ilike(activityLogs.actorLabel, `%${search}%`),
          ilike(activityLogs.orgLabel, `%${search}%`),
          ilike(activityLogs.action, `%${search}%`)
        )
      : ilike(activityLogs.action, `%${search}%`)
    : undefined;

  const result = await db
    .update(activityLogs)
    .set({ isArchived: true, archivedAt: new Date() })
    .where(and(eq(activityLogs.group, group), eq(activityLogs.isArchived, false), searchClause))
    .returning({ id: activityLogs.id });

  return result.length;
}

/** Permanent delete — only ever allowed on already-archived rows (matches the UI, which only shows Delete on archived items). */
export async function deleteLogPermanently(id: string) {
  const [existing] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
  if (!existing) return { ok: false as const, reason: "not_found" as const };
  if (!existing.isArchived) return { ok: false as const, reason: "not_archived" as const };

  await db.delete(activityLogs).where(eq(activityLogs.id, id));
  return { ok: true as const };
}