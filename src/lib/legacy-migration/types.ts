export type ContentKind = "page" | "news" | "event";

export type LegacyHttpResponse = Readonly<{
  status: number;
  finalUrl: string;
  contentType: string;
  body: Uint8Array;
  retryAfter?: string;
}>;

export interface LegacyHttp {
  get(input: {
    url: string;
    signal: AbortSignal;
    maxBytes: number;
  }): Promise<LegacyHttpResponse>;
}

export type RouteDecision = Readonly<{
  sourcePath: string;
  targetPath: string;
  kind: ContentKind;
  collection?: boolean;
  title?: string;
}>;

export type RecordOverrideDecision = Readonly<{
  sourcePath: string;
  sourceAliases?: readonly string[];
  publishedDate: string;
  detectedTitle: string;
  title: string;
  targetPath: string;
  reason: string;
}>;

export type RecordExcludeDecision = Readonly<{
  sourcePath: string;
  sourceAliases?: readonly string[];
  publishedDate: string;
  detectedTitle: string;
  sourceFingerprint: `sha256:${string}`;
  expectedAssetStates: readonly Readonly<{
    sourceUrl: string;
    status: "failed";
    reason: string;
  }>[];
  reason: string;
}>;

export type EditorialRedirectDecision = Readonly<{
  fromPath: string;
  targetPath: string;
  reason: string;
}>;

export type ExcludeDecision = Readonly<{
  pattern: string;
  reason: string;
}>;

export type CanonicalTargetDecision = Readonly<{
  targetPrefixes: readonly string[];
  preferTargetPrefix: string;
  reason: string;
}>;

export type DraftUpdateDecision = Readonly<{
  targetPath: string;
  kind: "page" | "news";
  publish: true;
  reason: string;
  title?: string;
}>;

export type CurrentNormalizationDecision = Readonly<{
  targetPath: string;
  kind: "page" | "news";
  reason: string;
  format?: "default" | "travel-history" | "legal-outline";
}>;

export type MigrationDecisions = Readonly<{
  schemaVersion: 1;
  origin: string;
  routes: readonly RouteDecision[];
  recordOverrides?: readonly RecordOverrideDecision[];
  recordExcludes?: readonly RecordExcludeDecision[];
  redirects?: readonly EditorialRedirectDecision[];
  canonicalTargets?: readonly CanonicalTargetDecision[];
  draftUpdates?: readonly DraftUpdateDecision[];
  currentNormalizations?: readonly CurrentNormalizationDecision[];
  excludes: readonly ExcludeDecision[];
}>;

export type SourceOutcome = Readonly<{
  url: string;
  status: "captured" | "excluded" | "failed" | "non-html";
  httpStatus?: number;
  recordCount?: number;
  reason?: string;
}>;

export type LegacyRecord = Readonly<{
  sourceKey: string;
  sourceUrls: readonly string[];
  sourcePageUrls: readonly string[];
  canonicalSource?: boolean;
  kind: ContentKind;
  targetPath: string;
  title: string;
  publishedDate?: string;
  event?: Readonly<{
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  }>;
  markdown: string;
  excerpt: string;
  assetUrls: readonly string[];
  internalLinks: readonly string[];
  digest: `sha256:${string}`;
  warnings: readonly string[];
}>;

export type LegacyAsset = Readonly<{
  assetType: "image" | "document";
  digest?: `sha256:${string}`;
  sourceUrls: readonly string[];
  contentType?: string;
  byteLength?: number;
  width?: number;
  height?: number;
  altTexts: readonly string[];
  usedBy: readonly string[];
  status: "captured" | "failed";
  reason?: string;
}>;

export type SnapshotFinding = Readonly<{
  severity: "info" | "warning" | "error";
  owner: string;
  message: string;
}>;

export type LegacySnapshot = Readonly<{
  schemaVersion: 1;
  origin: string;
  decisionsDigest: `sha256:${string}`;
  digest: `sha256:${string}`;
  outcomes: readonly SourceOutcome[];
  records: readonly LegacyRecord[];
  assets: readonly LegacyAsset[];
  findings: readonly SnapshotFinding[];
}>;

export type CaptureOptions = Readonly<{
  origin: string;
  outputDir: string;
  cacheDir: string;
  decisions?: MigrationDecisions;
  seeds?: readonly string[];
  maxPages?: number;
  concurrency?: number;
  reuseAssets?: boolean;
  signal?: AbortSignal;
}>;

export type CaptureResult = Readonly<{
  snapshot: LegacySnapshot;
  snapshotPath: string;
  recordsDir: string;
}>;

export type ComparisonStatus =
  | "equivalent"
  | "different"
  | "missing-current"
  | "native-review"
  | "ambiguous-target";

export type RouteComparison = Readonly<{
  sourceKey: string;
  sourceUrl: string;
  targetPath: string;
  kind: ContentKind;
  title: string;
  status: ComparisonStatus;
  sourceCharacters: number;
  currentCharacters?: number;
  similarity?: number;
  sourceImages: number;
  currentImages?: number;
  sourceDocuments: number;
  currentDocuments?: number;
  semanticCoverage?: Readonly<{
    sourceBlocks: number;
    currentBlocks: number;
    coveredSourceBlocks: number;
    coveredCurrentBlocks: number;
    sourceToCurrent: number;
    currentToSource: number;
  }>;
  notes: readonly string[];
}>;

export type AssetComparison = Readonly<{
  sourceUrl: string;
  digest?: string;
  status: "matched-by-digest" | "matched-by-derived-path" | "matched-by-name" | "missing" | "source-failed";
  localPaths: readonly string[];
}>;

export type ComparisonReport = Readonly<{
  schemaVersion: 1;
  digest: `sha256:${string}`;
  snapshotDigest: string;
  currentDatabaseDigest: `sha256:${string}`;
  summary: {
    sourceUrls: number;
    capturedUrls: number;
    failedUrls: number;
    sourceRecords: number;
    currentRecords: number;
    equivalent: number;
    different: number;
    missingCurrent: number;
    nativeReview: number;
    editorialOnly: number;
    sourceAssets: number;
    missingAssets: number;
  };
  routes: readonly RouteComparison[];
  assets: readonly AssetComparison[];
  editorialOnly: readonly string[];
  findings: readonly SnapshotFinding[];
}>;

export type CompareOptions = Readonly<{
  snapshotPath: string;
  databaseUrl: string;
  publicDir: string;
  outputDir: string;
}>;

export type CompareResult = Readonly<{
  report: ComparisonReport;
  reportPath: string;
  jsonPath: string;
}>;

export type StageOptions = Readonly<{
  snapshotPath: string;
  comparisonPath: string;
  approvedSnapshotDigest: string;
  approvedComparisonDigest: string;
  decisions: MigrationDecisions;
  databaseUrl: string;
  cacheDir: string;
  publicDir: string;
  migrationDir: string;
  outputDir: string;
}>;

export type StageResult = Readonly<{
  stagedPages: number;
  stagedNews: number;
  updatedDraftPages: number;
  updatedDraftNews: number;
  normalizedCurrentPages: number;
  normalizedCurrentNews: number;
  optimizedAssets: number;
  optimizedBytes: number;
  localizedDocuments: number;
  reusedAssets: number;
  skippedBrokenAssets: number;
  guardedParentCleanups: number;
  guardedStaleDraftCleanups: number;
  structureFixups: number;
  archiveDateFixups: number;
  reviewedDifferent: number;
  reviewedNativeRoutes: number;
  migrationPath: string;
  manifestPath: string;
}>;
