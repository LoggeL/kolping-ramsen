import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AssetComparison,
  CompareOptions,
  CompareResult,
  ComparisonReport,
  ContentKind,
  LegacySnapshot,
  RouteComparison,
  SnapshotFinding,
} from "../types";
import { readContentDatabaseSnapshot, type ContentDatabaseSnapshot } from "./database-state";
import { stableJson, sha256, uniqueSorted } from "./stable";

type CurrentRecord = Readonly<{
  route: string;
  kind: ContentKind;
  title: string;
  content: string;
  published: boolean;
  imageUrls: readonly string[];
  documentUrls: readonly string[];
  imageCount: number;
  documentCount: number;
  dateKey?: string;
  event?: Readonly<{
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    description: string;
  }>;
}>;

type SemanticBlock = Readonly<{
  text: string;
  comparable: string;
  compact: string;
  tokens: ReadonlySet<string>;
  tokenCounts: ReadonlyMap<string, number>;
  tokenCount: number;
}>;

type SemanticCoverage = NonNullable<RouteComparison["semanticCoverage"]>;

const NATIVE_ROUTES = new Set([
  "/",
  "/aktuelles",
  "/termine",
  "/gaestebuch",
  "/kontakt",
  "/galerien",
  "/rueckblick",
  "/ueber-uns",
  "/vereinsbereiche",
]);

function assertSnapshot(value: unknown): asserts value is LegacySnapshot {
  if (!value || typeof value !== "object") throw new Error("Snapshot ist kein Objekt.");
  const snapshot = value as Partial<LegacySnapshot>;
  if (snapshot.schemaVersion !== 1 || typeof snapshot.origin !== "string" || typeof snapshot.decisionsDigest !== "string" || typeof snapshot.digest !== "string") {
    throw new Error("Snapshot-Schema wird nicht unterstützt.");
  }
  if (!Array.isArray(snapshot.outcomes) || !Array.isArray(snapshot.records) || !Array.isArray(snapshot.assets) || !Array.isArray(snapshot.findings)) {
    throw new Error("Snapshot ist unvollständig.");
  }
  if (snapshot.assets.some((asset) => asset.assetType !== "image" && asset.assetType !== "document")) {
    throw new Error("Snapshot enthält Assets ohne unterstützten Typ.");
  }
  const { digest, ...withoutDigest } = snapshot;
  if (sha256(stableJson(withoutDigest)) !== digest) throw new Error("Snapshot-Digest stimmt nicht; Datei wurde verändert oder ist beschädigt.");
}

function civilKey(value: string | number | null): string | undefined {
  if (value === null) return undefined;
  const direct = String(value).match(/^\d{4}-\d{2}-\d{2}/u)?.[0];
  if (direct) return direct;
  const parsed = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function loadCurrentRecords(snapshot: ContentDatabaseSnapshot): CurrentRecord[] {
    const pages = (snapshot.pages as Array<{ slug: string; title: string; content: string; published: number }>).map((row): CurrentRecord => {
      const images = imageUrls(row.content);
      const documents = documentUrls(row.content);
      return {
        route: `/${row.slug.replace(/^\/+|\/+$/g, "")}`,
        kind: "page",
        title: row.title,
        content: row.content,
        published: Boolean(row.published),
        imageUrls: images,
        documentUrls: documents,
        imageCount: images.length,
        documentCount: documents.length,
      };
    });
    const news = (snapshot.news as Array<{ slug: string; title: string; date: string | number; teaser: string; content: string; coverImage: string | null; published: number }>).map((row): CurrentRecord => {
      const mediaMarkdown = [row.coverImage ? `![](${row.coverImage})` : "", row.content].filter(Boolean).join("\n");
      const images = imageUrls(mediaMarkdown);
      const documents = documentUrls(row.content);
      return {
        route: `/aktuelles/${row.slug.replace(/^\/+|\/+$/g, "")}`,
        kind: "news",
        title: row.title,
        content: [row.teaser, row.coverImage ? `![${row.title}](${row.coverImage})` : "", row.content].filter(Boolean).join("\n\n"),
        published: Boolean(row.published),
        imageUrls: images,
        documentUrls: documents,
        imageCount: images.length,
        documentCount: documents.length,
        dateKey: civilKey(row.date),
      };
    });
    const events = (snapshot.events as Array<{
      slug: string;
      title: string;
      startDate: string | number;
      endDate: string | number | null;
      startTime: string | null;
      endTime: string | null;
      location: string | null;
      description: string;
      published: number;
    }>).map((row): CurrentRecord => {
      const images = imageUrls(row.description);
      const documents = documentUrls(row.description);
      const startDate = civilKey(row.startDate);
      const endDate = civilKey(row.endDate);
      return {
        route: `/termine/${row.slug.replace(/^\/+|\/+$/g, "")}`,
        kind: "event",
        title: row.title,
        content: row.description,
        published: Boolean(row.published),
        imageUrls: images,
        documentUrls: documents,
        imageCount: images.length,
        documentCount: documents.length,
        dateKey: startDate,
        event: {
          startDate,
          endDate,
          startTime: normalizeTime(row.startTime),
          endTime: normalizeTime(row.endTime),
          location: normalizeOptionalText(row.location),
          description: row.description,
        },
      };
    });
    return [...pages, ...news, ...events].sort((left, right) => left.route.localeCompare(right.route, "de"));
}

function imageAttribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "iu"))?.[1];
}

