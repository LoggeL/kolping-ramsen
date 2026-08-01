import "server-only";

import { prisma } from "@/lib/prisma";
import { isNativeSitePath } from "@/lib/site";
import {
  isReservedContentSlug,
  matchingLegacyRedirects,
  normalizeInternalPathname,
  redirectDestinationCandidates,
  type LegacySearchParams,
  type RedirectEntryLike,
} from "@/lib/legacy-routing";

async function loadRedirects(path: string, searchParams: LegacySearchParams) {
  const normalizedPath = normalizeInternalPathname(path);
  if (!normalizedPath) return [];
  const trailingPath = normalizedPath === "/" ? "/" : `${normalizedPath}/`;

  const entries = await prisma.redirect.findMany({
    where: {
      OR: [
        { fromPath: normalizedPath },
        { fromPath: { startsWith: `${normalizedPath}?` } },
        { fromPath: trailingPath },
        { fromPath: { startsWith: `${trailingPath}?` } },
      ],
    },
  });

  return matchingLegacyRedirects(entries, normalizedPath, searchParams);
}

async function resolveRedirectTarget(
  entry: RedirectEntryLike,
  currentPath: string,
) {
  const candidates = redirectDestinationCandidates(entry.toPath).filter(
    (candidate) => candidate !== currentPath,
  );
  const cmsSlugs = candidates
    .filter((candidate) => candidate !== "/" && !isNativeSitePath(candidate))
    .map((candidate) => candidate.slice(1))
    .filter((slug) => !isReservedContentSlug(slug));
  const publishedPages = cmsSlugs.length
    ? await prisma.page.findMany({
        where: { slug: { in: cmsSlugs }, published: true },
        select: { slug: true },
      })
    : [];
  const publishedPaths = new Set(
    publishedPages.map((page) => `/${page.slug}`),
  );

  for (const [index, candidate] of candidates.entries()) {
    if (isNativeSitePath(candidate) || publishedPaths.has(candidate)) {
      return { destination: candidate, exact: index === 0 };
    }
  }
  return null;
}

export async function findPublishedRedirect(
  path: string,
  searchParams: LegacySearchParams,
): Promise<string | null> {
  const currentPath = normalizeInternalPathname(path);
  if (!currentPath) return null;
  const entries = await loadRedirects(currentPath, searchParams);
  let nearestFallback: string | null = null;

  for (const entry of entries) {
    const resolved = await resolveRedirectTarget(entry, currentPath);
    if (!resolved) continue;
    if (resolved.exact) return resolved.destination;
    nearestFallback ??= resolved.destination;
  }
  return nearestFallback;
}
