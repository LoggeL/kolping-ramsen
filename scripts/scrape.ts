import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as cheerio from "cheerio";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const BASE = "https://kolping-ramsen.de";
const visited = new Set<string>();
const queue: string[] = [`${BASE}/index.php`];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}

function cleanUrl(u: string): string {
  try {
    const url = new URL(u, BASE);
    if (url.hostname !== "kolping-ramsen.de") return "";
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

async function fetchPage(url: string): Promise<string | null> {
  if (/\.(pdf|jpg|jpeg|png|gif|webp|zip|docx?|xlsx?)$/i.test(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 KolpingMigration/1.0" },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    return await res.text();
  } catch (e) {
    console.warn(`✗ ${url}: ${(e as Error).message}`);
    return null;
  }
}

type Extracted = {
  title: string;
  contentHtml: string;
  text: string;
  links: string[];
};

function extract(html: string): Extracted {
  const $ = cheerio.load(html);

  // Joomla Cassiopeia: main content is usually inside <main> or .item-page
  const mainCandidates = [
    "main .item-page",
    ".item-page",
    "main article",
    "main",
    "#content",
  ];
  let contentEl = $("body");
  for (const sel of mainCandidates) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 50) {
      contentEl = el;
      break;
    }
  }

  // Strip nav, breadcrumbs, scripts, comments-form
  contentEl.find("script, style, nav, .breadcrumb, form, .pagenavigation, .item-pagenav").remove();

  const title =
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*-\s*Kolping.*$/i, "").trim() ||
    "Untitled";

  const contentHtml = contentEl.html()?.trim() ?? "";
  const text = contentEl.text().replace(/\s+/g, " ").trim();

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = cleanUrl($(el).attr("href") ?? "");
    if (href) links.push(href);
  });

  return { title, contentHtml, text, links };
}

function urlToPath(u: string): string {
  const url = new URL(u);
  let path = url.pathname.replace(/^\/+|\/+$/g, "");
  // Joomla URL like /index.php?option=...
  if (path === "index.php") {
    const params = url.searchParams;
    const view = params.get("view") || params.get("option") || "home";
    const id = params.get("id") || params.get("Itemid") || "";
    path = `${view}${id ? `-${id}` : ""}`;
  }
  // /index.php/pfad/zur/seite → pfad/zur/seite
  path = path.replace(/^index\.php\/?/i, "");
  // /component/content/article/foo → foo
  path = path.replace(/^component\/content\/article\//i, "");
  if (!path) return "home";
  // Slugify each segment, keep slashes
  return path
    .split("/")
    .map((seg) => slugify(seg))
    .filter(Boolean)
    .join("/") || "home";
}

async function run() {
  let processed = 0;
  const MAX = 80;

  while (queue.length > 0 && processed < MAX) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`→ ${url}`);
    const html = await fetchPage(url);
    if (!html) continue;
    processed++;

    const { title, contentHtml, text, links } = extract(html);
    if (text.length < 50) {
      console.log(`  (skip: too little content)`);
    } else {
      const slug = urlToPath(url);
      try {
        await prisma.page.upsert({
          where: { slug },
          update: {
            title,
            content: contentHtml,
          },
          create: {
            slug,
            title,
            content: contentHtml,
            published: false,
          },
        });

        await prisma.redirect.upsert({
          where: { fromPath: new URL(url).pathname + new URL(url).search },
          update: { toPath: `/${slug}` },
          create: { fromPath: new URL(url).pathname + new URL(url).search, toPath: `/${slug}` },
        });

        console.log(`  ✓ saved as /${slug}`);
      } catch (e) {
        console.warn(`  ✗ db error: ${(e as Error).message}`);
      }
    }

    for (const link of links) {
      if (!visited.has(link) && !queue.includes(link)) queue.push(link);
    }
  }

  console.log(`\nDone. Processed ${processed} pages.`);
  console.log("Pages were imported as DRAFTS — review and publish via /admin/pages.");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
