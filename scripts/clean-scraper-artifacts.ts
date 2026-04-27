import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

function strip(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    // Joomla article metadata block
    if (/^Details$/.test(t)) continue;
    if (/^Geschrieben von:/i.test(t)) continue;
    if (/^Veröffentlicht:/i.test(t)) continue;
    if (/^Zugriffe:\s*\d+/i.test(t)) continue;
    // "Seite 1 von N" pagination
    if (/^Seite\s+\d+\s+von\s+\d+/i.test(t)) continue;
    // bare numbered list of /index.php/... links (Joomla child-article pager)
    if (/^\d+\.\s*\[[^\]]+\]\(\/index\.php\//i.test(t)) continue;
    out.push(raw);
  }
  let s = out.join("\n");

  // Rewrite /index.php/... → /... everywhere (internal links + image-alt refs)
  s = s.replace(/\]\(\/index\.php\//g, "](/");

  // Trim leading/trailing blank lines
  s = s.replace(/^\s+|\s+$/g, "");

  // Collapse 3+ blank lines again (strip may have created them)
  s = s.replace(/\n{3,}/g, "\n\n");

  return s + "\n";
}

async function main() {
  const pages = await prisma.page.findMany({
    select: { id: true, slug: true, title: true, content: true },
  });
  let updated = 0;
  for (const p of pages) {
    const next = strip(p.content ?? "");
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
