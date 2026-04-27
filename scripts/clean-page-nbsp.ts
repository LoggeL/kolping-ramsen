import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

function clean(md: string): string {
  return md
    // nbsp → normal space
    .replace(/\u00a0/g, " ")
    // zero-width / BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Windows-1252 controls
    .replace(/[\u0080-\u009f]/g, "")
    // trailing whitespace on lines
    .replace(/[ \t]+\n/g, "\n")
    // Collapse 3+ blank lines into 2
    .replace(/\n{3,}/g, "\n\n");
}

async function main() {
  const pages = await prisma.page.findMany({
    select: { id: true, slug: true, content: true },
  });
  let updated = 0;
  for (const p of pages) {
    const next = clean(p.content ?? "");
    if (next !== p.content) {
      await prisma.page.update({
        where: { id: p.id },
        data: { content: next },
      });
      updated++;
      console.log(`cleaned ${p.slug}`);
    }
  }
  console.log(`\nupdated ${updated} / ${pages.length}`);
}

main().finally(() => prisma.$disconnect());
