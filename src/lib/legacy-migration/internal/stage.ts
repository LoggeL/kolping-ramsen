import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type {
  ComparisonReport,
  CurrentNormalizationDecision,
  DraftUpdateDecision,
  LegacyAsset,
  LegacyRecord,
  LegacySnapshot,
  StageOptions,
  StageResult,
} from "../types";
import { legacySourceRedirectPath, normalizeStoredLegacyPath } from "../../legacy-routing";
import { normalizeCurrentMarkdown } from "./current-markdown";
import { readContentDatabaseSnapshot, type ContentDatabaseSnapshot } from "./database-state";
import { sha256, stableJson, uniqueSorted } from "./stable";

const ARCHIVE_INTROS: Readonly<Record<string, string>> = {
  "rueckblick/ehrungen": "Auszeichnungen, Jubiläen und besondere Dankesmomente aus unserer Kolpingsfamilie.",
  "rueckblick/familienkreis": "Gemeinsame Aktionen, Feste und Ausflüge unserer Familienkreise – chronologisch zum Nachlesen und Anschauen.",
  "rueckblick/jahresprogramm": "Berichte und Bilder aus unserem Jahresprogramm: Begegnungen, Feste, Ausflüge und Aktionen aus vielen Vereinsjahren.",
  "rueckblick/jugendaktivitaeten": "Projekte, Freizeiten, Theater und weitere Erlebnisse unserer Jugend – gesammelt in einzelnen Berichten.",
  "rueckblick/presse": "Presseberichte und Veröffentlichungen über die Kolpingsfamilie Ramsen aus unserem Archiv.",
  "rueckblick/prunksitzung": "Bilder, Programme und Erinnerungen aus der Ramser Fasenacht und unseren Prunksitzungen.",
  "rueckblick/reisen": "Reiseberichte und Bilder unserer gemeinsamen Studien- und Bildungsreisen.",
  "vereinsbereiche/familienkreis": "Unsere Familienkreise schaffen Raum für Begegnungen, gemeinsame Aktionen und Erlebnisse mit Kindern. Berichte und Bilder stehen gesammelt im [Familienkreis-Rückblick](/rueckblick/familienkreis).",
  "vereinsbereiche/jugendgruppe": "Die Kolpingjugend Ramsen gestaltet eigene Projekte, Freizeiten und Theateraufführungen. Aktuelles zum Open-Air-Theater gibt es auf [kolpingtheater-ramsen.de](https://kolpingtheater-ramsen.de); Berichte und Bilder stehen im [Jugend-Rückblick](/rueckblick/jugendaktivitaeten).",
  "vereinsbereiche/kolpingskapelle": "Aktuelles, Konzerte und Einblicke in die Geschichte unserer Kolpingskapelle.",
};

const STALE_DRAFT_REPLACEMENTS: Readonly<Record<string, string>> = {
  datenschutzerklaerung: "Der Inhalt wurde unter [Datenschutz](/datenschutz) zusammengeführt.",
  gaestebuch: "Das frühere Joomla-Gästebuch wurde durch das native [Gästebuch](/gaestebuch) ersetzt.",
  home: "Diese frühere CMS-Startseite wurde durch die native [Startseite](/) ersetzt.",
  "rueckblick/jugend": "Der Inhalt wurde im [Jugend-Rückblick](/rueckblick/jugendaktivitaeten) zusammengeführt.",
  termine: "Diese frühere CMS-Sammelseite wurde durch die strukturierte [Terminübersicht](/termine) ersetzt.",
  theater: "Aktuelle Informationen und Spieltermine stehen auf [kolpingtheater-ramsen.de](https://kolpingtheater-ramsen.de).",
  "ueber-uns/geschichte-pfarrheim": "Der Inhalt wurde unter [Geschichte des Pfarrheims](/ueber-uns/pfarrheim) zusammengeführt.",
  "ueber-uns/relevante-vereinsdaten": "Der Inhalt wurde unter [Vereinsdaten](/ueber-uns/vereinsdaten) zusammengeführt.",
};

const NATIVE_ROUTE_RESOLUTIONS: Readonly<Record<string, string>> = {
  "/": "Die native Startseite ersetzt den alten Willkommenstext bewusst durch aktuelle Einstiege und redaktionelle Teaser.",
  "/aktuelles": "Die native Übersicht wird aus den strukturierten News-Datensätzen aufgebaut.",
  "/termine": "Die native Übersicht wird aus strukturierten Terminen samt Kalenderexport aufgebaut.",
  "/gaestebuch": "Das native Gästebuch ersetzt die Joomla-Ansicht inklusive alter Sicherheitsabfrage funktional.",
  "/kontakt": "Leitungsteam, zentrale Kontaktadresse und Pfarrheimanschrift sind in der nativen Kontaktseite integriert.",
  "/galerien": "Die native Galerieübersicht wird aus dem lokalen Medienkatalog aufgebaut.",
  "/rueckblick": "Die native Bereichsübersicht verweist auf die migrierten Rückblick-Archive.",
  "/ueber-uns": "Die native Bereichsübersicht verweist auf die redaktionellen Unterseiten.",
  "/vereinsbereiche": "Die native Bereichsübersicht verweist auf die redaktionellen Vereinsbereiche.",
};

