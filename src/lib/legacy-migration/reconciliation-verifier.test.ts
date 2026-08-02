import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { sha256, stableJson } from "./internal/stable";
import { verifyLegacyReconciliation } from "./internal/verify-reconciliation";

function sql(value: string | number | null): string {
  if (value === null) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

test("verifies reconciled outputs and their deterministic revision rows", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-reconciliation-verify-"));
  try {
    const snapshotDigest = sha256("snapshot");
    const pageContent = "Sauberer Seiteninhalt";
    const newsContent = "Sauberer Nachrichteninhalt";
    const metaDesc = "Eine ausreichend lange und saubere Metabeschreibung.";
    const eventState = {
      title: "Gemeinsamer Termin",
      startDate: "2026-08-21T00:00:00.000Z",
      endDate: "2026-08-22T00:00:00.000Z",
      startTime: "20:00",
      endTime: null,
      location: "Kolpingwiese",
      description: "Mit Veranstalterhinweis.",
      category: "jugend",
      published: true,
    };
    const pageSourceKey = "article:/seite-a#beleg";
    const newsSourceKey = "article:/aktuelles#beleg";
    const eventSourceKey = "event:2026-08-21:termin";
    const manifest = {
      schemaVersion: 1,
      snapshotDigest,
      comparisonDigest: sha256("comparison"),
      decisionsDigest: sha256("decisions"),
      resolutionsDigest: sha256("resolutions"),
      reviewedRoutes: [{
        sourceKey: pageSourceKey,
        targetPath: "/seite-a",
        kind: "page",
        resolution: "merge",
        reason: "Geprüfter Merge.",
      }],
      contentUpdates: [
        {
          action: "source-reconciliation",
          kind: "page",
          targetKey: "seite-a",
          sourceKey: pageSourceKey,
          sourceDigest: sha256("page-source"),
          previousContentDigest: sha256("page-before"),
          appliedContentDigest: sha256(pageContent),
          reason: "Geprüfter Seitenabgleich.",
        },
        {
          action: "guarded-current-merge",
          kind: "news",
          targetKey: "meldung-a",
          sourceKey: newsSourceKey,
          sourceDigest: sha256("news-source"),
          previousContentDigest: sha256("news-before"),
          appliedContentDigest: sha256(newsContent),
          reason: "Geprüfter Nachrichtenabgleich.",
        },
      ],
      eventUpdates: [{
        action: "guarded-event-merge",
        targetKey: "2026-08-21-termin",
        sourceKey: eventSourceKey,
        sourceDigest: sha256("event-source"),
        previousContentDigest: sha256("event-before"),
        appliedContentDigest: sha256(stableJson(eventState)),
        reason: "Geprüfter Terminabgleich.",
      }],
      metadataUpdates: [{
        action: "guarded-metadata-cleanup",
        targetPath: "/seite-a",
        previousContentDigest: sha256("meta-before"),
        appliedContentDigest: sha256(metaDesc),
        reason: "Geprüfte Metadatenbereinigung.",
      }],
      result: {
        contentUpdates: 2,
        eventUpdates: 1,
        metadataUpdates: 1,
        reviewedRoutes: 1,
        migrationPath: "migration.sql",
        manifestPath: "manifest.json",
      },
    } as const;
    const manifestPath = path.join(root, "manifest.json");
    await writeFile(manifestPath, stableJson(manifest));

    const revisionRows = [
      {
        sourceKey: `reconcile-content:page:seite-a:${pageSourceKey}`,
        targetKind: "page",
        targetKey: "seite-a",
        sourceDigest: manifest.contentUpdates[0].sourceDigest,
        appliedContentDigest: manifest.contentUpdates[0].appliedContentDigest,
      },
      {
        sourceKey: `reconcile-content:news:meldung-a:${newsSourceKey}`,
        targetKind: "news",
        targetKey: "meldung-a",
        sourceDigest: manifest.contentUpdates[1].sourceDigest,
        appliedContentDigest: manifest.contentUpdates[1].appliedContentDigest,
      },
      {
        sourceKey: `reconcile-event:2026-08-21-termin:${eventSourceKey}`,
        targetKind: "event",
        targetKey: "2026-08-21-termin",
        sourceDigest: manifest.eventUpdates[0].sourceDigest,
        appliedContentDigest: manifest.eventUpdates[0].appliedContentDigest,
      },
      {
        sourceKey: "cleanup-metadata:page:seite-a",
        targetKind: "page",
        targetKey: "seite-a",
        sourceDigest: manifest.metadataUpdates[0].previousContentDigest,
        appliedContentDigest: manifest.metadataUpdates[0].appliedContentDigest,
      },
    ].map((row) => ({
      ...row,
      id: `legacyrev_${sha256(row.sourceKey).slice(7, 31)}`,
    }));

    const databaseFile = path.join(root, "content.db");
    execFileSync("sqlite3", [databaseFile, [
      "CREATE TABLE Page (slug TEXT PRIMARY KEY, content TEXT NOT NULL, metaDesc TEXT);",
      "CREATE TABLE News (slug TEXT PRIMARY KEY, content TEXT NOT NULL);",
      "CREATE TABLE Event (slug TEXT PRIMARY KEY, title TEXT NOT NULL, startDate TEXT NOT NULL, endDate TEXT, startTime TEXT, endTime TEXT, location TEXT, description TEXT NOT NULL, category TEXT NOT NULL, published INTEGER NOT NULL);",
      "CREATE TABLE LegacyContentRevision (id TEXT PRIMARY KEY, sourceKey TEXT UNIQUE NOT NULL, targetKind TEXT NOT NULL, targetKey TEXT NOT NULL, sourceDigest TEXT NOT NULL, appliedContentDigest TEXT NOT NULL, snapshotDigest TEXT NOT NULL);",
      `INSERT INTO Page VALUES ('seite-a', ${sql(pageContent)}, ${sql(metaDesc)});`,
      `INSERT INTO News VALUES ('meldung-a', ${sql(newsContent)});`,
      `INSERT INTO Event VALUES ('2026-08-21-termin', ${sql(eventState.title)}, ${sql(eventState.startDate)}, ${sql(eventState.endDate)}, ${sql(eventState.startTime)}, ${sql(eventState.endTime)}, ${sql(eventState.location)}, ${sql(eventState.description)}, ${sql(eventState.category)}, 1);`,
      ...revisionRows.map((row) =>
        `INSERT INTO LegacyContentRevision VALUES (${sql(row.id)}, ${sql(row.sourceKey)}, ${sql(row.targetKind)}, ${sql(row.targetKey)}, ${sql(row.sourceDigest)}, ${sql(row.appliedContentDigest)}, ${sql(snapshotDigest)});`),
    ].join("\n")]);

    const options = { manifestPath, databaseUrl: `file:${databaseFile}` };
    assert.deepEqual(await verifyLegacyReconciliation(options), {
      contentUpdates: 2,
      eventUpdates: 1,
      metadataUpdates: 1,
      revisions: 4,
    });

    execFileSync("sqlite3", [databaseFile, "UPDATE Page SET content = 'Drift' WHERE slug = 'seite-a';"]);
    await assert.rejects(verifyLegacyReconciliation(options), /page:seite-a: Inhalts-Digest/u);
    execFileSync("sqlite3", [databaseFile, `UPDATE Page SET content = ${sql(pageContent)} WHERE slug = 'seite-a';`]);

    execFileSync("sqlite3", [databaseFile, `UPDATE LegacyContentRevision SET appliedContentDigest = ${sql(sha256("drift"))} WHERE sourceKey = ${sql(revisionRows[0].sourceKey)};`]);
    await assert.rejects(verifyLegacyReconciliation(options), /Revision reconcile-content:page:seite-a.*appliedContentDigest=/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
