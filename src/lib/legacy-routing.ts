export type LegacySearchParams = Record<
  string,
  string | string[] | undefined
>;

export type RedirectEntryLike = {
  fromPath: string;
  toPath: string;
};

export type StructuredContentPath = Readonly<{
  kind: "news" | "event";
  slug: string;
}>;

const RESERVED_CONTENT_SEGMENTS = new Set([
  "admin",
  "aktuelles",
  "termine",
  "termine.ics",
  "kontakt",
  "gaestebuch",
  "api",
  "health",
  "uploads",
]);

export function isReservedContentSlug(slug: string): boolean {
  return RESERVED_CONTENT_SEGMENTS.has(slug.split("/", 1)[0]);
}

const INTERNAL_ORIGIN = "https://legacy.local";
const LEGACY_SOURCE_HOSTS = new Set([
  "kolping-ramsen.de",
  "www.kolping-ramsen.de",
]);

export function legacySourceRedirectPath(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !LEGACY_SOURCE_HOSTS.has(url.hostname.toLowerCase()) ||
      url.pathname === "/"
    ) {
      return null;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function canonicalQuery(entries: Iterable<[string, string]>): string {
  const sorted = [...entries].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyOrder = leftKey.localeCompare(rightKey);
    return keyOrder !== 0 ? keyOrder : leftValue.localeCompare(rightValue);
  });
  const query = new URLSearchParams();
  for (const [key, value] of sorted) query.append(key, value);
  return query.toString();
}

function queryFromSearchParams(searchParams: LegacySearchParams): string {
  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) entries.push([key, item]);
    } else if (value !== undefined) {
      entries.push([key, value]);
    }
  }

  return canonicalQuery(entries);
}

export function normalizeInternalPathname(value: string): string | null {
  const input = value.trim();
  if (!input.startsWith("/") || input.startsWith("//")) return null;

  try {
    const url = new URL(input, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return null;

    const collapsed = url.pathname.replace(/\/{2,}/g, "/");
    if (collapsed === "/") return collapsed;
    return collapsed.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function normalizedLegacyRequestKeys(
  pathname: string,
  searchParams: LegacySearchParams,
): string[] {
  const normalizedPath = normalizeInternalPathname(pathname);
  if (!normalizedPath) return [];

  const query = queryFromSearchParams(searchParams);
  return query ? [`${normalizedPath}?${query}`, normalizedPath] : [normalizedPath];
}

export function normalizeStoredLegacyPath(value: string): string | null {
  const pathname = normalizeInternalPathname(value);
  if (!pathname) return null;

  try {
    const url = new URL(value, INTERNAL_ORIGIN);
    const query = canonicalQuery(url.searchParams.entries());
    return query ? `${pathname}?${query}` : pathname;
  } catch {
    return null;
  }
}

export function parseStructuredContentPath(value: string): StructuredContentPath | null {
  const pathname = normalizeInternalPathname(value);
  if (!pathname) return null;
  const match = pathname.match(/^\/(aktuelles|termine)\/([^/]+)$/u);
  if (!match) return null;
  return { kind: match[1] === "aktuelles" ? "news" : "event", slug: match[2] };
}

export function matchingLegacyRedirects<T extends RedirectEntryLike>(
  entries: readonly T[],
  pathname: string,
  searchParams: LegacySearchParams,
): T[] {
  const requestKeys = normalizedLegacyRequestKeys(pathname, searchParams);
  const priority = new Map(requestKeys.map((key, index) => [key, index]));

  return entries
    .map((entry, index) => ({
      entry,
      index,
      rank: priority.get(normalizeStoredLegacyPath(entry.fromPath) ?? ""),
    }))
    .filter(
      (candidate): candidate is typeof candidate & { rank: number } =>
        candidate.rank !== undefined,
    )
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ entry }) => entry);
}

export function redirectDestinationCandidates(destination: string): string[] {
  const pathname = normalizeInternalPathname(destination);
  if (!pathname) return [];
  if (pathname === "/") return [pathname];

  const segments = pathname.slice(1).split("/");
  const candidates: string[] = [];
  for (let length = segments.length; length > 0; length -= 1) {
    candidates.push(`/${segments.slice(0, length).join("/")}`);
  }
  candidates.push("/");
  return candidates;
}
