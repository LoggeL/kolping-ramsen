import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { z } from "zod";
import { sha256, stableJson } from "./stable";

const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

const contentUpdateSchema = z.object({
  action: z.enum(["source-reconciliation", "guarded-current-merge"]),
  kind: z.enum(["page", "news"]),
  targetKey: z.string().min(1),
  sourceKey: z.string().min(1),
  sourceDigest: digestSchema,
  previousContentDigest: digestSchema,
  appliedContentDigest: digestSchema,
  reason: z.string().min(3),
}).strict();

const eventUpdateSchema = z.object({
  action: z.literal("guarded-event-merge"),
  targetKey: z.string().min(1),
  sourceKey: z.string().min(1),
  sourceDigest: digestSchema,
  previousContentDigest: digestSchema,
  appliedContentDigest: digestSchema,
  reason: z.string().min(3),
}).strict();

const metadataUpdateSchema = z.object({
  action: z.literal("guarded-metadata-cleanup"),
  targetPath: z.string().min(2).startsWith("/"),
  previousContentDigest: digestSchema,
  appliedContentDigest: digestSchema,
  reason: z.string().min(3),
}).strict();

const resolutionSchema = z.object({
  sourceKey: z.string().min(1),
  targetPath: z.string().startsWith("/"),
  kind: z.enum(["page", "news", "event"]),
  resolution: z.enum(["merge", "keep-current", "draft"]),
  reason: z.string().min(3),
}).strict();

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotDigest: digestSchema,
  comparisonDigest: digestSchema,
  decisionsDigest: digestSchema,
  resolutionsDigest: digestSchema,
  reviewedRoutes: z.array(resolutionSchema),
  contentUpdates: z.array(contentUpdateSchema),
  eventUpdates: z.array(eventUpdateSchema),
  metadataUpdates: z.array(metadataUpdateSchema),
  result: z.object({
    contentUpdates: z.number().int().nonnegative(),
    eventUpdates: z.number().int().nonnegative(),
    metadataUpdates: z.number().int().nonnegative(),
    reviewedRoutes: z.number().int().nonnegative(),
    migrationPath: z.string().min(1),
    manifestPath: z.string().min(1),
  }).strict(),
}).strict();

type ReconciliationManifest = z.infer<typeof manifestSchema>;

type RevisionExpectation = Readonly<{
  id: string;
  sourceKey: string;
  targetKind: "page" | "news" | "event";
  targetKey: string;
  sourceDigest: string;
  appliedContentDigest: string;
  snapshotDigest: string;
}>;

type SqliteStatement = {
  all(...parameters: unknown[]): Record<string, unknown>[];
  get(...parameters: unknown[]): Record<string, unknown> | undefined;
  run(...parameters: unknown[]): unknown;
};
type SqliteDatabase = { prepare(sql: string): SqliteStatement; close(): void };
type SqliteConstructor = new (filename: string, options?: { readonly?: boolean; fileMustExist?: boolean }) => SqliteDatabase;
const require = createRequire(import.meta.url);
const Sqlite = require("better-sqlite3") as SqliteConstructor;

export type ReconciliationVerificationOptions = Readonly<{
  manifestPath: string;
  databaseUrl: string;
}>;

export type ReconciliationVerificationResult = Readonly<{
  contentUpdates: number;
  eventUpdates: number;
  metadataUpdates: number;
  revisions: number;
}>;

function databasePath(databaseUrl: string): string {
  if (!databaseUrl.startsWith("file:")) throw new Error("Nur file:-SQLite-Datenbanken werden unterstützt.");
  const value = databaseUrl.slice("file:".length).split("?", 1)[0];
  if (!value || value === ":memory:") throw new Error("Reconciliation-Verifikation benötigt eine persistente SQLite-Datei.");
  return path.resolve(decodeURIComponent(value));
}

function unique(values: readonly string[], label: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) throw new Error(`${label}: ${[...new Set(duplicates)].sort().join(", ")}`);
}

