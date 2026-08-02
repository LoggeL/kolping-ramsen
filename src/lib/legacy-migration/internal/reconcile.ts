import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type {
  ComparisonReport,
  ContentKind,
  LegacyRecord,
  LegacySnapshot,
} from "../types";
import {
  normalizeAssociationData,
  normalizeCampHistory,
  reconcilePfarrheimGallery,
} from "./reconciliation-normalizers";
import { readContentDatabaseSnapshot } from "./database-state";
import { sha256, stableJson } from "./stable";

const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);

const sourcePageUpdateSchema = z.object({
  sourceKey: z.string().min(1),
  sourceDigest: digestSchema,
  targetPath: z.string().startsWith("/"),
  expectedComparisonStatus: z.enum(["different", "equivalent"]),
  expectedCurrentContentDigest: digestSchema,
  transformer: z.enum(["association-data", "camp-history", "pfarrheim-gallery"]),
  reason: z.string().min(3),
}).strict();

const currentContentPatchSchema = z.object({
  kind: z.enum(["page", "news"]),
  targetKey: z.string().min(1),
  expectedCurrentContentDigest: digestSchema,
  find: z.string().min(1),
  replace: z.string(),
  sourceKey: z.string().min(1),
  sourceDigest: digestSchema,
  reason: z.string().min(3),
}).strict();

const eventStateSchema = z.object({
  title: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string(),
  category: z.string().min(1),
  published: z.boolean(),
}).strict();

const eventSetSchema = z.object({
  title: z.string().min(1).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  published: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Event-Update darf nicht leer sein.");

const eventUpdateSchema = z.object({
  sourceKey: z.string().min(1),
  sourceDigest: digestSchema,
  targetSlug: z.string().min(1),
  expect: eventStateSchema,
  set: eventSetSchema,
  reason: z.string().min(3),
}).strict();

const metadataUpdateSchema = z.object({
  targetPath: z.string().startsWith("/"),
  expectedCurrentMetaDigest: digestSchema,
  value: z.string().trim().min(20).max(240),
  reason: z.string().min(3),
}).strict();

const reconciliationDecisionsSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotDigest: digestSchema,
  comparisonDigest: digestSchema,
  sourcePageUpdates: z.array(sourcePageUpdateSchema),
  currentContentPatches: z.array(currentContentPatchSchema),
  eventUpdates: z.array(eventUpdateSchema),
  metadataUpdates: z.array(metadataUpdateSchema),
}).strict();

const resolutionSchema = z.object({
  sourceKey: z.string().min(1),
  targetPath: z.string().startsWith("/"),
  kind: z.enum(["page", "news", "event"]),
  resolution: z.enum(["merge", "keep-current", "draft"]),
  reason: z.string().min(3),
}).strict();

const resolutionLedgerSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotDigest: digestSchema,
  comparisonDigest: digestSchema,
  resolutions: z.array(resolutionSchema),
}).strict();

type ReconciliationDecisions = z.infer<typeof reconciliationDecisionsSchema>;
type EventState = z.infer<typeof eventStateSchema>;
type ResolutionLedger = z.infer<typeof resolutionLedgerSchema>;

type CurrentPage = Readonly<{
  slug: string;
  title: string;
  content: string;
  metaDesc: string | null;
  parent: string | null;
  sortOrder: number;
  archiveDate: string | null;
  published: boolean;
}>;

type CurrentNews = Readonly<{
  slug: string;
  title: string;
  date: string;
  teaser: string;
  content: string;
  coverImage: string | null;
  published: boolean;
}>;

type CurrentEvent = EventState & Readonly<{ slug: string }>;

type ContentUpdate = Readonly<{
  kind: "page" | "news";
  targetKey: string;
  sourceKey: string;
  sourceDigest: string;
  beforeContent: string;
  afterContent: string;
  reason: string;
  current: CurrentPage | CurrentNews;
  action: "source-reconciliation" | "guarded-current-merge";
}>;

type EventUpdate = Readonly<{
  targetKey: string;
  sourceKey: string;
  sourceDigest: string;
  before: CurrentEvent;
  after: CurrentEvent;
  reason: string;
}>;

