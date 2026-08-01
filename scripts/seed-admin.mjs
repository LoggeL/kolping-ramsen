import "dotenv/config";

import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const REVOKED_PASSWORD_DIGESTS = new Set([
  "0c9ad49edbc870c0897d394e6c501a244afd09d89de7809d4a069626d8ac683d",
]);

function databasePath(databaseUrl) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error("DATABASE_URL must point to a SQLite file.");
  }
  const value = databaseUrl.slice("file:".length).split("?", 1)[0];
  if (!value || value === ":memory:") {
    throw new Error("DATABASE_URL must point to a persistent SQLite file.");
  }
  return decodeURIComponent(value);
}

const filename = databasePath(process.env.DATABASE_URL ?? "file:./dev.db");
const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@kolping-ramsen.de")
  .trim()
  .toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
  throw new Error("SEED_ADMIN_EMAIL must be a valid email address.");
}

const database = new Database(filename);

try {
  const existing = database
    .prepare('SELECT "email" FROM "User" WHERE lower("email") = lower(?)')
    .get(email);

  if (existing) {
    console.log(`Admin account already exists for ${existing.email}; retained unchanged.`);
  } else {
    if (!password || password.length < 14) {
      throw new Error(
        "SEED_ADMIN_PASSWORD with at least 14 characters is required for the initial account.",
      );
    }
    const digest = createHash("sha256").update(password).digest("hex");
    if (REVOKED_PASSWORD_DIGESTS.has(digest)) {
      throw new Error("SEED_ADMIN_PASSWORD has been publicly compromised and cannot be used.");
    }

    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);
    database.prepare(`
      INSERT INTO "User" (
        "id", "email", "name", "passwordHash", "role", "createdAt", "updatedAt"
      ) VALUES (?, ?, 'Administrator', ?, 'admin', ?, ?)
    `).run(`user_${randomUUID().replaceAll("-", "")}`, email, passwordHash, now, now);
    console.log(`Admin account created for ${email}.`);
  }
} finally {
  database.close();
}