type CurrentPage = Readonly<{
  slug: string;
  title: string;
  content: string;
  metaDesc: string | null;
  published: boolean;
  parent: string | null;
  sortOrder: number;
  archiveDate: string | null;
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

type CurrentRedirect = Readonly<{
  fromPath: string;
  toPath: string;
}>;

function sql(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (value.includes("\0")) throw new Error("NUL-Byte kann nicht in SQLite geschrieben werden.");
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlGuard(column: string, value: string | null): string {
  return value === null ? `"${column}" IS NULL` : `"${column}" = ${sql(value)}`;
}

function fixedDate(value?: string): string {
  return value ? `${value}T00:00:00.000Z` : "1970-01-01T00:00:00.000Z";
}

function parentOf(targetPath: string): string | null {
  const slug = targetPath.replace(/^\/+|\/+$/g, "");
  const index = slug.lastIndexOf("/");
  return index < 0 ? null : slug.slice(0, index);
}

function firstImage(markdown: string): string | null {
  return markdown.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/u)?.[1] ?? null;
}

function markdownText(markdown: string): string {
  return markdown
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/gmu, "")
    .replace(/[*_~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textLength(markdown: string): number {
  return markdownText(markdown).length;
}

function germanDate(value?: string): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", dateStyle: "long" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function imageOnlyIntro(record: LegacyRecord): string {
  const date = germanDate(record.publishedDate);
  return record.targetPath.startsWith("/rueckblick/presse/")
    ? `Pressebeitrag aus unserem Archiv${date ? ` vom ${date}` : ""}.`
    : `Bilder und Erinnerungen aus unserem Vereinsleben${date ? ` vom ${date}` : ""}.`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeBrokenAsset(markdown: string, url: string): string {
  return markdown
    .replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(url)}(?:\\s+"[^"]*")?\\)`, "gu"), "")
    .replace(new RegExp(`\\[([^\\]]+)\\]\\(${escapeRegExp(url)}(?:\\s+"[^"]*")?\\)`, "gu"), "$1 (Datei an der Quelle nicht verfügbar)")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function publicFile(publicDir: string, publicUrl: string): string {
  const pathname = decodeURIComponent(new URL(publicUrl, "https://public.local").pathname);
  const absolute = path.resolve(publicDir, `.${pathname}`);
  const publicRoot = `${path.resolve(publicDir)}${path.sep}`;
  if (!absolute.startsWith(publicRoot)) throw new Error(`Asset liegt außerhalb von public: ${publicUrl}`);
  return absolute;
}

function versionedPublicUrl(publicPath: string, digest: string): string {
  const url = new URL(publicPath, "https://public.local");
  url.searchParams.set("v", digest.slice("sha256:".length, "sha256:".length + 12));
  return `${url.pathname}${url.search}`;
}

async function atomicWrite(file: string, value: string | Uint8Array) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  await writeFile(temporary, value);
  await rename(temporary, file);
}

async function readSealedInput(options: StageOptions): Promise<{ snapshot: LegacySnapshot; comparison: ComparisonReport }> {
  const snapshot = JSON.parse(await readFile(options.snapshotPath, "utf8")) as LegacySnapshot;
  const comparison = JSON.parse(await readFile(options.comparisonPath, "utf8")) as ComparisonReport;
  if (snapshot.assets.some((asset) => asset.assetType !== "image" && asset.assetType !== "document")) {
    throw new Error("Snapshot enthält Assets ohne unterstützten Typ.");
  }
  if (snapshot.digest !== options.approvedSnapshotDigest) {
    throw new Error(`Approval-Digest ${options.approvedSnapshotDigest} passt nicht zum Snapshot ${snapshot.digest}.`);
  }
  const { digest, ...withoutDigest } = snapshot;
  if (sha256(stableJson(withoutDigest)) !== digest) throw new Error("Snapshot-Digest ist ungültig.");
  if (sha256(stableJson(options.decisions)) !== snapshot.decisionsDigest) {
    throw new Error("Decisions-Datei gehört nicht zum freigegebenen Snapshot.");
  }
  const { digest: comparisonDigest, ...comparisonWithoutDigest } = comparison;
  if (sha256(stableJson(comparisonWithoutDigest)) !== comparisonDigest) {
    throw new Error("Comparison-Digest ist ungültig; Vergleich wurde verändert oder ist beschädigt.");
  }
  if (comparisonDigest !== options.approvedComparisonDigest) {
    throw new Error(`Comparison-Approval ${options.approvedComparisonDigest} passt nicht zu ${comparisonDigest}.`);
  }
  if (comparison.snapshotDigest !== snapshot.digest) throw new Error("Comparison und Snapshot gehören nicht zusammen.");
  if (comparison.summary.failedUrls !== 0) throw new Error("Ein unvollständiger Crawl darf nicht gestaged werden.");
  if (comparison.routes.some((route) => route.status === "ambiguous-target")) throw new Error("Mehrdeutige Zielrouten verhindern das Staging.");
  if (comparison.findings.some((finding) => finding.severity === "error")) throw new Error("Error-Findings verhindern das Staging.");
  return { snapshot, comparison };
}

function currentPages(snapshot: ContentDatabaseSnapshot): Map<string, CurrentPage> {
    const values = snapshot.pages as Array<{
      slug: string;
      title: string;
      content: string;
      metaDesc: string | null;
      published: number;
      parent: string | null;
      sortOrder: number;
      archiveDate?: string | number | null;
    }>;
    return new Map(values.map((value) => [value.slug, {
      ...value,
      published: Boolean(value.published),
      archiveDate: value.archiveDate === null || value.archiveDate === undefined ? null : String(value.archiveDate),
    }]));
}

function currentNews(snapshot: ContentDatabaseSnapshot): Map<string, CurrentNews> {
    const values = snapshot.news as Array<{
      slug: string;
      title: string;
      date: string | number;
      teaser: string;
      content: string;
      coverImage: string | null;
      published: number;
    }>;
    return new Map(values.map((value) => [value.slug, {
      ...value,
      date: String(value.date),
      published: Boolean(value.published),
    }]));
}

function currentRedirects(snapshot: ContentDatabaseSnapshot): Map<string, CurrentRedirect> {
    const values = snapshot.redirects as CurrentRedirect[];
    return new Map(values.map((value) => [normalizeStoredLegacyPath(value.fromPath) ?? value.fromPath, value]));
}

async function materializeAssets(
  records: readonly LegacyRecord[],
  snapshot: LegacySnapshot,
  comparison: ComparisonReport,
  cacheDir: string,
  publicDir: string,
): Promise<{
  replacements: Map<string, string>;
  outputDigests: Map<string, `sha256:${string}`>;
  optimizedAssets: number;
  optimizedBytes: number;
  localizedDocuments: number;
  reusedAssets: number;
  brokenUrls: Set<string>;
}> {
  const needed = new Set(records.flatMap((record) => record.assetUrls));
  const comparisonByUrl = new Map(comparison.assets.map((asset) => [asset.sourceUrl, asset]));
  const cacheFiles = await readdir(path.join(cacheDir, "assets"));
  const replacements = new Map<string, string>();
  const brokenUrls = new Set<string>();
  let optimizedAssets = 0;
  let optimizedBytes = 0;
  let localizedDocuments = 0;
  let reusedAssets = 0;

  for (const asset of snapshot.assets) {
    const usedUrls = asset.sourceUrls.filter((url) => needed.has(url));
    if (usedUrls.length === 0) continue;
    const compared = comparisonByUrl.get(asset.sourceUrls[0]);
    if (compared?.status === "matched-by-digest" && compared.localPaths[0]) {
      const localPath = compared.localPaths[0];
      const localFile = publicFile(publicDir, localPath);
      if (await exists(localFile) && sha256(await readFile(localFile)) === asset.digest) {
        const deliveredPath = versionedPublicUrl(localPath, asset.digest);
        for (const url of usedUrls) replacements.set(url, deliveredPath);
        reusedAssets += 1;
        continue;
      }
    }
    if (!asset.digest || asset.status === "failed") {
      for (const url of usedUrls) brokenUrls.add(url);
      continue;
    }
    const digest = asset.digest.slice("sha256:".length);
    const cacheName = cacheFiles.find((name) => name.startsWith(digest));
    if (!cacheName) throw new Error(`Cache-Datei für ${asset.sourceUrls[0]} (${asset.digest}) fehlt.`);
    const isDocument = asset.assetType === "document";
    const sourceExtension = path.extname(new URL(asset.sourceUrls[0]).pathname).toLowerCase().slice(0, 10) || ".bin";
    const targetRelative = isDocument
      ? path.posix.join("documents", "legacy-v2", digest.slice(0, 2), `${digest.slice(0, 32)}${sourceExtension}`)
      : path.posix.join("images", "legacy-v2", digest.slice(0, 2), `${digest.slice(0, 32)}-w1600-q78.webp`);
    const targetAbsolute = path.join(publicDir, ...targetRelative.split("/"));
    const input = await readFile(path.join(cacheDir, "assets", cacheName));
    if (sha256(input) !== asset.digest) throw new Error(`Cache-Digest für ${asset.sourceUrls[0]} stimmt nicht.`);
    const output = isDocument
      ? input
      : await sharp(input, { animated: false })
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 78, effort: 5, smartSubsample: true })
          .toBuffer();
    const expectedOutputDigest = sha256(output);
    const outputIsValid = await exists(targetAbsolute) && sha256(await readFile(targetAbsolute)) === expectedOutputDigest;
    if (!outputIsValid) await atomicWrite(targetAbsolute, output);
    const bytes = output.byteLength;
    if (isDocument) localizedDocuments += 1;
    else optimizedAssets += 1;
    optimizedBytes += bytes;
    const deliveredPath = isDocument
      ? versionedPublicUrl(`/${targetRelative}`, asset.digest)
      : `/${targetRelative}`;
    for (const url of usedUrls) replacements.set(url, deliveredPath);
  }
  const outputDigests = new Map<string, `sha256:${string}`>();
  for (const publicPath of uniqueSorted(replacements.values())) {
    const absolute = publicFile(publicDir, publicPath);
    if (!(await exists(absolute))) {
      throw new Error(`Gestagtes Asset fehlt oder liegt außerhalb von public: ${publicPath}`);
    }
    outputDigests.set(publicPath, sha256(await readFile(absolute)));
  }
  return { replacements, outputDigests, optimizedAssets, optimizedBytes, localizedDocuments, reusedAssets, brokenUrls };
}

