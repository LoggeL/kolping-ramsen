import "dotenv/config";

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function sqlitePath(databaseUrl, variableName) {
  if (!databaseUrl?.startsWith("file:")) {
    throw new Error(`${variableName} must point to a SQLite file`);
  }
  const value = databaseUrl.slice("file:".length).split("?", 1)[0];
  if (!value || value === ":memory:") {
    throw new Error(`${variableName} must point to a persistent SQLite file`);
  }
  return path.resolve(decodeURIComponent(value));
}

function expectedMigrations() {
  const root = path.join(process.cwd(), "prisma", "migrations");
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      name: entry.name,
      checksum: createHash("sha256")
        .update(readFileSync(path.join(root, entry.name, "migration.sql")))
        .digest("hex"),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function verifyDatabase(filename, expected) {
  const database = new Database(filename, { readonly: true, fileMustExist: true });
  try {
    const integrity = database.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") throw new Error(`${filename}: integrity_check failed`);
    const foreignKeyProblems = database.pragma("foreign_key_check");
    if (foreignKeyProblems.length) {
      throw new Error(`${filename}: foreign_key_check found violations`);
    }

    const applied = database
      .prepare(`
        SELECT "migration_name" AS name, "checksum"
        FROM "_prisma_migrations"
        WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL
        ORDER BY "migration_name"
      `)
      .all();
    if (applied.length !== expected.length) {
      throw new Error(
        `${filename}: expected ${expected.length} applied migrations, found ${applied.length}`,
      );
    }
    for (let index = 0; index < expected.length; index += 1) {
      if (
        applied[index].name !== expected[index].name ||
        applied[index].checksum !== expected[index].checksum
      ) {
        throw new Error(`${filename}: migration history differs at ${expected[index].name}`);
      }
    }

    return database
      .prepare(`
        SELECT "type", "name", "tbl_name" AS tableName, "sql"
        FROM "sqlite_master"
        WHERE "name" NOT LIKE 'sqlite_%'
          AND "name" <> '_prisma_migrations'
          AND "tbl_name" <> '_prisma_migrations'
        ORDER BY "type", "name"
      `)
      .all();
  } finally {
    database.close();
  }
}

const expected = expectedMigrations();
const primaryPath = sqlitePath(process.env.DATABASE_URL, "DATABASE_URL");
const primarySchema = verifyDatabase(primaryPath, expected);

if (process.env.REFERENCE_DATABASE_URL) {
  const referencePath = sqlitePath(
    process.env.REFERENCE_DATABASE_URL,
    "REFERENCE_DATABASE_URL",
  );
  const referenceSchema = verifyDatabase(referencePath, expected);
  if (JSON.stringify(primarySchema) !== JSON.stringify(referenceSchema)) {
    throw new Error("Committed and freshly migrated database schemas differ");
  }
  console.log(
    `Verified ${expected.length} migration checksums and matching database schemas.`,
  );
} else {
  console.log(`Verified ${expected.length} migration checksums and database integrity.`);
}