function imageLabel(alt: string | undefined, title: string | undefined, source: string | undefined): string {
  let stem = "";
  if (source) {
    try {
      const pathname = new URL(source, "https://image.invalid").pathname;
      stem = decodeURIComponent(path.posix.basename(pathname, path.posix.extname(pathname)));
    } catch {
      stem = "";
    }
  }
  const comparable = (value: string) => value
    .normalize("NFKC")
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
  const stemKey = comparable(stem);
  return [title, alt]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())
    .filter((value) => {
      const key = comparable(value);
      return key.length > 0
        && key !== stemKey
        && !/^(?:bild|image|foto|photo)\d*$/u.test(key);
    })[0] ?? "";
}

function replaceImageLabels(value: string): string {
  return value
    .replace(/<img\b[^>]*>/giu, (tag) =>
      imageLabel(imageAttribute(tag, "alt"), imageAttribute(tag, "title"), imageAttribute(tag, "src")))
    .replace(
      /!\[([^\]]*)\]\((?:<)?([^\s)>]+)(?:>)?(?:\s+["']([^"']*)["'])?\)/giu,
      (_whole, alt: string, source: string, title: string | undefined) => imageLabel(alt, title, source),
    );
}

function visibleText(markdown: string): string {
  return replaceImageLabels(markdown)
    .replace(/<[^>]*>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_>`|~\\-]/g, " ")
    .replace(/[\u00a0\u200b\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  return new Set(
    visibleText(value)
      .toLocaleLowerCase("de")
      .split(/[^a-z0-9äöüß]+/u)
      .filter((token) => token.length > 2),
  );
}

function contentSimilarity(left: string, right: string): number {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (leftTokens.size === 0 && rightTokens.size === 0) return 1;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : Number((intersection / union).toFixed(3));
}

function normalizeOptionalText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/[\u00a0\u200b\ufeff]/gu, " ").replace(/\s+/gu, " ").trim();
  return normalized || undefined;
}

function normalizeTime(value: string | null | undefined): string | undefined {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return undefined;
  const time = normalized.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/u);
  return time ? `${time[1].padStart(2, "0")}:${time[2]}` : normalized;
}

function semanticText(value: string): string {
  return replaceImageLabels(value.normalize("NFKC"))
    .replace(/\[([^\]]+)\]\((?:<)?[^)]*(?:>)?\)/giu, "$1")
    .replace(/<[^>]*>/gu, " ")
    .replace(/https?:\/\/\S+/giu, " ")
    .replace(/[#*_>`|~\\-]/gu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .toLocaleLowerCase("de")
    .replace(/\s+/gu, " ")
    .trim();
}

function semanticBlock(value: string): SemanticBlock | undefined {
  const text = visibleText(value);
  const comparable = semanticText(value);
  if (!comparable) return undefined;
  const tokenList = comparable.split(" ").filter(Boolean);
  const tokenCounts = new Map<string, number>();
  for (const token of tokenList) tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
  return {
    text,
    comparable,
    compact: comparable.replace(/\s+/gu, ""),
    tokens: new Set(tokenList),
    tokenCounts,
    tokenCount: tokenList.length,
  };
}

