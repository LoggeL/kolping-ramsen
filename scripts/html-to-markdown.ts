import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import TurndownService from "turndown";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

function makeTurndown(): TurndownService {
  const t = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
  });
  // Joomla dumps often have <p>&nbsp;</p> — drop those
  t.addRule("dropEmpty", {
    filter: (node) => {
      if (!["P", "DIV", "SPAN"].includes(node.nodeName)) return false;
      const txt = (node.textContent ?? "").replace(/\u00a0/g, " ").trim();
      return txt.length === 0 && !node.querySelector("img");
    },
    replacement: () => "",
  });
  // Tables — fall back to keeping HTML (Turndown's default doesn't handle them well)
  t.keep(["table", "thead", "tbody", "tr", "td", "th", "iframe"]);
  return t;
}

function looksLikeHtml(s: string): boolean {
  return /<[a-z][^>]*>/i.test(s);
}

async function convertTable(
  table: "page" | "news" | "event",
  field: "content" | "description",
) {
  const t = makeTurndown();
  const rows = await (prisma as any)[table].findMany({ select: { id: true, [field]: true } });
  let converted = 0;
  for (const r of rows) {
    const raw = r[field] as string | null;
    if (!raw || !looksLikeHtml(raw)) continue;
    const md = t.turndown(raw).replace(/\n{3,}/g, "\n\n").trim();
    await (prisma as any)[table].update({
      where: { id: r.id },
      data: { [field]: md },
    });
    converted++;
  }
  console.log(`${table}.${field}: converted ${converted}/${rows.length}`);
}

async function convertNewsTeasers() {
  const t = makeTurndown();
  const rows = await prisma.news.findMany({ select: { id: true, teaser: true } });
  let converted = 0;
  for (const r of rows) {
    if (!looksLikeHtml(r.teaser)) continue;
    const md = t.turndown(r.teaser).replace(/\n+/g, " ").trim();
    await prisma.news.update({ where: { id: r.id }, data: { teaser: md } });
    converted++;
  }
  console.log(`news.teaser: converted ${converted}/${rows.length}`);
}

async function main() {
  await convertTable("page", "content");
  await convertTable("news", "content");
  await convertNewsTeasers();
  await convertTable("event", "description");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