type MetadataUpdate = Readonly<{
  slug: string;
  before: string | null;
  after: string;
  reason: string;
  content: string;
  current: CurrentPage;
}>;

type RevisionExpectation = Readonly<{
  sourceKey: string;
  targetKind: ContentKind;
  targetKey: string;
  sourceDigest: string;
  appliedContentDigest: string;
  snapshotDigest: string;
}>;

const reconciliationContextTable = "_LegacyReconciliationContext";
const seededDatabaseGuard = `(SELECT "isSeeded" FROM "${reconciliationContextTable}") = 1`;
const unseededDatabaseGuard = `(SELECT "isSeeded" FROM "${reconciliationContextTable}") = 0`;

export type ReconciliationStageOptions = Readonly<{
  snapshotPath: string;
  comparisonPath: string;
  decisionsPath: string;
  resolutionsPath: string;
  databaseUrl: string;
  publicDir: string;
  migrationDir: string;
  manifestPath: string;
}>;

export type ReconciliationStageResult = Readonly<{
  contentUpdates: number;
  eventUpdates: number;
  metadataUpdates: number;
  reviewedRoutes: number;
  migrationPath: string;
  manifestPath: string;
}>;

function sql(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value.includes("\0")) throw new Error("NUL-Byte kann nicht in SQLite geschrieben werden.");
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlGuard(column: string, value: string | number | boolean | null): string {
  return value === null ? `"${column}" IS NULL` : `"${column}" = ${sql(value)}`;
}

function unique(values: readonly string[], label: string): void {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) throw new Error(`${label}: ${[...new Set(duplicates)].join(", ")}`);
}

async function atomicWrite(file: string, value: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  await writeFile(temporary, value);
  await rename(temporary, file);
}

function verifyDigest<T extends { digest: string }>(value: T, label: string): void {
  const { digest, ...withoutDigest } = value;
  if (sha256(stableJson(withoutDigest)) !== digest) throw new Error(`${label}-Digest ist ungültig.`);
}

async function readInputs(options: ReconciliationStageOptions): Promise<{
  snapshot: LegacySnapshot;
  comparison: ComparisonReport;
  decisions: ReconciliationDecisions;
  ledger: ResolutionLedger;
}> {
  const snapshot = JSON.parse(await readFile(options.snapshotPath, "utf8")) as LegacySnapshot;
  const comparison = JSON.parse(await readFile(options.comparisonPath, "utf8")) as ComparisonReport;
  const decisions = reconciliationDecisionsSchema.parse(JSON.parse(await readFile(options.decisionsPath, "utf8")));
  const ledger = resolutionLedgerSchema.parse(JSON.parse(await readFile(options.resolutionsPath, "utf8")));
  verifyDigest(snapshot, "Snapshot");
  verifyDigest(comparison, "Comparison");
  if (comparison.snapshotDigest !== snapshot.digest) throw new Error("Snapshot und Comparison gehören nicht zusammen.");
  for (const input of [decisions, ledger]) {
    if (input.snapshotDigest !== snapshot.digest || input.comparisonDigest !== comparison.digest) {
      throw new Error("Reconciliation-Eingabe gehört nicht zum versiegelten Snapshot/Comparison-Paar.");
    }
  }
  if (comparison.summary.failedUrls !== 0) throw new Error("Unvollständiger Crawl kann nicht reconciled werden.");
  if (snapshot.findings.some((finding) => finding.severity === "error")) {
    throw new Error("Snapshot enthält ungelöste Error-Findings.");
  }
  return { snapshot, comparison, decisions, ledger };
}

