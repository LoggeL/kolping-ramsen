const LOCAL_ASSET_REGEX =
  /\/(?:uploads|images)\/[^\s"'<>()[\]]+?\.(?:jpg|jpeg|png|webp|gif|avif|svg|pdf)(?:[?#][^\s"'<>()[\]]*)?/giu;
const IMAGE_EXTENSION_REGEX = /\.(?:jpg|jpeg|png|webp|gif|avif|svg)$/iu;

export function normalizeMediaPath(value: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  } catch {
    throw new Error("Ungültiger Medienpfad");
  }
  const normalized = decoded.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("\0") ||
    normalized.split("/").some((segment) => segment === ".." || segment === ".") ||
    !/^(?:uploads|images)\//i.test(normalized)
  ) {
    throw new Error("Medienpfad nicht erlaubt");
  }
  return normalized;
}

export function mediaReferenceKey(rawUrl: string): string {
  let value = rawUrl.split(/[?#]/, 1)[0];
  try {
    value = decodeURIComponent(value);
  } catch {}
  return `/${value.replace(/\\/g, "/").replace(/^\/+/, "")}`.toLocaleLowerCase("de-DE");
}

export function extractLocalAssetUrls(content: string | null | undefined): string[] {
  if (!content) return [];
  const urls = new Set<string>();
  for (const match of content.matchAll(LOCAL_ASSET_REGEX)) urls.add(match[0]);
  return [...urls];
}

export function extractImageUrls(content: string | null | undefined): string[] {
  return extractLocalAssetUrls(content).filter((url) => {
    const pathname = url.split(/[?#]/, 1)[0];
    return IMAGE_EXTENSION_REGEX.test(pathname);
  });
}
