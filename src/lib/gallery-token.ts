const GALLERY_TOKEN_PATTERN = /::gallery\[([a-z0-9-]+)\]::/gi;

export function extractGallerySlugs(content: string): string[] {
  return [...content.matchAll(GALLERY_TOKEN_PATTERN)].map((match) =>
    match[1].toLowerCase(),
  );
}

export function replaceGalleryTokens(
  content: string,
  replacement: (slug: string) => string,
): string {
  return content.replace(GALLERY_TOKEN_PATTERN, (_match, rawSlug: string) =>
    replacement(rawSlug.toLowerCase()),
  );
}

export function renameGalleryTokens(
  content: string,
  currentSlug: string,
  nextSlug: string,
): string {
  return replaceGalleryTokens(content, (slug) =>
    slug === currentSlug.toLowerCase()
      ? `::gallery[${nextSlug.toLowerCase()}]::`
      : `::gallery[${slug}]::`,
  );
}