function reviewRoutes(comparison: ComparisonReport, ledger: ResolutionLedger): Map<string, ResolutionLedger["resolutions"][number]> {
  const expected = comparison.routes.filter((route) =>
    route.status === "different" || (route.status === "equivalent" && (route.similarity ?? 1) < 1),
  );
  unique(ledger.resolutions.map((entry) => entry.sourceKey), "Doppelte Route-Resolution");
  const bySource = new Map(ledger.resolutions.map((entry) => [entry.sourceKey, entry]));
  const missing = expected.filter((route) => !bySource.has(route.sourceKey));
  const extra = ledger.resolutions.filter((entry) => !expected.some((route) => route.sourceKey === entry.sourceKey));
  if (missing.length || extra.length) {
    throw new Error(`Resolution-Ledger ist nicht vollständig (fehlend: ${missing.map((route) => route.sourceKey).join(", ") || "keine"}; zusätzlich: ${extra.map((entry) => entry.sourceKey).join(", ") || "keine"}).`);
  }
  for (const route of expected) {
    const resolution = bySource.get(route.sourceKey)!;
    if (resolution.targetPath !== route.targetPath || resolution.kind !== route.kind) {
      throw new Error(`Resolution passt nicht zur Vergleichsroute ${route.sourceKey}.`);
    }
  }
  return bySource;
}

function currentMaps(databaseUrl: string): {
  pages: Map<string, CurrentPage>;
  news: Map<string, CurrentNews>;
  events: Map<string, CurrentEvent>;
} {
  const snapshot = readContentDatabaseSnapshot(databaseUrl);
  const pages = new Map((snapshot.pages as Array<Record<string, unknown>>).map((row) => {
    const page: CurrentPage = {
      slug: String(row.slug),
      title: String(row.title),
      content: String(row.content),
      metaDesc: row.metaDesc === null ? null : String(row.metaDesc),
      parent: row.parent === null ? null : String(row.parent),
      sortOrder: Number(row.sortOrder),
      archiveDate: row.archiveDate === null || row.archiveDate === undefined ? null : String(row.archiveDate),
      published: Boolean(row.published),
    };
    return [page.slug, page] as const;
  }));
  const news = new Map((snapshot.news as Array<Record<string, unknown>>).map((row) => {
    const item: CurrentNews = {
      slug: String(row.slug),
      title: String(row.title),
      date: String(row.date),
      teaser: String(row.teaser),
      content: String(row.content),
      coverImage: row.coverImage === null ? null : String(row.coverImage),
      published: Boolean(row.published),
    };
    return [item.slug, item] as const;
  }));
  const events = new Map((snapshot.events as Array<Record<string, unknown>>).map((row) => {
    const event: CurrentEvent = {
      slug: String(row.slug),
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
    return [event.slug, event] as const;
  }));
  return { pages, news, events };
}

async function localAssetMap(
  record: LegacyRecord,
  snapshot: LegacySnapshot,
  comparison: ComparisonReport,
  publicDir: string,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const sourceUrl of record.assetUrls) {
    const sourceAsset = snapshot.assets.find((asset) => asset.sourceUrls.includes(sourceUrl));
    const compared = comparison.assets.find((asset) => asset.sourceUrl === sourceUrl);
    if (!sourceAsset || !compared) throw new Error(`Asset-Abgleich fehlt für ${sourceUrl}.`);
    if (compared.status === "source-failed") continue;
    if (compared.localPaths.length !== 1) throw new Error(`Asset ${sourceUrl} besitzt nicht genau einen lokalen Zielpfad.`);
    const publicPath = compared.localPaths[0];
    const absolute = path.resolve(publicDir, `.${new URL(publicPath, "https://public.invalid").pathname}`);
    const root = `${path.resolve(publicDir)}${path.sep}`;
    if (!absolute.startsWith(root)) throw new Error(`Lokaler Assetpfad liegt außerhalb von public: ${publicPath}`);
    await access(absolute);
    if (compared.status === "matched-by-digest" && sourceAsset.digest) {
      const bytes = await readFile(absolute);
      if (sha256(bytes) !== sourceAsset.digest) throw new Error(`Lokaler Asset-Digest weicht ab: ${publicPath}`);
    }
    result.set(sourceUrl, publicPath);
  }
  return result;
}

