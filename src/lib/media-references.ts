import "server-only";
import { prisma } from "@/lib/prisma";

export type MediaReferenceKind =
  | "news-cover"
  | "news-content"
  | "page"
  | "event"
  | "gallery";

export type MediaReference = {
  kind: MediaReferenceKind;
  label: string;
  href: string;
  adminHref: string;
};

const URL_REGEX =
  /\/(?:uploads|images)\/[A-Za-z0-9._\-/]+\.(?:jpg|jpeg|png|webp|gif|avif|svg)/gi;

export function extractImageUrls(content: string | null | undefined): string[] {
  if (!content) return [];
  const out = new Set<string>();
  for (const m of content.matchAll(URL_REGEX)) out.add(m[0]);
  return [...out];
}

export async function buildReferenceMap(): Promise<Map<string, MediaReference[]>> {
  const [news, pages, events, images] = await Promise.all([
    prisma.news.findMany({
      select: { id: true, slug: true, title: true, coverImage: true, content: true },
    }),
    prisma.page.findMany({
      select: { id: true, slug: true, title: true, content: true },
    }),
    prisma.event.findMany({
      select: { id: true, slug: true, title: true, description: true },
    }),
    prisma.image.findMany({
      select: {
        filename: true,
        gallery: { select: { id: true, slug: true, title: true } },
      },
    }),
  ]);

  const map = new Map<string, MediaReference[]>();
  const push = (rawUrl: string, ref: MediaReference) => {
    const key = rawUrl.toLowerCase();
    const arr = map.get(key);
    if (arr) {
      const dup = arr.some(
        (r) => r.kind === ref.kind && r.adminHref === ref.adminHref,
      );
      if (!dup) arr.push(ref);
    } else {
      map.set(key, [ref]);
    }
  };

  for (const n of news) {
    if (n.coverImage) {
      push(n.coverImage, {
        kind: "news-cover",
        label: `Titelbild · ${n.title}`,
        href: `/aktuelles/${n.slug}`,
        adminHref: `/admin/news/${n.id}`,
      });
    }
    for (const url of extractImageUrls(n.content)) {
      push(url, {
        kind: "news-content",
        label: n.title,
        href: `/aktuelles/${n.slug}`,
        adminHref: `/admin/news/${n.id}`,
      });
    }
  }
  for (const p of pages) {
    for (const url of extractImageUrls(p.content)) {
      push(url, {
        kind: "page",
        label: p.title,
        href: `/${p.slug}`,
        adminHref: `/admin/pages/${p.id}`,
      });
    }
  }
  for (const e of events) {
    for (const url of extractImageUrls(e.description)) {
      push(url, {
        kind: "event",
        label: e.title,
        href: `/termine/${e.slug}`,
        adminHref: `/admin/events/${e.id}`,
      });
    }
  }
  for (const img of images) {
    push(`/uploads/${img.filename}`, {
      kind: "gallery",
      label: `Galerie · ${img.gallery.title}`,
      href: `/galerien/${img.gallery.slug}`,
      adminHref: `/admin/galleries/${img.gallery.id}`,
    });
  }

  return map;
}

export const REFERENCE_KIND_LABEL: Record<MediaReferenceKind, string> = {
  "news-cover": "Titelbild",
  "news-content": "News",
  page: "Seite",
  event: "Termin",
  gallery: "Galerie",
};
