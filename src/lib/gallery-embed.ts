import "server-only";
import { prisma } from "@/lib/prisma";
import {
  extractGallerySlugs,
  replaceGalleryTokens,
} from "@/lib/gallery-token";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type GalleryItem = {
  alt: string | null;
  caption: string | null;
  asset: { path: string; alt: string; sizeBytes: number | null };
};

function renderGallery(slug: string, items: GalleryItem[]): string {
  if (items.length === 0) {
    return `<!-- gallery "${escapeHtml(slug)}" is empty -->`;
  }
  const tiles = items
    .map(
      (item, index) => {
        const src = `/${item.asset.path}`;
        const alt = item.alt ?? item.asset.alt;
        const label = alt
          ? `${alt} – Bild ${index + 1} von ${items.length} in Großansicht öffnen`
          : `Bild ${index + 1} von ${items.length} in Großansicht öffnen`;
        const caption = item.caption
          ? `<span class="md-image-caption">${escapeHtml(item.caption)}</span>`
          : "";
        return `<li><button type="button" class="md-image-trigger" data-lightbox-trigger data-lightbox-src="${escapeHtml(src)}" aria-label="${escapeHtml(label)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"><span class="md-image-zoom" aria-hidden="true">Vergrößern</span>${caption}</button></li>`;
      },
    )
    .join("");
  return `<section class="md-gallery" data-gallery="${escapeHtml(slug)}" data-lightbox-group aria-label="Bildergalerie mit ${items.length} Bildern"><ul>${tiles}</ul></section>`;
}

export async function expandGalleryEmbeds(md: string): Promise<string> {
  if (!md) return md;
  const slugs = new Set(extractGallerySlugs(md));
  if (slugs.size === 0) return md;

  const groups = await prisma.mediaGroup.findMany({
    where: { slug: { in: Array.from(slugs) } },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { asset: { select: { path: true, alt: true, sizeBytes: true } } },
      },
    },
  });
  const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]));

  return replaceGalleryTokens(md, (slug) => {
    const g = map.get(slug);
    if (!g) return `<!-- gallery "${escapeHtml(slug)}" not found -->`;
    return renderGallery(
      slug,
      g.items.filter((item) => item.asset.sizeBytes !== null),
    );
  });
}