function semanticBlocks(markdown: string, title: string): SemanticBlock[] {
  const output: SemanticBlock[] = [];
  let paragraph: string[] = [];
  const comparableTitle = semanticText(title).replace(/\s+/gu, "");
  const flush = () => {
    const block = semanticBlock(paragraph.join(" "));
    if (block) output.push(block);
    paragraph = [];
  };
  const addStructural = (line: string, heading: boolean) => {
    const block = semanticBlock(line);
    if (!block) return;
    if (heading && block.compact === comparableTitle) return;
    output.push(block);
  };

  for (const rawLine of markdown.replace(/\r\n?/gu, "\n").replace(/<br\s*\/?>/giu, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^(?:!\[[^\]]*\]\([^)]*\)|<img\b[^>]*>)$/iu.test(line)) {
      flush();
      addStructural(line, false);
      continue;
    }
    if (/^\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/u.test(line)) {
      flush();
      continue;
    }
    const heading = /^#{1,6}\s+/u.test(line);
    const structural = heading
      || /^\s*(?:[-+*]|\d+[.)])\s+/u.test(line)
      || /^\s*>\s?/u.test(line)
      || /^\|.*\|$/u.test(line);
    if (structural) {
      flush();
      addStructural(line, heading);
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return output;
}

function blockIsCovered(
  source: SemanticBlock,
  targets: readonly SemanticBlock[],
  targetDocument: string,
  targetDocumentTokenCounts: ReadonlyMap<string, number>,
): boolean {
  if (source.compact.length >= 8 && targetDocument.includes(source.compact)) return true;
  const matchedBlock = targets.some((target) => {
    if (source.compact === target.compact) return true;
    const shorterLength = Math.min(source.compact.length, target.compact.length);
    if (shorterLength >= 18 && (source.compact.includes(target.compact) || target.compact.includes(source.compact))) return true;
    if (source.tokens.size < 4) return false;
    const coveredTokens = [...source.tokens].filter((token) => target.tokens.has(token)).length;
    return coveredTokens / source.tokens.size >= 0.95;
  });
  if (matchedBlock) return true;
  if (source.tokenCount < 4) return false;
  const coveredDocumentTokens = [...source.tokenCounts].reduce(
    (count, [token, wanted]) => count + Math.min(wanted, targetDocumentTokenCounts.get(token) ?? 0),
    0,
  );
  return coveredDocumentTokens / source.tokenCount >= 0.95;
}

function documentTokenCounts(blocks: readonly SemanticBlock[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const block of blocks) {
    for (const [token, count] of block.tokenCounts) counts.set(token, (counts.get(token) ?? 0) + count);
  }
  return counts;
}

function semanticCoverage(
  sourceMarkdown: string,
  currentMarkdown: string,
  sourceTitle: string,
  currentTitle: string,
): { metrics: SemanticCoverage; missingSource: SemanticBlock[]; currentOnly: SemanticBlock[] } {
  const source = semanticBlocks(sourceMarkdown, sourceTitle);
  const current = semanticBlocks(currentMarkdown, currentTitle);
  const sourceDocument = source.map((block) => block.compact).join("");
  const currentDocument = current.map((block) => block.compact).join("");
  const sourceDocumentTokens = documentTokenCounts(source);
  const currentDocumentTokens = documentTokenCounts(current);
  const missingSource = source.filter((block) => !blockIsCovered(block, current, currentDocument, currentDocumentTokens));
  const currentOnly = current.filter((block) => !blockIsCovered(block, source, sourceDocument, sourceDocumentTokens));
  const coveredSourceBlocks = source.length - missingSource.length;
  const coveredCurrentBlocks = current.length - currentOnly.length;
  return {
    metrics: {
      sourceBlocks: source.length,
      currentBlocks: current.length,
      coveredSourceBlocks,
      coveredCurrentBlocks,
      sourceToCurrent: source.length === 0 ? 1 : Number((coveredSourceBlocks / source.length).toFixed(3)),
      currentToSource: current.length === 0 ? 1 : Number((coveredCurrentBlocks / current.length).toFixed(3)),
    },
    missingSource,
    currentOnly,
  };
}

function blockExamples(blocks: readonly SemanticBlock[]): string {
  return blocks.slice(0, 3).map((block) => {
    const value = block.text.replace(/\s+/gu, " ").trim();
    return `„${value.length > 140 ? `${value.slice(0, 137)}…` : value}“`;
  }).join("; ");
}

