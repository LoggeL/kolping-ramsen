import "dotenv/config";
import path from "node:path";
import { verifyLegacyReconciliation } from "../src/lib/legacy-migration/internal/verify-reconciliation";

function option(name: string): string | undefined {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const result = await verifyLegacyReconciliation({
    manifestPath: path.resolve(option("--manifest") ?? "content/legacy/reconciliation-manifest.json"),
    databaseUrl: option("--database") ?? process.env.MIGRATION_DATABASE_URL ?? "file:./build-dev.db",
  });
  console.log(
    `Legacy-Reconciliation verifiziert: ${result.contentUpdates} Inhalte, ${result.eventUpdates} Termine, ${result.metadataUpdates} Metadaten, ${result.revisions} Revisionen.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
