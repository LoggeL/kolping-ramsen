import type { ExcludeDecision } from "../types";

const HTML_PATH_PREFIX = /^\/(?:$|index\.php(?:\/|$))/i;
const BINARY_EXTENSION = /\.(?:avif|css|csv|docx?|eot|gif|ico|jpe?g|js|json|mp3|mp4|odt|pdf|png|pptx?|svg|ttf|webm|webp|woff2?|xlsx?|xml|zip)$/i;
const TRACKING_PARAMS = /^(?:fbclid|gclid|mc_[a-z]+|utm_[a-z]+)$/i;
const SAFE_QUERY_PARAMS = new Set([
  "Itemid",
  "catid",
  "id",
  "limit",
  "limitstart",
  "option",
  "start",
  "view",
]);

function normalizePathname(pathname: string): string {
  const decoded = pathname
    .split("/")
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part));
      } catch {
        return encodeURIComponent(part);
      }
    })
    .join("/");
  const collapsed = decoded.replace(/\/{2,}/g, "/").replace(/\/$/, "");
  return collapsed || "/index.php";
}
export function canonicalLegacyUrl(raw: string, origin: string): string | null {
  let parsed: URL;
  const canonicalOrigin = new URL(origin);
  try {
    parsed = new URL(raw, canonicalOrigin);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const wantedHost = canonicalOrigin.hostname.toLowerCase().replace(/^www\./, "");
  if (hostname !== wantedHost) return null;

  parsed.protocol = canonicalOrigin.protocol;
  parsed.hostname = canonicalOrigin.hostname;
  parsed.port = canonicalOrigin.port;
  parsed.hash = "";
  parsed.pathname = normalizePathname(parsed.pathname === "/" ? "/index.php" : parsed.pathname);
  if (!HTML_PATH_PREFIX.test(parsed.pathname) || BINARY_EXTENSION.test(parsed.pathname)) return null;

  const normalizedParams = new URLSearchParams();
  for (const [key, value] of [...parsed.searchParams.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (TRACKING_PARAMS.test(key)) continue;
    if (!SAFE_QUERY_PARAMS.has(key)) continue;
    if ((key === "start" || key === "limitstart") && (value === "" || value === "0")) continue;
    normalizedParams.append(key, value);
  }
  parsed.search = normalizedParams.toString();
  return parsed.href;
}

export function canonicalAssetUrl(raw: string, baseUrl: string, origin: string): string | null {
  try {
    const url = new URL(raw, baseUrl);
    const sourceHost = new URL(origin).hostname.toLowerCase().replace(/^www\./, "");
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== sourceHost) return null;
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.protocol = new URL(origin).protocol;
    url.hostname = new URL(origin).hostname;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export function sourcePath(url: string): string {
  const parsed = new URL(url);
  return `${parsed.pathname.replace(/\/$/, "") || "/"}${parsed.search}`;
}

export function matchesExclude(url: string, excludes: readonly ExcludeDecision[]): ExcludeDecision | null {
  const pathname = sourcePath(url);
  for (const decision of excludes) {
    try {
      if (new RegExp(decision.pattern, "u").test(pathname)) return decision;
    } catch {
      if (pathname.startsWith(decision.pattern)) return decision;
    }
  }
  return null;
}

export function isLikelyAsset(raw: string, baseUrl: string): boolean {
  try {
    return BINARY_EXTENSION.test(new URL(raw, baseUrl).pathname);
  } catch {
    return false;
  }
}