function sourceRecord(
  decision: ReconciliationDecisions["sourcePageUpdates"][number],
  snapshot: LegacySnapshot,
  comparison: ComparisonReport,
): LegacyRecord {
  const matches = snapshot.records.filter((record) => record.sourceKey === decision.sourceKey);
  if (matches.length !== 1) throw new Error(`Referenz ${decision.sourceKey} ist nicht eindeutig.`);
  const record = matches[0];
  if (record.kind !== "page" || record.targetPath !== decision.targetPath || record.digest !== decision.sourceDigest) {
    throw new Error(`Referenzdaten passen nicht zur Source-Page-Freigabe ${decision.sourceKey}.`);
  }
  if (!record.canonicalSource || record.warnings.length > 0) {
    throw new Error(`Referenz ${decision.sourceKey} ist nicht kanonisch oder besitzt Warnungen.`);
  }
  const route = comparison.routes.find((entry) => entry.sourceKey === decision.sourceKey);
  if (!route || route.status !== decision.expectedComparisonStatus || route.targetPath !== decision.targetPath) {
    throw new Error(`Vergleichsstatus passt nicht zur Source-Page-Freigabe ${decision.sourceKey}.`);
  }
  return record;
}

function replaceExactlyOnce(source: string, find: string, replacement: string, owner: string): string {
  const first = source.indexOf(find);
  if (first < 0 || source.indexOf(find, first + find.length) >= 0) {
    throw new Error(`Patch ${owner} findet seinen Anker nicht exakt einmal.`);
  }
  return `${source.slice(0, first)}${replacement}${source.slice(first + find.length)}`;
}

function eventState(event: CurrentEvent): EventState {
  const { slug: _slug, ...state } = event;
  return state;
}

function sameState(left: unknown, right: unknown): boolean {
  return stableJson(left) === stableJson(right);
}

function pageGuards(current: CurrentPage, content: string): string[] {
  return [
    `"slug" = ${sql(current.slug)}`,
    `"title" = ${sql(current.title)}`,
    `"content" = ${sql(content)}`,
    sqlGuard("metaDesc", current.metaDesc),
    sqlGuard("parent", current.parent),
    `"sortOrder" = ${sql(current.sortOrder)}`,
    sqlGuard("archiveDate", current.archiveDate),
    `"published" = ${sql(current.published)}`,
  ];
}

function newsGuards(current: CurrentNews, content: string): string[] {
  return [
    `"slug" = ${sql(current.slug)}`,
    `"title" = ${sql(current.title)}`,
    `"date" = ${sql(current.date)}`,
    `"teaser" = ${sql(current.teaser)}`,
    `"content" = ${sql(content)}`,
    sqlGuard("coverImage", current.coverImage),
    `"published" = ${sql(current.published)}`,
  ];
}

function eventGuards(event: CurrentEvent): string[] {
  return [
    `"slug" = ${sql(event.slug)}`,
    `"title" = ${sql(event.title)}`,
    `"startDate" = ${sql(event.startDate)}`,
    sqlGuard("endDate", event.endDate),
    sqlGuard("startTime", event.startTime),
    sqlGuard("endTime", event.endTime),
    sqlGuard("location", event.location),
    `"description" = ${sql(event.description)}`,
    `"category" = ${sql(event.category)}`,
    `"published" = ${sql(event.published)}`,
  ];
}

function revisionSql(
  expectation: RevisionExpectation,
  table: "Page" | "News" | "Event",
  targetGuards: readonly string[],
): string {
  const id = `legacyrev_${sha256(expectation.sourceKey).slice(7, 31)}`;
  return `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")\nSELECT ${sql(id)}, ${sql(expectation.sourceKey)}, ${sql(expectation.targetKind)}, ${sql(expectation.targetKey)}, ${sql(expectation.sourceDigest)}, ${sql(expectation.appliedContentDigest)}, ${sql(expectation.snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP\nWHERE changes() = 1 AND EXISTS (SELECT 1 FROM "${table}" WHERE ${targetGuards.join(" AND ")});`;
}

