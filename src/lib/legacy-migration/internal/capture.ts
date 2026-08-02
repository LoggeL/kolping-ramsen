import { access, mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { TextDecoder } from "node:util";
import type {
  CaptureOptions,
  CaptureResult,
  CanonicalTargetDecision,
  LegacyAsset,
  LegacyHttp,
  LegacyHttpResponse,
  LegacyRecord,
  LegacySnapshot,
  SnapshotFinding,
  SourceOutcome,
} from "../types";
import { extractLegacyPage, slugifyLegacyTitle, type RecordExclusionApplication } from "./normalize";
import { sha256, stableJson, uniqueSorted } from "./stable";
import { canonicalLegacyUrl, matchesExclude } from "./url";

const HTML_LIMIT = 5 * 1024 * 1024;
const ASSET_LIMIT = 30 * 1024 * 1024;
const textDecoder = new TextDecoder("utf-8");

export class CrawlIncompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrawlIncompleteError";
  }
}

class SourceBoundaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceBoundaryError";
  }
}

function assertFinalUrl(
  response: LegacyHttpResponse,
  origin: string,
  resource: "html" | "asset" | "robots",
) {
  let finalUrl: URL;
  const expected = new URL(origin);
  try {
    finalUrl = new URL(response.finalUrl);
  } catch {
    throw new SourceBoundaryError(`Ungültige finale URL nach Redirect: ${response.finalUrl}`);
  }
  const expectedHost = expected.hostname.toLowerCase().replace(/^www\./u, "");
  const finalHost = finalUrl.hostname.toLowerCase().replace(/^www\./u, "");
  if (finalUrl.protocol !== expected.protocol || finalHost !== expectedHost || finalUrl.port !== expected.port) {
    throw new SourceBoundaryError(`Redirect verlässt die freigegebene Legacy-Origin: ${response.finalUrl}`);
  }
  if (resource === "html" && !canonicalLegacyUrl(response.finalUrl, origin)) {
    throw new SourceBoundaryError(`HTML-Redirect endet außerhalb der zulässigen Legacy-Pfade: ${response.finalUrl}`);
  }
}

function assertOptions(options: CaptureOptions) {
  const parsed = new URL(options.origin);
  if (parsed.protocol !== "https:") throw new Error("Die Legacy-Origin muss HTTPS verwenden.");
  if ((options.maxPages ?? 500) < 1) throw new Error("maxPages muss größer als null sein.");
  if ((options.concurrency ?? 4) < 1 || (options.concurrency ?? 4) > 8) {
    throw new Error("concurrency muss zwischen 1 und 8 liegen.");
  }
  if (options.decisions && new URL(options.decisions.origin).hostname.replace(/^www\./, "") !== parsed.hostname.replace(/^www\./, "")) {
    throw new Error("Die Decisions-Datei gehört zu einer anderen Origin.");
  }
}

function retryDelay(response: LegacyHttpResponse | undefined, attempt: number): number {
  const retryAfter = response?.retryAfter;
  if (retryAfter && /^\d+$/u.test(retryAfter)) return Math.min(5_000, Number(retryAfter) * 1_000);
  return Math.min(2_000, 200 * 2 ** attempt);
}

async function wait(milliseconds: number, signal: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error("Abgebrochen"));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

