// src/db/schema.ts
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const orgStatusEnum = pgEnum("org_status", [
  "pending_verification",
  "active",
  "suspended",
]);

export const teacherStatusEnum = pgEnum("teacher_status", [
  "invited",
  "active",
  "suspended",
  "deleted",
]);

export const userTypeEnum = pgEnum("user_type", ["org", "teacher", "admin"]);

export const verificationPurposeEnum = pgEnum("verification_purpose", [
  "signup",
  "login",
  "forgot_password",
]);

export const examStatusEnum = pgEnum("exam_status", [
  "scheduled",
  "in_progress",
  "completed",
  "locked",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "mcq",
  "multiple_select",
  "true_false",
  "short_answer",
  "essay",
  "coding",
  "fill_in_blank",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "reviewed",
  "needs_review",
]);

export const logGroupEnum = pgEnum("log_group", ["user", "system"]);

export const logSeverityEnum = pgEnum("log_severity", [
  "info",
  "warning",
  "critical",
]);

export const examStudentStatusEnum = pgEnum("exam_student_status", [
  "pending",
  "approved",
  "rejected",
]);

export const gradingStatusEnum = pgEnum("grading_status", [
  "in_progress",
  "complete",
]);

// ---------- Organizations ----------
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: orgStatusEnum("status").notNull().default("pending_verification"),
  orgType: text("org_type"),
  country: text("country"),
  region: text("region"),
  address: text("address"),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  courses: integer("courses").notNull().default(0),
  students: integer("students").notNull().default(0),
  faculty: integer("faculty").notNull().default(0),
  metricLabel: text("metric_label").notNull().default("Exam Completion Rate"),
  metricValue: integer("metric_value").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Teachers ----------
export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  status: teacherStatusEnum("status").notNull().default("invited"),
  suspendedBy: text("suspended_by"),
  deletedBy: text("deleted_by"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  assignments: jsonb("assignments")
    .$type<Array<{ department: string; subject: string }>>()
    .notNull()
    .default([]),
  inviteToken: text("invite_token").unique(),
  inviteTokenExpiresAt: timestamp("invite_token_expires_at", { withTimezone: true }),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Verification codes ----------
export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  purpose: verificationPurposeEnum("purpose").notNull(),
  userType: userTypeEnum("user_type").notNull(),
  attempts: integer("attempts").notNull().default(0),
  rememberMe: boolean("remember_me").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Sessions ----------
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userType: userTypeEnum("user_type").notNull(),
  userId: uuid("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Reset tokens ----------
export const resetTokens = pgTable("reset_tokens", {
  id: text("id").primaryKey(),
  userType: userTypeEnum("user_type").notNull(),
  userId: uuid("user_id").notNull(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Password history ----------
export const passwordHistory = pgTable("password_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userType: userTypeEnum("user_type").notNull(),
  userId: uuid("user_id").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Rate limits ----------
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

// ---------- Exams ----------
export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  departmentId: uuid("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  examCode: text("exam_code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  academicYear: text("academic_year").notNull().default("2025-2026"),
  semester: text("semester").notNull().default("Semester 2"),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  status: examStatusEnum("status").notNull().default("scheduled"),
  isLaunched: boolean("is_launched").notNull().default(false),  // ← ADD
  isPaused: boolean("is_paused").notNull().default(false),      // ← ADD
  totalQuestions: integer("total_questions").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  parts: jsonb("parts").$type<unknown[]>().notNull().default([]), // ← ADD
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  gradingStatus: gradingStatusEnum("grading_status").notNull().default("in_progress"), // ← ADD
});

// ---------- Exam Sections ----------
export const examSections = pgTable("exam_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  sectionOrder: integer("section_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Pages ----------
export const examPages = pgTable("exam_pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sectionId: uuid("section_id")
    .notNull()
    .references(() => examSections.id, { onDelete: "cascade" }),
  pageOrder: integer("page_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Questions ----------
export const examQuestions = pgTable("exam_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => examPages.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: questionTypeEnum("question_type").notNull(),
  points: integer("points").notNull().default(1),
  questionOrder: integer("question_order").notNull(),
  explanation: text("explanation"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}), // ← ADD
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Question Options ----------
export const examQuestionOptions = pgTable("exam_question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => examQuestions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
  optionOrder: integer("option_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Student Exam Assignments ----------
export const examStudents = pgTable("exam_students", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull(),
  studentName: text("student_name"),
  studentEmail: text("student_email"),
  status: examStudentStatusEnum("status").notNull().default("pending"),
  isLocked: boolean("is_locked").notNull().default(false),
  isRejectedLive: boolean("is_rejected_live").notNull().default(false),
  tabSwitches: integer("tab_switches").notNull().default(0),
  violationMessage: text("violation_message"),
  lastLockedAt: timestamp("last_locked_at", { withTimezone: true }),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Student Exam Attempts ----------
export const studentExamAttempts = pgTable("student_exam_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  examStudentId: uuid("exam_student_id")
    .notNull()
    .references(() => examStudents.id, { onDelete: "cascade" }),
  attemptNumber: integer("attempt_number").notNull().default(1),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  autoPoints: integer("auto_points").notNull().default(0),
  manualPoints: integer("manual_points").notNull().default(0),
  maxPoints: integer("max_points").notNull().default(0),
  status: reviewStatusEnum("status").notNull().default("needs_review"),
  isForcedSubmit: boolean("is_forced_submit").notNull().default(false),
  gradingStatus: gradingStatusEnum("grading_status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Student Answers ----------
export const studentAnswers = pgTable("student_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => studentExamAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => examQuestions.id, { onDelete: "cascade" }),
  answerText: text("answer_text"),
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>().notNull().default([]),
  markedCorrect: boolean("marked_correct"),
  autoPoints: integer("auto_points").notNull().default(0),
  manualPoints: integer("manual_points").notNull().default(0),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Notifications ----------
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  relatedEntityId: uuid("related_entity_id"),
  relatedEntityType: text("related_entity_type"),
  isRead: boolean("is_read").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Activity Logs ----------
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id"),
  userType: text("user_type").notNull().default("system"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  group: logGroupEnum("group").notNull().default("system"),
  severity: logSeverityEnum("severity").notNull().default("info"),
  actorLabel: text("actor_label"),
  orgLabel: text("org_label"),
  isArchived: boolean("is_archived").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Analytics ----------
export const examAnalytics = pgTable("exam_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  totalEnrolled: integer("total_enrolled").notNull().default(0),
  totalSubmitted: integer("total_submitted").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  passRate: integer("pass_rate").notNull().default(0),
  highestScore: integer("highest_score").notNull().default(0),
  lowestScore: integer("lowest_score").notNull().default(0),
  scoreDistribution: jsonb("score_distribution").$type<Record<string, number>>().notNull().default({}),
  questionStats: jsonb("question_stats").$type<Array<{ questionId: string; correctCount: number; totalAttempts: number }>>().notNull().default([]),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Broadcasts ----------
export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  audience: text("audience").notNull(),
  targetOrgId: uuid("target_org_id").references(() => organizations.id, { onDelete: "set null" }),
  targetTeacherId: uuid("target_teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  audienceLabel: text("audience_label").notNull(),
  recipientsCount: integer("recipients_count").notNull().default(0),
  priority: text("priority").notNull().default("normal"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Admins ----------
export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});