function internalLinkMap(records: readonly LegacyRecord[]): Map<string, string> {
  const candidates = new Map<string, Set<string>>();
  for (const record of records) {
    for (const sourceUrl of record.sourceUrls) {
      if (!candidates.has(sourceUrl)) candidates.set(sourceUrl, new Set());
      candidates.get(sourceUrl)?.add(record.targetPath);
    }
  }
  return new Map(
    [...candidates]
      .filter(([, targets]) => targets.size === 1)
      .map(([source, targets]) => [source, [...targets][0]]),
  );
}

function rewriteRecord(
  record: LegacyRecord,
  assetReplacements: ReadonlyMap<string, string>,
  brokenUrls: ReadonlySet<string>,
  links: ReadonlyMap<string, string>,
): LegacyRecord {
  let markdown = record.markdown;
  const destinationReplacements = new Map([...assetReplacements, ...links]);
  markdown = markdown.replace(
    /(\]\()(<)?([^\s)>]+)(>)?(?=(?:\s+"[^"]*")?\))/gu,
    (whole, prefix: string, opening: string | undefined, destination: string, closing: string | undefined) =>
      `${prefix}${opening ?? ""}${destinationReplacements.get(destination) ?? destination}${closing ?? ""}`,
  );
  markdown = markdown.replace(
    /<(https?:\/\/[^>\s]+)>/gu,
    (whole, destination: string) => `<${destinationReplacements.get(destination) ?? destination}>`,
  );
  for (const source of brokenUrls) markdown = removeBrokenAsset(markdown, source);
  const mappedAssets = uniqueSorted(record.assetUrls.flatMap((url) => assetReplacements.get(url) ?? []));
  const allSourceAssetsBroken = record.assetUrls.length > 0 && mappedAssets.length === 0;
  const isImageOnly = textLength(markdown) < 20;
  const fallbackIntro = isImageOnly ? imageOnlyIntro(record) : null;
  if (fallbackIntro && record.kind === "page") {
    markdown = `${fallbackIntro}\n\n${markdown}`.trim();
  }
  return {
    ...record,
    markdown,
    excerpt: fallbackIntro ?? (textLength(markdown) > 0
      ? markdownText(markdown).slice(0, 240)
      : record.excerpt),
    assetUrls: mappedAssets,
    internalLinks: uniqueSorted(record.internalLinks.map((url) => links.get(url) ?? url)),
    warnings: allSourceAssetsBroken
      ? uniqueSorted([...record.warnings, "Alle Medien dieses Datensatzes fehlen an der Quelle; Inhalt bleibt Entwurf."])
      : record.warnings,
  };
}

function revisionSql(
  record: LegacyRecord,
  table: "Page" | "News",
  key: string,
  content: string,
  snapshotDigest: string,
  appliedGuards: readonly string[] = [],
): string {
  const revisionId = `legacyrev_${sha256(record.sourceKey).slice(7, 31)}`;
  const appliedDigest = sha256(content);
  const guards = appliedGuards.length ? ` AND ${appliedGuards.join(" AND ")}` : "";
  return `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")\nSELECT ${sql(revisionId)}, ${sql(record.sourceKey)}, ${sql(record.kind)}, ${sql(key)}, ${sql(record.digest)}, ${sql(appliedDigest)}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP\nWHERE changes() = 1 AND EXISTS (SELECT 1 FROM "${table}" WHERE "slug" = ${sql(key)} AND "content" = ${sql(content)}${guards});`;
}

function pageSql(record: LegacyRecord, snapshotDigest: string): string {
  const slug = record.targetPath.replace(/^\/+/, "");
  const id = `legacypage_${sha256(record.sourceKey).slice(7, 31)}`;
  const date = fixedDate(record.publishedDate);
  const published = record.warnings.some((warning) => warning.includes("Inhalt bleibt Entwurf")) ? 0 : 1;
  return [
    `INSERT OR IGNORE INTO "Page" ("id", "slug", "title", "content", "metaTitle", "metaDesc", "parent", "sortOrder", "archiveDate", "published", "gallerySlug", "createdAt", "updatedAt", "authorId") VALUES (${sql(id)}, ${sql(slug)}, ${sql(record.title)}, ${sql(record.markdown)}, NULL, ${sql(record.excerpt)}, ${sql(parentOf(record.targetPath))}, 0, ${record.publishedDate ? sql(date) : "NULL"}, ${published}, NULL, ${sql(date)}, ${sql(date)}, NULL);`,
    revisionSql(record, "Page", slug, record.markdown, snapshotDigest),
  ].join("\n");
}