function contentUpdateSql(update: ContentUpdate, snapshotDigest: string): { sql: string; expectation: RevisionExpectation } {
  const table = update.kind === "page" ? "Page" : "News";
  const beforeGuards = update.kind === "page"
    ? pageGuards(update.current as CurrentPage, update.beforeContent)
    : newsGuards(update.current as CurrentNews, update.beforeContent);
  const afterGuards = update.kind === "page"
    ? pageGuards(update.current as CurrentPage, update.afterContent)
    : newsGuards(update.current as CurrentNews, update.afterContent);
  const revisionKey = `reconcile-content:${update.kind}:${update.targetKey}:${update.sourceKey}`;
  const expectation: RevisionExpectation = {
    sourceKey: revisionKey,
    targetKind: update.kind,
    targetKey: update.targetKey,
    sourceDigest: update.sourceDigest,
    appliedContentDigest: sha256(update.afterContent),
    snapshotDigest,
  };
  return {
    expectation,
    sql: [
      `UPDATE "${table}" SET "content" = ${sql(update.afterContent)}, "updatedAt" = CURRENT_TIMESTAMP WHERE ${seededDatabaseGuard} AND ${beforeGuards.join(" AND ")};`,
      revisionSql(expectation, table, afterGuards),
    ].join("\n"),
  };
}

function eventUpdateSql(update: EventUpdate, snapshotDigest: string): { sql: string; expectation: RevisionExpectation } {
  const fields: Array<keyof EventState> = ["title", "startDate", "endDate", "startTime", "endTime", "location", "description", "category", "published"];
  const assignments = fields
    .filter((field) => update.before[field] !== update.after[field])
    .map((field) => `"${field}" = ${sql(update.after[field])}`);
  if (assignments.length === 0) throw new Error(`Event-Update ist wirkungslos: ${update.targetKey}`);
  const revisionKey = `reconcile-event:${update.targetKey}:${update.sourceKey}`;
  const expectation: RevisionExpectation = {
    sourceKey: revisionKey,
    targetKind: "event",
    targetKey: update.targetKey,
    sourceDigest: update.sourceDigest,
    appliedContentDigest: sha256(stableJson(eventState(update.after))),
    snapshotDigest,
  };
  return {
    expectation,
    sql: [
      `UPDATE "Event" SET ${assignments.join(", ")}, "updatedAt" = CURRENT_TIMESTAMP WHERE ${seededDatabaseGuard} AND ${eventGuards(update.before).join(" AND ")};`,
      revisionSql(expectation, "Event", eventGuards(update.after)),
    ].join("\n"),
  };
}

function metadataUpdateSql(update: MetadataUpdate, snapshotDigest: string): { sql: string; expectation: RevisionExpectation } {
  const revisionKey = `cleanup-metadata:page:${update.slug}`;
  const expectation: RevisionExpectation = {
    sourceKey: revisionKey,
    targetKind: "page",
    targetKey: update.slug,
    sourceDigest: sha256(update.before ?? ""),
    appliedContentDigest: sha256(update.after),
    snapshotDigest,
  };
  const afterGuards = [
    `"slug" = ${sql(update.slug)}`,
    `"title" = ${sql(update.current.title)}`,
    `"content" = ${sql(update.content)}`,
    `"metaDesc" = ${sql(update.after)}`,
    sqlGuard("parent", update.current.parent),
    `"sortOrder" = ${sql(update.current.sortOrder)}`,
    sqlGuard("archiveDate", update.current.archiveDate),
    `"published" = ${sql(update.current.published)}`,
  ];
  return {
    expectation,
    sql: [
      `UPDATE "Page" SET "metaDesc" = ${sql(update.after)}, "updatedAt" = CURRENT_TIMESTAMP WHERE ${seededDatabaseGuard} AND "slug" = ${sql(update.slug)} AND "title" = ${sql(update.current.title)} AND "content" = ${sql(update.content)} AND ${sqlGuard("metaDesc", update.before)} AND ${sqlGuard("parent", update.current.parent)} AND "sortOrder" = ${sql(update.current.sortOrder)} AND ${sqlGuard("archiveDate", update.current.archiveDate)} AND "published" = ${sql(update.current.published)};`,
      revisionSql(expectation, "Page", afterGuards),
    ].join("\n"),
  };
}