function revisionId(sourceKey: string): string {
  return `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
}

function revisionExpectations(manifest: ReconciliationManifest): RevisionExpectation[] {
  const content = manifest.contentUpdates.map((update): RevisionExpectation => {
    const sourceKey = `reconcile-content:${update.kind}:${update.targetKey}:${update.sourceKey}`;
    return {
      id: revisionId(sourceKey),
      sourceKey,
      targetKind: update.kind,
      targetKey: update.targetKey,
      sourceDigest: update.sourceDigest,
      appliedContentDigest: update.appliedContentDigest,
      snapshotDigest: manifest.snapshotDigest,
    };
  });
  const events = manifest.eventUpdates.map((update): RevisionExpectation => {
    const sourceKey = `reconcile-event:${update.targetKey}:${update.sourceKey}`;
    return {
      id: revisionId(sourceKey),
      sourceKey,
      targetKind: "event",
      targetKey: update.targetKey,
      sourceDigest: update.sourceDigest,
      appliedContentDigest: update.appliedContentDigest,
      snapshotDigest: manifest.snapshotDigest,
    };
  });
  const metadata = manifest.metadataUpdates.map((update): RevisionExpectation => {
    const targetKey = update.targetPath.slice(1);
    const sourceKey = `cleanup-metadata:page:${targetKey}`;
    return {
      id: revisionId(sourceKey),
      sourceKey,
      targetKind: "page",
      targetKey,
      sourceDigest: update.previousContentDigest,
      appliedContentDigest: update.appliedContentDigest,
      snapshotDigest: manifest.snapshotDigest,
    };
  });
  const expectations = [...content, ...events, ...metadata].sort((left, right) => left.sourceKey.localeCompare(right.sourceKey, "en"));
  unique(expectations.map((expectation) => expectation.sourceKey), "Doppelte Revisionsschlüssel im Manifest");
  return expectations;
}

function assertManifestCounts(manifest: ReconciliationManifest): void {
  const expected = {
    contentUpdates: manifest.contentUpdates.length,
    eventUpdates: manifest.eventUpdates.length,
    metadataUpdates: manifest.metadataUpdates.length,
    reviewedRoutes: manifest.reviewedRoutes.length,
  };
  for (const [field, count] of Object.entries(expected) as Array<[keyof typeof expected, number]>) {
    if (manifest.result[field] !== count) {
      throw new Error(`Manifest-Ergebnis ${field}=${manifest.result[field]} passt nicht zu ${count} Einträgen.`);
    }
  }
  unique(manifest.contentUpdates.map((update) => `${update.kind}:${update.targetKey}`), "Doppelte Inhaltsziele im Manifest");
  unique(manifest.eventUpdates.map((update) => update.targetKey), "Doppelte Eventziele im Manifest");
  unique(manifest.metadataUpdates.map((update) => update.targetPath), "Doppelte Metadata-Ziele im Manifest");
}

function singleRow(statement: SqliteStatement, key: string, label: string): Record<string, unknown> {
  const rows = statement.all(key);
  if (rows.length !== 1) throw new Error(`${label}: erwartet genau einen Datensatz, gefunden ${rows.length}.`);
  return rows[0];
}

function eventState(row: Record<string, unknown>): Readonly<Record<string, unknown>> {
  return {
    title: String(row.title),
    startDate: String(row.startDate),
    endDate: row.endDate === null ? null : String(row.endDate),
    startTime: row.startTime === null ? null : String(row.startTime),
    endTime: row.endTime === null ? null : String(row.endTime),
    location: row.location === null ? null : String(row.location),
    description: String(row.description),
    category: String(row.category),
    published: Boolean(row.published),
  };
}

function verifyOutputs(database: SqliteDatabase, manifest: ReconciliationManifest, errors: string[]): void {
  const pageContent = database.prepare('SELECT "content" FROM "Page" WHERE "slug" = ? ORDER BY "slug"');
  const newsContent = database.prepare('SELECT "content" FROM "News" WHERE "slug" = ? ORDER BY "slug"');
  const event = database.prepare('SELECT "title", "startDate", "endDate", "startTime", "endTime", "location", "description", "category", "published" FROM "Event" WHERE "slug" = ? ORDER BY "slug"');
  const pageMetadata = database.prepare('SELECT "metaDesc" FROM "Page" WHERE "slug" = ? ORDER BY "slug"');

  for (const update of manifest.contentUpdates) {
    try {
      const row = singleRow(update.kind === "page" ? pageContent : newsContent, update.targetKey, `${update.kind}:${update.targetKey}`);
      const actual = sha256(String(row.content));
      if (actual !== update.appliedContentDigest) {
        errors.push(`${update.kind}:${update.targetKey}: Inhalts-Digest ${actual} statt ${update.appliedContentDigest}.`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  for (const update of manifest.eventUpdates) {
    try {
      const row = singleRow(event, update.targetKey, `event:${update.targetKey}`);
      const actual = sha256(stableJson(eventState(row)));
      if (actual !== update.appliedContentDigest) {
        errors.push(`event:${update.targetKey}: Event-Digest ${actual} statt ${update.appliedContentDigest}.`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  for (const update of manifest.metadataUpdates) {
    const targetKey = update.targetPath.slice(1);
    try {
      const row = singleRow(pageMetadata, targetKey, `metadata:${update.targetPath}`);
      if (row.metaDesc === null || row.metaDesc === undefined) {
        errors.push(`metadata:${update.targetPath}: Meta-Beschreibung fehlt.`);
        continue;
      }
      const actual = sha256(String(row.metaDesc));
      if (actual !== update.appliedContentDigest) {
        errors.push(`metadata:${update.targetPath}: Metadata-Digest ${actual} statt ${update.appliedContentDigest}.`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
}

function verifyRevisions(database: SqliteDatabase, expectations: readonly RevisionExpectation[], errors: string[]): void {
  const revision = database.prepare(`
    SELECT "id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest"
    FROM "LegacyContentRevision"
    WHERE "sourceKey" = ?
    ORDER BY "sourceKey"
  `);
  const fields: Array<keyof RevisionExpectation> = [
    "id",
    "sourceKey",
    "targetKind",
    "targetKey",
    "sourceDigest",
    "appliedContentDigest",
    "snapshotDigest",
  ];
  for (const expectation of expectations) {
    let row: Record<string, unknown>;
    try {
      row = singleRow(revision, expectation.sourceKey, `Revision ${expectation.sourceKey}`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    for (const field of fields) {
      if (row[field] !== expectation[field]) {
        errors.push(`Revision ${expectation.sourceKey}: ${field}=${String(row[field])} statt ${expectation[field]}.`);
      }
    }
  }
}

export async function verifyLegacyReconciliation(
  options: ReconciliationVerificationOptions,
): Promise<ReconciliationVerificationResult> {
  const manifest = manifestSchema.parse(JSON.parse(await readFile(options.manifestPath, "utf8")));
  assertManifestCounts(manifest);
  const expectations = revisionExpectations(manifest);
  const database = new Sqlite(databasePath(options.databaseUrl), { readonly: true, fileMustExist: true });
  const errors: string[] = [];
  database.prepare("BEGIN").run();
  try {
    verifyOutputs(database, manifest, errors);
    verifyRevisions(database, expectations, errors);
    database.prepare("COMMIT").run();
  } catch (error) {
    database.prepare("ROLLBACK").run();
    throw error;
  } finally {
    database.close();
  }
  if (errors.length > 0) {
    throw new Error(`Legacy-Reconciliation-Verifikation fehlgeschlagen:\n- ${errors.sort((left, right) => left.localeCompare(right, "de")).join("\n- ")}`);
  }
  return {
    contentUpdates: manifest.contentUpdates.length,
    eventUpdates: manifest.eventUpdates.length,
    metadataUpdates: manifest.metadataUpdates.length,
    revisions: expectations.length,
  };
}
