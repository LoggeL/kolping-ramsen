import "server-only";
import { prisma } from "@/lib/prisma";

const GALLERY_RE = /::gallery\[([a-z0-9-]+)\]::/gi;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderGallery(slug: string, items: { path: string }[]): string {
  if (items.length === 0) {
    return `<!-- gallery "${escapeHtml(slug)}" is empty -->`;
  }
  const tiles = items
    .map(
      (i) =>
        `<li><a href="${escapeHtml(i.path)}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(i.path)}" alt="" loading="lazy" /></a></li>`,
    )
    .join("");
  return `<div class="md-gallery" data-gallery="${escapeHtml(slug)}"><ul>${tiles}</ul></div>`;
}

export async function expandGalleryEmbeds(md: string): Promise<string> {
  if (!md) return md;
  const slugs = new Set<string>();
  for (const m of md.matchAll(GALLERY_RE)) slugs.add(m[1].toLowerCase());
  if (slugs.size === 0) return md;

  const groups = await prisma.mediaGroup.findMany({
    where: { slug: { in: Array.from(slugs) } },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  const map = new Map(groups.map((g) => [g.slug.toLowerCase(), g]));

  return md.replace(GALLERY_RE, (_match, rawSlug: string) => {
    const slug = rawSlug.toLowerCase();
    const g = map.get(slug);
    if (!g) return `<!-- gallery "${escapeHtml(slug)}" not found -->`;
    return renderGallery(slug, g.items);
  });
}
