import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const SLUGS = [
  "rueckblick/jugend",
  "rueckblick/presse/kreativbuehne-2024",
  "rueckblick/presse/kreativtheater2024-02",
  "rueckblick/prunksitzung/prunksitzung2021",
  "rueckblick/reisen",
  "rueckblick/reisen/rumaenien-2018",
  "ueber-uns/geschichte-pfarrheim",
  "ueber-uns/pfarrheim",
];

async function main() {
  const dir = path.resolve("scripts/content-fixes");
  await fs.mkdir(dir, { recursive: true });
  for (const slug of SLUGS) {
    const p = await prisma.page.findUnique({ where: { slug } });
    if (!p) {
      console.log(`missing: ${slug}`);
      continue;
    }
    const safe = slug.replace(/[\/]/g, "__");
    const front =
      `---\nid: ${p.id}\nslug: ${p.slug}\ntitle: ${p.title}\nmetaTitle: ${p.metaTitle ?? ""}\nmetaDesc: ${p.metaDesc ?? ""}\n---\n\n`;
    await fs.writeFile(path.join(dir, `${safe}.md`), front + (p.content ?? ""), "utf8");
  }
  console.log(`dumped ${SLUGS.length} pages to ${dir}`);
}

main().finally(() => prisma.$disconnect());