function contextSql(
  contentUpdates: readonly ContentUpdate[],
  eventUpdates: readonly EventUpdate[],
  metadataUpdates: readonly MetadataUpdate[],
): string[] {
  const pageTargets = new Set([
    ...contentUpdates.filter((update) => update.kind === "page").map((update) => update.targetKey),
    ...metadataUpdates.map((update) => update.slug),
  ]);
  const newsTargets = new Set(contentUpdates
    .filter((update) => update.kind === "news")
    .map((update) => update.targetKey));
  const eventTargets = new Set(eventUpdates.map((update) => update.targetKey));
  const targetChecks = [
    pageTargets.size > 0
      ? `EXISTS (SELECT 1 FROM "Page" WHERE "slug" IN (${[...pageTargets].map(sql).join(", ")}))`
      : null,
    newsTargets.size > 0
      ? `EXISTS (SELECT 1 FROM "News" WHERE "slug" IN (${[...newsTargets].map(sql).join(", ")}))`
      : null,
    eventTargets.size > 0
      ? `EXISTS (SELECT 1 FROM "Event" WHERE "slug" IN (${[...eventTargets].map(sql).join(", ")}))`
      : null,
  ].filter((entry): entry is string => entry !== null);
  if (targetChecks.length === 0) throw new Error("Reconciliation besitzt keine Zielrecords.");

  return [
    `CREATE TEMP TABLE "${reconciliationContextTable}" ("isSeeded" INTEGER NOT NULL CHECK ("isSeeded" IN (0, 1)));`,
    `INSERT INTO "${reconciliationContextTable}" ("isSeeded") SELECT CASE WHEN EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-current:page:ueber-uns/vereinsdaten' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/vereinsdaten') THEN 1 ELSE 0 END;`,
    'CREATE TEMP TABLE "_LegacyReconciliationBootstrapAssertion" ("ok" INTEGER NOT NULL ON CONFLICT ROLLBACK);',
    `INSERT INTO "_LegacyReconciliationBootstrapAssertion" ("ok") SELECT NULL WHERE ${unseededDatabaseGuard} AND (${targetChecks.join(" OR ")});`,
    'DROP TABLE "_LegacyReconciliationBootstrapAssertion";',
  ];
}

function assertionSql(expectations: readonly RevisionExpectation[]): string[] {
  unique(expectations.map((expectation) => expectation.sourceKey), "Doppelte Revisionserwartung");
  return [
    'CREATE TEMP TABLE "_LegacyReconciliationAssertion" ("ok" INTEGER NOT NULL ON CONFLICT ROLLBACK);',
    ...expectations.map((expectation) =>
      `INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE ${seededDatabaseGuard} AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = ${sql(expectation.sourceKey)} AND "targetKind" = ${sql(expectation.targetKind)} AND "targetKey" = ${sql(expectation.targetKey)} AND "sourceDigest" = ${sql(expectation.sourceDigest)} AND "appliedContentDigest" = ${sql(expectation.appliedContentDigest)} AND "snapshotDigest" = ${sql(expectation.snapshotDigest)});`),
    'DROP TABLE "_LegacyReconciliationAssertion";',
  ];
}

