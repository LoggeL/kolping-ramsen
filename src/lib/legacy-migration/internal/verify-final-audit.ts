import { readFile } from "node:fs/promises";
import { z } from "zod";
import { sha256, stableJson } from "./stable";

const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/u);
const comparisonStatusSchema = z.enum([
  "equivalent",
  "different",
  "missing-current",
  "native-review",
  "ambiguous-target",
]);

const comparisonSchema = z.object({
  schemaVersion: z.literal(1),
  digest: digestSchema,
  snapshotDigest: digestSchema,
  summary: z.object({
    failedUrls: z.number().int().nonnegative(),
    sourceRecords: z.number().int().nonnegative(),
    equivalent: z.number().int().nonnegative(),
    different: z.number().int().nonnegative(),
    missingCurrent: z.number().int().nonnegative(),
    nativeReview: z.number().int().nonnegative(),
  }).passthrough(),
  routes: z.array(z.object({
    sourceKey: z.string().min(1),
    targetPath: z.string().startsWith("/"),
    status: comparisonStatusSchema,
  }).passthrough()),
  findings: z.array(z.object({
    severity: z.enum(["info", "warning", "error"]),
    owner: z.string(),
    message: z.string(),
  }).passthrough()),
}).passthrough();

const resolutionSchema = z.object({
  sourceKey: z.string().min(1),
  targetPath: z.string().startsWith("/"),
  status: z.enum(["different", "native-review"]),
  resolution: z.enum(["accepted-current", "accepted-draft", "native-replacement"]),
  reason: z.string().min(3),
}).strict();

const ledgerSchema = z.object({
  schemaVersion: z.literal(1),
  snapshotDigest: digestSchema,
  comparisonDigest: digestSchema,
  resolutions: z.array(resolutionSchema),
  digest: digestSchema,
}).strict();

type FinalComparison = z.infer<typeof comparisonSchema>;
type FinalLedger = z.infer<typeof ledgerSchema>;
type FinalResolution = FinalLedger["resolutions"][number];

export type FinalAuditVerificationOptions = Readonly<{
  comparisonPath: string;
  resolutionsPath: string;
}>;

export type FinalAuditVerificationResult = Readonly<{
  comparisonDigest: string;
  ledgerDigest: string;
  required: number;
  resolved: number;
  unresolved: 0;
  acceptedCurrent: number;
  acceptedDraft: number;
  nativeReplacements: number;
}>;

function verifySealedValue(value: Record<string, unknown>, label: string): void {
  const digest = value.digest;
  if (typeof digest !== "string") throw new Error(`${label} besitzt keinen Digest.`);
  const { digest: _digest, ...withoutDigest } = value;
  const actual = sha256(stableJson(withoutDigest));
  if (actual !== digest) throw new Error(`${label}-Digest ist ungültig: ${actual} statt ${digest}.`);
}

async function readInputs(options: FinalAuditVerificationOptions): Promise<{
  comparison: FinalComparison;
  ledger: FinalLedger;
}> {
  const rawComparison = JSON.parse(await readFile(options.comparisonPath, "utf8")) as unknown;
  if (!rawComparison || typeof rawComparison !== "object" || Array.isArray(rawComparison)) {
    throw new Error("Finaler Vergleich ist kein Objekt.");
  }
  verifySealedValue(rawComparison as Record<string, unknown>, "Finaler Vergleich");
  const comparison = comparisonSchema.parse(rawComparison);

  const rawLedger = JSON.parse(await readFile(options.resolutionsPath, "utf8")) as unknown;
  if (!rawLedger || typeof rawLedger !== "object" || Array.isArray(rawLedger)) {
    throw new Error("Finales Resolution-Ledger ist kein Objekt.");
  }
  verifySealedValue(rawLedger as Record<string, unknown>, "Resolution-Ledger");
  const ledger = ledgerSchema.parse(rawLedger);
  return { comparison, ledger };
}

function routeKey(value: { sourceKey: string; targetPath: string }): string {
  return `${value.sourceKey}\u0000${value.targetPath}`;
}

function assertComparisonConsistency(comparison: FinalComparison): void {
  const counts = new Map<string, number>();
  for (const route of comparison.routes) counts.set(route.status, (counts.get(route.status) ?? 0) + 1);
  const expectedSummary = {
    sourceRecords: comparison.routes.length,
    equivalent: counts.get("equivalent") ?? 0,
    different: counts.get("different") ?? 0,
    missingCurrent: (counts.get("missing-current") ?? 0) + (counts.get("ambiguous-target") ?? 0),
    nativeReview: counts.get("native-review") ?? 0,
  };
  for (const [field, expected] of Object.entries(expectedSummary) as Array<[keyof typeof expectedSummary, number]>) {
    if (comparison.summary[field] !== expected) {
      throw new Error(`Vergleichssummary ${field}=${comparison.summary[field]} passt nicht zu ${expected} Routen.`);
    }
  }
  if (comparison.summary.failedUrls !== 0) {
    throw new Error(`Finaler Vergleich enthält ${comparison.summary.failedUrls} fehlgeschlagene Quell-URLs.`);
  }
  if (comparison.summary.missingCurrent !== 0) {
    throw new Error(`Finaler Vergleich enthält ${comparison.summary.missingCurrent} fehlende aktuelle Ziele.`);
  }
  const ambiguous = comparison.routes.filter((route) => route.status === "ambiguous-target");
  if (ambiguous.length > 0) {
    throw new Error(`Finaler Vergleich enthält mehrdeutige Ziele: ${ambiguous.map((route) => route.targetPath).sort().join(", ")}.`);
  }
  const errors = comparison.findings.filter((finding) => finding.severity === "error");
  if (errors.length > 0) {
    throw new Error(`Finaler Vergleich enthält Error-Findings: ${errors.map((finding) => `${finding.owner}: ${finding.message}`).sort().join("; ")}.`);
  }
  const routeKeys = comparison.routes.map(routeKey);
  const duplicateRoutes = routeKeys.filter((key, index) => routeKeys.indexOf(key) !== index);
  if (duplicateRoutes.length > 0) throw new Error("Finaler Vergleich enthält doppelte sourceKey/targetPath-Routen.");
}

