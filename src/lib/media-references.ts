import "server-only";
import { prisma } from "@/lib/prisma";
import {
  extractImageUrls,
  mediaReferenceKey,
} from "@/lib/media-paths";

export { extractImageUrls, mediaReferenceKey } from "@/lib/media-paths";

export type MediaReferenceKind =
  | "news-cover"
  | "news-content"
  | "page"
  | "event"
  | "group"
  | "site";

export type MediaReference = {
  kind: MediaReferenceKind;
  label: string;
  href: string;
  adminHref: string;
};

export async function buildReferenceMap(): Promise<Map<string, MediaReference[]>> {
  const [news, pages, events, groupItems] = await Promise.all([
    prisma.news.findMany({
      select: { id: true, slug: true, title: true, coverImage: true, content: true },
    }),
    prisma.page.findMany({
      select: { id: true, slug: true, title: true, content: true },
    }),
    prisma.event.findMany({
      select: { id: true, slug: true, title: true, description: true },
    }),
    prisma.mediaGroupItem.findMany({
      select: {
        asset: { select: { path: true } },
        group: { select: { id: true, slug: true, name: true } },
      },
    }),
  ]);

  const map = new Map<string, MediaReference[]>();
  const push = (rawUrl: string, ref: MediaReference) => {
    const key = mediaReferenceKey(rawUrl);
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
  for (const item of groupItems) {
    push(`/${item.asset.path}`, {
      kind: "group",
      label: `Galerie · ${item.group.name}`,
      href: `/admin/media/groups/${item.group.id}`,
      adminHref: `/admin/media/groups/${item.group.id}`,
    });
  }
  push("/images/ramsen-scenic.jpg", {
    kind: "site",
    label: "Startseiten-Hero",
    href: "/",
    adminHref: "/",
  });

  return map;
}

export const REFERENCE_KIND_LABEL: Record<MediaReferenceKind, string> = {
  "news-cover": "Titelbild",
  "news-content": "News",
  page: "Seite",
  event: "Termin",
  group: "Galerie",
  site: "Website",
};
