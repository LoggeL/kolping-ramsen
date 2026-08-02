import "dotenv/config";
import path from "node:path";
import { loadMigrationDecisions, stageLegacyContent } from "../src/lib/legacy-migration";

function option(name: string): string | undefined {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const approvedSnapshotDigest = option("--approve");
  const approvedComparisonDigest = option("--approve-comparison");
  if (!approvedSnapshotDigest || !approvedComparisonDigest) {
    throw new Error("Staging benötigt beide geprüften Digests: --approve sha256:… --approve-comparison sha256:…");
  }
  const outputDir = path.resolve(option("--output") ?? "content/legacy");
  const decisions = await loadMigrationDecisions(path.resolve(option("--decisions") ?? "content/legacy-decisions.json"));
  const result = await stageLegacyContent({
    snapshotPath: path.join(outputDir, "snapshot.json"),
    comparisonPath: path.join(outputDir, "comparison.json"),
    approvedSnapshotDigest,
    approvedComparisonDigest,
    decisions,
    databaseUrl: process.env.MIGRATION_DATABASE_URL ?? "file:./build-dev.db",
    cacheDir: path.resolve(option("--cache") ?? ".cache/legacy-migration"),
    publicDir: path.resolve("public"),
    migrationDir: path.resolve(option("--migration") ?? "prisma/migrations/20260801200000_legacy_content_reconciliation"),
    outputDir,
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