async function getWithRetry(
  http: LegacyHttp,
  url: string,
  signal: AbortSignal,
  maxBytes: number,
): Promise<LegacyHttpResponse> {
  let lastError: unknown;
  let lastResponse: LegacyHttpResponse | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await http.get({ url, signal, maxBytes });
      lastResponse = response;
      if (response.status !== 408 && response.status !== 429 && response.status < 500) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 2) await wait(retryDelay(lastResponse, attempt), signal);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function parseRobots(body: string): string[] {
  const disallows: string[] = [];
  let applies = false;
  for (const rawLine of body.split(/\r?\n/u)) {
    const line = rawLine.replace(/#.*$/u, "").trim();
    const [rawKey, ...rawValue] = line.split(":");
    const key = rawKey?.trim().toLowerCase();
    const value = rawValue.join(":").trim();
    if (key === "user-agent") applies = value === "*";
    if (applies && key === "disallow" && value) disallows.push(value);
  }
  return uniqueSorted(disallows);
}

function isRobotsAllowed(url: string, disallows: readonly string[]): boolean {
  const pathname = new URL(url).pathname;
  return !disallows.some((prefix) => pathname.startsWith(prefix));
}

function belongsToTargetPrefix(targetPath: string, prefix: string): boolean {
  return prefix === "/" ? targetPath === "/" : targetPath === prefix || targetPath.startsWith(`${prefix}/`);
}

function canonicalTargetDecision(
  targets: ReadonlySet<string>,
  decisions: readonly CanonicalTargetDecision[],
): CanonicalTargetDecision | undefined {
  const matching = decisions.filter((decision) => {
    const representedPrefixes = new Set<string>();
    for (const target of targets) {
      const matchingPrefixes = decision.targetPrefixes.filter((prefix) => belongsToTargetPrefix(target, prefix));
      if (matchingPrefixes.length !== 1) return false;
      representedPrefixes.add(matchingPrefixes[0]);
    }
    const preferredTargets = [...targets].filter((target) =>
      belongsToTargetPrefix(target, decision.preferTargetPrefix));
    return representedPrefixes.size >= 2 && preferredTargets.length === 1;
  });
  return matching.length === 1 ? matching[0] : undefined;
}

function canonicalContentKey(record: LegacyRecord): string {
  return sha256(stableJson({
    kind: record.kind,
    publishedDate: record.publishedDate ?? null,
    event: record.event ?? null,
    markdown: record.markdown,
  }));
}

function hasExactSourcePath(record: Pick<LegacyRecord, "sourceUrls" | "sourcePageUrls">, sourcePathname: string): boolean {
  const normalized = sourcePathname.replace(/\/$/u, "") || "/";
  return [...record.sourceUrls, ...record.sourcePageUrls].some((url) => {
    const pathname = new URL(url).pathname.replace(/\/$/u, "") || "/";
    return pathname === normalized;
  });
}

function validateRecordOverrides(
  records: readonly LegacyRecord[],
  findings: SnapshotFinding[],
  decisions: CaptureOptions["decisions"],
) {
  for (const override of decisions?.recordOverrides ?? []) {
    const owner = `${override.sourcePath}#${override.publishedDate}-${override.detectedTitle}`;
    const allMatches: LegacyRecord[] = [];
    for (const sourcePathname of [override.sourcePath, ...(override.sourceAliases ?? [])]) {
      const matches = records.filter((record) =>
        hasExactSourcePath(record, sourcePathname)
        && record.publishedDate === override.publishedDate
        && record.title === override.title
        && record.targetPath === override.targetPath);
      if (matches.length === 0) {
        findings.push({
          severity: "error",
          owner,
          message: `Deklarativer Record-Override passt nicht mehr exakt zur Quelle ${sourcePathname}.`,
        });
        continue;
      }
      if (new Set(matches.map((record) => record.digest)).size !== 1) {
        findings.push({
          severity: "error",
          owner,
          message: `Die Kopien unter ${sourcePathname} sind inhaltlich nicht identisch.`,
        });
      }
      allMatches.push(...matches);
    }
    if (allMatches.length > 0 && new Set(allMatches.map((record) => record.digest)).size !== 1) {
      findings.push({
        severity: "error",
        owner,
        message: "Die deklarierten Haupt- und Aliasquellen des Record-Overrides sind inhaltlich nicht identisch.",
      });
    }
  }
}

function hasExactExclusionSourcePath(application: RecordExclusionApplication, sourcePathname: string): boolean {
  const normalized = sourcePathname.replace(/\/$/u, "") || "/";
  return [application.sourceUrl, application.sourcePageUrl].some((url) => {
    const pathname = new URL(url).pathname.replace(/\/$/u, "") || "/";
    return pathname === normalized;
  });
}

function validateRecordExclusions(
  applications: readonly RecordExclusionApplication[],
  assets: readonly LegacyAsset[],
  findings: SnapshotFinding[],
  decisions: CaptureOptions["decisions"],
) {
  for (const exclusion of decisions?.recordExcludes ?? []) {
    const owner = `record-exclude:${exclusion.sourcePath}#${exclusion.publishedDate}-${exclusion.detectedTitle}`;
    const decisionApplications = applications.filter((application) =>
      application.decisionSourcePath === exclusion.sourcePath
      && application.publishedDate === exclusion.publishedDate
      && application.detectedTitle === exclusion.detectedTitle);
    for (const sourcePathname of [exclusion.sourcePath, ...(exclusion.sourceAliases ?? [])]) {
      if (!decisionApplications.some((application) => hasExactExclusionSourcePath(application, sourcePathname))) {
        findings.push({
          severity: "error",
          owner,
          message: `Deklarativer Record-Ausschluss passt nicht mehr exakt zur Quelle ${sourcePathname}.`,
        });
      }
    }
    if (decisionApplications.length === 0) continue;
    if (new Set(decisionApplications.map((application) => application.sourceFingerprint)).size !== 1) {
      findings.push({
        severity: "error",
        owner,
        message: "Die deklarierten Haupt- und Aliasquellen des Record-Ausschlusses sind inhaltlich nicht identisch.",
      });
    }
    const expectedAssetUrls = uniqueSorted(exclusion.expectedAssetStates.map((asset) => asset.sourceUrl));
    for (const application of decisionApplications) {
      const actualAssetUrls = uniqueSorted(application.assetUrls);
      if (stableJson(actualAssetUrls) !== stableJson(expectedAssetUrls)) {
        findings.push({
          severity: "error",
          owner,
          message: `Die versiegelten Asset-URLs des Ausschlusses stimmen nicht exakt überein: erwartet ${expectedAssetUrls.join(", ")}, erfasst ${actualAssetUrls.join(", ") || "keine"}.`,
        });
      }
    }
    for (const expected of exclusion.expectedAssetStates) {
      const asset = assets.find((candidate) => candidate.sourceUrls.includes(expected.sourceUrl));
      if (!asset || asset.status !== expected.status || asset.reason !== expected.reason) {
        const actual = asset ? `${asset.status}${asset.reason ? ` (${asset.reason})` : ""}` : "nicht erfasst";
        findings.push({
          severity: "error",
          owner,
          message: `Erwarteter Asset-Zustand für ${expected.sourceUrl} ist ${expected.status} (${expected.reason}), erfasst wurde ${actual}.`,
        });
      }
    }
  }
}

function validateZeroRecordPages(
  outcomes: readonly SourceOutcome[],
  findings: SnapshotFinding[],
  decisions: CaptureOptions["decisions"],
) {
  for (const outcome of outcomes) {
    if (outcome.status !== "captured" || outcome.recordCount !== 0) continue;
    const url = new URL(outcome.url);
    const pathname = url.pathname.replace(/\/$/u, "") || "/";
    const sourcePath = `${pathname}${url.search}`;
    const explicitlyRedirected = decisions?.redirects?.some((redirect) => {
      const redirectUrl = new URL(redirect.fromPath, "https://legacy.invalid");
      const redirectPath = `${redirectUrl.pathname.replace(/\/$/u, "") || "/"}${redirectUrl.search}`;
      return redirectPath === sourcePath;
    });
    if (!explicitlyRedirected) {
      findings.push({
        severity: "error",
        owner: outcome.url,
        message: "Erfolgreich geladene Legacy-Detailseite enthält keinen extrahierten Datensatz und hat keinen expliziten Redirect.",
      });
    }
  }
}

function mergeRecords(
  records: readonly LegacyRecord[],
  findings: SnapshotFinding[],
  targetDecisions: readonly CanonicalTargetDecision[],
): LegacyRecord[] {
  const preference = (record: LegacyRecord): number => {
    let score = record.targetPath.startsWith("/_legacy-review/") ? 0 : 100;
    const targetLegacyPath = `/index.php${record.targetPath === "/" ? "" : record.targetPath}`;
    if (record.sourcePageUrls.some((url) => new URL(url).pathname === targetLegacyPath)) score += 50;
    if (record.sourceUrls.some((url) => url !== record.sourcePageUrls[0])) score += 20;
    score -= record.warnings.length * 5;
    return score;
  };
  const mergedProvenance = (
    preferred: LegacyRecord,
    left: LegacyRecord,
    right: LegacyRecord,
  ): LegacyRecord => ({
    ...preferred,
    sourceKey: preferred.sourceKey,
    sourceUrls: uniqueSorted([...left.sourceUrls, ...right.sourceUrls]),
    sourcePageUrls: uniqueSorted([...left.sourcePageUrls, ...right.sourcePageUrls]),
    assetUrls: uniqueSorted([...left.assetUrls, ...right.assetUrls]),
    internalLinks: uniqueSorted([...left.internalLinks, ...right.internalLinks]),
    warnings: uniqueSorted([...left.warnings, ...right.warnings]),
  });

  const byRouteContent = new Map<string, LegacyRecord>();
  for (const record of records) {
    const key = `${record.kind}\0${record.targetPath}\0${canonicalContentKey(record)}`;
    const duplicate = byRouteContent.get(key);
    if (!duplicate) {
      byRouteContent.set(key, record);
      continue;
    }
    const preferred = preference(record) > preference(duplicate) ? record : duplicate;
    byRouteContent.set(key, mergedProvenance(preferred, duplicate, record));
  }

  const recordsByContent = new Map<string, LegacyRecord[]>();
  for (const record of byRouteContent.values()) {
    const key = canonicalContentKey(record);
    recordsByContent.set(key, [...(recordsByContent.get(key) ?? []), record]);
  }
  const canonicalized: LegacyRecord[] = [];
  for (const group of recordsByContent.values()) {
    const targets = new Set(group.map((record) => record.targetPath));
    if (targets.size < 2) {
      canonicalized.push(...group);
      continue;
    }
    const exactTargets = uniqueSorted(group.flatMap((record) =>
      record.canonicalSource ? [record.targetPath] : [],
    ));
    const configuredDecision = exactTargets.length === 1
      ? undefined
      : canonicalTargetDecision(targets, targetDecisions);
    const canonicalTarget = exactTargets.length === 1
      ? exactTargets[0]
      : [...targets].filter((target) => configuredDecision
        && belongsToTargetPrefix(target, configuredDecision.preferTargetPrefix))[0];
    if (!canonicalTarget) {
      canonicalized.push(...group);
      continue;
    }
    const preferred = [...group]
      .filter((record) => record.targetPath === canonicalTarget)
      .sort((left, right) => preference(right) - preference(left) || left.sourceKey.localeCompare(right.sourceKey, "de"))[0];
    const canonical = group.reduce(
      (merged, record) => mergedProvenance(merged, merged, record),
      preferred,
    );
    canonicalized.push(canonical);
    findings.push({
      severity: "info",
      owner: canonical.sourceKey,
      message: configuredDecision
        ? `Identische Collection-Kopien wurden ${canonicalTarget} zugeordnet: ${configuredDecision.reason}`
        : `Identische Collection-Kopien wurden dem expliziten Direktziel ${canonicalTarget} zugeordnet.`,
    });
  }

  const byIdentity = new Map<string, LegacyRecord>();
  for (const record of canonicalized) {
    const key = `${record.kind}\0${record.targetPath}\0${record.sourceKey}`;
    const collision = byIdentity.get(key);
    if (!collision) {
      byIdentity.set(key, record);
      continue;
    }
    const preferred = record.markdown.length > collision.markdown.length ? record : collision;
    byIdentity.set(key, mergedProvenance(preferred, collision, record));
    findings.push({
      severity: "warning",
      owner: record.sourceKey,
      message: `Mehrere unterschiedliche Fassungen derselben Zielroute gefunden; die längere Fassung (${preferred.digest}) wurde gewählt.`,
    });
  }

  const sourceKeyCounts = new Map<string, number>();
  for (const record of byIdentity.values()) {
    sourceKeyCounts.set(record.sourceKey, (sourceKeyCounts.get(record.sourceKey) ?? 0) + 1);
  }
  const merged = [...byIdentity.values()].map((record) =>
    (sourceKeyCounts.get(record.sourceKey) ?? 0) > 1
      ? {
          ...record,
          sourceKey: `${record.sourceKey}|target:${record.kind}:${record.targetPath}`,
        }
      : record,
  ).sort((left, right) =>
    left.targetPath.localeCompare(right.targetPath, "de") || left.sourceKey.localeCompare(right.sourceKey, "de"),
  );
  const targetsByContent = new Map<string, Set<string>>();
  for (const record of merged) {
    const key = canonicalContentKey(record);
    if (!targetsByContent.has(key)) targetsByContent.set(key, new Set());
    targetsByContent.get(key)?.add(record.targetPath);
  }
  for (const [contentKey, targets] of targetsByContent) {
    if (targets.size < 2) continue;
    findings.push({
      severity: "error",
      owner: contentKey,
      message: `Identischer Inhalt wurde mehreren Zielrouten zugeordnet (${[...targets].sort((left, right) => left.localeCompare(right, "de")).join(", ")}); eine kanonische Quellroute muss in legacy-decisions.json deklariert werden.`,
    });
  }
  const byTarget = new Map<string, LegacyRecord[]>();
  for (const record of merged) byTarget.set(record.targetPath, [...(byTarget.get(record.targetPath) ?? []), record]);
  return merged.map((record) => {
    const collisions = byTarget.get(record.targetPath) ?? [];
    const index = collisions.findIndex((candidate) => candidate.sourceKey === record.sourceKey);
    if (collisions.length < 2 || index === 0) return record;
    const assetHint = record.assetUrls[0]
      ? slugifyLegacyTitle(decodeURIComponent(path.posix.basename(new URL(record.assetUrls[0]).pathname))).slice(0, 48)
      : record.digest.slice("sha256:".length, "sha256:".length + 10);
    return {
      ...record,
      targetPath: `${record.targetPath}-${assetHint}`,
      warnings: uniqueSorted([...record.warnings, "Zielroute wurde wegen eines gleichnamigen Artikels eindeutig ergänzt."]),
    };
  });
}

function extensionFor(contentType: string, url: string): string {
  const known: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  };
  const mime = contentType.split(";", 1)[0].trim().toLowerCase();
  return known[mime] ?? (path.extname(new URL(url).pathname).toLowerCase().slice(0, 10) || ".bin");
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function atomicWrite(file: string, value: string | Uint8Array) {
  await mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.tmp-${process.pid}`;
  await writeFile(tempFile, value);
  await rename(tempFile, file);
}

async function assetDimensions(body: Uint8Array, contentType: string): Promise<{ width?: number; height?: number }> {
  if (!contentType.toLowerCase().startsWith("image/") || contentType.toLowerCase().includes("svg")) return {};
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(body).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch {
    return {};
  }
}

async function captureAssets(
  urls: readonly string[],
  records: readonly LegacyRecord[],
  altTexts: Map<string, Set<string>>,
  http: LegacyHttp,
  cacheDir: string,
  concurrency: number,
  signal: AbortSignal,
  findings: SnapshotFinding[],
  cachedAssets: ReadonlyMap<string, LegacyAsset>,
): Promise<LegacyAsset[]> {
  const results: LegacyAsset[] = [];
  for (let offset = 0; offset < urls.length; offset += concurrency) {
    const batch = urls.slice(offset, offset + concurrency);
    const captured = await Promise.all(batch.map(async (url): Promise<LegacyAsset> => {
      const usedBy = uniqueSorted(records.filter((record) => record.assetUrls.includes(url)).map((record) => record.sourceKey));
      const alts = uniqueSorted(altTexts.get(url) ?? []);
      const cached = cachedAssets.get(url);
      if (cached?.digest) {
        return {
          ...cached,
          assetType: cached.contentType?.startsWith("image/") ? "image" : "document",
          sourceUrls: [url],
          altTexts: uniqueSorted([...cached.altTexts, ...alts]),
          usedBy,
        };
      }
      try {
        const response = await getWithRetry(http, url, signal, ASSET_LIMIT);
        assertFinalUrl(response, new URL(url).origin, "asset");
        if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
        const contentType = response.contentType.split(";", 1)[0].trim().toLowerCase();
        const assetType = contentType.startsWith("image/") ? "image" : "document";
        if (assetType === "document" && !(
          contentType === "application/pdf" ||
          contentType === "application/msword" ||
          contentType === "application/zip" ||
          contentType === "text/csv" ||
          contentType.startsWith("application/vnd.")
        )) throw new Error(`Unerwarteter Content-Type ${response.contentType}`);
        const digest = sha256(response.body);
        const extension = extensionFor(response.contentType, response.finalUrl || url);
        const cacheFile = path.join(cacheDir, "assets", `${digest.slice("sha256:".length)}${extension}`);
        const cacheIsValid = await exists(cacheFile) && sha256(await readFile(cacheFile)) === digest;
        if (!cacheIsValid) await atomicWrite(cacheFile, response.body);
        const dimensions = await assetDimensions(response.body, response.contentType);
        return {
          assetType,
          digest,
          sourceUrls: [url],
          contentType,
          byteLength: response.body.byteLength,
          ...dimensions,
          altTexts: alts,
          usedBy,
          status: "captured",
        };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        findings.push({ severity: error instanceof SourceBoundaryError ? "error" : "warning", owner: url, message: `Asset konnte nicht erfasst werden: ${reason}` });
        const assetType = /\.(?:pdf|docx?|odt|pptx?|xlsx?|csv|zip)(?:[?#]|$)/iu.test(url) ? "document" : "image";
        return { assetType, sourceUrls: [url], altTexts: alts, usedBy, status: "failed", reason };
      }
    }));
    results.push(...captured);
  }

  const byDigest = new Map<string, LegacyAsset>();
  const failed: LegacyAsset[] = [];
  for (const asset of results) {
    if (!asset.digest) {
      failed.push(asset);
      continue;
    }
    const duplicate = byDigest.get(asset.digest);
    if (!duplicate) byDigest.set(asset.digest, asset);
    else byDigest.set(asset.digest, {
      ...duplicate,
      sourceUrls: uniqueSorted([...duplicate.sourceUrls, ...asset.sourceUrls]),
      altTexts: uniqueSorted([...duplicate.altTexts, ...asset.altTexts]),
      usedBy: uniqueSorted([...duplicate.usedBy, ...asset.usedBy]),
    });
  }
  return [...byDigest.values(), ...failed].sort((left, right) =>
    (left.digest ?? left.sourceUrls[0]).localeCompare(right.digest ?? right.sourceUrls[0], "en"),
  );
}

async function reusableAssets(outputDir: string, cacheDir: string): Promise<Map<string, LegacyAsset>> {
  const output = new Map<string, LegacyAsset>();
  try {
    const previous = JSON.parse(await readFile(path.join(outputDir, "snapshot.json"), "utf8")) as { assets?: LegacyAsset[] };
    const cacheFiles = await readdir(path.join(cacheDir, "assets"));
    const verified = new Map<string, boolean>();
    for (const asset of previous.assets ?? []) {
      if (asset.status !== "captured" || !asset.digest) continue;
      const digest = asset.digest.slice("sha256:".length);
      const cacheName = cacheFiles.find((file) => file.startsWith(digest));
      if (!cacheName) continue;
      let valid = verified.get(asset.digest);
      if (valid === undefined) {
        valid = sha256(await readFile(path.join(cacheDir, "assets", cacheName))) === asset.digest;
        verified.set(asset.digest, valid);
      }
      if (!valid) continue;
      for (const url of asset.sourceUrls) output.set(url, asset);
    }
  } catch {
    // A missing or stale cache is only a performance miss; source capture remains authoritative.
  }
  return output;
}

function recordFileName(record: LegacyRecord): string {
  const route = record.targetPath.replace(/^\/+/, "").replace(/\//g, "--") || "startseite";
  return `${record.kind}--${slugifyLegacyTitle(route)}--${record.digest.slice(7, 15)}.md`;
}

async function writeSnapshot(outputDir: string, snapshot: LegacySnapshot): Promise<CaptureResult> {
  await mkdir(outputDir, { recursive: true });
  const recordsDir = path.join(outputDir, "records");
  await mkdir(recordsDir, { recursive: true });
  const wantedFiles = new Set(snapshot.records.map(recordFileName));
  for (const entry of await readdir(recordsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !wantedFiles.has(entry.name)) {
      await unlink(path.join(recordsDir, entry.name));
    }
  }
  for (const record of snapshot.records) {
    const frontmatter = [
      "---",
      `kind: ${record.kind}`,
      `target: ${record.targetPath}`,
      `sourceKey: ${record.sourceKey}`,
      `digest: ${record.digest}`,
      "---",
      "",
      `# ${record.title}`,
      "",
      record.markdown,
      "",
    ].join("\n");
    await atomicWrite(path.join(recordsDir, recordFileName(record)), frontmatter);
  }
  const snapshotPath = path.join(outputDir, "snapshot.json");
  await atomicWrite(snapshotPath, stableJson(snapshot));
  return { snapshot, snapshotPath, recordsDir };
}

