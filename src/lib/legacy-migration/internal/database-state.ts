import { createRequire } from "node:module";
import path from "node:path";
import { sha256, stableJson } from "./stable";

type SqliteStatement = {
  all(...parameters: unknown[]): Record<string, unknown>[];
  run(...parameters: unknown[]): unknown;
};
type SqliteDatabase = { prepare(sql: string): SqliteStatement; close(): void };
type SqliteConstructor = new (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean }) => SqliteDatabase;
const require = createRequire(import.meta.url);
const Sqlite = require("better-sqlite3") as SqliteConstructor;

export type ContentDatabaseSnapshot = Readonly<{
  digest: `sha256:${string}`;
  pages: readonly Record<string, unknown>[];
  news: readonly Record<string, unknown>[];
  events: readonly Record<string, unknown>[];
  redirects: readonly Record<string, unknown>[];
}>;

function databasePath(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) throw new Error("Nur file:-SQLite-Datenbanken werden unterstützt.");
  const value = databaseUrl.slice("file:".length).split("?", 1)[0];
  if (!value) throw new Error("Leerer SQLite-Pfad.");
  return path.resolve(decodeURIComponent(value));
}

/** Reads every compared/mutated content table from one SQLite read snapshot. */
export function readContentDatabaseSnapshot(databaseUrl: string): ContentDatabaseSnapshot {
  const database = new Sqlite(databasePath(databaseUrl), { readonly: true, fileMustExist: true });
  database.prepare("BEGIN").run();
  try {
    const state = {
      pages: database.prepare('SELECT * FROM "Page" ORDER BY "slug"').all(),
      news: database.prepare('SELECT * FROM "News" ORDER BY "slug"').all(),
      events: database.prepare('SELECT * FROM "Event" ORDER BY "slug"').all(),
      redirects: database.prepare('SELECT * FROM "Redirect" ORDER BY "fromPath"').all(),
    };
    database.prepare("COMMIT").run();
    return { digest: sha256(stableJson(state)), ...state };
  } catch (error) {
    database.prepare("ROLLBACK").run();
    throw error;
  } finally {
    database.close();
  }
}