function eventFieldComparison(
  source: LegacySnapshot["records"][number],
  current: CurrentRecord,
  coverage: SemanticCoverage,
): { preservesSource: boolean; notes: string[] } {
  if (source.kind !== "event") return { preservesSource: true, notes: [] };
  if (!source.event || !current.event) {
    return { preservesSource: false, notes: ["Strukturierte Event-Felder fehlen auf der Legacy- oder aktuellen Seite."] };
  }
  const notes: string[] = [];
  let preservesSource = true;
  const fields = [
    { label: "Titel", source: normalizeOptionalText(source.title), current: normalizeOptionalText(current.title) },
    { label: "Startdatum", source: civilKey(source.event.startDate), current: current.event.startDate },
    { label: "Enddatum", source: civilKey(source.event.endDate ?? null), current: current.event.endDate },
    { label: "Startzeit", source: normalizeTime(source.event.startTime), current: current.event.startTime },
    { label: "Endzeit", source: normalizeTime(source.event.endTime), current: current.event.endTime },
    { label: "Ort", source: normalizeOptionalText(source.event.location), current: current.event.location },
  ] as const;
  for (const field of fields) {
    const sourceValue = field.source;
    const currentValue = field.current;
    const equal = semanticText(sourceValue ?? "") === semanticText(currentValue ?? "");
    if (equal) continue;
    if (sourceValue !== undefined) preservesSource = false;
    notes.push(`Event-Feld ${field.label} weicht ab: Legacy „${sourceValue ?? "leer"}“, aktuell „${currentValue ?? "leer"}“.`);
  }
  if (coverage.coveredSourceBlocks < coverage.sourceBlocks) {
    preservesSource = false;
    notes.push(`Event-Feld Beschreibung deckt nur ${coverage.coveredSourceBlocks}/${coverage.sourceBlocks} Legacy-Blöcke ab.`);
  } else if (coverage.coveredCurrentBlocks < coverage.currentBlocks) {
    notes.push(`Event-Feld Beschreibung enthält ${coverage.currentBlocks - coverage.coveredCurrentBlocks} zusätzliche aktuelle Blöcke.`);
  }
  return { preservesSource, notes };
}

function titleInferenceScore(left: string, right: string): number {
  const similarity = contentSimilarity(left, right);
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  const shorter = leftTokens.size <= rightTokens.size ? leftTokens : rightTokens;
  const longer = shorter === leftTokens ? rightTokens : leftTokens;
  const singleSpecificToken = shorter.size === 1 && ([...shorter][0]?.length ?? 0) >= 10;
  const specificContainment = shorter.size > 0
    && (shorter.size >= 2 || singleSpecificToken)
    && [...shorter].every((token) => longer.has(token));
  return specificContainment ? Math.max(0.6, similarity) : similarity;
}

