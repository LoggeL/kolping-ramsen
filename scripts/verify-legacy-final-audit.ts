import path from "node:path";
import { verifyLegacyFinalAudit } from "../src/lib/legacy-migration/internal/verify-final-audit";

function option(name: string): string | undefined {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main(): Promise<void> {
  const result = await verifyLegacyFinalAudit({
    comparisonPath: path.resolve(option("--comparison") ?? "content/legacy-final/comparison.json"),
    resolutionsPath: path.resolve(option("--resolutions") ?? "content/legacy-final/resolutions.json"),
  });
  console.log(
    `Finaler Legacy-Audit verifiziert: ${result.resolved}/${result.required} Routen gelöst, ${result.unresolved} offen (${result.acceptedCurrent} aktuell akzeptiert, ${result.acceptedDraft} Entwürfe, ${result.nativeReplacements} native Ersetzungen).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