function updatedDraftPageSql(
  record: LegacyRecord,
  current: CurrentPage,
  decision: DraftUpdateDecision,
  snapshotDigest: string,
): string {
  const slug = record.targetPath.replace(/^\/+/, "");
  const title = decision.title ?? record.title;
  const targetParent = parentOf(record.targetPath);
  const targetSortOrder = current.sortOrder;
  const targetArchiveDate = record.publishedDate ? fixedDate(record.publishedDate) : current.archiveDate;
  const appliedGuards = [
    `"title" = ${sql(title)}`,
    sqlGuard("metaDesc", record.excerpt),
    sqlGuard("parent", targetParent),
    `"sortOrder" = ${targetSortOrder}`,
    sqlGuard("archiveDate", targetArchiveDate),
    `"published" = 1`,
  ];
  return [
    `UPDATE "Page" SET "title" = ${sql(title)}, "content" = ${sql(record.markdown)}, "metaDesc" = ${sql(record.excerpt)}, "parent" = ${sql(targetParent)}, "sortOrder" = ${targetSortOrder}, "archiveDate" = ${sql(targetArchiveDate)}, "published" = 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(slug)} AND "title" = ${sql(current.title)} AND "content" = ${sql(current.content)} AND ${sqlGuard("metaDesc", current.metaDesc)} AND ${sqlGuard("parent", current.parent)} AND "sortOrder" = ${current.sortOrder} AND "archiveDate" IS NULL AND "published" = 0;`,
    revisionSql(record, "Page", slug, record.markdown, snapshotDigest, appliedGuards),
  ].join("\n");
}

function updatedDraftNewsSql(
  record: LegacyRecord,
  current: CurrentNews,
  decision: DraftUpdateDecision,
  snapshotDigest: string,
): string {
  if (!record.publishedDate) throw new Error(`News ${record.sourceKey} besitzt kein Veröffentlichungsdatum.`);
  const slug = record.targetPath.replace(/^\/aktuelles\//, "");
  const title = decision.title ?? record.title;
  const date = fixedDate(record.publishedDate);
  const teaser = record.excerpt || current.teaser;
  const coverImage = firstImage(record.markdown) ?? current.coverImage;
  const appliedGuards = [
    `"title" = ${sql(title)}`,
    `"date" = ${sql(date)}`,
    `"teaser" = ${sql(teaser)}`,
    sqlGuard("coverImage", coverImage),
    `"published" = 1`,
  ];
  return [
    `UPDATE "News" SET "title" = ${sql(title)}, "date" = ${sql(date)}, "teaser" = ${sql(teaser)}, "content" = ${sql(record.markdown)}, "coverImage" = ${sql(coverImage)}, "published" = 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(slug)} AND "title" = ${sql(current.title)} AND "date" = ${sql(current.date)} AND "teaser" = ${sql(current.teaser)} AND "content" = ${sql(current.content)} AND ${sqlGuard("coverImage", current.coverImage)} AND "published" = 0;`,
    revisionSql(record, "News", slug, record.markdown, snapshotDigest, appliedGuards),
  ].join("\n");
}

function normalizedCurrentPageSql(
  decision: CurrentNormalizationDecision,
  current: CurrentPage,
  content: string,
  snapshotDigest: string,
): string {
  const slug = decision.targetPath.replace(/^\/+/, "");
  const sourceKey = `cleanup-current:page:${slug}`;
  const id = `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
  return [
    `UPDATE "Page" SET "content" = ${sql(content)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(slug)} AND "title" = ${sql(current.title)} AND "content" = ${sql(current.content)} AND ${sqlGuard("metaDesc", current.metaDesc)} AND ${sqlGuard("parent", current.parent)} AND "sortOrder" = ${current.sortOrder} AND "published" = ${current.published ? 1 : 0};`,
    `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt") SELECT ${sql(id)}, ${sql(sourceKey)}, 'page', ${sql(slug)}, ${sql(sha256(current.content))}, ${sql(sha256(content))}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = ${sql(slug)} AND "title" = ${sql(current.title)} AND "content" = ${sql(content)} AND ${sqlGuard("metaDesc", current.metaDesc)} AND ${sqlGuard("parent", current.parent)} AND "sortOrder" = ${current.sortOrder} AND "published" = ${current.published ? 1 : 0});`,
  ].join("\n");
}

function normalizedCurrentNewsSql(
  decision: CurrentNormalizationDecision,
  current: CurrentNews,
  content: string,
  snapshotDigest: string,
): string {
  const slug = decision.targetPath.replace(/^\/aktuelles\//, "");
  const sourceKey = `cleanup-current:news:${slug}`;
  const id = `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
  return [
    `UPDATE "News" SET "content" = ${sql(content)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(slug)} AND "title" = ${sql(current.title)} AND "teaser" = ${sql(current.teaser)} AND "content" = ${sql(current.content)} AND ${sqlGuard("coverImage", current.coverImage)} AND "published" = ${current.published ? 1 : 0};`,
    `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt") SELECT ${sql(id)}, ${sql(sourceKey)}, 'news', ${sql(slug)}, ${sql(sha256(current.content))}, ${sql(sha256(content))}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "News" WHERE "slug" = ${sql(slug)} AND "title" = ${sql(current.title)} AND "teaser" = ${sql(current.teaser)} AND "content" = ${sql(content)} AND ${sqlGuard("coverImage", current.coverImage)} AND "published" = ${current.published ? 1 : 0});`,
  ].join("\n");
}

function newsSql(record: LegacyRecord, snapshotDigest: string): string {
  if (!record.publishedDate) throw new Error(`News ${record.sourceKey} besitzt kein Veröffentlichungsdatum.`);
  const slug = record.targetPath.replace(/^\/aktuelles\//, "");
  const id = `legacynews_${sha256(record.sourceKey).slice(7, 31)}`;
  const date = fixedDate(record.publishedDate);
  const cover = firstImage(record.markdown);
  const published = record.warnings.some((warning) => warning.includes("Inhalt bleibt Entwurf")) ? 0 : 1;
  return [
    `INSERT OR IGNORE INTO "News" ("id", "slug", "title", "date", "teaser", "content", "coverImage", "published", "createdAt", "updatedAt", "authorId") VALUES (${sql(id)}, ${sql(slug)}, ${sql(record.title)}, ${sql(date)}, ${sql(record.excerpt)}, ${sql(record.markdown)}, ${sql(cover)}, ${published}, ${sql(date)}, ${sql(date)}, NULL);`,
    revisionSql(record, "News", slug, record.markdown, snapshotDigest),
  ].join("\n");
}

function parentCleanupSql(
  slug: string,
  current: CurrentPage,
  intro: string,
  snapshotDigest: string,
): string {
  const sourceKey = `cleanup:${slug}`;
  const id = `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
  return [
    `UPDATE "Page" SET "content" = ${sql(intro)}, "metaDesc" = ${sql(intro)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(slug)} AND "content" = ${sql(current.content)} AND ${sqlGuard("metaDesc", current.metaDesc)};`,
    `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt") SELECT ${sql(id)}, ${sql(sourceKey)}, 'page', ${sql(slug)}, ${sql(sha256(current.content))}, ${sql(sha256(intro))}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = ${sql(slug)} AND "content" = ${sql(intro)} AND "metaDesc" = ${sql(intro)});`,
  ].join("\n");
}

