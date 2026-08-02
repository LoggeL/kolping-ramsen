import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode, Element } from "domhandler";
import TurndownService from "turndown";
import type {
  ContentKind,
  LegacyRecord,
  MigrationDecisions,
  RecordExcludeDecision,
  RecordOverrideDecision,
  RouteDecision,
  SnapshotFinding,
} from "../types";
import { canonicalAssetUrl, canonicalLegacyUrl, isLikelyAsset, sourcePath } from "./url";
import { sha256, stableJson, uniqueSorted } from "./stable";

export type RecordExclusionApplication = Readonly<{
  decisionSourcePath: string;
  publishedDate: string;
  detectedTitle: string;
  sourceUrl: string;
  sourcePageUrl: string;
  sourceFingerprint: `sha256:${string}`;
  assetUrls: readonly string[];
}>;

type NormalizedPage = Readonly<{
  records: LegacyRecord[];
  pageLinks: string[];
  assetUrls: string[];
  assetAltTexts: Map<string, Set<string>>;
  findings: SnapshotFinding[];
  recordExclusions: RecordExclusionApplication[];
}>;

type RecordExtraction = Readonly<{
  record?: LegacyRecord;
  exclusion?: SnapshotFinding;
  exclusionApplication?: RecordExclusionApplication;
  assetUrls?: readonly string[];
}>;

