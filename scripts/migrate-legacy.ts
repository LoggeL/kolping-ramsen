import "dotenv/config";
import path from "node:path";
import {
  captureLegacySource,
  compareLegacyContent,
  fetchLegacyHttp,
  loadMigrationDecisions,
} from "../src/lib/legacy-migration";

type Mode = "capture" | "compare" | "all";

function option(name: string): string | undefined {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`Ungültige positive Ganzzahl: ${value}`);
  return parsed;
}

function flag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const rawMode = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : "all";
  if (!["capture", "compare", "all"].includes(rawMode)) {
    throw new Error("Aufruf: npm run content:migrate -- [capture|compare|all] [--snapshot content/legacy/snapshot.json] [--max-pages 500] [--concurrency 4]");
  }
  const mode = rawMode as Mode;
  const decisionsPath = path.resolve(option("--decisions") ?? "content/legacy-decisions.json");
  const outputDir = path.resolve(option("--output") ?? "content/legacy");
  const cacheDir = path.resolve(option("--cache") ?? ".cache/legacy-migration");
  const decisions = await loadMigrationDecisions(decisionsPath);
  const snapshotOption = option("--snapshot");
  if (snapshotOption && mode !== "compare") {
    throw new Error("--snapshot kann nur im compare-Modus verwendet werden.");
  }
  const snapshotPath = path.resolve(snapshotOption ?? path.join(outputDir, "snapshot.json"));

  if (mode === "capture" || mode === "all") {
    const result = await captureLegacySource(
      {
        origin: decisions.origin,
        outputDir,
        cacheDir,
        decisions,
        maxPages: positiveInteger(option("--max-pages"), 500),
        concurrency: positiveInteger(option("--concurrency"), 4),
        reuseAssets: flag("--reuse-assets"),
      },
      fetchLegacyHttp,
    );
    console.log(`Snapshot ${result.snapshot.digest}`);
    console.log(`${result.snapshot.outcomes.length} HTML-Ausgänge, ${result.snapshot.records.length} Datensätze, ${result.snapshot.assets.length} Assets`);
    console.log(result.snapshotPath);
  }

  if (mode === "compare" || mode === "all") {
    const result = await compareLegacyContent({
      snapshotPath,
      databaseUrl: process.env.MIGRATION_DATABASE_URL ?? "file:./build-dev.db",
      publicDir: path.resolve("public"),
      outputDir,
    });
    console.log(`Comparison ${result.report.digest}`);
    console.log(stableSummary(result.report.summary));
    console.log(result.reportPath);
  }
}

function stableSummary(summary: Record<string, number>): string {
  return Object.entries(summary)
    .map(([label, count]) => `${label}: ${count}`)
    .join("\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