function assertLedgerOrder(resolutions: readonly FinalResolution[]): void {
  const expected = [...resolutions].sort((left, right) =>
    (left.sourceKey < right.sourceKey ? -1 : left.sourceKey > right.sourceKey ? 1 : 0)
      || (left.targetPath < right.targetPath ? -1 : left.targetPath > right.targetPath ? 1 : 0));
  const actualKeys = resolutions.map(routeKey);
  const expectedKeys = expected.map(routeKey);
  if (actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error("Resolution-Ledger ist nicht deterministisch nach sourceKey und targetPath sortiert.");
  }
}

function verifyLedger(comparison: FinalComparison, ledger: FinalLedger): FinalAuditVerificationResult {
  if (ledger.snapshotDigest !== comparison.snapshotDigest || ledger.comparisonDigest !== comparison.digest) {
    throw new Error("Resolution-Ledger ist nicht am finalen Snapshot/Comparison-Paar verankert.");
  }
  assertLedgerOrder(ledger.resolutions);
  const duplicateSourceKeys = ledger.resolutions
    .map((resolution) => resolution.sourceKey)
    .filter((sourceKey, index, values) => values.indexOf(sourceKey) !== index);
  if (duplicateSourceKeys.length > 0) {
    throw new Error(`Resolution-Ledger enthält doppelte sourceKeys: ${[...new Set(duplicateSourceKeys)].sort().join(", ")}.`);
  }
  for (const resolution of ledger.resolutions) {
    const compatible = resolution.status === "native-review"
      ? resolution.resolution === "native-replacement"
      : resolution.resolution === "accepted-current" || resolution.resolution === "accepted-draft";
    if (!compatible) {
      throw new Error(`Resolution ${resolution.sourceKey} verwendet ${resolution.resolution} nicht zulässig für ${resolution.status}.`);
    }
  }

  const required = comparison.routes.filter((route) => route.status === "different" || route.status === "native-review");
  const requiredByKey = new Map(required.map((route) => [routeKey(route), route]));
  const resolvedByKey = new Map(ledger.resolutions.map((resolution) => [routeKey(resolution), resolution]));
  const missing = required.filter((route) => !resolvedByKey.has(routeKey(route)));
  const extras = ledger.resolutions.filter((resolution) => !requiredByKey.has(routeKey(resolution)));
  const statusMismatches = required.flatMap((route) => {
    const resolution = resolvedByKey.get(routeKey(route));
    return resolution && resolution.status !== route.status ? [`${route.sourceKey}: ${resolution.status} statt ${route.status}`] : [];
  });
  if (missing.length > 0 || extras.length > 0 || statusMismatches.length > 0) {
    throw new Error([
      "Finales Resolution-Ledger ist nicht vollständig.",
      `Fehlend: ${missing.map((route) => route.sourceKey).sort().join(", ") || "keine"}.`,
      `Zusätzlich: ${extras.map((resolution) => resolution.sourceKey).sort().join(", ") || "keine"}.`,
      `Statusabweichungen: ${statusMismatches.sort().join(", ") || "keine"}.`,
    ].join(" "));
  }
  const unresolved = required.length - ledger.resolutions.length;
  if (unresolved !== 0) throw new Error(`Finales Resolution-Ledger enthält ${unresolved} ungelöste Routen.`);
  return {
    comparisonDigest: comparison.digest,
    ledgerDigest: ledger.digest,
    required: required.length,
    resolved: ledger.resolutions.length,
    unresolved: 0,
    acceptedCurrent: ledger.resolutions.filter((entry) => entry.resolution === "accepted-current").length,
    acceptedDraft: ledger.resolutions.filter((entry) => entry.resolution === "accepted-draft").length,
    nativeReplacements: ledger.resolutions.filter((entry) => entry.resolution === "native-replacement").length,
  };
}

export async function verifyLegacyFinalAudit(
  options: FinalAuditVerificationOptions,
): Promise<FinalAuditVerificationResult> {
  const { comparison, ledger } = await readInputs(options);
  assertComparisonConsistency(comparison);
  return verifyLedger(comparison, ledger);
}
