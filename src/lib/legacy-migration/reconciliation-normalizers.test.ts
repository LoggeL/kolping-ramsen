import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { LegacySnapshot } from "./types";
import {
  normalizeAssociationData,
  normalizeCampHistory,
  reconcileAssociationDataMarkdown,
  reconcileCampHistoryMarkdown,
  reconcilePfarrheimGallery,
  reconcileParishHallMarkdown,
  ReconciliationDriftError,
} from "./internal/reconciliation-normalizers";

const snapshot = JSON.parse(readFileSync("content/legacy/snapshot.json", "utf8")) as LegacySnapshot;

function sourceRecord(targetPath: string) {
  const records = snapshot.records.filter((record) => record.targetPath === targetPath && record.canonicalSource);
  assert.equal(records.length, 1, `Expected one canonical source record for ${targetPath}`);
  return records[0];
}

function currentPage(slug: string): string {
  return execFileSync("sqlite3", ["build-dev.db", `SELECT content FROM Page WHERE slug = '${slug.replace(/'/g, "''")}';`], {
    encoding: "utf8",
  }).trim();
}

function imageParts(markdown: string): Array<{ alt: string; destination: string }> {
  return Array.from(markdown.matchAll(/!\[([^\]]*)\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/gu), (match) => ({
    alt: match[1],
    destination: match[2] ?? match[3],
  }));
}