const GERMAN_MONTHS: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  maerz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\u00a0\u200b\ufeff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLegacyTitle(value: string): string {
  let title = cleanText(value);
  const quoteCount = (title.match(/["„“]/gu) ?? []).length;
  if (quoteCount % 2 === 1) {
    title = title.replace(/^["„“]\s*/u, "").replace(/\s*["„“]$/u, "");
  }
  return title
    .replace(/\s+(?:und|oder)\s*$/iu, "")
    .replace(/[;,]\s*$/u, "")
    .trim();
}

export function slugifyLegacyTitle(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "ohne-titel";
}

function parsePublishedDate(scope: Cheerio<AnyNode>): string | undefined {
  const datetime = scope.find("time[datetime]").first().attr("datetime");
  if (datetime) {
    const iso = datetime.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (iso) return iso;
  }

  const text = cleanText(scope.text());
  const numeric = text.match(/(?:Veröffentlicht|Erstellt|Datum)?\s*:?[\s]*(\d{1,2})\.(\d{1,2})\.(\d{4})/iu);
  if (numeric) {
    return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  }
  const named = text.match(/(?:Veröffentlicht|Erstellt|Datum)?\s*:?[\s]*(\d{1,2})\.\s*([A-Za-zÄÖÜäöüß]+)\s+(\d{4})/iu);
  if (!named) return undefined;
  const month = GERMAN_MONTHS[named[2].toLowerCase()];
  if (!month) return undefined;
  return `${named[3]}-${String(month).padStart(2, "0")}-${named[1].padStart(2, "0")}`;
}

function pageTitle($: CheerioAPI): string {
  const documentTitle = cleanLegacyTitle($("title").first().text().replace(/\s*[-–|]\s*Kolping(?:sfamilie)?\s+Ramsen.*$/iu, ""));
  if (documentTitle) return documentTitle;
  return cleanLegacyTitle($("main h1, main .page-header h2, main h2").first().text()) || "Ohne Titel";
}

function germanDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Intl.DateTimeFormat("de-DE", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function humanizeImageLabel(value: string): string {
  return cleanText(value
    .replace(/^.*[\\/]/u, "")
    .replace(/\.(?:avif|gif|jpe?g|png|webp)$/iu, "")
    .replace(/[_-]+/g, " "));
}

function weakImageLabel(value: string): boolean {
  const normalized = cleanText(value);
  return !normalized
    || /(?:WhatsApp\s+Image|^IMG\s*\d|^DSC\s*\d|^PXL\s*\d|page\s*\d+$|\.(?:jpe?g|png|webp)$|[_\\/])/iu.test(normalized)
    || /^(?:image|bild|foto|logo|header)(?:\s*\d+)?$/iu.test(normalized);
}

function itemTitle(
  $: CheerioAPI,
  scope: Cheerio<AnyNode>,
  fallback: string,
  publishedDate?: string,
): { title: string; warning?: string } {
  const candidates = scope.find(".page-header h1, .page-header h2, h1, h2, h3").toArray();
  for (const candidate of candidates) {
    const text = cleanLegacyTitle($(candidate).text());
    if (/^(?:RHEINPFALZ|Pressebericht|Zeitungsbericht)$/iu.test(text)) {
      const filenameTitle = humanizeImageLabel(scope.find("img[alt]").first().attr("alt") ?? "");
      if (filenameTitle && !/(?:WhatsApp\s+Image|^(?:IMG|DSC|PXL)\s*\d)/iu.test(filenameTitle)) {
        return { title: filenameTitle };
      }
    }
    if (/\b(?:Tel\.?|Telefon)\s*:?\s*[+()\d][\d\s/()-]{5,}/iu.test(text)) {
      const date = germanDate(publishedDate);
      return {
        title: `${fallback}: Kontakt${date ? ` vom ${date}` : ""}`,
        warning: "Telefonnummer im Quellheading wurde nicht als Seitentitel übernommen.",
      };
    }
    if (text && !weakImageLabel(text) && text.length <= 120 && !(text.length > 80 && /[.!?]$/u.test(text)) && !/^(?:Details|Aktuelles|Rückblick)$/iu.test(text)) {
      return { title: text };
    }
  }
  const rawAlt = cleanText(scope.find("img[alt]").first().attr("alt") ?? "");
  const alt = humanizeImageLabel(rawAlt);
  if (alt && !/(?:WhatsApp\s+Image|^(?:IMG|DSC|PXL)\s*\d|^(?:image|bild|foto|logo|header)(?:\s*\d+)?$)/iu.test(alt)) return { title: alt };
  const date = germanDate(publishedDate);
  if (rawAlt && date) return { title: `Impressionen vom ${date}`, warning: "Generischer Bilddateiname wurde durch einen datierten Titel ersetzt." };
  return { title: fallback, warning: "Titel konnte nicht eindeutig aus dem Artikel abgeleitet werden." };
}

function routeDecision(url: string, decisions?: MigrationDecisions): RouteDecision | undefined {
  if (!decisions) return undefined;
  const pathname = new URL(url).pathname.replace(/\/$/, "") || "/";
  return [...decisions.routes]
    .sort((left, right) => right.sourcePath.length - left.sourcePath.length)
    .find((entry) => {
      const source = entry.sourcePath.replace(/\/$/, "") || "/";
      if (source === "/index.php" || source === "/") return pathname === source;
      return pathname === source || pathname.startsWith(`${source}/`);
    });
}

function belongsToSourcePrefix(pathname: string, prefix: string): boolean {
  const normalizedPathname = pathname.replace(/\/$/u, "") || "/";
  const normalizedPrefix = prefix.replace(/\/$/u, "") || "/";
  return normalizedPathname === normalizedPrefix || normalizedPathname.startsWith(`${normalizedPrefix}/`);
}

function recordOverride(
  url: string,
  publishedDate: string | undefined,
  detectedTitle: string,
  decisions: MigrationDecisions | undefined,
): RecordOverrideDecision | undefined {
  if (!publishedDate || !decisions?.recordOverrides?.length) return undefined;
  const pathname = new URL(url).pathname.replace(/\/$/u, "") || "/";
  return decisions.recordOverrides.find((decision) =>
    [decision.sourcePath, ...(decision.sourceAliases ?? [])].some((prefix) => belongsToSourcePrefix(pathname, prefix))
    && decision.publishedDate === publishedDate
    && decision.detectedTitle === detectedTitle,
  );
}

function recordExclude(
  url: string,
  publishedDate: string | undefined,
  detectedTitle: string,
  decisions: MigrationDecisions | undefined,
): RecordExcludeDecision | undefined {
  if (!publishedDate || !decisions?.recordExcludes?.length) return undefined;
  const pathname = new URL(url).pathname.replace(/\/$/u, "") || "/";
  return decisions.recordExcludes.find((decision) =>
    [decision.sourcePath, ...(decision.sourceAliases ?? [])].some((prefix) => belongsToSourcePrefix(pathname, prefix))
    && decision.publishedDate === publishedDate
    && decision.detectedTitle === detectedTitle,
  );
}

function targetFor(
  decision: RouteDecision | undefined,
  kind: ContentKind,
  title: string,
  sourceUrl: string,
  isCollectionItem: boolean,
  publishedDate?: string,
): { targetPath: string; warning?: string } {
  const slug = slugifyLegacyTitle(title);
  if (!decision) {
    const legacyPath = new URL(sourceUrl).pathname.replace(/^\/index\.php\/?/i, "");
    return {
      targetPath: `/_legacy-review/${legacyPath || slug}`.replace(/\/{2,}/g, "/"),
      warning: "Keine deklarative Zuordnung zu einer aktuellen Route vorhanden.",
    };
  }
  const base = `/${decision.targetPath.replace(/^\/+|\/+$/g, "")}`.replace(/^\/$/, "/");
  const decisionSourcePath = new URL(decision.sourcePath, "https://legacy.invalid").pathname.replace(/\/$/u, "") || "/";
  const sourcePathname = new URL(sourceUrl).pathname.replace(/\/$/u, "") || "/";
  if (!decision.collection || (!isCollectionItem && sourcePathname === decisionSourcePath)) {
    return { targetPath: base };
  }
  const datedSlug = publishedDate ? `${publishedDate}-${slug}` : slug;
  if (kind === "news") return { targetPath: `/aktuelles/${datedSlug}` };
  if (kind === "event") return { targetPath: `/termine/${datedSlug}` };
  return { targetPath: `${base}/${datedSlug}`.replace(/\/{2,}/g, "/") };
}

function addMarkdownTableRule(service: TurndownService) {
  service.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = cheerio.load(node.outerHTML ?? "", null, false);
      const rows = table("tr")
        .toArray()
        .map((row) =>
          table(row)
            .find("th, td")
            .toArray()
            .map((cell) => cleanText(table(cell).text()).replace(/\|/g, "\\|")),
        )
        .filter((row) => row.length > 0);
      if (rows.length === 0) return "";
      const width = Math.max(...rows.map((row) => row.length));
      const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
      const header = normalized[0];
      return `\n\n| ${header.join(" | ")} |\n| ${header.map(() => "---").join(" | ")} |\n${normalized
        .slice(1)
        .map((row) => `| ${row.join(" | ")} |`)
        .join("\n")}\n\n`;
    },
  });
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[\u00a0\u200b\ufeff]/g, " ")
    .replace(/Diese E-Mail-Adresse ist vor Spambots geschützt!\s*Zur Anzeige muss JavaScript eingeschaltet sein\.?/giu, "")
    .replace(/\bhttp:\/\/theater\.kolping-ramsen\.de\b/giu, "https://kolpingtheater-ramsen.de")
    .replace(/^#{1,6}\s+(?:Details|Inhalt)\s*$/gimu, "")
    .replace(/(!\[[^\]]*\]\([^)]*\))0(?=\s|$)/gu, "$1")
    .replace(/\n[ \t]+\n/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeHiddenMailValue(value: string | undefined): string | undefined {
  if (!value || !/^[A-Za-z0-9+/]+={0,2}$/u.test(value)) return undefined;
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    return decoded && !decoded.includes("�") ? decoded : undefined;
  } catch {
    return undefined;
  }
}

