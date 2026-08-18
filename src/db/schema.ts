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
]);

export const userTypeEnum = pgEnum("user_type", ["org", "teacher"]);

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

// ---------- Organizations (sign up as org) ----------
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

// ---------- Teachers (created only via org invite) ----------
export const teachers = pgTable("teachers", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name"),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null until invite is accepted
  status: teacherStatusEnum("status").notNull().default("invited"),
  assignments: jsonb("assignments").$type<Array<{ department: string; subject: string }>>().notNull().default([]),
  inviteToken: text("invite_token").unique(),
  inviteTokenExpiresAt: timestamp("invite_token_expires_at", { withTimezone: true }),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Verification codes (signup / login / forgot-password) ----------
export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(), // sha256 hash of the 6-digit code, never store plaintext
  purpose: verificationPurposeEnum("purpose").notNull(),
  userType: userTypeEnum("user_type").notNull(),
  attempts: integer("attempts").notNull().default(0),
  rememberMe: boolean("remember_me").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Sessions (DB-backed, revocable) ----------
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // random session token
  userType: userTypeEnum("user_type").notNull(),
  userId: uuid("user_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Short-lived reset tokens (issued after forgot-password code is verified) ----------
export const resetTokens = pgTable("reset_tokens", {
  id: text("id").primaryKey(), // random token, stored in an httpOnly cookie
  userType: userTypeEnum("user_type").notNull(),
  userId: uuid("user_id").notNull(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Password history (prevents reusing an old password) ----------
export const passwordHistory = pgTable("password_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userType: userTypeEnum("user_type").notNull(),
  userId: uuid("user_id").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Generic rate limiting (IP-based and account-based throttles) ----------
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(), // e.g. "login:ip:1.2.3.4" or "failed-login:user@x.com"
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

// ---------- Exams (created by teachers) ----------
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
  totalQuestions: integer("total_questions").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Sections (groups of questions within an exam) ----------
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

// ---------- Exam Pages (pages within sections) ----------
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
  explanation: text("explanation"), // show after submission
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Question Options (for MCQ and Multiple Select) ----------
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

// ---------- Student Exam Assignments (many-to-many: students enrolled in exams) ----------
export const examStudents = pgTable("exam_students", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull(), // can be email or external ID
  studentName: text("student_name"),
  studentEmail: text("student_email"),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Student Exam Attempts (track multiple attempts per student per exam) ----------
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Student Answers (individual answers to individual questions) ----------
export const studentAnswers = pgTable("student_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => studentExamAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => examQuestions.id, { onDelete: "cascade" }),
  answerText: text("answer_text"), // for essay, short answer, coding
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>().notNull().default([]), // for MCQ, multiple select
  markedCorrect: boolean("marked_correct"), // null = not yet graded, true/false = graded
  autoPoints: integer("auto_points").notNull().default(0),
  manualPoints: integer("manual_points").notNull().default(0),
  feedback: text("feedback"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Notifications (exam notifications for teachers/orgs) ----------
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").references(() => teachers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // e.g., "teacher_invite", "exam_created", "submission_received", "grade_ready"
  relatedEntityId: uuid("related_entity_id"), // examId, teacherId, etc.
  relatedEntityType: text("related_entity_type"), // "exam", "teacher", "submission"
  isRead: boolean("is_read").notNull().default(false),
  isArchived: boolean("is_archived").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Activity Logs (audit trail for exams, submissions, grading) ----------
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(), // can be org or teacher
  userType: userTypeEnum("user_type").notNull(),
  action: text("action").notNull(), // e.g., "exam_created", "student_submitted", "exam_graded"
  entityType: text("entity_type").notNull(), // "exam", "question", "submission"
  entityId: uuid("entity_id"), // examId, submissionId, etc.
  details: jsonb("details"), // additional context
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exam Analytics (cached/computed stats for performance) ----------
export const examAnalytics = pgTable("exam_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  examId: uuid("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  totalEnrolled: integer("total_enrolled").notNull().default(0),
  totalSubmitted: integer("total_submitted").notNull().default(0),
  averageScore: integer("average_score").notNull().default(0),
  passRate: integer("pass_rate").notNull().default(0), // percentage 0-100
  highestScore: integer("highest_score").notNull().default(0),
  lowestScore: integer("lowest_score").notNull().default(0),
  scoreDistribution: jsonb("score_distribution").$type<Record<string, number>>().notNull().default({}), // e.g., {"0-20": 5, "21-40": 10}
  questionStats: jsonb("question_stats").$type<Array<{ questionId: string; correctCount: number; totalAttempts: number }>>().notNull().default([]),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).notNull().defaultNow(),
});