test("reconciles Vereinsdaten into semantic headings and complete lists without changing source facts", () => {
  const source = sourceRecord("/ueber-uns/vereinsdaten");
  const current = currentPage("ueber-uns/vereinsdaten");
  const result = reconcileAssociationDataMarkdown({ currentMarkdown: current, sourceMarkdown: source.markdown });

  assert.equal((result.match(/^#{2,3}\s+/gmu) ?? []).length, 22);
  assert.equal((result.match(/^##\s+/gmu) ?? []).length, 20);
  assert.equal((result.match(/^###\s+/gmu) ?? []).length, 2);
  assert.equal((result.match(/^-\s+/gmu) ?? []).length, 210);
  assert.doesNotMatch(result, /Relevante Vereins\s*-\s*Daten/u);
  assert.match(result, /^## Gründungsversammlung am 29\. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7$/mu);
  assert.doesNotMatch(result, /^#{2,3} des Schwesternhauses/mu);
  assert.match(result, /^- 25\.11\.2016\s+Wiltrud Schach$/mu);
  assert.match(result, /^- 1973\s+Bau der Mariengrotte.+unter der Leitung von Steinmetz Karl Böhm$/mu);
  assert.doesNotMatch(result, /^- Leitung von Steinmetz Karl Böhm$/mu);
  assert.match(result, /^- 31\.01\.2026\s+Manfred Zengerle$/mu);
  assert.match(result, /^- 29\.04\.1953 - 04 05\.1963 Pfarrer Dr\. Karl Zinke \(verst\.\)$/mu);
  assert.equal((result.match(/^- 31\.11\.2012/gmu) ?? []).length, 2, "Ungeklärte Quelldaten dürfen nicht still korrigiert werden.");
  assert.deepEqual(imageParts(result).map((image) => image.destination), imageParts(current).map((image) => image.destination));
  assert.doesNotMatch(result, /https:\/\/kolping-ramsen\.de\/images\//u);
  assert.equal(
    normalizeAssociationData(source.markdown, new Map(imageParts(source.markdown).map((image, index) => [image.destination, imageParts(current)[index].destination]))),
    result,
  );
  assert.equal(
    reconcileAssociationDataMarkdown({ currentMarkdown: result, sourceMarkdown: source.markdown }),
    result,
    "Die source-aware Normalisierung muss idempotent sein.",
  );
});

test("renders all 52 Zeltlager records as an accessible source-authoritative table", () => {
  const source = sourceRecord("/vereinsbereiche/zeltlager");
  const result = reconcileCampHistoryMarkdown({ sourceMarkdown: source.markdown, sourceTitle: source.title });
  const dataRows = result.split("\n").filter((line) => /^\| (?:–|\d{2}\.) \|/u.test(line));

  assert.equal(dataRows.length, 52);
  assert.match(result, /^\| Nr\. \| Zeitraum \| Lager \/ Hinweis \|$/mu);
  assert.match(result, /^\| 42\. \| 17\.07\. - 25\.07\.2026 \| Familienzeltlager in Niederschlettenbach\/ Südpfalz \(Am Teilberg\) \|$/mu);
  assert.doesNotMatch(result, /In Planung/u);
  assert.match(result, /^\| 43\. \| 2027 \| Familienzeltlager in Frauenberg\/ \(an der Nahe\) \|$/mu);
  assert.match(result, /wegen Corona abgesagt/u);
  assert.equal(normalizeCampHistory(source.markdown), result);
  assert.equal(
    reconcileCampHistoryMarkdown({ sourceMarkdown: result, sourceTitle: source.title }),
    result,
    "Auch die bereits strukturierte Quellfassung muss stabil bleiben.",
  );
});

test("rebuilds the Pfarrheim gallery with source captions and current local image paths", () => {
  const source = sourceRecord("/ueber-uns/pfarrheim");
  const current = currentPage("ueber-uns/pfarrheim");
  const missing = "https://kolping-ramsen.de/images/P3161033.JPG";
  const result = reconcileParishHallMarkdown({
    currentMarkdown: current,
    sourceMarkdown: source.markdown,
    unavailableSourceImageUrls: [missing],
  });
  const images = imageParts(result);

  assert.match(result, /\| Jahr \| Ereignis \|/u);
  assert.match(result, /\| 1980 \| Einweihung des „Pfarrheims" nach Umbau und Renovierung in Eigenleistung durch die Kolpingsfamilie Ramsen \|/u);
  assert.match(result, /Großer Versammlungsraum von der KF ausgebaut – das zugehörige Bild ist an der Quelle nicht mehr verfügbar\./u);
  assert.doesNotMatch(result, /P3161033/u);
  assert.deepEqual(images, [
    { alt: "Bühne & Saal von der KF renoviert", destination: "/images/imported/ueber-uns/P3161030.JPG" },
    { alt: "Jugendraum von der KF errichtet", destination: "/images/imported/ueber-uns/P3161022.JPG" },
    { alt: "Außengelände von der KF angelegt", destination: "/images/imported/ueber-uns/P3161028.JPG" },
  ]);
  assert.match(result, /P3161030\.JPG "Bühne & Saal von der KF renoviert"/u);
  assert.match(result, /P3161022\.JPG "Jugendraum von der KF errichtet"/u);
  assert.match(result, /P3161028\.JPG "Außengelände von der KF angelegt"/u);
  assert.match(result, /\*Die Adresse des Pfarrheims: Klosterhof 7\*$/u);
  const sourceImages = imageParts(source.markdown);
  assert.equal(reconcilePfarrheimGallery(current, source.markdown, new Map([
    [sourceImages[1].destination, images[0].destination],
    [sourceImages[2].destination, images[1].destination],
    [sourceImages[3].destination, images[2].destination],
  ])), result);
  assert.equal(
    reconcileParishHallMarkdown({
      currentMarkdown: result,
      sourceMarkdown: source.markdown,
      unavailableSourceImageUrls: [missing],
    }),
    result,
    "Pfarrheim-Reconciliation muss idempotent sein.",
  );
});

test("fails closed on reconciliation drift", () => {
  const association = sourceRecord("/ueber-uns/vereinsdaten");
  assert.throws(
    () => reconcileAssociationDataMarkdown({ currentMarkdown: "Kein lokales Bild-Mapping", sourceMarkdown: association.markdown }),
    ReconciliationDriftError,
  );

  const camp = sourceRecord("/vereinsbereiche/zeltlager");
  assert.throws(
    () => reconcileCampHistoryMarkdown({ sourceMarkdown: `${camp.markdown}\n\nNicht parsebar`, sourceTitle: camp.title }),
    ReconciliationDriftError,
  );

  const parishHall = sourceRecord("/ueber-uns/pfarrheim");
  assert.throws(
    () => reconcileParishHallMarkdown({
      currentMarkdown: currentPage("ueber-uns/pfarrheim"),
      sourceMarkdown: parishHall.markdown,
      unavailableSourceImageUrls: [],
    }),
    ReconciliationDriftError,
  );
});