function staleDraftCleanupSql(
  slug: string,
  current: CurrentPage,
  replacement: string,
  snapshotDigest: string,
): string {
  const sourceKey = `cleanup-draft:${slug}`;
  const id = `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
  const excerpt = markdownText(replacement).slice(0, 240);
  return [
    `UPDATE "Page" SET "content" = ${sql(replacement)}, "metaDesc" = ${sql(excerpt)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(slug)} AND "content" = ${sql(current.content)} AND ${sqlGuard("metaDesc", current.metaDesc)} AND "published" = 0;`,
    `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt") SELECT ${sql(id)}, ${sql(sourceKey)}, 'page', ${sql(slug)}, ${sql(sha256(current.content))}, ${sql(sha256(replacement))}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = ${sql(slug)} AND "content" = ${sql(replacement)} AND "metaDesc" = ${sql(excerpt)} AND "published" = 0);`,
  ].join("\n");
}

function structureFixupSql(
  current: CurrentPage,
  parent: string,
  targetSortOrder: number,
  sourceDigest: string,
  snapshotDigest: string,
): string {
  const sourceKey = `structure:${current.slug}`;
  const id = `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
  const before = sha256(`parent:${current.parent ?? ""}\nsortOrder:${current.sortOrder}`);
  const after = sha256(`parent:${parent}\nsortOrder:${targetSortOrder}`);
  return [
    `UPDATE "Page" SET "parent" = ${sql(parent)}, "sortOrder" = ${targetSortOrder}, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(current.slug)} AND "parent" IS NULL AND "sortOrder" = ${current.sortOrder};`,
    `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt") SELECT ${sql(id)}, ${sql(sourceKey)}, 'page', ${sql(current.slug)}, ${sql(sourceDigest || before)}, ${sql(after)}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = ${sql(current.slug)} AND "parent" = ${sql(parent)} AND "sortOrder" = ${targetSortOrder});`,
  ].join("\n");
}

function archiveDateFixupSql(
  current: CurrentPage,
  record: LegacyRecord,
  snapshotDigest: string,
): string {
  if (!record.publishedDate) throw new Error(`Archivdatum fehlt für ${record.targetPath}.`);
  const archiveDate = fixedDate(record.publishedDate);
  const sourceKey = `archive-date:${current.slug}`;
  const id = `legacyrev_${sha256(sourceKey).slice(7, 31)}`;
  return [
    `UPDATE "Page" SET "archiveDate" = ${sql(archiveDate)}, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = ${sql(current.slug)} AND "title" = ${sql(current.title)} AND "content" = ${sql(current.content)} AND ${sqlGuard("metaDesc", current.metaDesc)} AND ${sqlGuard("parent", current.parent)} AND "sortOrder" = ${current.sortOrder} AND "archiveDate" IS NULL AND "published" = ${current.published ? 1 : 0};`,
    `INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt") SELECT ${sql(id)}, ${sql(sourceKey)}, 'page', ${sql(current.slug)}, ${sql(record.digest)}, ${sql(sha256(archiveDate))}, ${sql(snapshotDigest)}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = ${sql(current.slug)} AND "archiveDate" = ${sql(archiveDate)});`,
  ].join("\n");
}

type RedirectPlan = Readonly<{
  fromPath: string;
  toPath: string;
  previousFromPath?: string;
  previousToPath?: string;
}>;

function legacyRedirectPlans(
  records: readonly LegacyRecord[],
  current: ReadonlyMap<string, CurrentRedirect>,
  editorialRedirects: readonly Readonly<{ fromPath: string; targetPath: string }>[],
): RedirectPlan[] {
  const candidates = new Map<string, Set<string>>();
  for (const record of records) {
    for (const sourceUrl of record.sourceUrls) {
      const rawPath = legacySourceRedirectPath(sourceUrl);
      const fromPath = rawPath ? normalizeStoredLegacyPath(rawPath) : null;
      if (!fromPath || fromPath === record.targetPath) continue;
      if (!candidates.has(fromPath)) candidates.set(fromPath, new Set());
      candidates.get(fromPath)?.add(record.targetPath);
    }
  }
  for (const redirect of editorialRedirects) {
    const fromPath = normalizeStoredLegacyPath(redirect.fromPath);
    const toPath = normalizeStoredLegacyPath(redirect.targetPath);
    if (!fromPath || !toPath) throw new Error(`Ungültiger redaktioneller Redirect: ${redirect.fromPath} -> ${redirect.targetPath}`);
    candidates.set(fromPath, new Set([toPath]));
  }
  return [...candidates]
    .filter(([, targets]) => targets.size === 1)
    .map(([fromPath, targets]) => {
      const toPath = [...targets][0];
      const existing = current.get(fromPath);
      return {
        fromPath,
        toPath,
        ...(existing && (existing.fromPath !== fromPath || existing.toPath !== toPath)
          ? { previousFromPath: existing.fromPath, previousToPath: existing.toPath }
          : {}),
      };
    })
    .sort((left, right) => left.fromPath.localeCompare(right.fromPath, "de"));
}

function redirectSql(plan: RedirectPlan): string {
  const id = `legacyredirect_${sha256(`${plan.fromPath}\n${plan.toPath}`).slice(7, 31)}`;
  return [
    ...(plan.previousFromPath === undefined || plan.previousToPath === undefined ? [] : [
      `UPDATE "Redirect" SET "fromPath" = ${sql(plan.fromPath)}, "toPath" = ${sql(plan.toPath)} WHERE "fromPath" = ${sql(plan.previousFromPath)} AND "toPath" = ${sql(plan.previousToPath)};`,
    ]),
    `INSERT OR IGNORE INTO "Redirect" ("id", "fromPath", "toPath", "createdAt") VALUES (${sql(id)}, ${sql(plan.fromPath)}, ${sql(plan.toPath)}, CURRENT_TIMESTAMP);`,
  ].join("\n");
}

type RevisionExpectation = Readonly<{
  sourceKey: string;
  targetKind: "page" | "news";
  targetKey: string;
  sourceDigest: string;
  appliedContentDigest: string;
  snapshotDigest: string;
  requiresBaseline?: true;
}>;

