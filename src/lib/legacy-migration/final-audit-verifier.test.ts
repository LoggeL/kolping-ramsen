import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { sha256, stableJson } from "./internal/stable";
import { verifyLegacyFinalAudit } from "./internal/verify-final-audit";

function seal<T extends Record<string, unknown>>(value: T): T & { digest: `sha256:${string}` } {
  return { ...value, digest: sha256(stableJson(value)) };
}

test("verifies a sealed final comparison against an exact fail-closed resolution ledger", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-final-audit-"));
  try {
    const snapshotDigest = sha256("snapshot");
    const comparisonPath = path.join(root, "comparison.json");
    const resolutionsPath = path.join(root, "resolutions.json");
    const comparisonWithoutDigest = {
      schemaVersion: 1,
      snapshotDigest,
      summary: {
        failedUrls: 0,
        sourceRecords: 3,
        equivalent: 1,
        different: 1,
        missingCurrent: 0,
        nativeReview: 1,
      },
      routes: [
        { sourceKey: "route:equivalent", targetPath: "/gleich", status: "equivalent" },
        { sourceKey: "route:different", targetPath: "/abweichend", status: "different" },
        { sourceKey: "route:native", targetPath: "/kontakt", status: "native-review" },
      ],
      findings: [{ severity: "warning", owner: "/kontakt", message: "Native Route redaktionell geprüft." }],
    } as const;
    const comparison = seal(comparisonWithoutDigest);
    const ledgerWithoutDigest = {
      schemaVersion: 1,
      snapshotDigest,
      comparisonDigest: comparison.digest,
      resolutions: [
        {
          sourceKey: "route:different",
          targetPath: "/abweichend",
          status: "different",
          resolution: "accepted-current",
          reason: "Aktueller Inhalt ist redaktionell belegt.",
        },
        {
          sourceKey: "route:native",
          targetPath: "/kontakt",
          status: "native-review",
          resolution: "native-replacement",
          reason: "Die native Kontaktansicht ersetzt den Altinhalt vollständig.",
        },
      ],
    } as const;
    const ledger = seal(ledgerWithoutDigest);
    await writeFile(comparisonPath, stableJson(comparison));
    await writeFile(resolutionsPath, stableJson(ledger));

    const options = { comparisonPath, resolutionsPath };
    assert.deepEqual(await verifyLegacyFinalAudit(options), {
      comparisonDigest: comparison.digest,
      ledgerDigest: ledger.digest,
      required: 2,
      resolved: 2,
      unresolved: 0,
      acceptedCurrent: 1,
      acceptedDraft: 0,
      nativeReplacements: 1,
    });

    await writeFile(comparisonPath, stableJson({ ...comparison, routes: comparison.routes.slice(0, 2) }));
    await assert.rejects(verifyLegacyFinalAudit(options), /Finaler Vergleich-Digest ist ungültig/u);
    await writeFile(comparisonPath, stableJson(comparison));

    const incompleteLedger = seal({ ...ledgerWithoutDigest, resolutions: ledgerWithoutDigest.resolutions.slice(0, 1) });
    await writeFile(resolutionsPath, stableJson(incompleteLedger));
    await assert.rejects(verifyLegacyFinalAudit(options), /Fehlend: route:native/u);

    const incompatibleLedger = seal({
      ...ledgerWithoutDigest,
      resolutions: ledgerWithoutDigest.resolutions.map((entry) =>
        entry.sourceKey === "route:native" ? { ...entry, resolution: "accepted-current" as const } : entry),
    });
    await writeFile(resolutionsPath, stableJson(incompatibleLedger));
    await assert.rejects(verifyLegacyFinalAudit(options), /accepted-current nicht zulässig für native-review/u);

    const comparisonWithError = seal({
      ...comparisonWithoutDigest,
      findings: [{ severity: "error" as const, owner: "/abweichend", message: "Ungeklärter Fehler." }],
    });
    const anchoredLedger = seal({ ...ledgerWithoutDigest, comparisonDigest: comparisonWithError.digest });
    await writeFile(comparisonPath, stableJson(comparisonWithError));
    await writeFile(resolutionsPath, stableJson(anchoredLedger));
    await assert.rejects(verifyLegacyFinalAudit(options), /Error-Findings/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
