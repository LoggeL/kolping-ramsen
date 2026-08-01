import { constants } from "node:fs";
import { access, copyFile, link, mkdir, unlink } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.startsWith("file:")) {
  throw new Error("DATABASE_URL must point to a SQLite file.");
}

const rawDatabasePath = databaseUrl.slice("file:".length).split("?", 1)[0];
if (!rawDatabasePath || rawDatabasePath === ":memory:") {
  throw new Error("DATABASE_URL must point to a persistent SQLite file.");
}

const databasePath = path.resolve(decodeURIComponent(rawDatabasePath));
const seedPath = path.resolve(
  process.env.SEED_DATABASE_PATH ?? path.join(process.cwd(), "build-dev.db"),
);

function isErrorCode(error, code) {
  return error && typeof error === "object" && error.code === code;
}

function validateDatabase(filename) {
  const database = new Database(filename, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const integrity = database.pragma("quick_check", { simple: true });
    if (integrity !== "ok") throw new Error(`SQLite quick_check failed: ${integrity}`);

    const tables = new Set(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name),
    );
    for (const required of ["_prisma_migrations", "User", "Page", "Event"]) {
      if (!tables.has(required)) {
        throw new Error(`Database is missing required table ${required}`);
      }
    }
  } finally {
    database.close();
  }
}

async function exists(filename) {
  try {
    await access(filename, constants.F_OK);
    return true;
  } catch (error) {
    if (isErrorCode(error, "ENOENT")) return false;
    throw error;
  }
}

if (await exists(databasePath)) {
  validateDatabase(databasePath);
  console.log(`Database already present and valid at ${databasePath}.`);
} else {
  if (databasePath === seedPath) {
    throw new Error("Seed and destination database paths must differ.");
  }
  validateDatabase(seedPath);
  await mkdir(path.dirname(databasePath), { recursive: true });

  const temporaryPath = path.join(
    path.dirname(databasePath),
    `.${path.basename(databasePath)}.init-${process.pid}-${randomBytes(6).toString("hex")}`,
  );
  try {
    await copyFile(seedPath, temporaryPath, constants.COPYFILE_EXCL);
    validateDatabase(temporaryPath);
    try {
      // The hard link publishes the complete inode atomically and never
      // replaces a database created by another starting container.
      await link(temporaryPath, databasePath);
      console.log(`Initialized database atomically from ${seedPath}.`);
    } catch (error) {
      if (!isErrorCode(error, "EEXIST")) throw error;
      validateDatabase(databasePath);
      console.log(`Database was initialized concurrently at ${databasePath}.`);
    }
  } finally {
    await unlink(temporaryPath).catch((error) => {
      if (!isErrorCode(error, "ENOENT")) throw error;
    });
  }
}