function decodeJoomlaHiddenMail($: CheerioAPI, scope: Cheerio<AnyNode>): string[] {
  const warnings: string[] = [];
  scope.find("joomla-hidden-mail").each((_, node) => {
    const element = $(node);
    const first = decodeHiddenMailValue(element.attr("first"));
    const last = decodeHiddenMailValue(element.attr("last"));
    const text = decodeHiddenMailValue(element.attr("text"));
    const display = element.attr("is-email") === "1" && first && last ? `${first}@${last}` : text;
    if (!display) {
      warnings.push("Joomla-Mail-Verschleierung konnte nicht verlustfrei dekodiert werden.");
      return;
    }
    const replacement = $("<span></span>").text(display);
    element.replaceWith(replacement);
  });
  return warnings;
}

function hasPresentationalHeadingStyle($: CheerioAPI, heading: Cheerio<AnyNode>): boolean {
  const styles = [
    heading.attr("style") ?? "",
    ...heading.find("[style]").toArray().map((node) => $(node).attr("style") ?? ""),
  ].join(";");
  return /(?:color|font-size|font-family|text-align)\s*:/iu.test(styles);
}

function headingIdentity(value: string): string {
  return cleanLegacyTitle(value)
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

function isProgramHeadingText(value: string): boolean {
  return /^(?:(?:Mo(?:ntag)?|Di(?:enstag)?|Mi(?:ttwoch)?|Do(?:nnerstag)?|Fr(?:eitag)?|Sa(?:mstag)?|So(?:nntag)?)[.,]?\s+\d{1,2}[.]|\d{1,2}[.]\s*(?:Tag|Abend|Etappe)\b)/iu.test(cleanText(value));
}

function nearestMeaningfulSibling(
  $: CheerioAPI,
  heading: Cheerio<AnyNode>,
  direction: "previous" | "next",
): Cheerio<AnyNode> | undefined {
  let sibling = direction === "previous" ? heading.prev() : heading.next();
  while (sibling.length) {
    const hasMedia = sibling.is("img, iframe, video, audio") || sibling.find("img, iframe, video, audio").length > 0;
    if (hasMedia || cleanText(sibling.text())) return sibling;
    sibling = direction === "previous" ? sibling.prev() : sibling.next();
  }
  return undefined;
}

function containsMedia(heading: Cheerio<AnyNode>): boolean {
  return heading.is("img, iframe, video, audio")
    || heading.find("img, iframe, video, audio").length > 0;
}

function endsSentence(value: string): boolean {
  return /[.!?](?:[”"'»)]*)$/u.test(cleanText(value));
}

function startsWithLowercaseLetter(value: string): boolean {
  const firstLetter = cleanText(value).match(/^[\p{P}\p{S}\s]*([\p{L}])/u)?.[1];
  return Boolean(
    firstLetter
    && firstLetter === firstLetter.toLocaleLowerCase("de-DE")
    && firstLetter !== firstLetter.toLocaleUpperCase("de-DE"),
  );
}

function styledHeadingRunLooksLikeSentence($: CheerioAPI, heading: Cheerio<AnyNode>): boolean {
  if (heading.attr("data-legacy-prose-heading") === "1") return true;
  if (
    containsMedia(heading)
    || endsSentence(heading.text())
    || isProgramHeadingText(heading.text())
    || !hasPresentationalHeadingStyle($, heading)
  ) return false;
  const headings: Cheerio<AnyNode>[] = [heading];
  let sibling = nearestMeaningfulSibling($, heading, "next");
  while (
    sibling?.is("h1, h2, h3, h4, h5, h6") &&
    !containsMedia(sibling) &&
    !isProgramHeadingText(sibling.text()) &&
    hasPresentationalHeadingStyle($, sibling) &&
    startsWithLowercaseLetter(sibling.text())
  ) {
    headings.push(sibling);
    if (endsSentence(sibling.text())) break;
    sibling = nearestMeaningfulSibling($, sibling, "next");
  }
  if (headings.length < 2 || !endsSentence(headings.at(-1)?.text() ?? "")) return false;
  const text = headings.map((entry) => cleanText(entry.text())).join(" ");
  const looksLikeSentence = text.split(/\s+/u).length >= 5;
  if (looksLikeSentence) {
    heading.html(headings.map((entry) => entry.html() ?? cleanText(entry.text())).join(" "));
    heading.attr("data-legacy-prose-heading", "1");
    headings.slice(1).forEach((entry) => entry.remove());
  }
  return looksLikeSentence;
}

function normalizeBody(
  $: CheerioAPI,
  rawScope: Cheerio<AnyNode>,
  title: string,
  sourceUrl: string,
  origin: string,
  duplicateTitles: readonly string[] = [title],
): { markdown: string; assets: string[]; links: string[]; altTexts: Map<string, Set<string>>; warnings: string[] } {
  const scope = rawScope.clone();
  const warnings = decodeJoomlaHiddenMail($, scope);
  scope.find("script, style, noscript, form, nav, template, .article-info, .icons, .breadcrumb, .breadcrumbs, .pagenavigation, .item-pagenav, .pagination, .pager, .readmore, .tags, [aria-hidden='true']").remove();
  scope.find("meta, link").remove();

  scope.find("h1, h2, h3, h4, h5, h6").each((_, node) => {
    const heading = $(node);
    const text = cleanText(heading.text());
    const containsMedia = heading.find("img, iframe, video, audio").length > 0;
    const identity = headingIdentity(text);
    const hasPresentationalStyle = hasPresentationalHeadingStyle($, heading);
    const duplicatesTitle = duplicateTitles.some((candidate) =>
      identity === headingIdentity(candidate) || (
        hasPresentationalStyle &&
        identity.length >= 12 &&
        headingIdentity(candidate).includes(identity)
      ),
    );
    if (!text || duplicatesTitle) {
      if (containsMedia) heading.replaceWith(heading.contents());
      else heading.remove();
      return;
    }
    const originalTag = node.tagName.toLowerCase();
    const originalLevel = Number(originalTag.slice(1)) || 2;
    const nestedInList = heading.parents("li").length > 0;
    const previousSibling = nearestMeaningfulSibling($, heading, "previous");
    const nextSibling = nearestMeaningfulSibling($, heading, "next");
    const previousHasMedia = Boolean(previousSibling?.is("img, iframe, video, audio") || previousSibling?.find("img, iframe, video, audio").length);
    const nextHasMedia = Boolean(nextSibling?.is("img, iframe, video, audio") || nextSibling?.find("img, iframe, video, audio").length);
    const sandwichedByMedia = previousHasMedia && nextHasMedia;
    const terminalImageCaption = previousHasMedia && (!nextSibling || nextSibling.is("h1, h2, h3, h4, h5, h6"));
    const programLike = isProgramHeadingText(text);
    const sentenceLike = text.split(/\s+/u).length >= 5 && /[.](?:[”"'»)]*)$/u.test(text);
    const italicPresentation = originalLevel >= 4 && heading.find("em, i").length > 0;
    const linkedPresentation = heading.find("a[href]").length > 0;
    const splitSentence = !programLike && styledHeadingRunLooksLikeSentence($, heading);
    const looksDecorative = nestedInList || (!programLike && (
      text.length > 120 ||
      sentenceLike ||
      italicPresentation ||
      linkedPresentation ||
      splitSentence ||
      (hasPresentationalStyle && (sandwichedByMedia || terminalImageCaption))
    ));
    if (looksDecorative) {
      heading.replaceWith(nestedInList ? `<span>${heading.html() ?? ""}</span>` : `<p>${heading.html() ?? ""}</p>`);
      return;
    }
    const level = Math.min(3, Math.max(2, originalLevel));
    heading.replaceWith(`<h${level}>${heading.html() ?? ""}</h${level}>`);
  });

  scope.find("span, font, strong, b, em, i, u").each((_, node) => {
    $(node).replaceWith($(node).contents());
  });
  scope.find("*").each((_, node) => {
    const element = $(node);
    for (const attribute of ["align", "border", "cellpadding", "cellspacing", "class", "height", "id", "itemprop", "role", "style", "width"]) {
      element.removeAttr(attribute);
    }
  });
  scope.find("p, div").each((_, node) => {
    const element = $(node);
    if (!cleanText(element.text()) && element.find("img, iframe, video, audio").length === 0) element.remove();
  });

  const assets: string[] = [];
  const links: string[] = [];
  const altTexts = new Map<string, Set<string>>();
  let imageIndex = 0;
  scope.find("img").each((_, node) => {
    const image = $(node);
    const candidate = image.attr("src") || image.attr("data-src") || image.attr("data-lazy-src") || image.attr("srcset")?.split(/[\s,]+/)[0];
    const assetUrl = candidate ? canonicalAssetUrl(candidate, sourceUrl, origin) : null;
    if (!assetUrl) {
      image.remove();
      return;
    }
    image.attr("src", assetUrl);
    image.removeAttr("srcset");
    image.removeAttr("data-src");
    image.removeAttr("data-lazy-src");
    const rawAlt = cleanText(image.attr("alt") ?? "");
    const alt = weakImageLabel(rawAlt)
      ? `${title} – Bild ${imageIndex + 1}`
      : humanizeImageLabel(rawAlt);
    imageIndex += 1;
    image.attr("alt", alt);
    assets.push(assetUrl);
    if (!altTexts.has(assetUrl)) altTexts.set(assetUrl, new Set());
    if (alt) altTexts.get(assetUrl)?.add(alt);
  });
  scope.find("a[href]").each((_, node) => {
    const anchor = $(node);
    const raw = anchor.attr("href") ?? "";
    if (isLikelyAsset(raw, sourceUrl)) {
      const assetUrl = canonicalAssetUrl(raw, sourceUrl, origin);
      if (assetUrl) {
        anchor.attr("href", assetUrl);
        assets.push(assetUrl);
        const label = cleanText(anchor.text());
        if (!altTexts.has(assetUrl)) altTexts.set(assetUrl, new Set());
        if (label) altTexts.get(assetUrl)?.add(label);
        return;
      }
    }
    const internal = canonicalLegacyUrl(raw, origin);
    if (internal) {
      anchor.attr("href", internal);
      links.push(internal);
      return;
    }
    try {
      const absolute = new URL(raw, sourceUrl);
      if (absolute.hostname.toLowerCase() === "theater.kolping-ramsen.de") {
        absolute.protocol = "https:";
        absolute.hostname = "kolpingtheater-ramsen.de";
        absolute.port = "";
      }
      if (["http:", "https:", "mailto:", "tel:"].includes(absolute.protocol)) anchor.attr("href", absolute.href);
      else anchor.removeAttr("href");
    } catch {
      anchor.removeAttr("href");
    }
  });
  scope.find("iframe[src]").each((_, node) => {
    const frame = $(node);
    try {
      const absolute = new URL(frame.attr("src") ?? "", sourceUrl).href;
      frame.replaceWith(`<p><a href="${absolute}">Eingebetteten Inhalt öffnen</a></p>`);
    } catch {
      frame.remove();
    }
  });
  scope.find("video, audio").each((_, node) => {
    const media = $(node);
    const raw = media.attr("src") || media.find("source[src]").first().attr("src");
    if (!raw) {
      media.replaceWith(media.contents());
      return;
    }
    try {
      const absolute = new URL(raw, sourceUrl);
      if (!["http:", "https:"].includes(absolute.protocol)) throw new Error("unsupported media URL");
      const label = node.tagName.toLowerCase() === "video" ? "Video öffnen" : "Audio abspielen";
      media.replaceWith(`<p><a href="${absolute.href}">${label}</a></p>`);
    } catch {
      media.replaceWith(media.contents());
    }
  });

  const service = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
    strongDelimiter: "**",
  });
  addMarkdownTableRule(service);
  service.addRule("dropJoomlaEmpty", {
    filter: (node) => ["DIV", "P", "SECTION"].includes(node.nodeName) && cleanText(node.textContent ?? "") === "" && !node.querySelector("img"),
    replacement: () => "",
  });
  const markdown = cleanMarkdown(service.turndown(scope.html() ?? ""));
  if (/<\/?[a-z][^>]*>/iu.test(markdown)) warnings.push("Nach der Normalisierung ist noch rohes HTML vorhanden.");
  if (markdown.length < 20) warnings.push("Der normalisierte Inhalt ist sehr kurz.");
  return {
    markdown,
    assets: uniqueSorted(assets),
    links: uniqueSorted(links),
    altTexts,
    warnings,
  };
}

function articleBody(scope: Cheerio<AnyNode>): Cheerio<AnyNode> {
  const body = scope.find(".com-content-article__body, .item-content").first();
  return body.length ? body : scope;
}

function recordSourceUrl($: CheerioAPI, scope: Cheerio<AnyNode>, pageUrl: string, origin: string): string {
  for (const node of scope.find(".page-header a[href], h1 a[href], h2 a[href], h3 a[href], a[itemprop='url']").toArray()) {
    const candidate = canonicalLegacyUrl($(node).attr("href") ?? "", origin);
    if (candidate) return candidate;
  }
  return pageUrl;
}

function makeRecord(
  $: CheerioAPI,
  scope: Cheerio<AnyNode>,
  pageUrl: string,
  origin: string,
  fallbackTitle: string,
  decisions: MigrationDecisions | undefined,
  isCollectionItem: boolean,
): RecordExtraction {
  const sourceUrl = recordSourceUrl($, scope, pageUrl, origin);
  const publishedDate = parsePublishedDate(scope);
  const sourceDecision = sourceUrl === pageUrl ? undefined : routeDecision(sourceUrl, decisions);
  const decision = sourceDecision ?? routeDecision(pageUrl, decisions) ?? routeDecision(sourceUrl, decisions);
  const titleResult = itemTitle($, scope, fallbackTitle, publishedDate);
  const normalized = normalizeBody($, articleBody(scope), titleResult.title, sourceUrl, origin, [titleResult.title]);
  const exclusion = recordExclude(sourceUrl, publishedDate, titleResult.title, decisions)
    ?? recordExclude(pageUrl, publishedDate, titleResult.title, decisions);
  if (exclusion) {
    const sourceFingerprint = sha256(stableJson({
      publishedDate: publishedDate ?? null,
      detectedTitle: titleResult.title,
      markdown: normalized.markdown,
      assetUrls: normalized.assets,
      internalLinks: normalized.links,
    }));
    if (sourceFingerprint !== exclusion.sourceFingerprint) {
      return {
        record: buildRecord(),
        assetUrls: normalized.assets,
        exclusion: {
          severity: "error",
          owner: `record-exclude:${exclusion.sourcePath}#${exclusion.publishedDate}-${exclusion.detectedTitle}`,
          message: `Ausschluss-Fingerprint ist gedriftet: erwartet ${exclusion.sourceFingerprint}, erfasst ${sourceFingerprint}. Der Datensatz wurde nicht ausgeschlossen.`,
        },
      };
    }
    return {
      assetUrls: normalized.assets,
      exclusionApplication: {
        decisionSourcePath: exclusion.sourcePath,
        publishedDate: exclusion.publishedDate,
        detectedTitle: exclusion.detectedTitle,
        sourceUrl,
        sourcePageUrl: pageUrl,
        sourceFingerprint,
        assetUrls: normalized.assets,
      },
      exclusion: {
        severity: "info",
        owner: `record-exclude:${exclusion.sourcePath}#${exclusion.publishedDate}-${exclusion.detectedTitle}`,
        message: `Legacy-Datensatz bewusst ausgeschlossen: ${exclusion.reason}`,
      },
    };
  }

  return { record: buildRecord(), assetUrls: normalized.assets };

  function buildRecord(): LegacyRecord {
  const override = recordOverride(sourceUrl, publishedDate, titleResult.title, decisions)
    ?? recordOverride(pageUrl, publishedDate, titleResult.title, decisions);
  const title = override?.title ?? decision?.title ?? titleResult.title;
  const kind = decision?.kind ?? "page";
  const target = override
    ? { targetPath: override.targetPath }
    : targetFor(decision, kind, title, sourceUrl, isCollectionItem, publishedDate);
  const finalNormalized = title === titleResult.title
    ? normalized
    : normalizeBody($, articleBody(scope), title, sourceUrl, origin, [titleResult.title, title]);
  const digest = sha256([kind, title, publishedDate ?? "", finalNormalized.markdown].join("\n\0\n"));
  const stableHint = finalNormalized.assets[0]
    ? slugifyLegacyTitle(new URL(finalNormalized.assets[0]).pathname.split("/").pop() ?? "asset")
    : digest.slice("sha256:".length, "sha256:".length + 12);
  const sourceIdentity = sourceUrl !== pageUrl
    ? `url:${sourcePath(sourceUrl)}`
    : `article:${new URL(pageUrl).pathname}#${publishedDate ?? "undated"}-${slugifyLegacyTitle(title)}-${stableHint}`;
  const warnings = uniqueSorted([
    ...finalNormalized.warnings,
    ...(titleResult.warning && !decision?.title && !override ? [titleResult.warning] : []),
    ...(target.warning ? [target.warning] : []),
  ]);
  const excerpt = cleanText(finalNormalized.markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/gmu, "")
    .replace(/[*_~`|]/g, " ")).slice(0, 240);
  return {
      sourceKey: sourceIdentity,
      sourceUrls: [sourceUrl],
      sourcePageUrls: [pageUrl],
      canonicalSource: Boolean(decision && !decision.collection),
      kind,
      targetPath: target.targetPath,
      title,
      ...(publishedDate ? { publishedDate } : {}),
      markdown: finalNormalized.markdown,
      excerpt,
      assetUrls: finalNormalized.assets,
      internalLinks: finalNormalized.links,
      digest,
      warnings,
  };
  }
}

type EventDraft = {
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  description: string;
};

function validCivilDate(year: number, month: number, day: number): string | null {
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseEventHeading(value: string, year: number): EventDraft | null {
  const text = cleanText(value).replace(/[„“]/g, '"');
  const match = text.match(
    /^(?:Mo|Di|Mi|Do|Fr|Sa|So)\.\s*(\d{1,2})\.\s*(?:(\d{1,2})\.?)?\s*(?:([&–-])\s*(?:(?:Mo|Di|Mi|Do|Fr|Sa|So)\.\s*)?(\d{1,2})\.(\d{1,2})\.?)?\s*(.*)$/iu,
  );
  if (!match) return null;
  const firstDay = Number(match[1]);
  const firstMonth = Number(match[2] ?? match[5]);
  const startDate = validCivilDate(year, firstMonth, firstDay);
  if (!startDate) return null;
  const endDate = match[4] && match[5] ? validCivilDate(year, Number(match[5]), Number(match[4])) ?? undefined : undefined;
  let remainder = cleanText(match[6] ?? "");
  const time = remainder.match(/^(\d{1,2})[:.](\d{2})(?:\s*[–-]\s*(\d{1,2})[:.](\d{2}))?\s*Uhr\b\s*/iu)
    ?? remainder.match(/^(\d{1,2})\s*Uhr\b\s*/iu);
  let startTime: string | undefined;
  let endTime: string | undefined;
  if (time) {
    startTime = `${time[1].padStart(2, "0")}:${(time[2] ?? "00").padStart(2, "0")}`;
    if (time[3]) endTime = `${time[3].padStart(2, "0")}:${(time[4] ?? "00").padStart(2, "0")}`;
    remainder = cleanText(remainder.slice(time[0].length));
  }
  return {
    startDate,
    ...(endDate ? { endDate } : {}),
    ...(startTime ? { startTime } : {}),
    ...(endTime ? { endTime } : {}),
    description: remainder,
  };
}

function inferEventLocation(description: string): string | undefined {
  const locations: Array<[RegExp, string]> = [
    [/Pfarrheim/iu, "Pfarrheim"],
    [/Eistalhalle/iu, "Eistalhalle"],
    [/Kolpingwiese/iu, "Kolpingwiese"],
    [/Grünstadt/iu, "Grünstadt"],
    [/Park von Dirmstein/iu, "Park von Dirmstein"],
    [/Kloster Sion/iu, "Kloster Sion"],
    [/Niederschlettenbach/iu, "Niederschlettenbach"],
    [/Bad Sobernheim/iu, "Bad Sobernheim"],
    [/Heßheim/iu, "Heßheim"],
    [/Ev\. Kirche/iu, "Ev. Kirche"],
    [/Pfarrkirche/iu, "Pfarrkirche"],
    [/Mariengrotte/iu, "Mariengrotte Ramsen"],
  ];
  return locations.find(([pattern]) => pattern.test(description))?.[1];
}

function eventTitle(description: string): string {
  const boundaries = [
    /\s+im Pfarrheim\b/iu,
    /\s+in der Eistalhalle\b/iu,
    /\s+auf der Kolpingwiese\b/iu,
    /\s+in Grünstadt\b/iu,
    /\s+im Park von Dirmstein\b/iu,
    /\s+in Ramsen an der Mariengrotte\b/iu,
    /\s+in Niederschlettenbach\b/iu,
    /\s+\((?:Next Generation|Jugend|Blaskapelle|VG Eisenberg|Kath\.)/iu,
    /\s+anschl\./iu,
  ];
  let end = description.length;
  for (const boundary of boundaries) {
    const index = description.search(boundary);
    if (index >= 0) end = Math.min(end, index);
  }
  return cleanText(description.slice(0, end).replace(/^[-–—:]+\s*/u, "")) || "Termin";
}

function extractEventRecords(
  $: CheerioAPI,
  scope: Cheerio<AnyNode>,
  pageUrl: string,
): LegacyRecord[] {
  const headings = articleBody(scope).find("h1, h2, h3, h4").toArray();
  let year: number | undefined;
  const drafts: EventDraft[] = [];
  for (const node of headings) {
    const text = cleanText($(node).text());
    const yearMatch = text.match(/Jahresprogramm\s+für\s+(20\d{2})/iu);
    if (yearMatch) {
      year = Number(yearMatch[1]);
      continue;
    }
    if (!year) continue;
    const parsed = parseEventHeading(text, year);
    if (parsed) {
      drafts.push(parsed);
      continue;
    }
    if (drafts.length && text) drafts[drafts.length - 1].description = cleanText(`${drafts[drafts.length - 1].description} ${text}`);
  }
  return drafts.map((draft): LegacyRecord => {
    const title = eventTitle(draft.description);
    const location = inferEventLocation(draft.description);
    const event = {
      startDate: draft.startDate,
      ...(draft.endDate ? { endDate: draft.endDate } : {}),
      ...(draft.startTime ? { startTime: draft.startTime } : {}),
      ...(draft.endTime ? { endTime: draft.endTime } : {}),
      ...(location ? { location } : {}),
    };
    const timeLabel = draft.startTime
      ? `${draft.startTime}${draft.endTime ? `–${draft.endTime}` : ""} Uhr — `
      : "";
    const markdown = `${timeLabel}${draft.description}`;
    const digest = sha256(["event", title, stableEvent(event), markdown].join("\n\0\n"));
    const slug = slugifyLegacyTitle(title);
    return {
      sourceKey: `event:${draft.startDate}:${slug}`,
      sourceUrls: [pageUrl],
      sourcePageUrls: [pageUrl],
      kind: "event",
      targetPath: `/termine/${draft.startDate}-${slug}`,
      title,
      event,
      markdown,
      excerpt: cleanText(markdown).slice(0, 240),
      assetUrls: [],
      internalLinks: [],
      digest,
      warnings: /\?{3,}/u.test(markdown) ? ["Termin enthält einen ungeklärten Platzhalter."] : [],
    };
  });
}

function stableEvent(event: NonNullable<LegacyRecord["event"]>): string {
  return [event.startDate, event.endDate ?? "", event.startTime ?? "", event.endTime ?? "", event.location ?? ""].join("|");
}

export function extractLegacyPage(
  html: string,
  pageUrl: string,
  origin: string,
  decisions?: MigrationDecisions,
): NormalizedPage {
  const $ = cheerio.load(html);
  const fallbackTitle = pageTitle($);
  const pageLinks = uniqueSorted(
    $("a[href]")
      .toArray()
      .map((node) => canonicalLegacyUrl($(node).attr("href") ?? "", origin))
      .filter((value): value is string => Boolean(value)),
  );

  const pageDecision = routeDecision(pageUrl, decisions);
  if (pageDecision?.kind === "event" && pageDecision.collection) {
    const eventScope = $("main .blog-item, main .item-page, main article").first();
    const records = eventScope.length ? extractEventRecords($, eventScope, pageUrl) : [];
    const findings: SnapshotFinding[] = records.length
      ? []
      : [{ severity: "error", owner: pageUrl, message: "Termin-Collection erkannt, aber keine datierten Termine extrahiert." }];
    return { records, pageLinks, assetUrls: [], assetAltTexts: new Map(), findings, recordExclusions: [] };
  }

  const articleScopes = $("main .blog-item, main .item-page, main article").toArray();
  let scopes: Cheerio<AnyNode>[];
  let isCollection = false;
  if ($("main .blog-item").length > 0) {
    const blogScopes = $("main .blog-item").toArray().map((node) => $(node));
    if (pageDecision && !pageDecision.collection) {
      scopes = [blogScopes.find((scope) => itemTitle($, scope, fallbackTitle, parsePublishedDate(scope)).title.localeCompare(fallbackTitle, "de", { sensitivity: "base" }) === 0)
        ?? [...blogScopes].sort((left, right) => cleanText(right.text()).length - cleanText(left.text()).length)[0]];
    } else {
      scopes = blogScopes;
      isCollection = true;
    }
  } else if ($("main .item-page").length > 0) {
    scopes = [$("main .item-page").first()];
  } else if ($("main article").length > 0) {
    scopes = [$("main article").first()];
  } else {
    const main = $("main").first();
    scopes = main.length ? [main] : [];
  }

  const findings: SnapshotFinding[] = [];
  if (scopes.length === 0 || articleScopes.length === 0 && cleanText(scopes[0]?.text() ?? "").length < 20) {
    findings.push({ severity: "warning", owner: pageUrl, message: "Kein plausibler Joomla-Inhaltsbereich gefunden." });
  }
  const extracted = scopes
    .map((scope, index) => makeRecord($, scope, pageUrl, origin, `${fallbackTitle}${scopes.length > 1 ? ` ${index + 1}` : ""}`, decisions, isCollection));
  findings.push(...extracted.flatMap((result) => result.exclusion ? [result.exclusion] : []));
  const records = extracted
    .flatMap((result) => result.record ? [result.record] : [])
    .filter((record) => record.markdown.length > 0 || record.assetUrls.length > 0);
  const recordExclusions = extracted.flatMap((result) => result.exclusionApplication ? [result.exclusionApplication] : []);

  const assetAltTexts = new Map<string, Set<string>>();
  for (const scope of scopes) {
    scope.find("img").each((_, node) => {
      const raw = $(node).attr("src") || $(node).attr("data-src") || $(node).attr("data-lazy-src");
      const url = raw ? canonicalAssetUrl(raw, pageUrl, origin) : null;
      if (!url) return;
      if (!assetAltTexts.has(url)) assetAltTexts.set(url, new Set());
      const alt = cleanText($(node).attr("alt") ?? "");
      if (alt) assetAltTexts.get(url)?.add(alt);
    });
  }

  return {
    records,
    pageLinks,
    assetUrls: uniqueSorted(extracted.flatMap((result) => result.assetUrls ?? [])),
    assetAltTexts,
    findings,
    recordExclusions,
  };
}