function revisionAssertionsSql(
  expectations: readonly RevisionExpectation[],
  redirects: readonly RedirectPlan[],
): string[] {
  const duplicateKeys = expectations
    .map((expectation) => expectation.sourceKey)
    .filter((sourceKey, index, values) => values.indexOf(sourceKey) !== index);
  if (duplicateKeys.length > 0) throw new Error(`Doppelte Revisionserwartungen: ${uniqueSorted(duplicateKeys).join(", ")}`);
  return [
    'CREATE TEMP TABLE "_LegacyMigrationAssertion" ("ok" INTEGER NOT NULL ON CONFLICT ROLLBACK);',
    ...expectations.map((expectation) =>
      `INSERT INTO "_LegacyMigrationAssertion" ("ok") SELECT NULL WHERE ${expectation.requiresBaseline ? '(SELECT "isFresh" FROM "_LegacyMigrationContext") = 0 AND ' : ""}NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = ${sql(expectation.sourceKey)} AND "targetKind" = ${sql(expectation.targetKind)} AND "targetKey" = ${sql(expectation.targetKey)} AND "sourceDigest" = ${sql(expectation.sourceDigest)} AND "appliedContentDigest" = ${sql(expectation.appliedContentDigest)} AND "snapshotDigest" = ${sql(expectation.snapshotDigest)});`),
    ...redirects.map((redirect) =>
      `INSERT INTO "_LegacyMigrationAssertion" ("ok") SELECT NULL WHERE NOT EXISTS (SELECT 1 FROM "Redirect" WHERE "fromPath" = ${sql(redirect.fromPath)} AND "toPath" = ${sql(redirect.toPath)});`),
    ...redirects.flatMap((redirect) =>
      redirect.previousFromPath && redirect.previousFromPath !== redirect.fromPath
        ? [`INSERT INTO "_LegacyMigrationAssertion" ("ok") SELECT NULL WHERE EXISTS (SELECT 1 FROM "Redirect" WHERE "fromPath" = ${sql(redirect.previousFromPath)});`]
        : []),
    'DROP TABLE "_LegacyMigrationAssertion";',
  ];
}

