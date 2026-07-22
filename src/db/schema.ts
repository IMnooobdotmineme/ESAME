import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
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
  googleId: text("google_id").unique(),
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
