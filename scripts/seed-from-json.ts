import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import TurndownService from "turndown";
import {
  EVENT_TIME_ZONE,
  inferEventCategory,
  inferEventTime,
  parseCivilDate,
  type EventCategory,
} from "../src/lib/event-time";
import { legacySourceRedirectPath } from "../src/lib/legacy-routing";

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

function repairKnownLegacyPageHtml(slug: string, source: string): string {
  let repaired = source.replace(
    /(<img\b[^>]*Engagementpreis_Verleihung_02a\.png[^>]*>)0(?=<\/p>)/giu,
    "$1",
  );
  if (slug === "vereinsbereiche/vorstandschaft") {
    repaired = repaired.replace(
      /<p[^>]*>\s*<span[^>]*>Jonas Berst, Email:[\s\S]*?<\/p>/iu,
      "<p>Jonas Berst &amp; Nele Rörig – Kontakt über kolping-ramsen(at)gmx.de</p>",
    );
  }
  return repaired;
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
  published?: boolean;
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
  startTime?: string | null;
  endTime?: string | null;
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
    const sourceHtml = repairKnownLegacyPageHtml(slug, rec.content);
    const metaDesc = metaDescFrom(sourceHtml, rec.metaDesc);
    const contentMd = toMd(sourceHtml);

    await prisma.page.upsert({
      where: { slug },
      // The database becomes the editorial source of truth after import.
      // Re-running the seed must never overwrite later CMS changes.
      update: {},
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
      const fromPath = legacySourceRedirectPath(rec.sourceUrl);
      if (fromPath) {
        await prisma.redirect.upsert({
          where: { fromPath },
          update: {},
          create: { fromPath, toPath: "/" + slug },
        });
      }
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
      // The database becomes the editorial source of truth after import.
      // Re-running the seed must never overwrite later CMS changes.
      update: {},
      create: {
        slug: rec.slug,
        title: rec.title,
        date,
        teaser: rec.teaser,
        content: contentMd,
        coverImage: rec.coverImage ?? null,
        published: rec.published ?? true,
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
    let start: Date;
    let end: Date | null;
    try {
      start = parseCivilDate(rec.startDate);
      end = rec.endDate ? parseCivilDate(rec.endDate) : null;
    } catch {
      continue;
    }
    const inferredTime = inferEventTime(rec.description);
    const startTime = rec.startTime ?? inferredTime.startTime;
    const endTime = rec.endTime ?? inferredTime.endTime;
    const category = rec.category && rec.category !== "alle"
      ? rec.category as EventCategory
      : inferEventCategory(rec.title, rec.description);
    const published = !rec.description.includes("?????");
    await prisma.event.upsert({
      where: { slug: rec.slug },
      // The database becomes the editorial source of truth after import.
      // Re-running the seed must never overwrite later CMS changes.
      update: {},
      create: {
        slug: rec.slug,
        title: rec.title,
        startDate: start,
        endDate: end,
        startTime,
        endTime,
        allDay: startTime === null,
        timeZone: EVENT_TIME_ZONE,
        location: rec.location ?? null,
        description: rec.description,
        category,
        published,
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
