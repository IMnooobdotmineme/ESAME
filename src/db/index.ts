import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

export const db = (databaseUrl
  ? drizzle(neon(databaseUrl), { schema })
  : ({} as any)) as any;

export function assertDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return db;
}