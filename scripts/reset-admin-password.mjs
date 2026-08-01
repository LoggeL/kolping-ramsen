import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { createHash } from "node:crypto";

const REVOKED_PASSWORD_DIGESTS = new Set([
  "0c9ad49edbc870c0897d394e6c501a244afd09d89de7809d4a069626d8ac683d",
]);

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!databaseUrl?.startsWith("file:")) {
  throw new Error("DATABASE_URL must point to a SQLite file.");
}
if (!email) {
  throw new Error("ADMIN_EMAIL is required.");
}
if (!password || password.length < 14) {
  throw new Error("ADMIN_PASSWORD must contain at least 14 characters.");
}
if (REVOKED_PASSWORD_DIGESTS.has(createHash("sha256").update(password).digest("hex"))) {
  throw new Error("ADMIN_PASSWORD has been publicly compromised and cannot be used.");
}

const filename = databaseUrl.replace(/^file:/, "");
const database = new Database(filename);

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const result = database
    .prepare(
      "UPDATE User SET passwordHash = ?, updatedAt = ? WHERE lower(email) = lower(?)",
    )
    .run(passwordHash, new Date().toISOString(), email.trim());

  if (result.changes !== 1) {
    throw new Error(`Expected one admin account for ${email}, updated ${result.changes}.`);
  }

  console.log(`Password reset completed for ${email}.`);
} finally {
  database.close();
}
