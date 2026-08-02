import "dotenv/config";
import path from "node:path";
import { stageLegacyReconciliation } from "../src/lib/legacy-migration/internal/reconcile";

function option(name: string): string | undefined {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const outputDir = path.resolve(option("--output") ?? "content/legacy");
  const result = await stageLegacyReconciliation({
    snapshotPath: path.join(outputDir, "snapshot.json"),
    comparisonPath: path.join(outputDir, "comparison.json"),
    decisionsPath: path.resolve(option("--decisions") ?? "content/legacy-reconciliation-decisions.json"),
    resolutionsPath: path.resolve(option("--resolutions") ?? "content/legacy-route-resolutions.json"),
    databaseUrl: process.env.MIGRATION_DATABASE_URL ?? "file:./build-dev.db",
    publicDir: path.resolve("public"),
    migrationDir: path.resolve(option("--migration") ?? "prisma/migrations/20260801210000_legacy_content_followup"),
    manifestPath: path.resolve(option("--manifest") ?? "content/legacy/reconciliation-manifest.json"),
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
