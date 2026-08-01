import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});
turndown.addRule("dropEmpty", {
  filter: (node) => {
    if (!["P", "DIV", "SPAN"].includes(node.nodeName)) return false;
    const txt = (node.textContent ?? "").replace(/\u00a0/g, " ").trim();
    return txt.length === 0 && !node.querySelector("img");
  },
  replacement: () => "",
});
turndown.keep(["table", "thead", "tbody", "tr", "td", "th", "iframe"]);

function toMd(s: string | null | undefined): string {
  if (!s) return "";
  const md = turndown.turndown(s);
  return md.replace(/\n{3,}/g, "\n\n").trim();
}

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

const dataDir = path.join(process.cwd(), "scripts", "seed-data");

type PageRec = {
  slug: string;
  title: string;
  content: string;
  metaDesc?: string;
  coverImage?: string | null;
  sourceUrl?: string;
};
type NewsRec = {
  slug: string;
  title: string;
  date: string;
  teaser: string;
  content: string;
  coverImage?: string | null;
  sourceUrl?: string;
};
type EventRec = {
  slug: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  description: string;
  category?: string;
};

const NAV_TITLES: Record<string, string> = {
  "vereinsbereiche/jugendgruppe": "Jugendgruppe",
  "vereinsbereiche/familienkreis": "Familienkreis",
  "vereinsbereiche/zeltlager": "Zeltlager",
  "vereinsbereiche/kolpingskapelle": "Kolpingskapelle",
  "vereinsbereiche/vorstandschaft": "Vorstandschaft",
  "ueber-uns/kolpingsfamilie-ramsen": "Kolpingsfamilie Ramsen",
  "ueber-uns/pfarrheim": "Pfarrheim",
  "ueber-uns/vereinsdaten": "Vereinsdaten",
  "ueber-uns/adolf-kolping": "Adolf Kolping",
  "rueckblick/jahresprogramm": "Jahresprogramm",
  "rueckblick/jugendaktivitaeten": "Jugendaktivitäten",
  "rueckblick/prunksitzung": "Prunksitzung",
  "rueckblick/familienkreis": "Familienkreis",
  "rueckblick/presse": "Presse",
  "rueckblick/ehrungen": "Ehrungen",
  "rueckblick/staedtereisen": "Städtereisen",
  "rueckblick/reisen": "Reisen",
  "rueckblick/trachtengruppe": "Trachtengruppe",
  "theater": "Theater",
  "mitglied-werden": "Mitglied werden",
  "impressum": "Impressum",
  "datenschutz": "Datenschutz",
};

const SKIP_PAGE_SLUGS = new Set(["", "home", "kontakt", "gaestebuch"]);

function readJson<T>(file: string): T[] {
  const p = path.join(dataDir, file);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8")) as T[];
}

function metaDescFrom(html: string, explicit?: string): string | null {
  if (explicit && explicit.trim().length > 0) return explicit.slice(0, 240);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 0 ? text.slice(0, 240) : null;
}

async function ensureAdmin() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@kolping-ramsen.de";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });
  if (existingAdmin) return existingAdmin;

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 14) {
    throw new Error(
      "SEED_ADMIN_PASSWORD (at least 14 characters) is required when creating the initial admin user.",
    );
  }

  return prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      name: "Administrator",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "admin",
    },
  });
}

async function seedPages(authorId: string) {
  const pageFiles = [
    "vereinsbereiche.json",
    "ueber-uns.json",
    "rueckblick.json",
    "static.json",
  ];
  const all: PageRec[] = pageFiles.flatMap((f) => readJson<PageRec>(f));

  let ok = 0, skip = 0;
  for (const rec of all) {
    const slug = rec.slug ?? "";
    if (SKIP_PAGE_SLUGS.has(slug)) { skip++; continue; }
    const title = NAV_TITLES[slug] ?? rec.title ?? slug;
    const metaDesc = metaDescFrom(rec.content, rec.metaDesc);
    const contentMd = toMd(rec.content);

    await prisma.page.upsert({
      where: { slug },
      update: {
        title,
        content: contentMd,
        metaDesc: metaDesc ?? undefined,
        published: true,
      },
      create: {
        slug,
        title,
        content: contentMd,
        metaDesc: metaDesc ?? undefined,
        published: true,
        authorId,
      },
    });

    if (rec.sourceUrl) {
      try {
        const src = new URL(rec.sourceUrl);
        const fromPath = src.pathname + src.search;
        await prisma.redirect.upsert({
          where: { fromPath },
          update: { toPath: "/" + slug },
          create: { fromPath, toPath: "/" + slug },
        });
      } catch { /* ignore bad URLs */ }
    }
    ok++;
  }
  console.log(`Pages: ${ok} upserted, ${skip} skipped (reserved routes)`);
}

async function seedNews(authorId: string) {
  const items = readJson<NewsRec>("news.json");
  let ok = 0;
  for (const rec of items) {
    const date = new Date(rec.date);
    if (isNaN(date.getTime())) continue;
    const contentMd = toMd(rec.content);
    await prisma.news.upsert({
      where: { slug: rec.slug },
      update: {
        title: rec.title,
        date,
        teaser: rec.teaser,
        content: contentMd,
        coverImage: rec.coverImage ?? null,
        published: true,
      },
      create: {
        slug: rec.slug,
        title: rec.title,
        date,
        teaser: rec.teaser,
        content: contentMd,
        coverImage: rec.coverImage ?? null,
        published: true,
        authorId,
      },
    });
    ok++;
  }
  console.log(`News: ${ok} upserted`);
}

async function seedEvents(authorId: string) {
  const items = readJson<EventRec>("events.json");
  let ok = 0;
  for (const rec of items) {
    const start = new Date(rec.startDate);
    if (isNaN(start.getTime())) continue;
    const end = rec.endDate ? new Date(rec.endDate) : null;
    await prisma.event.upsert({
      where: { slug: rec.slug },
      update: {
        title: rec.title,
        startDate: start,
        endDate: end,
        location: rec.location ?? null,
        description: rec.description,
        category: rec.category ?? "alle",
        published: true,
      },
      create: {
        slug: rec.slug,
        title: rec.title,
        startDate: start,
        endDate: end,
        location: rec.location ?? null,
        description: rec.description,
        category: rec.category ?? "alle",
        published: true,
        authorId,
      },
    });
    ok++;
  }
  console.log(`Events: ${ok} upserted`);
}

async function cleanupStaleDrafts() {
  // Earlier scrape.ts seeded many draft pages with different slugs
  // (e.g. rueckblick/jahresprogramm/ebiketour-im-september). They're not
  // linked from the new nav. Leave drafts in place so the admin can review,
  // but mark anything still at published=false with a clear note.
  const drafts = await prisma.page.count({ where: { published: false } });
  console.log(`Drafts remaining (from old scrape): ${drafts}`);
}

async function main() {
  const admin = await ensureAdmin();
  console.log(`Admin: ${admin.email}`);
  await seedPages(admin.id);
  await seedNews(admin.id);
  await seedEvents(admin.id);
  await cleanupStaleDrafts();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
