import type { MetadataRoute } from "next";

function sitemapUrlKey(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    url.searchParams.sort();
    return url.toString();
  } catch {
    return value;
  }
}

export function uniqueSitemapEntries(
  entries: MetadataRoute.Sitemap,
): MetadataRoute.Sitemap {
  const unique: MetadataRoute.Sitemap = [];
  const indexByUrl = new Map<string, number>();

  for (const entry of entries) {
    const key = sitemapUrlKey(entry.url);
    const existingIndex = indexByUrl.get(key);

    if (existingIndex === undefined) {
      indexByUrl.set(key, unique.length);
      unique.push(entry);
      continue;
    }

    const existing = unique[existingIndex];
    unique[existingIndex] = {
      ...entry,
      ...existing,
      lastModified: existing.lastModified ?? entry.lastModified,
    };
  }

  return unique;
}
