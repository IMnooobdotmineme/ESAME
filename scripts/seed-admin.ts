// One-off script to create the platform admin account.
// Run once with: npx tsx scripts/seed-admin.ts
// (adjust the import paths below to match where this file lives relative to src/)

import { config } from "dotenv";
config({ path: ".env.local" }); // load DATABASE_URL before @/db reads it
config(); // fallback to .env if .env.local doesn't have it

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs"; // matches lib/password.ts

const ADMIN_EMAIL = "admin@esame.kh";
const ADMIN_PASSWORD = "Admin@Esame";

async function main() {
  // Dynamic imports so these only load AFTER dotenv has populated process.env —
  // static `import` statements get hoisted above config() by the compiler.
  const { db } = await import("@/db");
  const { admins } = await import("@/db/schema");

  const emailLower = ADMIN_EMAIL.toLowerCase().trim();

  const [existing] = await db.select().from(admins).where(eq(admins.email, emailLower));
  if (existing) {
    console.log("Admin account already exists:", emailLower);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await db.insert(admins).values({
    email: emailLower,
    passwordHash,
  });

  console.log("Admin account created:", emailLower);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  });