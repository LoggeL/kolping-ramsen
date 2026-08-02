export { loadMigrationDecisions, parseMigrationDecisions } from "./config";
export { fetchLegacyHttp } from "./fetch-adapter";
export { captureLegacySource, CrawlIncompleteError } from "./internal/capture";
export { compareLegacyContent } from "./internal/compare";
export { stageLegacyContent } from "./internal/stage";
export type {
  AssetComparison,
  CaptureOptions,
  CaptureResult,
  CompareOptions,
  CompareResult,
  ComparisonReport,
  ContentKind,
  CurrentNormalizationDecision,
  DraftUpdateDecision,
  LegacyAsset,
  LegacyHttp,
  LegacyHttpResponse,
  LegacyRecord,
  LegacySnapshot,
  MigrationDecisions,
  RouteComparison,
  SourceOutcome,
  StageOptions,
  StageResult,
} from "./types";
