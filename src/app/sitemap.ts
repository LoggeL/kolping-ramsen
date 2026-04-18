import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/aktuelles",
    "/termine",
    "/galerien",
    "/gaestebuch",
    "/kontakt",
    "/mitglied-werden",
    "/impressum",
    "/datenschutz",
  ].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 }));

  const [news, events, pages, galleries] = await Promise.all([
    prisma.news.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.event.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.gallery.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...news.map((n) => ({
      url: `${base}/aktuelles/${n.slug}`,
      lastModified: n.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...events.map((e) => ({
      url: `${base}/termine/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...pages.map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...galleries.map((g) => ({
      url: `${base}/galerien/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
