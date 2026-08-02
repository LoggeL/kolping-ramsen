import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { compareLegacyContent } from "./index";
import { sha256, stableJson } from "./internal/stable";
import type { LegacyAsset, LegacyRecord, LegacySnapshot } from "./types";

const ORIGIN = "https://legacy.example";

function sql(value: string | null): string {
  return value === null ? "NULL" : `'${value.replaceAll("'", "''")}'`;
}

function pageRecord(targetPath: string, title: string, markdown: string, assetUrls: readonly string[] = []): LegacyRecord {
  return {
    sourceKey: `page:${targetPath}`,
    sourceUrls: [`${ORIGIN}${targetPath}`],
    sourcePageUrls: [`${ORIGIN}${targetPath}`],
    kind: "page",
    targetPath,
    title,
    markdown,
    excerpt: markdown.slice(0, 180),
    assetUrls,
    internalLinks: [],
    digest: sha256(markdown),
    warnings: [],
  };
}

function eventRecord(markdown: string): LegacyRecord {
  return {
    sourceKey: "event:2026-07-18:familien-zeltlager",
    sourceUrls: [`${ORIGIN}/termine`],
    sourcePageUrls: [`${ORIGIN}/termine`],
    kind: "event",
    targetPath: "/termine/2026-07-18-familien-zeltlager",
    title: "Familien-Zeltlager",
    event: {
      startDate: "2026-07-18",
      endDate: "2026-07-25",
      startTime: "09:00",
      endTime: "18:00",
      location: "Niederschlettenbach",
    },
    markdown,
    excerpt: markdown.slice(0, 180),
    assetUrls: [],
    internalLinks: [],
    digest: sha256(markdown),
    warnings: [],
  };
}

async function writeSnapshot(root: string, records: readonly LegacyRecord[], assets: readonly LegacyAsset[]): Promise<string> {
  const withoutDigest = {
    schemaVersion: 1 as const,
    origin: ORIGIN,
    decisionsDigest: sha256("comparison-hardening-decisions"),
    outcomes: records.map((record) => ({
      url: record.sourceUrls[0],
      status: "captured" as const,
      httpStatus: 200,
      recordCount: 1,
    })),
    records,
    assets,
    findings: [],
  };
  const snapshot: LegacySnapshot = { ...withoutDigest, digest: sha256(stableJson(withoutDigest)) };
  const snapshotPath = path.join(root, "snapshot.json");
  await writeFile(snapshotPath, stableJson(snapshot));
  return snapshotPath;
}

