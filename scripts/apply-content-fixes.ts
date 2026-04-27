import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

function parseFrontmatter(src: string): {
  meta: Record<string, string>;
  body: string;
} {
  if (!src.startsWith("---")) return { meta: {}, body: src };
  const end = src.indexOf("\n---", 3);
  if (end < 0) return { meta: {}, body: src };
  const head = src.slice(3, end).trim();
  const body = src.slice(end + 4).replace(/^\s*\n/, "");
  const meta: Record<string, string> = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  return { meta, body };
}

async function main() {
  const dir = path.resolve("scripts/content-fixes");
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".fixed.md"));
  if (files.length === 0) {
    console.log("no .fixed.md files to apply");
    return;
  }
  for (const f of files) {
    const full = path.join(dir, f);
    const src = await fs.readFile(full, "utf8");
    const { meta, body } = parseFrontmatter(src);
    if (!meta.slug) {
      console.log(`skip ${f}: no slug in frontmatter`);
      continue;
    }
    const data: Record<string, string | null> = { content: body.trimEnd() + "\n" };
    if (meta.title) data.title = meta.title;
    if (meta.metaTitle !== undefined) data.metaTitle = meta.metaTitle || null;
    if (meta.metaDesc !== undefined) data.metaDesc = meta.metaDesc || null;
    await prisma.page.update({
      where: { slug: meta.slug },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
    console.log(`updated ${meta.slug} from ${f}`);
  }
}

main().finally(() => prisma.$disconnect());