export async function stageLegacyReconciliation(options: ReconciliationStageOptions): Promise<ReconciliationStageResult> {
  const { snapshot, comparison, decisions, ledger } = await readInputs(options);
  const resolutionBySource = reviewRoutes(comparison, ledger);
  const current = currentMaps(options.databaseUrl);
  const sourcePageUpdates: ContentUpdate[] = [];

  for (const decision of decisions.sourcePageUpdates) {
    const record = sourceRecord(decision, snapshot, comparison);
    if (resolutionBySource.get(record.sourceKey)?.resolution !== "merge") {
      throw new Error(`Source-Page-Update ist im Resolution-Ledger nicht als merge freigegeben: ${record.sourceKey}`);
    }
    const slug = decision.targetPath.replace(/^\/+/, "");
    const page = current.pages.get(slug);
    if (!page || !page.published) throw new Error(`Veröffentlichtes Page-Ziel fehlt: ${decision.targetPath}`);
    if (sha256(page.content) !== decision.expectedCurrentContentDigest) {
      throw new Error(`Current-Content-Guard weicht ab: ${decision.targetPath}`);
    }
    const assets = await localAssetMap(record, snapshot, comparison, options.publicDir);
    const afterContent = decision.transformer === "association-data"
      ? normalizeAssociationData(record.markdown, assets)
      : decision.transformer === "camp-history"
        ? normalizeCampHistory(record.markdown)
        : reconcilePfarrheimGallery(page.content, record.markdown, assets);
    if (afterContent === page.content) throw new Error(`Source-Page-Update ist wirkungslos: ${decision.targetPath}`);
    sourcePageUpdates.push({
      kind: "page",
      targetKey: slug,
      sourceKey: record.sourceKey,
      sourceDigest: record.digest,
      beforeContent: page.content,
      afterContent,
      reason: decision.reason,
      current: page,
      action: "source-reconciliation",
    });
  }

  const currentContentUpdates: ContentUpdate[] = decisions.currentContentPatches.map((decision) => {
    if (resolutionBySource.get(decision.sourceKey)?.resolution !== "merge") {
      throw new Error(`Current-Merge ist im Resolution-Ledger nicht als merge freigegeben: ${decision.sourceKey}`);
    }
    const record = snapshot.records.find((entry) => entry.sourceKey === decision.sourceKey);
    if (!record || record.digest !== decision.sourceDigest) throw new Error(`Patch-Referenz weicht ab: ${decision.sourceKey}`);
    const item = decision.kind === "page" ? current.pages.get(decision.targetKey) : current.news.get(decision.targetKey);
    if (!item || !item.published) throw new Error(`Veröffentlichtes Patch-Ziel fehlt: ${decision.kind}:${decision.targetKey}`);
    if (sha256(item.content) !== decision.expectedCurrentContentDigest) throw new Error(`Patch-Content-Guard weicht ab: ${decision.targetKey}`);
    return {
      kind: decision.kind,
      targetKey: decision.targetKey,
      sourceKey: decision.sourceKey,
      sourceDigest: decision.sourceDigest,
      beforeContent: item.content,
      afterContent: replaceExactlyOnce(item.content, decision.find, decision.replace, decision.targetKey),
      reason: decision.reason,
      current: item,
      action: "guarded-current-merge" as const,
    };
  });

  const eventUpdates: EventUpdate[] = decisions.eventUpdates.map((decision) => {
    const resolution = resolutionBySource.get(decision.sourceKey)?.resolution;
    const approvedDraft = resolution === "draft" && decision.set.published === false;
    if (resolution !== "merge" && !approvedDraft) {
      throw new Error(`Event-Update ist im Resolution-Ledger nicht als merge oder unveröffentlichter draft freigegeben: ${decision.sourceKey}`);
    }
    const record = snapshot.records.find((entry) => entry.sourceKey === decision.sourceKey);
    if (!record || record.kind !== "event" || record.digest !== decision.sourceDigest) {
      throw new Error(`Event-Referenz weicht ab: ${decision.sourceKey}`);
    }
    const before = current.events.get(decision.targetSlug);
    if (!before || !sameState(eventState(before), decision.expect)) throw new Error(`Event-Guard weicht ab: ${decision.targetSlug}`);
    const after: CurrentEvent = { ...before, ...decision.set };
    return {
      targetKey: decision.targetSlug,
      sourceKey: decision.sourceKey,
      sourceDigest: decision.sourceDigest,
      before,
      after,
      reason: decision.reason,
    };
  });

  const allContentUpdates = [...sourcePageUpdates, ...currentContentUpdates];
  unique(allContentUpdates.map((update) => `${update.kind}:${update.targetKey}`), "Doppelte Content-Updates");
  unique(eventUpdates.map((update) => update.targetKey), "Doppelte Event-Updates");
  const handledSources = new Set([
    ...allContentUpdates.map((update) => update.sourceKey),
    ...eventUpdates.map((update) => update.sourceKey),
  ]);
  const unhandledMerges = ledger.resolutions.filter((entry) => entry.resolution === "merge" && !handledSources.has(entry.sourceKey));
  if (unhandledMerges.length > 0) {
    throw new Error(`Merge-Resolution ohne geguardetes Update: ${unhandledMerges.map((entry) => entry.sourceKey).join(", ")}`);
  }
  const appliedPageContent = new Map(allContentUpdates
    .filter((update) => update.kind === "page")
    .map((update) => [update.targetKey, update.afterContent]));

  const metadataUpdates: MetadataUpdate[] = decisions.metadataUpdates.map((decision) => {
    const slug = decision.targetPath.replace(/^\/+/, "");
    const page = current.pages.get(slug);
    if (!page || !page.published) throw new Error(`Metadata-Ziel fehlt: ${decision.targetPath}`);
    if (sha256(page.metaDesc ?? "") !== decision.expectedCurrentMetaDigest) throw new Error(`Metadata-Guard weicht ab: ${decision.targetPath}`);
    if (page.metaDesc === decision.value) throw new Error(`Metadata-Update ist wirkungslos: ${decision.targetPath}`);
    return {
      slug,
      before: page.metaDesc,
      after: decision.value,
      reason: decision.reason,
      content: appliedPageContent.get(slug) ?? page.content,
      current: page,
    };
  });
  unique(metadataUpdates.map((update) => update.slug), "Doppelte Metadata-Updates");

  const contentSql = allContentUpdates.map((update) => contentUpdateSql(update, snapshot.digest));
  const eventSql = eventUpdates.map((update) => eventUpdateSql(update, snapshot.digest));
  const metadataSql = metadataUpdates.map((update) => metadataUpdateSql(update, snapshot.digest));
  const expectations = [...contentSql, ...eventSql, ...metadataSql].map((entry) => entry.expectation);
  const migration = [
    "-- Generated from sealed legacy evidence and an exhaustive per-route resolution ledger. Do not edit by hand.",
    "PRAGMA foreign_keys=ON;",
    "BEGIN IMMEDIATE;",
    ...contextSql(allContentUpdates, eventUpdates, metadataUpdates),
    ...contentSql.map((entry) => entry.sql),
    ...eventSql.map((entry) => entry.sql),
    ...metadataSql.map((entry) => entry.sql),
    ...assertionSql(expectations),
    `DROP TABLE "${reconciliationContextTable}";`,
    "COMMIT;",
  ].join("\n\n");
  const migrationPath = path.join(options.migrationDir, "migration.sql");
  await atomicWrite(migrationPath, `${migration}\n`);

  const result: ReconciliationStageResult = {
    contentUpdates: allContentUpdates.length,
    eventUpdates: eventUpdates.length,
    metadataUpdates: metadataUpdates.length,
    reviewedRoutes: ledger.resolutions.length,
    migrationPath,
    manifestPath: options.manifestPath,
  };
  const manifest = {
    schemaVersion: 1,
    snapshotDigest: snapshot.digest,
    comparisonDigest: comparison.digest,
    decisionsDigest: sha256(stableJson(decisions)),
    resolutionsDigest: sha256(stableJson(ledger)),
    reviewedRoutes: ledger.resolutions,
    contentUpdates: allContentUpdates.map((update) => ({
      action: update.action,
      kind: update.kind,
      targetKey: update.targetKey,
      sourceKey: update.sourceKey,
      sourceDigest: update.sourceDigest,
      previousContentDigest: sha256(update.beforeContent),
      appliedContentDigest: sha256(update.afterContent),
      reason: update.reason,
    })),
    eventUpdates: eventUpdates.map((update) => ({
      action: "guarded-event-merge",
      targetKey: update.targetKey,
      sourceKey: update.sourceKey,
      sourceDigest: update.sourceDigest,
      previousContentDigest: sha256(stableJson(eventState(update.before))),
      appliedContentDigest: sha256(stableJson(eventState(update.after))),
      reason: update.reason,
    })),
    metadataUpdates: metadataUpdates.map((update) => ({
      action: "guarded-metadata-cleanup",
      targetPath: `/${update.slug}`,
      previousContentDigest: sha256(update.before ?? ""),
      appliedContentDigest: sha256(update.after),
      reason: update.reason,
    })),
    result: {
      ...result,
      migrationPath: path.relative(path.dirname(options.manifestPath), migrationPath).split(path.sep).join("/"),
      manifestPath: path.basename(options.manifestPath),
    },
  };
  await atomicWrite(options.manifestPath, stableJson(manifest));
  return result;
}
