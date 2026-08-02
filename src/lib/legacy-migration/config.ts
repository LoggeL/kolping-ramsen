import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { MigrationDecisions } from "./types";

const routeSchema = z.object({
  sourcePath: z.string().startsWith("/"),
  targetPath: z.string().startsWith("/"),
  kind: z.enum(["page", "news", "event"]),
  collection: z.boolean().optional(),
  title: z.string().trim().min(3).optional(),
}).strict();

const recordOverrideSchema = z.object({
  sourcePath: z.string().startsWith("/"),
  sourceAliases: z.array(z.string().startsWith("/")).min(1).optional(),
  publishedDate: z.iso.date(),
  detectedTitle: z.string().trim().min(1),
  title: z.string().trim().min(3),
  targetPath: z.string().startsWith("/"),
  reason: z.string().min(3),
}).strict();

const recordExcludeSchema = z.object({
  sourcePath: z.string().startsWith("/"),
  sourceAliases: z.array(z.string().startsWith("/")).min(1).optional(),
  publishedDate: z.iso.date(),
  detectedTitle: z.string().trim().min(1),
  sourceFingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/u),
  expectedAssetStates: z.array(z.object({
    sourceUrl: z.url().refine((value) => value.startsWith("https://"), "Asset-URL muss HTTPS verwenden."),
    status: z.literal("failed"),
    reason: z.string().min(3),
  }).strict()).min(1),
  reason: z.string().min(3),
}).strict();

const editorialRedirectSchema = z.object({
  fromPath: z.string().startsWith("/"),
  targetPath: z.string().startsWith("/"),
  reason: z.string().min(3),
}).strict().refine((value) => value.fromPath !== value.targetPath, {
  message: "Redirect-Quelle und -Ziel müssen verschieden sein.",
});

const excludeSchema = z.object({
  pattern: z.string().min(1),
  reason: z.string().min(3),
}).strict();

const targetPrefixSchema = z.string()
  .startsWith("/")
  .refine((value) => value === "/" || !value.endsWith("/"), "Zielpräfix darf nicht mit / enden.");

const canonicalTargetSchema = z.object({
  targetPrefixes: z.array(targetPrefixSchema).min(2),
  preferTargetPrefix: targetPrefixSchema,
  reason: z.string().min(3),
}).strict().refine(
  (value) => value.targetPrefixes.includes(value.preferTargetPrefix),
  { message: "preferTargetPrefix muss in targetPrefixes enthalten sein.", path: ["preferTargetPrefix"] },
);

const draftUpdateSchema = z.object({
  targetPath: z.string().startsWith("/"),
  kind: z.enum(["page", "news"]),
  publish: z.literal(true),
  reason: z.string().min(3),
  title: z.string().trim().min(3).optional(),
}).strict();

const currentNormalizationSchema = z.object({
  targetPath: z.string().startsWith("/"),
  kind: z.enum(["page", "news"]),
  reason: z.string().min(3),
  format: z.enum(["default", "travel-history", "legal-outline"]).optional(),
}).strict();

const decisionsSchema = z.object({
  schemaVersion: z.literal(1),
  origin: z.url().refine((value) => value.startsWith("https://"), "Origin muss HTTPS verwenden."),
  routes: z.array(routeSchema),
  recordOverrides: z.array(recordOverrideSchema).optional(),
  recordExcludes: z.array(recordExcludeSchema).optional(),
  redirects: z.array(editorialRedirectSchema).optional(),
  canonicalTargets: z.array(canonicalTargetSchema).optional(),
  draftUpdates: z.array(draftUpdateSchema).optional(),
  currentNormalizations: z.array(currentNormalizationSchema).optional(),
  excludes: z.array(excludeSchema),
}).strict();

