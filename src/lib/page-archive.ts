import {
  cleanLegacyMetaDescription,
  preparePublicMarkdown,
} from "./public-content";

const DEFAULT_EXCERPT_LENGTH = 190;
export const PAGE_ARCHIVE_PAGE_SIZE = 18;

export type ArchivePageState = {
  currentPage: number;
  totalPages: number;
  shouldRedirect: boolean;
};

function requestedArchivePage(
  value: string | string[] | undefined,
): { page: number; canonical: boolean } {
  if (value === undefined) return { page: 1, canonical: true };
  if (typeof value !== "string" || !/^[1-9]\d*$/u.test(value)) {
    return { page: 1, canonical: false };
  }

  const page = Number(value);
  if (!Number.isSafeInteger(page)) return { page: 1, canonical: false };

  return {
    page,
    // The first archive page lives at the clean parent URL.
    canonical: page > 1 && value === String(page),
  };
}

export function resolveArchivePage(
  value: string | string[] | undefined,
  totalCount: number,
  pageSize = PAGE_ARCHIVE_PAGE_SIZE,
): ArchivePageState {
  if (!Number.isSafeInteger(totalCount) || totalCount < 0) {
    throw new RangeError("totalCount must be a non-negative integer");
  }
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) {
    throw new RangeError("pageSize must be a positive integer");
  }

  // Query strings on ordinary CMS pages must keep behaving exactly as before.
  if (totalCount === 0) {
    return { currentPage: 1, totalPages: 0, shouldRedirect: false };
  }

  const totalPages = Math.ceil(totalCount / pageSize);
  const requested = requestedArchivePage(value);
  const currentPage = Math.min(requested.page, totalPages);

  return {
    currentPage,
    totalPages,
    shouldRedirect: !requested.canonical || currentPage !== requested.page,
  };
}

export function archivePageHref(parentPath: string, page: number): string {
  if (!Number.isSafeInteger(page) || page < 1) {
    throw new RangeError("page must be a positive integer");
  }

  const normalizedPath = parentPath.trim().replace(/^\/+|\/+$/gu, "");
  const basePath = normalizedPath ? `/${normalizedPath}` : "/";
  return page === 1 ? basePath : `${basePath}?seite=${page}`;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;|&#xa0;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&apos;|&#39;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#(x?)([0-9a-f]+);/giu, (entity, hexadecimal, digits) => {
      const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);
      if (!Number.isSafeInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
        return entity;
      }
      try {
        return String.fromCodePoint(codePoint);
      } catch {
        return entity;
      }
    });
}

function plainText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/gu, " ")
    .replace(/::gallery\[[^\]]+\]::/giu, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, " ")
    .replace(/<img\b[^>]*>/giu, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<https?:\/\/[^>]+>/giu, " ")
    .replace(/<[^>]*>/gu, " ")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/gmu, "")
    .replace(/[*_~`|]/gu, " ")
    .replace(/\\([\\`*{}\[\]()#+.!_>-])/gu, "$1")
    .replace(/^0\s+(?=\p{L})/iu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const candidate = value.slice(0, maxLength + 1);
  const wordBoundary = candidate.lastIndexOf(" ");
  const end = wordBoundary >= Math.floor(maxLength * 0.65)
    ? wordBoundary
    : maxLength;

  return `${candidate
    .slice(0, end)
    .replace(/[\s,;:–—-]+$/u, "")
    .trim()}…`;
}

export function pageArchiveExcerpt({
  title,
  content,
  metaDesc,
  maxLength = DEFAULT_EXCERPT_LENGTH,
}: {
  title: string;
  content: string;
  metaDesc: string | null;
  maxLength?: number;
}): string | null {
  const cleanedMeta = plainText(cleanLegacyMetaDescription(metaDesc) ?? "");
  const cleanedContent = plainText(preparePublicMarkdown(content, title));
  const source = cleanedMeta.length >= 30 ? cleanedMeta : cleanedContent || cleanedMeta;

  return source ? truncateAtWord(source, maxLength) : null;
}
