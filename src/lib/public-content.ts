const JOOMLA_METADATA_LINE = [
  /^details\s*:?$/iu,
  /^geschrieben\s+von\s*:?\s*.+$/iu,
  /^ver(?:ö|oe)ffentlicht\s*:?\s*.+$/iu,
  /^zuletzt\s+aktualisiert\s*:?\s*.+$/iu,
  /^zugriffe\s*:?\s*[\d.,]+$/iu,
  /^kategorie(?:n)?\s*:?\s*.+$/iu,
];

function decodeCommonEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;|&#xa0;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&apos;|&#39;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">");
}

function lineAsPlainText(line: string): string {
  return decodeCommonEntities(line)
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isJoomlaMetadataLine(line: string): boolean {
  const plain = lineAsPlainText(line);
  return JOOMLA_METADATA_LINE.some((pattern) => pattern.test(plain));
}

function stripJoomlaHtmlPreamble(source: string): string {
  let cleaned = source.replace(/^\uFEFF/, "").trimStart();
  let previous = "";

  while (cleaned !== previous) {
    previous = cleaned;
    cleaned = cleaned
      .replace(
        /^<meta\b[^>]*\bitemprop\s*=\s*["']inLanguage["'][^>]*>\s*/iu,
        "",
      )
      .replace(
        /^<dl\b[^>]*\bclass\s*=\s*["'][^"']*\barticle-info\b[^"']*["'][^>]*>[\s\S]*?<\/dl>\s*/iu,
        "",
      )
      .trimStart();
  }

  return cleaned;
}

function stripJoomlaMarkdownPreamble(source: string): string {
  const lines = source.split("\n");
  let cursor = 0;
  let removedMetadata = false;

  while (cursor < lines.length) {
    if (lines[cursor].trim() === "") {
      cursor += 1;
      continue;
    }
    if (!isJoomlaMetadataLine(lines[cursor])) break;
    removedMetadata = true;
    cursor += 1;
  }

  return removedMetadata ? lines.slice(cursor).join("\n").trimStart() : source;
}

function normalizedHeading(value: string): string {
  return lineAsPlainText(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("de")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function normalizeArticleHeadings(source: string, documentTitle: string): string {
  const lines = source.split("\n");
  const firstContentLine = lines.findIndex((line) => line.trim() !== "");
  const markdownHeading =
    firstContentLine >= 0
      ? lines[firstContentLine].match(/^\s{0,3}#(?!#)\s+(.+?)\s*#*\s*$/u)
      : null;
  const htmlHeading =
    firstContentLine >= 0
      ? lines[firstContentLine].match(/^\s*<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>\s*$/iu)
      : null;
  const duplicateHeading = markdownHeading?.[1] ?? htmlHeading?.[1];

  if (
    duplicateHeading &&
    normalizedHeading(duplicateHeading) === normalizedHeading(documentTitle)
  ) {
    lines.splice(firstContentLine, 1);
  }

  let fence: "```" | "~~~" | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    const fenceMatch = lines[index].match(/^\s{0,3}(```|~~~)/u);
    if (fenceMatch) {
      if (!fence) {
        fence = fenceMatch[1] as "```" | "~~~";
      } else if (fence === fenceMatch[1]) {
        fence = null;
      }
      continue;
    }
    if (fence) continue;

    lines[index] = lines[index]
      .replace(/^(\s{0,3})#(?!#)(\s+)/u, "$1##$2")
      .replace(/<h1(\s[^>]*)?>/giu, "<h2$1>")
      .replace(/<\/h1>/giu, "</h2>");
  }

  return lines.join("\n").trimStart();
}

export function preparePublicMarkdown(
  source: string,
  documentTitle?: string,
): string {
  const withoutHtmlMetadata = stripJoomlaHtmlPreamble(source ?? "");
  const withoutMetadata = stripJoomlaMarkdownPreamble(withoutHtmlMetadata);

  return documentTitle
    ? normalizeArticleHeadings(withoutMetadata, documentTitle)
    : withoutMetadata;
}

export function cleanLegacyMetaDescription(
  description: string | null | undefined,
): string | undefined {
  if (!description) return undefined;

  let cleaned = decodeCommonEntities(description)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned
    .replace(/^\s*details\s*:?\s*/iu, "")
    .replace(
      /^\s*geschrieben\s+von\s*:?\s*.*?(?=\s+(?:ver(?:ö|oe)ffentlicht|zuletzt\s+aktualisiert|zugriffe)\s*:)/iu,
      "",
    )
    .replace(
      /^\s*ver(?:ö|oe)ffentlicht\s*:?\s*(?:\d{1,2}\.\s*[\p{L}]+\s+\d{4}|\d{1,2}\.\d{1,2}\.\d{2,4})(?:\s+\d{1,2}:\d{2})?\s*/iu,
      "",
    )
    .replace(
      /^\s*zuletzt\s+aktualisiert\s*:?\s*(?:\d{1,2}\.\s*[\p{L}]+\s+\d{4}|\d{1,2}\.\d{1,2}\.\d{2,4})(?:\s+\d{1,2}:\d{2})?\s*/iu,
      "",
    )
    .replace(/^\s*zugriffe\s*:?\s*[\d.,]+\s*/iu, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || undefined;
}