export function parseMigrationDecisions(value: unknown): MigrationDecisions {
  const parsed = decisionsSchema.parse(value) as MigrationDecisions;
  const duplicates = parsed.routes
    .map((route) => route.sourcePath)
    .filter((sourcePath, index, values) => values.indexOf(sourcePath) !== index);
  if (duplicates.length) throw new Error(`Doppelte sourcePath-Einträge: ${[...new Set(duplicates)].join(", ")}`);
  const duplicateRecordOverrides = (parsed.recordOverrides ?? [])
    .map((decision) => `${decision.publishedDate}\0${decision.detectedTitle}`)
    .filter((key, index, values) => values.indexOf(key) !== index);
  if (duplicateRecordOverrides.length) {
    throw new Error(`Doppelte recordOverrides: ${[...new Set(duplicateRecordOverrides)].join(", ")}`);
  }
  for (const decision of parsed.recordOverrides ?? []) {
    const sourcePaths = [decision.sourcePath, ...(decision.sourceAliases ?? [])];
    if (new Set(sourcePaths).size !== sourcePaths.length) throw new Error(`Doppelte Record-Override-Quellen: ${sourcePaths.join(", ")}`);
  }
  const duplicateRecordExcludes = (parsed.recordExcludes ?? [])
    .map((decision) => `${decision.publishedDate}\0${decision.detectedTitle}`)
    .filter((key, index, values) => values.indexOf(key) !== index);
  if (duplicateRecordExcludes.length) {
    throw new Error(`Doppelte recordExcludes: ${[...new Set(duplicateRecordExcludes)].join(", ")}`);
  }
  for (const decision of parsed.recordExcludes ?? []) {
    const sourcePaths = [decision.sourcePath, ...(decision.sourceAliases ?? [])];
    if (new Set(sourcePaths).size !== sourcePaths.length) throw new Error(`Doppelte Record-Exclude-Quellen: ${sourcePaths.join(", ")}`);
    const assetUrls = decision.expectedAssetStates.map((asset) => asset.sourceUrl);
    if (new Set(assetUrls).size !== assetUrls.length) throw new Error(`Doppelte erwartete Exclude-Assets: ${assetUrls.join(", ")}`);
  }
  const duplicateRedirects = (parsed.redirects ?? [])
    .map((redirect) => redirect.fromPath)
    .filter((fromPath, index, values) => values.indexOf(fromPath) !== index);
  if (duplicateRedirects.length) throw new Error(`Doppelte Redirect-Quellen: ${[...new Set(duplicateRedirects)].join(", ")}`);
  for (const decision of parsed.canonicalTargets ?? []) {
    const duplicatePrefixes = decision.targetPrefixes.filter((prefix, index, values) => values.indexOf(prefix) !== index);
    if (duplicatePrefixes.length) {
      throw new Error(`Doppelte targetPrefixes: ${[...new Set(duplicatePrefixes)].join(", ")}`);
    }
  }
  const duplicateDraftTargets = (parsed.draftUpdates ?? [])
    .map((decision) => `${decision.kind}:${decision.targetPath}`)
    .filter((target, index, values) => values.indexOf(target) !== index);
  if (duplicateDraftTargets.length) {
    throw new Error(`Doppelte draftUpdates: ${[...new Set(duplicateDraftTargets)].join(", ")}`);
  }
  const duplicateNormalizationTargets = (parsed.currentNormalizations ?? [])
    .map((decision) => `${decision.kind}:${decision.targetPath}`)
    .filter((target, index, values) => values.indexOf(target) !== index);
  if (duplicateNormalizationTargets.length) {
    throw new Error(`Doppelte currentNormalizations: ${[...new Set(duplicateNormalizationTargets)].join(", ")}`);
  }
  for (const exclude of parsed.excludes) {
    try {
      new RegExp(exclude.pattern, "u");
    } catch (error) {
      throw new Error(`Ungültiger Exclude-RegExp ${exclude.pattern}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return parsed;
}

export async function loadMigrationDecisions(file: string): Promise<MigrationDecisions> {
  return parseMigrationDecisions(JSON.parse(await readFile(file, "utf8")) as unknown);
}
