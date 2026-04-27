import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

async function main() {
  const pages = await prisma.page.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      published: true,
    },
    orderBy: { slug: "asc" },
  });

  type Issue = {
    id: string;
    slug: string;
    title: string;
    len: number;
    reasons: string[];
    published: boolean;
  };
  const issues: Issue[] = [];

  for (const p of pages) {
    const reasons: string[] = [];
    const c = p.content ?? "";
    const t = p.title ?? "";

    if (/<\/?(p|div|span|strong|em|br|table|thead|tbody|tr|td|th|ul|ol|li|img|a|h[1-6]|figure|figcaption|blockquote|center|font|iframe|section|article)\b/i.test(c)) reasons.push("html-tags");
    if (/&(nbsp|amp|lt|gt|quot|ouml|auml|uuml|szlig|Ouml|Auml|Uuml|ndash|mdash|laquo|raquo|rsquo|lsquo|hellip|#\d+);/.test(c)) reasons.push("entities");
    if (/\{(loadmodule|loadposition|gallery|K2|tag)/i.test(c)) reasons.push("joomla");
    if (/\]\(\s*\)/.test(c)) reasons.push("empty-link");
    if (/!\[\]\(\s*\)/.test(c)) reasons.push("empty-image");
    if (/style="/.test(c)) reasons.push("inline-style");
    if (c.trim().length < 20) reasons.push("very-short");
    if (/\\\*|\\\_|\\\|/.test(c)) reasons.push("escaped-md");
    if (/!\[[^\]]*<[^>]+>[^\]]*\]/.test(c)) reasons.push("html-in-alt");

    // Title looks like body content (punctuation ending, over 60 chars, starts with year/weekday/source)
    if (t.length > 70) reasons.push("long-title");
    if (/^(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Am\s|Rheinpfalz|Begründung)/i.test(t)) reasons.push("body-as-title");
    if (/:\s*$/.test(t)) reasons.push("title-ends-colon");

    if (reasons.length > 0) {
      issues.push({
        id: p.id,
        slug: p.slug,
        title: t,
        len: c.length,
        reasons,
        published: p.published,
      });
    }
  }

  console.log(`Total pages: ${pages.length}`);
  console.log(`Pages with issues: ${issues.length}\n`);
  for (const i of issues) {
    console.log(`- [${i.slug}] (${i.len}b) ${i.reasons.join(",")}${i.published ? "" : " [draft]"}\n  :: ${i.title}`);
  }
}

main().finally(() => prisma.$disconnect());