function routeInferenceScore(left: string, right: string): number {
  const leaf = (value: string) => value
    .replace(/^.*\//u, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/u, "")
    .replace(/[-_]+/gu, " ");
  return titleInferenceScore(leaf(left), leaf(right));
}

function imageUrls(markdown: string): string[] {
  const urls = new Set<string>();
  for (const match of markdown.matchAll(/!\[[^\]]*\]\((?:<)?([^\s)>]+)(?:>)?(?:\s+"[^"]*")?\)/giu)) urls.add(match[1]);
  for (const match of markdown.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/giu)) urls.add(match[1]);
  return uniqueSorted(urls);
}

function documentUrls(markdown: string): string[] {
  const urls = new Set<string>();
  for (const match of markdown.matchAll(/\[[^\]]*\]\((?:<)?([^\s)>]+)(?:>)?(?:\s+"[^"]*")?\)/giu)) {
    if (/\.(?:pdf|docx?|odt|pptx?|xlsx?|csv|zip)(?:[?#]|$)/iu.test(match[1])) urls.add(match[1]);
  }
  for (const match of markdown.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/giu)) {
    if (/\.(?:pdf|docx?|odt|pptx?|xlsx?|csv|zip)(?:[?#]|$)/iu.test(match[1])) urls.add(match[1]);
  }
  return uniqueSorted(urls);
}

async function walkFiles(directory: string, prefix = ""): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const output: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en"))) {
    if (entry.name.startsWith(".")) continue;
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walkFiles(absolute, relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output;
}

async function fileDigest(file: string): Promise<string> {
  const hash = createHash("sha256");
  hash.update(await readFile(file));
  return `sha256:${hash.digest("hex")}`;
}

async function compareAssets(snapshot: LegacySnapshot, publicDir: string): Promise<AssetComparison[]> {
  const files = await walkFiles(publicDir);
  const byName = new Map<string, string[]>();
  const byDigest = new Map<string, string[]>();
  const byDerivedSourcePrefix = new Map<string, string[]>();
  for (const relative of files) {
    const basename = path.posix.basename(relative).toLocaleLowerCase("de");
    byName.set(basename, [...(byName.get(basename) ?? []), `/${relative}`]);
    const derived = relative.match(/^images\/legacy-v2\/([a-f0-9]{2})\/([a-f0-9]{32})-w1600-q78\.webp$/u);
    if (derived && derived[2].startsWith(derived[1])) {
      byDerivedSourcePrefix.set(derived[2], [...(byDerivedSourcePrefix.get(derived[2]) ?? []), `/${relative}`]);
    }
  }
  const wantedDigests = new Set<string>(snapshot.assets.flatMap((asset) => asset.digest ? [asset.digest] : []));
  for (const relative of files) {
    const absolute = path.join(publicDir, relative);
    const info = await stat(absolute);
    if (info.size > 30 * 1024 * 1024) continue;
    const digest = await fileDigest(absolute);
    if (!wantedDigests.has(digest)) continue;
    byDigest.set(digest, [...(byDigest.get(digest) ?? []), `/${relative}`]);
  }

  return snapshot.assets.map((asset): AssetComparison => {
    const sourceUrl = asset.sourceUrls[0];
    if (asset.status === "failed") return { sourceUrl, digest: asset.digest, status: "source-failed", localPaths: [] };
    const digestMatches = asset.digest ? uniqueSorted(byDigest.get(asset.digest) ?? []) : [];
    if (digestMatches.length) return { sourceUrl, digest: asset.digest, status: "matched-by-digest", localPaths: digestMatches };
    const digestPrefix = asset.digest?.slice("sha256:".length, "sha256:".length + 32);
    const derivedMatches = digestPrefix ? uniqueSorted(byDerivedSourcePrefix.get(digestPrefix) ?? []) : [];
    if (derivedMatches.length) return { sourceUrl, digest: asset.digest, status: "matched-by-derived-path", localPaths: derivedMatches };
    const names = uniqueSorted(asset.sourceUrls.flatMap((url) => {
      try {
        return byName.get(decodeURIComponent(path.posix.basename(new URL(url).pathname)).toLocaleLowerCase("de")) ?? [];
      } catch {
        return [];
      }
    }));
    if (names.length) return { sourceUrl, digest: asset.digest, status: "matched-by-name", localPaths: names };
    return { sourceUrl, digest: asset.digest, status: "missing", localPaths: [] };
  }).sort((left, right) => left.sourceUrl.localeCompare(right.sourceUrl, "en"));
}

function assetRefKey(value: string): string | undefined {
  try {
    const url = new URL(value, "https://current.invalid");
    const pathname = decodeURIComponent(url.pathname).replace(/\/{2,}/g, "/");
    return url.origin === "https://current.invalid" ? pathname : `${url.origin}${pathname}`;
  } catch {
    return undefined;
  }
}

function currentAssetsBelongToSource(
  currentUrls: readonly string[],
  sourceUrls: readonly string[],
  comparisons: ReadonlyMap<string, AssetComparison>,
): boolean {
  if (currentUrls.length === 0) return true;
  const expected = new Set(sourceUrls.flatMap((sourceUrl) => {
    const comparison = comparisons.get(sourceUrl);
    return [sourceUrl, ...(comparison?.localPaths ?? [])]
      .map(assetRefKey)
      .filter((value): value is string => Boolean(value));
  }));
  return currentUrls.every((currentUrl) => {
    const key = assetRefKey(currentUrl);
    return key !== undefined && expected.has(key);
  });
}

function sourceAssetsAreRepresentedInCurrent(
  currentUrls: readonly string[],
  sourceUrls: readonly string[],
  comparisons: ReadonlyMap<string, AssetComparison>,
): boolean {
  const current = new Set(currentUrls.map(assetRefKey).filter((value): value is string => Boolean(value)));
  return sourceUrls.every((sourceUrl) => {
    const comparison = comparisons.get(sourceUrl);
    return [sourceUrl, ...(comparison?.localPaths ?? [])]
      .map(assetRefKey)
      .some((value) => value !== undefined && current.has(value));
  });
}

function markdownEscape(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function reportMarkdown(report: ComparisonReport): string {
  const summary = report.summary;
  const lines = [
    "# Abgleich der Legacy-Inhalte",
    "",
    `Snapshot: \`${report.snapshotDigest}\``,
    `Vergleich: \`${report.digest}\``,
    "",
    "## Abdeckung",
    "",
    "| Prüfpunkt | Anzahl |",
    "| --- | ---: |",
    `| Alte HTML-URLs | ${summary.sourceUrls} |`,
    `| Erfolgreich erfasst | ${summary.capturedUrls} |`,
    `| Fehlgeschlagen | ${summary.failedUrls} |`,
    `| Kanonische Quelldatensätze | ${summary.sourceRecords} |`,
    `| Aktuelle redaktionelle Datensätze | ${summary.currentRecords} |`,
    `| Inhaltlich weitgehend gleich | ${summary.equivalent} |`,
    `| Inhaltlich abweichend | ${summary.different} |`,
    `| Aktuelles Ziel fehlt | ${summary.missingCurrent} |`,
    `| Native App-Route, bewusst zu prüfen | ${summary.nativeReview} |`,
    `| Nur im aktuellen CMS | ${summary.editorialOnly} |`,
    `| Legacy-Assets | ${summary.sourceAssets} |`,
    `| Nicht lokal zugeordnete Assets | ${summary.missingAssets} |`,
    "",
    "## Routenvergleich",
    "",
    "| Status | Ziel | Quelle | Titel | Ähnlichkeit | Blöcke Quelle→aktuell | Blöcke aktuell→Quelle | Zeichen alt/neu | Bilder alt/neu | Dokumente alt/neu |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...report.routes.map((route) =>
      `| ${route.status} | \`${markdownEscape(route.targetPath)}\` | [alt](${route.sourceUrl}) | ${markdownEscape(route.title)} | ${route.similarity ?? "–"} | ${route.semanticCoverage ? `${route.semanticCoverage.coveredSourceBlocks}/${route.semanticCoverage.sourceBlocks}` : "–"} | ${route.semanticCoverage ? `${route.semanticCoverage.coveredCurrentBlocks}/${route.semanticCoverage.currentBlocks}` : "–"} | ${route.sourceCharacters}/${route.currentCharacters ?? "–"} | ${route.sourceImages}/${route.currentImages ?? "–"} | ${route.sourceDocuments}/${route.currentDocuments ?? "–"} |`,
    ),
    "",
    "## Fehlende oder ungeklärte Assets",
    "",
    ...(
      report.assets.filter((asset) => asset.status === "missing" || asset.status === "source-failed").length
        ? report.assets
            .filter((asset) => asset.status === "missing" || asset.status === "source-failed")
            .map((asset) => `- ${asset.status}: ${asset.sourceUrl}`)
        : ["Keine." ]
    ),
    "",
    "## Nur im aktuellen CMS",
    "",
    ...(report.editorialOnly.length ? report.editorialOnly.map((route) => `- \`${route}\``) : ["Keine."]),
    "",
    "## Findings",
    "",
    ...(report.findings.length
      ? report.findings.map((finding) => `- **${finding.severity}** \`${markdownEscape(finding.owner)}\`: ${markdownEscape(finding.message)}`)
      : ["Keine."]),
    "",
  ];
  return lines.join("\n");
}

async function atomicWrite(file: string, value: string) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  await writeFile(temp, value);
  await import("node:fs/promises").then(({ rename }) => rename(temp, file));
}

export async function compareLegacyContent(options: CompareOptions): Promise<CompareResult> {
  const snapshotValue = JSON.parse(await readFile(options.snapshotPath, "utf8")) as unknown;
  assertSnapshot(snapshotValue);
  const snapshot = snapshotValue;
  const currentSnapshot = readContentDatabaseSnapshot(options.databaseUrl);
  const current = loadCurrentRecords(currentSnapshot);
  const assets = await compareAssets(snapshot, options.publicDir);
  const assetTypeByUrl = new Map(snapshot.assets.flatMap((asset) =>
    asset.sourceUrls.map((url) => [url, asset.assetType] as const),
  ));
  const assetComparisonByUrl = new Map(snapshot.assets.flatMap((asset) => {
    const comparison = assets.find((candidate) => candidate.sourceUrl === asset.sourceUrls[0]);
    return comparison ? asset.sourceUrls.map((url) => [url, comparison] as const) : [];
  }));
  const currentByRoute = new Map<string, CurrentRecord[]>();
  for (const record of current) currentByRoute.set(record.route, [...(currentByRoute.get(record.route) ?? []), record]);
  const targetCounts = new Map<string, number>();
  for (const record of snapshot.records) targetCounts.set(record.targetPath, (targetCounts.get(record.targetPath) ?? 0) + 1);
  const usedCurrent = new Set<string>();
  const findings: SnapshotFinding[] = [...snapshot.findings];
  const routes: RouteComparison[] = snapshot.records.map((source): RouteComparison => {
    const currentMatches = currentByRoute.get(source.targetPath) ?? [];
    const sourceText = visibleText(source.markdown);
    const common = {
      sourceKey: source.sourceKey,
      sourceUrl: source.sourceUrls[0],
      targetPath: source.targetPath,
      kind: source.kind,
      title: source.title,
      sourceCharacters: sourceText.length,
      sourceImages: source.assetUrls.filter((url) => assetTypeByUrl.get(url) === "image").length,
      sourceDocuments: source.assetUrls.filter((url) => assetTypeByUrl.get(url) === "document").length,
    };
    if ((targetCounts.get(source.targetPath) ?? 0) > 1 || currentMatches.length > 1) {
      findings.push({ severity: "error", owner: source.targetPath, message: "Mehrdeutige Zuordnung: mehrere Datensätze beanspruchen dasselbe Ziel." });
      return { ...common, status: "ambiguous-target", notes: ["Mehrdeutige Zielroute"] };
    }
    if (NATIVE_ROUTES.has(source.targetPath)) {
      findings.push({
        severity: "warning",
        owner: source.targetPath,
        message: "Native App-Route benötigt eine dokumentierte redaktionelle Auflösung; sie gilt nicht automatisch als inhaltlich abgedeckt.",
      });
      return {
        ...common,
        status: "native-review",
        notes: ["Route wird von der Anwendung statt vom CMS gerendert und muss bewusst redaktionell geprüft werden."],
      };
    }
    let currentRecord = currentMatches[0];
    let inferredMatch: string | undefined;
    if (!currentRecord) {
      const sourceDate = source.event?.startDate ?? (source.kind === "news" ? source.publishedDate : undefined);
      if (sourceDate) {
        const candidates = current
          .filter((candidate) => candidate.kind === source.kind && candidate.dateKey === sourceDate && !usedCurrent.has(candidate.route))
          .map((candidate) => ({
            candidate,
            score: Math.max(
              titleInferenceScore(source.title, candidate.title),
              routeInferenceScore(source.targetPath, candidate.route),
            ),
          }))
          .sort((left, right) => right.score - left.score || left.candidate.route.localeCompare(right.candidate.route, "de"));
        const best = candidates[0];
        const runnerUp = candidates[1];
        if (best && best.score >= 0.4 && (!runnerUp || best.score - runnerUp.score >= 0.15)) {
          currentRecord = best.candidate;
          inferredMatch = `Über Inhaltstyp, Datum und Titel der bestehenden Route ${currentRecord.route} zugeordnet.`;
        }
      }
    }
    if (!currentRecord) {
      return { ...common, status: "missing-current", notes: ["Kein aktueller redaktioneller Datensatz mit exakt dieser Route."] };
    }
    usedCurrent.add(currentRecord.route);
    const similarity = contentSimilarity(`${source.title}\n${source.markdown}`, `${currentRecord.title}\n${currentRecord.content}`);
    const currentCharacters = visibleText(currentRecord.content).length;
    const currentImages = currentRecord.imageCount;
    const currentDocuments = currentRecord.documentCount;
    const sourceImageUrls = source.assetUrls.filter((url) => assetTypeByUrl.get(url) === "image");
    const sourceDocumentUrls = source.assetUrls.filter((url) => assetTypeByUrl.get(url) === "document");
    const availableSourceImageUrls = sourceImageUrls.filter((url) => assetComparisonByUrl.get(url)?.status !== "source-failed");
    const availableSourceDocumentUrls = sourceDocumentUrls.filter((url) => assetComparisonByUrl.get(url)?.status !== "source-failed");
    const imagesCorrelate = currentAssetsBelongToSource(currentRecord.imageUrls, availableSourceImageUrls, assetComparisonByUrl)
      && sourceAssetsAreRepresentedInCurrent(currentRecord.imageUrls, availableSourceImageUrls, assetComparisonByUrl);
    const documentsCorrelate = currentAssetsBelongToSource(currentRecord.documentUrls, availableSourceDocumentUrls, assetComparisonByUrl)
      && sourceAssetsAreRepresentedInCurrent(currentRecord.documentUrls, availableSourceDocumentUrls, assetComparisonByUrl);
    const hasCompleteAssetSet = availableSourceImageUrls.length === currentImages
      && availableSourceDocumentUrls.length === currentDocuments
      && imagesCorrelate
      && documentsCorrelate;
    const coverage = semanticCoverage(source.markdown, currentRecord.content, source.title, currentRecord.title);
    const eventFields = eventFieldComparison(source, currentRecord, coverage.metrics);
    const hasCompleteSourceCoverage = coverage.metrics.coveredSourceBlocks === coverage.metrics.sourceBlocks;
    const titlePreservesSource = source.kind === "event"
      ? true
      : titleInferenceScore(source.title, currentRecord.title) >= 0.6;
    const notes = [
      currentRecord.published ? "Aktueller Datensatz ist veröffentlicht." : "Aktueller Datensatz ist ein Entwurf.",
      ...(source.kind === currentRecord.kind ? [] : [`Inhaltstyp weicht ab: ${currentRecord.kind}`]),
      ...(titlePreservesSource ? [] : [`Titel weicht semantisch ab: Legacy „${source.title}“, aktuell „${currentRecord.title}“.`]),
      ...(inferredMatch ? [inferredMatch] : []),
      ...(availableSourceImageUrls.length >= currentImages ? [] : [`Legacy-Extraktion enthält weniger lokal verfügbare Bilder als der aktuelle Datensatz (${availableSourceImageUrls.length}/${currentImages}).`]),
      ...(availableSourceImageUrls.length <= currentImages ? [] : [`Aktueller Datensatz enthält nicht alle lokal verfügbaren Legacy-Bilder (${currentImages}/${availableSourceImageUrls.length}).`]),
      ...(availableSourceDocumentUrls.length >= currentDocuments ? [] : [`Legacy-Extraktion enthält weniger lokal verfügbare Dokumente als der aktuelle Datensatz (${availableSourceDocumentUrls.length}/${currentDocuments}).`]),
      ...(availableSourceDocumentUrls.length <= currentDocuments ? [] : [`Aktueller Datensatz enthält nicht alle lokal verfügbaren Legacy-Dokumente (${currentDocuments}/${availableSourceDocumentUrls.length}).`]),
      ...(imagesCorrelate ? [] : ["Aktuelle Bildpfade lassen sich nicht den erfassten Legacy-Bildern zuordnen."]),
      ...(documentsCorrelate ? [] : ["Aktuelle Dokumentpfade lassen sich nicht den erfassten Legacy-Dokumenten zuordnen."]),
      ...(!hasCompleteSourceCoverage
        ? [`Im aktuellen Datensatz nicht belegte Legacy-Blöcke (${coverage.missingSource.length}): ${blockExamples(coverage.missingSource)}.`]
        : []),
      ...(coverage.currentOnly.length
        ? [`Nur im aktuellen Datensatz belegte Blöcke (${coverage.currentOnly.length}): ${blockExamples(coverage.currentOnly)}.`]
        : []),
      ...eventFields.notes,
      ...(source.warnings ?? []),
    ];
    return {
      ...common,
      status: source.kind === currentRecord.kind
        && hasCompleteAssetSet
        && hasCompleteSourceCoverage
        && titlePreservesSource
        && eventFields.preservesSource
        ? "equivalent"
        : "different",
      currentCharacters,
      similarity,
      currentImages,
      currentDocuments,
      semanticCoverage: coverage.metrics,
      notes,
    };
  }).sort((left, right) => left.targetPath.localeCompare(right.targetPath, "de") || left.sourceKey.localeCompare(right.sourceKey, "de"));

  const editorialOnly = uniqueSorted(current.filter((record) => !usedCurrent.has(record.route) && !NATIVE_ROUTES.has(record.route)).map((record) => record.route));
  const summary = {
    sourceUrls: snapshot.outcomes.length,
    capturedUrls: snapshot.outcomes.filter((outcome) => outcome.status === "captured").length,
    failedUrls: snapshot.outcomes.filter((outcome) => outcome.status === "failed").length,
    sourceRecords: snapshot.records.length,
    currentRecords: current.length,
    equivalent: routes.filter((route) => route.status === "equivalent").length,
    different: routes.filter((route) => route.status === "different").length,
    missingCurrent: routes.filter((route) => route.status === "missing-current" || route.status === "ambiguous-target").length,
    nativeReview: routes.filter((route) => route.status === "native-review").length,
    editorialOnly: editorialOnly.length,
    sourceAssets: snapshot.assets.length,
    missingAssets: assets.filter((asset) => asset.status === "missing" || asset.status === "source-failed").length,
  };
  const reportWithoutDigest = {
    schemaVersion: 1 as const,
    snapshotDigest: snapshot.digest,
    currentDatabaseDigest: currentSnapshot.digest,
    summary,
    routes,
    assets,
    editorialOnly,
    findings: findings.sort((left, right) =>
      left.severity.localeCompare(right.severity, "en") || left.owner.localeCompare(right.owner, "de") || left.message.localeCompare(right.message, "de"),
    ),
  };
  const report: ComparisonReport = {
    ...reportWithoutDigest,
    digest: sha256(stableJson(reportWithoutDigest)),
  };
  const jsonPath = path.join(options.outputDir, "comparison.json");
  const reportPath = path.join(options.outputDir, "report.md");
  await atomicWrite(jsonPath, stableJson(report));
  await atomicWrite(reportPath, reportMarkdown(report));
  return { report, reportPath, jsonPath };
}