test("directional semantic coverage catches one-line omissions while ignoring presentation and localized asset URLs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-compare-hardening-"));
  try {
    const memberEntries = Array.from({ length: 80 }, (_, index) =>
      `- ${String(index + 1).padStart(2, "0")}.01.${1900 + index} Chronik-Eintrag Mitglied ${index}`,
    );
    const missingMember = "- 31.01.2026 Manfred Zengerle";
    const associationSource = [...memberEntries, missingMember].join("\n\n");
    const associationCurrent = memberEntries.join("\n\n");

    const campEntries = Array.from({ length: 42 }, (_, index) =>
      `${index + 1}. 20.07.${1984 + index} Familienzeltlager in Ort${index} für Gruppe${index}`,
    );
    const missingCamp = "43. 2027 Familienzeltlager in Frauenberg an der Nahe";
    const campSource = [...campEntries, missingCamp].join("\n\n");
    const campCurrent = campEntries.join("\n\n");

    const image = Buffer.from("same-image-bytes");
    const sourceImageUrl = `${ORIGIN}/images/gruppe.jpg`;
    const presentationSource = [
      "## Einführung",
      "Mehr unter [den Details](https://legacy.example/alter-pfad).",
      `![Gruppenfoto](${sourceImageUrl})`,
    ].join("\n\n");
    const presentationCurrent = [
      "### **Einführung**",
      "Mehr unter [den Details](/neuer-pfad).",
      "![Gruppenfoto](/images/gruppe.webp)",
    ].join("\n\n");
    const captionSource = [
      `![gruppe](${sourceImageUrl})`,
      "Bühne & Saal von der KF renoviert",
    ].join("\n\n");
    const captionCurrent =
      '![Bühne & Saal von der KF renoviert](/images/gruppe.webp "Bühne & Saal von der KF renoviert")';

    const eventBlocks = Array.from({ length: 140 }, (_, index) =>
      `Programmpunkt ${index + 1} mit Kennwort${index} für das gemeinsame Wochenende in Niederschlettenbach.`,
    );
    const missingEventDescription = "Die Zelte werden am Freitag gemeinsam auf dem markierten Platz aufgebaut.";
    const eventSource = [...eventBlocks, missingEventDescription].join("\n\n");
    const eventCurrent = eventBlocks.join("\n\n");

    const records = [
      pageRecord("/ueber-uns/vereinsdaten", "Vereinsdaten", associationSource),
      pageRecord("/vereinsbereiche/zeltlager", "Zeltlager", campSource),
      pageRecord("/darstellung", "Darstellung", presentationSource, [sourceImageUrl]),
      pageRecord("/bildbeschriftung", "Bildbeschriftung", captionSource, [sourceImageUrl]),
      eventRecord(eventSource),
      {
        ...eventRecord("Theateraufführung der Jugend, falls ein Winterstück gespielt wird."),
        sourceKey: "event:2026-12-26:theaterauffuehrung-sollte-es-ein-winterstueck-geben",
        targetPath: "/termine/2026-12-26-theaterauffuehrung-sollte-es-ein-winterstueck-geben",
        title: "Theateraufführung Sollte es ein Winterstück geben",
        event: { startDate: "2026-12-26", endDate: "2026-12-27" },
      },
    ];
    const assets: LegacyAsset[] = [{
      assetType: "image",
      digest: sha256(image),
      sourceUrls: [sourceImageUrl],
      contentType: "image/jpeg",
      byteLength: image.byteLength,
      altTexts: ["Gruppenfoto"],
      usedBy: ["page:/darstellung"],
      status: "captured",
    }];
    const snapshotPath = await writeSnapshot(root, records, assets);

    const databaseFile = path.join(root, "content.db");
    execFileSync("sqlite3", [databaseFile, [
      "CREATE TABLE Page (slug TEXT, title TEXT, content TEXT, published INTEGER);",
      "CREATE TABLE News (slug TEXT, title TEXT, date TEXT, teaser TEXT, content TEXT, coverImage TEXT, published INTEGER);",
      "CREATE TABLE Event (slug TEXT, title TEXT, startDate TEXT, endDate TEXT, startTime TEXT, endTime TEXT, location TEXT, description TEXT, published INTEGER);",
      "CREATE TABLE Redirect (fromPath TEXT, toPath TEXT);",
      `INSERT INTO Page VALUES ('ueber-uns/vereinsdaten', 'Vereinsdaten', ${sql(associationCurrent)}, 1);`,
      `INSERT INTO Page VALUES ('vereinsbereiche/zeltlager', 'Zeltlager', ${sql(campCurrent)}, 1);`,
      `INSERT INTO Page VALUES ('darstellung', 'Darstellung', ${sql(presentationCurrent)}, 1);`,
      `INSERT INTO Page VALUES ('bildbeschriftung', 'Bildbeschriftung', ${sql(captionCurrent)}, 1);`,
      `INSERT INTO Event VALUES ('2026-07-18-familien-zeltlager', 'Familien-Zeltlager', '2026-07-18T00:00:00.000Z', '2026-07-24T00:00:00.000Z', NULL, '18:30', NULL, ${sql(eventCurrent)}, 1);`,
      `INSERT INTO Event VALUES ('2026-12-26-theaterauffuehrung', 'Theateraufführung (vorläufig)', '2026-12-26T00:00:00.000Z', '2026-12-27T00:00:00.000Z', NULL, NULL, NULL, 'Theateraufführung der Jugend, falls ein Winterstück gespielt wird.', 0);`,
    ].join("\n")]);

    const publicDir = path.join(root, "public");
    await mkdir(path.join(publicDir, "images"), { recursive: true });
    await writeFile(path.join(publicDir, "images", "gruppe.webp"), image);
    const compared = await compareLegacyContent({
      snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir: path.join(root, "comparison"),
    });

    const association = compared.report.routes.find((route) => route.targetPath === "/ueber-uns/vereinsdaten");
    assert.ok((association?.similarity ?? 0) >= 0.94, "Der frühere Tokenvergleich hätte die einzelne Auslassung als äquivalent eingestuft.");
    assert.equal(association?.status, "different");
    assert.equal(association?.semanticCoverage?.coveredSourceBlocks, 80);
    assert.equal(association?.semanticCoverage?.sourceBlocks, 81);
    assert.ok(association?.notes.some((note) => note.includes("31.01.2026 Manfred Zengerle")));

    const camp = compared.report.routes.find((route) => route.targetPath === "/vereinsbereiche/zeltlager");
    assert.ok((camp?.similarity ?? 0) >= 0.94);
    assert.equal(camp?.status, "different");
    assert.equal(camp?.semanticCoverage?.coveredSourceBlocks, 42);
    assert.equal(camp?.semanticCoverage?.sourceBlocks, 43);
    assert.ok(camp?.notes.some((note) => note.includes("2027 Familienzeltlager")));

    const presentation = compared.report.routes.find((route) => route.targetPath === "/darstellung");
    assert.equal(presentation?.status, "equivalent");
    assert.equal(presentation?.semanticCoverage?.sourceToCurrent, 1);
    assert.equal(presentation?.semanticCoverage?.currentToSource, 1);

    const caption = compared.report.routes.find((route) => route.targetPath === "/bildbeschriftung");
    assert.equal(caption?.status, "equivalent");
    assert.equal(caption?.semanticCoverage?.sourceBlocks, 1);
    assert.equal(caption?.semanticCoverage?.coveredSourceBlocks, 1);

    const event = compared.report.routes.find((route) => route.sourceKey === "event:2026-07-18:familien-zeltlager");
    assert.ok((event?.similarity ?? 0) >= 0.94);
    assert.equal(event?.status, "different");
    assert.ok(event?.notes.some((note) => note.includes("Event-Feld Enddatum weicht ab")));
    assert.ok(event?.notes.some((note) => note.includes("Event-Feld Startzeit weicht ab")));
    assert.ok(event?.notes.some((note) => note.includes("Event-Feld Endzeit weicht ab")));
    assert.ok(event?.notes.some((note) => note.includes("Event-Feld Ort weicht ab")));
    assert.ok(event?.notes.some((note) => note.includes("Event-Feld Beschreibung deckt nur 140/141")));

    const renamedEvent = compared.report.routes.find((route) =>
      route.sourceKey === "event:2026-12-26:theaterauffuehrung-sollte-es-ein-winterstueck-geben",
    );
    assert.notEqual(renamedEvent?.status, "missing-current");
    assert.ok(renamedEvent?.notes.some((note) => note.includes("/termine/2026-12-26-theaterauffuehrung zugeordnet")));

    const markdownReport = await readFile(compared.reportPath, "utf8");
    assert.match(markdownReport, /Blöcke Quelle→aktuell/u);
    assert.match(markdownReport, /80\/81/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
