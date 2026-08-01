import "dotenv/config";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { extractLocalAssetUrls } from "../src/lib/media-paths";
import { SITE_SECTIONS, isNativeSitePath } from "../src/lib/site";
import { extractGallerySlugs } from "../src/lib/gallery-token";
import {
  EVENT_CATEGORY_VALUES,
  EVENT_TIME_ZONE,
  civilDateKey,
  isClockTime,
  zonedDateTimeToUtc,
} from "../src/lib/event-time";

const databaseUrl = process.env.DATABASE_URL ?? "file:./build-dev.db";
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: databaseUrl.replace(/^file:/, "") }),
});

type Issue = { owner: string; message: string };

async function walkFiles(directory: string, prefix: string, output: Set<string>) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const absolute = path.join(directory, entry.name);
    const relative = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await walkFiles(absolute, relative, output);
    else if (entry.isFile()) output.add(relative);
  }
}

function assetPath(rawUrl: string): string | null {
  let pathname = rawUrl.split(/[?#]/, 1)[0].replace(/^\/+/, "");
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (
    !pathname ||
    pathname.includes("\0") ||
    pathname.split("/").some((segment) => segment === "." || segment === "..")
  ) return null;
  return pathname;
}

function textLength(content: string): number {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_>`|\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

async function main() {
  const knownFiles = new Set<string>();
  await walkFiles(path.join(process.cwd(), "public", "images"), "images", knownFiles);
  await walkFiles(path.join(process.cwd(), "public", "uploads"), "uploads", knownFiles);
  if (process.env.MEDIA_UPLOAD_DIR) {
    await walkFiles(path.resolve(process.env.MEDIA_UPLOAD_DIR), "uploads", knownFiles);
  }

  const [pages, news, events, groups] = await Promise.all([
    prisma.page.findMany({
      select: {
        slug: true,
        title: true,
        content: true,
        gallerySlug: true,
        published: true,
      },
    }),
    prisma.news.findMany({
      select: {
        slug: true,
        title: true,
        teaser: true,
        content: true,
        coverImage: true,
        published: true,
      },
    }),
    prisma.event.findMany({
      select: {
        slug: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        allDay: true,
        timeZone: true,
        category: true,
        published: true,
      },
    }),
    prisma.mediaGroup.findMany({
      select: {
        slug: true,
        items: {
          select: {
            asset: { select: { path: true, sizeBytes: true } },
          },
        },
      },
    }),
  ]);

  const issues: Issue[] = [];
  const draftMissingAssets = new Set<string>();
  const checkAssets = (owner: string, content: string, published: boolean) => {
    for (const rawUrl of extractLocalAssetUrls(content)) {
      const localPath = assetPath(rawUrl);
      if (!localPath || !knownFiles.has(localPath)) {
        if (published) issues.push({ owner, message: `fehlendes Asset ${rawUrl}` });
        else draftMissingAssets.add(rawUrl);
      }
    }
  };

  for (const page of pages) {
    const owner = `Seite /${page.slug}`;
    if (page.published && textLength(page.content) < 20) {
      issues.push({ owner, message: "veröffentlichter Inhalt ist leer oder zu kurz" });
    }
    if (
      page.published &&
      (/Spambots geschützt/iu.test(page.content) ||
        /\.(?:png|jpe?g|webp|gif|avif|svg)\)0(?:\s|$)/iu.test(page.content))
    ) {
      issues.push({ owner, message: "sichtbares Joomla-Importartefakt im Inhalt" });
    }
    checkAssets(owner, page.content, page.published);
  }
  for (const item of news) {
    const owner = `News /aktuelles/${item.slug}`;
    if (item.published && textLength(`${item.teaser}\n${item.content}`) < 20) {
      issues.push({ owner, message: "veröffentlichter Inhalt ist leer oder zu kurz" });
    }
    checkAssets(owner, `${item.coverImage ?? ""}\n${item.content}`, item.published);
  }
  for (const event of events) {
    const owner = `Termin /termine/${event.slug}`;
    const startDate = civilDateKey(event.startDate);
    const endDate = event.endDate ? civilDateKey(event.endDate) : null;
    if (
      event.published &&
      (event.startDate.getUTCHours() !== 0 ||
        event.startDate.getUTCMinutes() !== 0 ||
        event.startDate.getUTCSeconds() !== 0 ||
        event.startDate.getUTCMilliseconds() !== 0)
    ) {
      issues.push({ owner, message: "Startdatum ist kein normalisiertes Civil Date" });
    }
    if (event.published && event.endDate && event.endDate < event.startDate) {
      issues.push({ owner, message: "Enddatum liegt vor dem Startdatum" });
    }
    if (
      event.published &&
      event.endDate &&
      (event.endDate.getUTCHours() !== 0 ||
        event.endDate.getUTCMinutes() !== 0 ||
        event.endDate.getUTCSeconds() !== 0 ||
        event.endDate.getUTCMilliseconds() !== 0)
    ) {
      issues.push({ owner, message: "Enddatum ist kein normalisiertes Civil Date" });
    }
    if (event.published && event.allDay && (event.startTime || event.endTime)) {
      issues.push({ owner, message: "ganztägiger Termin enthält Uhrzeiten" });
    }
    if (event.published && !event.allDay && !event.startTime) {
      issues.push({ owner, message: "Termin mit Uhrzeit hat keine Startzeit" });
    }
    if (event.published && event.startTime && !isClockTime(event.startTime)) {
      issues.push({ owner, message: "ungültiges Startzeitformat" });
    }
    if (event.published && event.endTime && !isClockTime(event.endTime)) {
      issues.push({ owner, message: "ungültiges Endzeitformat" });
    }
    if (event.published && event.endTime && !event.startTime) {
      issues.push({ owner, message: "Endzeit ohne Startzeit" });
    }
    if (
      event.published &&
      event.startTime &&
      endDate &&
      endDate !== startDate &&
      !event.endTime
    ) {
      issues.push({ owner, message: "mehrtägiger Termin mit Uhrzeit hat keine Endzeit" });
    }
    if (
      event.published &&
      event.startTime &&
      event.endTime &&
      (!endDate || endDate === startDate) &&
      event.endTime <= event.startTime
    ) {
      issues.push({ owner, message: "Endzeit liegt nicht nach der Startzeit" });
    }
    if (event.published && event.timeZone !== EVENT_TIME_ZONE) {
      issues.push({ owner, message: `unerwartete Zeitzone ${event.timeZone}` });
    }
    if (
      event.published &&
      !EVENT_CATEGORY_VALUES.includes(
        event.category as (typeof EVENT_CATEGORY_VALUES)[number],
      )
    ) {
      issues.push({ owner, message: `ungültige Kategorie ${event.category}` });
    }
    for (const [date, time, label] of [
      [startDate, event.startTime, "Startzeit"],
      [endDate ?? startDate, event.endTime, "Endzeit"],
    ] as const) {
      if (!event.published || !time || !isClockTime(time)) continue;
      try {
        zonedDateTimeToUtc(date, time, EVENT_TIME_ZONE);
      } catch {
        issues.push({ owner, message: `${label} existiert wegen Zeitumstellung nicht` });
      }
    }
    checkAssets(owner, event.description, event.published);
  }

  const publishedSlugs = new Set(pages.filter((page) => page.published).map((page) => page.slug));
  for (const section of Object.values(SITE_SECTIONS)) {
    for (const link of section.links) {
      if (
        !link.external &&
        !isNativeSitePath(link.href) &&
        !publishedSlugs.has(link.href.replace(/^\//, ""))
      ) {
        issues.push({ owner: `Navigation ${section.label}`, message: `unerreichbares Ziel ${link.href}` });
      }
    }
  }

  const groupSlugs = new Map(groups.map((group) => [group.slug.toLowerCase(), group]));
  const checkedGalleries = new Set<string>();
  const checkGallery = (owner: string, rawSlug: string) => {
    const slug = rawSlug.toLowerCase();
    const issueKey = `${owner}\0${slug}`;
    if (checkedGalleries.has(issueKey)) return;
    checkedGalleries.add(issueKey);

    const group = groupSlugs.get(slug);
    if (!group) {
      issues.push({ owner, message: `Galerie ${rawSlug} fehlt` });
      return;
    }
    const unavailable = group.items.filter(
      (item) =>
        item.asset.sizeBytes === null || !knownFiles.has(item.asset.path),
    );
    const available = group.items.length - unavailable.length;
    if (available === 0) {
      issues.push({ owner, message: `Galerie ${rawSlug} enthält keine verfügbaren Bilder` });
    } else if (unavailable.length > 0) {
      issues.push({
        owner,
        message: `Galerie ${rawSlug} enthält ${unavailable.length} fehlende Bilder`,
      });
    }
  };
  const checkGalleryEmbeds = (owner: string, content: string) => {
    for (const slug of extractGallerySlugs(content)) checkGallery(owner, slug);
  };

  for (const page of pages.filter((entry) => entry.published)) {
    const owner = `Seite /${page.slug}`;
    checkGalleryEmbeds(owner, page.content);
    if (page.gallerySlug) checkGallery(owner, page.gallerySlug);
  }
  for (const item of news.filter((entry) => entry.published)) {
    checkGalleryEmbeds(`News /aktuelles/${item.slug}`, item.content);
  }
  for (const event of events.filter((entry) => entry.published)) {
    checkGalleryEmbeds(`Termin /termine/${event.slug}`, event.description);
  }

  console.log(
    `Content-Audit: ${pages.filter((item) => item.published).length} Seiten, ` +
      `${news.filter((item) => item.published).length} News, ` +
      `${events.filter((item) => item.published).length} Termine, ${knownFiles.size} lokale Assets.`,
  );
  if (draftMissingAssets.size > 0) {
    console.log(`${draftMissingAssets.size} fehlende Draft-Assets bleiben bewusst unveröffentlicht.`);
  }
  if (issues.length > 0) {
    for (const issue of issues) console.error(`- ${issue.owner}: ${issue.message}`);
    throw new Error(`Content-Audit fehlgeschlagen (${issues.length} Probleme).`);
  }
  console.log("Content-Audit bestanden.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