export async function captureLegacySource(options: CaptureOptions, http: LegacyHttp): Promise<CaptureResult> {
  assertOptions(options);
  const origin = new URL(options.origin).origin;
  const maxPages = options.maxPages ?? 500;
  const concurrency = options.concurrency ?? 4;
  const signal = options.signal ?? new AbortController().signal;
  const findings: SnapshotFinding[] = [];
  const outcomes: SourceOutcome[] = [];
  const rawRecords: LegacyRecord[] = [];
  const recordExclusions: RecordExclusionApplication[] = [];
  const assetAltTexts = new Map<string, Set<string>>();
  const discoveredAssets = new Set<string>();

  let disallows: string[] = [];
  try {
    const response = await getWithRetry(http, `${origin}/robots.txt`, signal, 512 * 1024);
    assertFinalUrl(response, origin, "robots");
    if (response.status >= 200 && response.status < 300) {
      disallows = parseRobots(textDecoder.decode(response.body));
      if (disallows.includes("/")) {
        throw new CrawlIncompleteError("robots.txt untersagt den vollständigen Crawl; es wurden keine Inhaltsseiten abgerufen.");
      }
    }
  } catch (error) {
    if (error instanceof CrawlIncompleteError) throw error;
    if (error instanceof SourceBoundaryError) throw new CrawlIncompleteError(error.message);
    findings.push({ severity: "warning", owner: `${origin}/robots.txt`, message: `robots.txt nicht verfügbar: ${error instanceof Error ? error.message : String(error)}` });
  }

  const seedValues = [
    `${origin}/index.php`,
    ...(options.seeds ?? []),
    ...(options.decisions?.routes.map((route) => new URL(route.sourcePath, origin).href) ?? []),
  ];
  const queue = uniqueSorted(seedValues.map((seed) => canonicalLegacyUrl(seed, origin)).filter((url): url is string => Boolean(url)));
  const queued = new Set(queue);
  const visited = new Set<string>();

  while (queue.length > 0 && visited.size < maxPages) {
    queue.sort((left, right) => left.localeCompare(right, "en"));
    const available = maxPages - visited.size;
    const batch = queue.splice(0, Math.min(concurrency, available));
    const batchResults = await Promise.all(batch.map(async (url) => {
      visited.add(url);
      const excluded = matchesExclude(url, options.decisions?.excludes ?? []);
      if (excluded) {
        return { url, outcome: { url, status: "excluded", reason: excluded.reason } satisfies SourceOutcome };
      }
      if (!isRobotsAllowed(url, disallows)) {
        return { url, outcome: { url, status: "excluded", reason: "Durch robots.txt ausgeschlossen." } satisfies SourceOutcome };
      }
      try {
        const response = await getWithRetry(http, url, signal, HTML_LIMIT);
        assertFinalUrl(response, origin, "html");
        if (response.status < 200 || response.status >= 300) {
          return { url, outcome: { url, status: "failed", httpStatus: response.status, reason: `HTTP ${response.status}` } satisfies SourceOutcome };
        }
        if (!/\b(?:text\/html|application\/xhtml\+xml)\b/iu.test(response.contentType)) {
          return { url, outcome: { url, status: "non-html", httpStatus: response.status, reason: response.contentType } satisfies SourceOutcome };
        }
        const parsed = extractLegacyPage(textDecoder.decode(response.body), url, origin, options.decisions);
        return {
          url,
          outcome: { url, status: "captured", httpStatus: response.status, recordCount: parsed.records.length } satisfies SourceOutcome,
          parsed,
        };
      } catch (error) {
        return { url, outcome: { url, status: "failed", reason: error instanceof Error ? error.message : String(error) } satisfies SourceOutcome };
      }
    }));

    for (const result of batchResults.sort((left, right) => left.url.localeCompare(right.url, "en"))) {
      outcomes.push(result.outcome);
      if (!result.parsed) continue;
      rawRecords.push(...result.parsed.records);
      recordExclusions.push(...result.parsed.recordExclusions);
      findings.push(...result.parsed.findings);
      for (const asset of result.parsed.assetUrls) discoveredAssets.add(asset);
      for (const [asset, alts] of result.parsed.assetAltTexts) {
        if (!assetAltTexts.has(asset)) assetAltTexts.set(asset, new Set());
        for (const alt of alts) assetAltTexts.get(asset)?.add(alt);
      }
      for (const link of result.parsed.pageLinks) {
        if (!visited.has(link) && !queued.has(link)) {
          queue.push(link);
          queued.add(link);
        }
      }
    }
  }

  if (queue.length > 0) {
    throw new CrawlIncompleteError(`Crawl nach ${visited.size} Seiten unvollständig; ${queue.length} URL(s) verbleiben. maxPages erhöhen statt still abzubrechen.`);
  }
  const failedPages = outcomes.filter((outcome) => outcome.status === "failed");
  for (const outcome of failedPages) {
    findings.push({ severity: "error", owner: outcome.url, message: `HTML-Quelle nicht erfasst: ${outcome.reason ?? "unbekannter Fehler"}` });
  }
  validateZeroRecordPages(outcomes, findings, options.decisions);
  validateRecordOverrides(rawRecords, findings, options.decisions);
  const records = mergeRecords(rawRecords, findings, options.decisions?.canonicalTargets ?? []).map((record) => {
    const explicitTitle = options.decisions?.recordOverrides?.some((override) =>
      override.publishedDate === record.publishedDate
      && override.title === record.title
      && override.targetPath === record.targetPath,
    );
    return explicitTitle
      ? {
          ...record,
          warnings: record.warnings.filter((warning) =>
            warning !== "Telefonnummer im Quellheading wurde nicht als Seitentitel übernommen."
            && warning !== "Generischer Bilddateiname wurde durch einen datierten Titel ersetzt.",
          ),
        }
      : record;
  });
  const cachedAssets = options.reuseAssets
    ? await reusableAssets(options.outputDir, options.cacheDir)
    : new Map<string, LegacyAsset>();
  const assets = await captureAssets(
    uniqueSorted(discoveredAssets),
    records,
    assetAltTexts,
    http,
    options.cacheDir,
    concurrency,
    signal,
    findings,
    cachedAssets,
  );
  validateRecordExclusions(recordExclusions, assets, findings, options.decisions);
  for (const record of records) {
    for (const warning of record.warnings) findings.push({
      severity: warning.includes("Joomla-Mail-Verschleierung") ? "error" : "warning",
      owner: record.sourceKey,
      message: warning,
    });
  }
  const normalizedOutcomes = outcomes.sort((left, right) => left.url.localeCompare(right.url, "en"));
  const normalizedFindings = findings.sort((left, right) =>
    left.severity.localeCompare(right.severity, "en") || left.owner.localeCompare(right.owner, "de") || left.message.localeCompare(right.message, "de"),
  );
  const snapshotWithoutDigest = {
    schemaVersion: 1 as const,
    origin,
    decisionsDigest: sha256(stableJson(options.decisions ?? null)),
    outcomes: normalizedOutcomes,
    records,
    assets,
    findings: normalizedFindings,
  };
  const snapshot: LegacySnapshot = {
    ...snapshotWithoutDigest,
    digest: sha256(stableJson(snapshotWithoutDigest)),
  };
  return writeSnapshot(options.outputDir, snapshot);
}