export async function stageLegacyContent(options: StageOptions): Promise<StageResult> {
  const { snapshot, comparison } = await readSealedInput(options);
  const unresolvedNative = comparison.routes.filter((route) =>
    route.status === "native-review" && !NATIVE_ROUTE_RESOLUTIONS[route.targetPath],
  );
  if (unresolvedNative.length > 0) {
    throw new Error(`Native Routen ohne dokumentierte Auflösung: ${unresolvedNative.map((route) => route.targetPath).join(", ")}`);
  }
  const currentSnapshot = readContentDatabaseSnapshot(options.databaseUrl);
  if (comparison.currentDatabaseDigest !== currentSnapshot.digest) {
    throw new Error(`Redaktionelle Datenbank wurde seit dem freigegebenen Vergleich verändert (${comparison.currentDatabaseDigest} != ${currentSnapshot.digest}).`);
  }
  const pages = currentPages(currentSnapshot);
  const news = currentNews(currentSnapshot);
  const redirects = legacyRedirectPlans(snapshot.records, currentRedirects(currentSnapshot), options.decisions.redirects ?? []);
  const approvedDraftByTarget = new Map((options.decisions.draftUpdates ?? [])
    .map((decision) => [`${decision.kind}:${decision.targetPath}`, decision]));
  const missingKeys = new Set(comparison.routes.filter((route) => route.status === "missing-current").map((route) => route.sourceKey));
  const draftUpdateKeys = new Set(comparison.routes
    .filter((route) => {
      if ((route.status !== "different" && route.status !== "equivalent") || (route.kind !== "page" && route.kind !== "news")) return false;
      const current = route.kind === "news"
        ? news.get(route.targetPath.replace(/^\/aktuelles\//, ""))
        : pages.get(route.targetPath.replace(/^\/+/, ""));
      return current !== undefined && !current.published && approvedDraftByTarget.has(`${route.kind}:${route.targetPath}`);
    })
    .map((route) => route.sourceKey));
  const unusedDraftApprovals = [...approvedDraftByTarget.keys()].filter((target) =>
    !comparison.routes.some((route) => `${route.kind}:${route.targetPath}` === target && draftUpdateKeys.has(route.sourceKey)),
  );
  if (unusedDraftApprovals.length > 0) {
    throw new Error(`Draft-Freigaben passen nicht zu unveröffentlichten Zielen: ${unusedDraftApprovals.join(", ")}`);
  }
  const selectedKeys = new Set([...missingKeys, ...draftUpdateKeys]);
  const sourceRecords = snapshot.records.filter((record) => selectedKeys.has(record.sourceKey) && (record.kind === "page" || record.kind === "news"));
  const unhandledMissing = snapshot.records.filter((record) => missingKeys.has(record.sourceKey) && !sourceRecords.includes(record));
  if (unhandledMissing.length > 0) {
    throw new Error(`Fehlende Inhaltstypen ohne Staging-Adapter: ${unhandledMissing.map((record) => `${record.kind}:${record.targetPath}`).join(", ")}`);
  }
  const assets = await materializeAssets(sourceRecords, snapshot, comparison, options.cacheDir, options.publicDir);
  const links = internalLinkMap(snapshot.records);
  const records = sourceRecords.map((record) => rewriteRecord(record, assets.replacements, assets.brokenUrls, links));
  const insertedRecords = records.filter((record) => missingKeys.has(record.sourceKey));
  const updatedDraftRecords = records.filter((record) => draftUpdateKeys.has(record.sourceKey));
  const brokenApprovedDrafts = updatedDraftRecords.filter((record) =>
    record.warnings.some((warning) => warning.includes("Inhalt bleibt Entwurf")),
  );
  if (brokenApprovedDrafts.length > 0) {
    throw new Error(`Freigegebene Drafts besitzen keine vollständigen Assets: ${brokenApprovedDrafts.map((record) => record.targetPath).join(", ")}`);
  }
  const currentNormalizations = (options.decisions.currentNormalizations ?? []).map((decision) => {
    const key = decision.kind === "news"
      ? decision.targetPath.replace(/^\/aktuelles\//, "")
      : decision.targetPath.replace(/^\/+/, "");
    const current = decision.kind === "news" ? news.get(key) : pages.get(key);
    if (!current) throw new Error(`Current-Normalisierung hat kein ${decision.kind}-Ziel: ${decision.targetPath}`);
    const content = normalizeCurrentMarkdown(current.content, current.title, decision.format);
    if (content === current.content) throw new Error(`Current-Normalisierung ist wirkungslos oder bereits angewendet: ${decision.targetPath}`);
    return { decision, current, content };
  });
  const usedParents = new Set(records.filter((record) => record.kind === "page").map((record) => parentOf(record.targetPath)).filter((value): value is string => Boolean(value)));
  const parentCleanups = Object.entries(ARCHIVE_INTROS)
    .filter(([slug]) => (usedParents.has(slug) || slug.startsWith("vereinsbereiche/")) && pages.has(slug))
    .sort(([left], [right]) => left.localeCompare(right, "de"));
  const movedDraftReplacements = (options.decisions.redirects ?? []).flatMap((redirect): Array<[string, string]> => {
    const slug = redirect.fromPath.replace(/^\/+|\/+$/g, "");
    const current = pages.get(slug);
    return current && !current.published
      ? [[slug, `Der historische Beitrag wurde in den [kanonischen Rückblick](${redirect.targetPath}) verschoben.`]]
      : [];
  });
  const staleDraftReplacements = new Map<string, string>([
    ...Object.entries(STALE_DRAFT_REPLACEMENTS),
    ...movedDraftReplacements,
  ]);
  const staleDraftCleanups = [...staleDraftReplacements.entries()]
    .filter(([slug]) => pages.has(slug) && !pages.get(slug)?.published)
    .sort(([left], [right]) => left.localeCompare(right, "de"));
  const sourceByTarget = new Map(snapshot.records
    .filter((record) => record.kind === "page")
    .map((record) => [record.targetPath.replace(/^\/+/, ""), record]));
  const updatedDraftSlugs = new Set(updatedDraftRecords.map((record) => record.targetPath.replace(/^\/+/, "")));
  const archiveDateFixups = [...sourceByTarget]
    .flatMap(([slug, record]) => {
      const current = pages.get(slug);
      const targetParent = parentOf(record.targetPath);
      return current && record.publishedDate && targetParent && ARCHIVE_INTROS[targetParent] && !updatedDraftSlugs.has(slug)
        ? [{ current, record }]
        : [];
    })
    .sort((left, right) => left.current.slug.localeCompare(right.current.slug, "de"));
  const structureFixups = [...pages.values()]
    .filter((current) => {
      if (current.parent !== null || !current.slug.includes("/")) return false;
      if (updatedDraftSlugs.has(current.slug)) return false;
      return pages.has(current.slug.slice(0, current.slug.lastIndexOf("/")));
    })
    .map((current) => {
      const parent = current.slug.slice(0, current.slug.lastIndexOf("/"));
      const source = sourceByTarget.get(current.slug);
      return {
        current,
        parent,
        targetSortOrder: current.sortOrder,
        sourceDigest: source?.digest ?? sha256(current.content),
      };
    })
    .sort((left, right) => left.current.slug.localeCompare(right.current.slug, "de"));
  const reviewedDifferent = comparison.routes.filter((route) =>
    route.status === "different" && !draftUpdateKeys.has(route.sourceKey),
  ).length;
  const reviewedNativeRoutes = comparison.routes.filter((route) => route.status === "native-review").length;

  const revisionExpectations: RevisionExpectation[] = [
    ...insertedRecords.map((record) => ({
      sourceKey: record.sourceKey,
      targetKind: record.kind as "page" | "news",
      targetKey: record.kind === "news" ? record.targetPath.replace(/^\/aktuelles\//, "") : record.targetPath.replace(/^\/+/, ""),
      sourceDigest: record.digest,
      appliedContentDigest: sha256(record.markdown),
      snapshotDigest: snapshot.digest,
    })),
    ...updatedDraftRecords.map((record) => ({
      sourceKey: record.sourceKey,
      targetKind: record.kind as "page" | "news",
      targetKey: record.kind === "news" ? record.targetPath.replace(/^\/aktuelles\//, "") : record.targetPath.replace(/^\/+/, ""),
      sourceDigest: record.digest,
      appliedContentDigest: sha256(record.markdown),
      snapshotDigest: snapshot.digest,
      requiresBaseline: true as const,
    })),
    ...currentNormalizations.map(({ decision, current, content }) => ({
      sourceKey: `cleanup-current:${decision.kind}:${decision.kind === "news" ? decision.targetPath.replace(/^\/aktuelles\//, "") : decision.targetPath.replace(/^\/+/, "")}`,
      targetKind: decision.kind,
      targetKey: decision.kind === "news" ? decision.targetPath.replace(/^\/aktuelles\//, "") : decision.targetPath.replace(/^\/+/, ""),
      sourceDigest: sha256(current.content),
      appliedContentDigest: sha256(content),
      snapshotDigest: snapshot.digest,
      requiresBaseline: true as const,
    })),
    ...parentCleanups.map(([slug, intro]) => ({
      sourceKey: `cleanup:${slug}`,
      targetKind: "page" as const,
      targetKey: slug,
      sourceDigest: sha256(pages.get(slug)!.content),
      appliedContentDigest: sha256(intro),
      snapshotDigest: snapshot.digest,
      requiresBaseline: true as const,
    })),
    ...staleDraftCleanups.map(([slug, replacement]) => ({
      sourceKey: `cleanup-draft:${slug}`,
      targetKind: "page" as const,
      targetKey: slug,
      sourceDigest: sha256(pages.get(slug)!.content),
      appliedContentDigest: sha256(replacement),
      snapshotDigest: snapshot.digest,
      requiresBaseline: true as const,
    })),
    ...structureFixups.map((fixup) => ({
      sourceKey: `structure:${fixup.current.slug}`,
      targetKind: "page" as const,
      targetKey: fixup.current.slug,
      sourceDigest: fixup.sourceDigest,
      appliedContentDigest: sha256(`parent:${fixup.parent}\nsortOrder:${fixup.targetSortOrder}`),
      snapshotDigest: snapshot.digest,
      requiresBaseline: true as const,
    })),
    ...archiveDateFixups.map(({ current, record }) => ({
      sourceKey: `archive-date:${current.slug}`,
      targetKind: "page" as const,
      targetKey: current.slug,
      sourceDigest: record.digest,
      appliedContentDigest: sha256(fixedDate(record.publishedDate)),
      snapshotDigest: snapshot.digest,
      requiresBaseline: true as const,
    })),
  ];

  const statements = [
    "-- Generated from a sealed, reviewed legacy snapshot. Do not edit by hand.",
    "PRAGMA foreign_keys=ON;",
    "BEGIN IMMEDIATE;",
    'CREATE TEMP TABLE "_LegacyMigrationContext" ("isFresh" INTEGER NOT NULL CHECK ("isFresh" IN (0, 1)));',
    'INSERT INTO "_LegacyMigrationContext" ("isFresh") SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM "Page") AND NOT EXISTS (SELECT 1 FROM "News") AND NOT EXISTS (SELECT 1 FROM "Event") THEN 1 ELSE 0 END;',
    `CREATE TABLE "LegacyContentRevision" (\n  "id" TEXT NOT NULL PRIMARY KEY,\n  "sourceKey" TEXT NOT NULL,\n  "targetKind" TEXT NOT NULL,\n  "targetKey" TEXT NOT NULL,\n  "sourceDigest" TEXT NOT NULL,\n  "appliedContentDigest" TEXT NOT NULL,\n  "snapshotDigest" TEXT NOT NULL,\n  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" DATETIME NOT NULL\n);`,
    `CREATE UNIQUE INDEX "LegacyContentRevision_sourceKey_key" ON "LegacyContentRevision"("sourceKey");`,
    `CREATE INDEX "LegacyContentRevision_targetKind_targetKey_idx" ON "LegacyContentRevision"("targetKind", "targetKey");`,
    ...insertedRecords.filter((record) => record.kind === "page").map((record) => pageSql(record, snapshot.digest)),
    ...insertedRecords.filter((record) => record.kind === "news").map((record) => newsSql(record, snapshot.digest)),
    ...updatedDraftRecords.filter((record) => record.kind === "page").map((record) => updatedDraftPageSql(record, pages.get(record.targetPath.replace(/^\/+/, ""))!, approvedDraftByTarget.get(`page:${record.targetPath}`)!, snapshot.digest)),
    ...updatedDraftRecords.filter((record) => record.kind === "news").map((record) => updatedDraftNewsSql(record, news.get(record.targetPath.replace(/^\/aktuelles\//, ""))!, approvedDraftByTarget.get(`news:${record.targetPath}`)!, snapshot.digest)),
    ...archiveDateFixups.map(({ current, record }) => archiveDateFixupSql(current, record, snapshot.digest)),
    ...currentNormalizations.filter(({ decision }) => decision.kind === "page").map(({ decision, current, content }) =>
      normalizedCurrentPageSql(decision, current as CurrentPage, content, snapshot.digest)),
    ...currentNormalizations.filter(({ decision }) => decision.kind === "news").map(({ decision, current, content }) =>
      normalizedCurrentNewsSql(decision, current as CurrentNews, content, snapshot.digest)),
    ...structureFixups.map((fixup) => structureFixupSql(fixup.current, fixup.parent, fixup.targetSortOrder, fixup.sourceDigest, snapshot.digest)),
    ...parentCleanups.map(([slug, intro]) => parentCleanupSql(slug, pages.get(slug)!, intro, snapshot.digest)),
    ...staleDraftCleanups.map(([slug, replacement]) => staleDraftCleanupSql(slug, pages.get(slug)!, replacement, snapshot.digest)),
    ...redirects.map(redirectSql),
    ...revisionAssertionsSql(revisionExpectations, redirects),
    'DROP TABLE "_LegacyMigrationContext";',
    "COMMIT;",
  ];
  const migrationPath = path.join(options.migrationDir, "migration.sql");
  await atomicWrite(migrationPath, `${statements.join("\n\n")}\n`);
  const result: StageResult = {
    stagedPages: insertedRecords.filter((record) => record.kind === "page").length,
    stagedNews: insertedRecords.filter((record) => record.kind === "news").length,
    updatedDraftPages: updatedDraftRecords.filter((record) => record.kind === "page").length,
    updatedDraftNews: updatedDraftRecords.filter((record) => record.kind === "news").length,
    normalizedCurrentPages: currentNormalizations.filter(({ decision }) => decision.kind === "page").length,
    normalizedCurrentNews: currentNormalizations.filter(({ decision }) => decision.kind === "news").length,
    optimizedAssets: assets.optimizedAssets,
    optimizedBytes: assets.optimizedBytes,
    localizedDocuments: assets.localizedDocuments,
    reusedAssets: assets.reusedAssets,
    skippedBrokenAssets: assets.brokenUrls.size,
    guardedParentCleanups: parentCleanups.length,
    guardedStaleDraftCleanups: staleDraftCleanups.length,
    structureFixups: structureFixups.length,
    archiveDateFixups: archiveDateFixups.length,
    reviewedDifferent,
    reviewedNativeRoutes,
    migrationPath,
    manifestPath: path.join(options.outputDir, "stage-manifest.json"),
  };
  const manifest = {
    schemaVersion: 1,
    approvedSnapshotDigest: snapshot.digest,
    approvedComparisonDigest: comparison.digest,
    decisionsDigest: snapshot.decisionsDigest,
    records: records.map((record) => ({
      sourceKey: record.sourceKey,
      targetPath: record.targetPath,
      kind: record.kind,
      action: missingKeys.has(record.sourceKey)
        ? "insert"
        : "guarded-draft-update",
      sourceDigest: record.digest,
      appliedContentDigest: sha256(record.markdown),
      ...(draftUpdateKeys.has(record.sourceKey) && approvedDraftByTarget.get(`${record.kind}:${record.targetPath}`)?.title
        ? { titleOverride: approvedDraftByTarget.get(`${record.kind}:${record.targetPath}`)?.title }
        : {}),
    })),
    assets: uniqueSorted([...assets.replacements.values()]),
    assetDigests: [...assets.outputDigests]
      .map(([publicPath, digest]) => ({ publicPath, digest }))
      .sort((left, right) => left.publicPath.localeCompare(right.publicPath, "de")),
    brokenAssetUrls: uniqueSorted(assets.brokenUrls),
    parentCleanups: parentCleanups.map(([slug]) => slug),
    staleDraftCleanups: staleDraftCleanups.map(([slug]) => slug),
    currentNormalizations: currentNormalizations.map(({ decision, current, content }) => ({
      targetPath: decision.targetPath,
      kind: decision.kind,
      action: "guarded-current-normalization",
      reason: decision.reason,
      sourceDigest: sha256(current.content),
      appliedContentDigest: sha256(content),
    })),
    structureFixups: structureFixups.map((fixup) => ({
      slug: fixup.current.slug,
      parent: fixup.parent,
      sortOrder: fixup.targetSortOrder,
    })),
    archiveDateFixups: archiveDateFixups.map(({ current, record }) => ({
      slug: current.slug,
      archiveDate: record.publishedDate,
      sourceDigest: record.digest,
    })),
    redirects,
    routeResolutions: comparison.routes.map((route) => ({
      sourceKey: route.sourceKey,
      targetPath: route.targetPath,
      comparisonStatus: route.status,
      resolution: missingKeys.has(route.sourceKey)
        ? "staged-insert"
        : draftUpdateKeys.has(route.sourceKey)
          ? "guarded-draft-update"
          : route.status === "native-review"
            ? "reviewed-native"
            : route.status === "different"
              ? "reviewed-keep-current"
              : "reviewed-equivalent",
      ...(route.status === "native-review" ? { note: NATIVE_ROUTE_RESOLUTIONS[route.targetPath] } : {}),
      ...(draftUpdateKeys.has(route.sourceKey) ? { note: approvedDraftByTarget.get(`${route.kind}:${route.targetPath}`)?.reason } : {}),
    })),
    result: {
      ...result,
      migrationPath: path.relative(options.outputDir, result.migrationPath).split(path.sep).join("/"),
      manifestPath: path.basename(result.manifestPath),
    },
  };
  await atomicWrite(result.manifestPath, stableJson(manifest));
  return result;
}
