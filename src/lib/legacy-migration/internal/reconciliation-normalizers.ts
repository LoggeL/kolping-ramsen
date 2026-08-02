export class ReconciliationDriftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReconciliationDriftError";
  }
}

export type AssociationDataReconciliationInput = Readonly<{
  currentMarkdown: string;
  sourceMarkdown: string;
}>;

export type CampHistoryReconciliationInput = Readonly<{
  sourceMarkdown: string;
  sourceTitle: string;
}>;

export type ParishHallReconciliationInput = Readonly<{
  currentMarkdown: string;
  sourceMarkdown: string;
  unavailableSourceImageUrls: readonly string[];
}>;

type MarkdownImage = Readonly<{
  alt: string;
  destination: string;
}>;

const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"([^"]*)")?\)/gu;

const ASSOCIATION_SOURCE_HEADINGS = [
  "Gründungsversammlung am 29. April 1953 im Pfarrsaal",
  "des Schwesternhauses in Ramsen, Klosterhof 7",
  "Gründungsvorstand (29.04.1953)",
  "Gründungsmitglieder (06.12.1953)",
  "Gruppe Kolping:",
  "Gruppe Altkolping:",
  "Präses der Kolpingsfamilie:",
  "Senioren:",
  "Altsenioren:",
  "1. Vorsitzende",
  "2. Vorsitzende",
  "Leitungsteam",
  "Familienkreis",
  'Familienkreis "Next Generation"',
  "Jungkolpinggruppe/ Gruppenführer/Vertreter der Jugend",
  "Ehrenpräses der Kolpingsfamilie",
  "Ehrenmitglieder der Kolpingsfamilie:",
  "Verleihung der Pirminius Plakette",
  "Verleihung der Diözesan - Ehrenurkunde:",
  "Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland",
  "Verleihung der Ehrennadel in Gold von der Gemeinde Ramsen",
  "Besondere chronologische Daten:",
  "Bau und Renovierungsarbeiten",
] as const;

const ASSOCIATION_NESTED_HEADINGS = new Set([
  "Gruppe Kolping:",
  "Gruppe Altkolping:",
]);

const ASSOCIATION_DATE_LIST_SECTIONS = new Set([
  "Präses der Kolpingsfamilie:",
  "Senioren:",
  "Altsenioren:",
  'Familienkreis "Next Generation"',
  "Ehrenpräses der Kolpingsfamilie",
  "Verleihung der Diözesan - Ehrenurkunde:",
  "Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland",
]);

const ASSOCIATION_TITLE_KEYS = new Set([
  "relevante vereinsdaten",
  "relevante vereins daten",
]);

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ReconciliationDriftError(message);
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ").trim();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanHeading(value: string): string {
  return normalizeWhitespace(value
    .replace(/\\\./g, ".")
    .replace(/^[*_`~]+|[*_`~]+$/g, "")
    .replace(/(?<!\\)\*{2,}/gu, ""));
}

function headingKey(value: string): string {
  return cleanHeading(value)
    .toLocaleLowerCase("de")
    .replace(/[^a-z0-9äöüß]+/gu, " ")
    .trim();
}

function headingText(block: string): string | null {
  const match = block.trim().match(/^#{1,6}\s+(.+?)\s*#*$/u);
  return match ? cleanHeading(match[1]) : null;
}

function blocks(markdown: string): string[] {
  return normalizeNewlines(markdown)
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .filter(Boolean);
}

function parseImages(markdown: string): MarkdownImage[] {
  return Array.from(normalizeNewlines(markdown).matchAll(MARKDOWN_IMAGE_RE), (match) => ({
    alt: match[1],
    destination: match[2] ?? match[3],
  }));
}

function isLocalDestination(destination: string): boolean {
  return destination.startsWith("/") && !destination.startsWith("//");
}

function replaceImageDestinations(markdown: string, destinations: readonly MarkdownImage[]): string {
  let index = 0;
  const replaced = markdown.replace(MARKDOWN_IMAGE_RE, (_whole, alt: string) => {
    const replacement = destinations[index];
    invariant(replacement, `Lokales Bild-Mapping fehlt an Position ${index + 1}.`);
    invariant(
      normalizeWhitespace(alt) === normalizeWhitespace(replacement.alt),
      `Bildreihenfolge ist gedriftet: „${alt}“ statt „${replacement.alt}“.`,
    );
    invariant(isLocalDestination(replacement.destination), `Bildziel ist nicht lokal: ${replacement.destination}`);
    index += 1;
    return `![${alt}](${replacement.destination})`;
  });
  invariant(index === destinations.length, "Aktuelles Markdown enthält zusätzliche, nicht zuordenbare Bilder.");
  return replaced;
}

function semanticText(markdown: string): string {
  return normalizeWhitespace(markdown
    .replace(MARKDOWN_IMAGE_RE, "$1")
    .replace(/\[([^\]]+)\]\((?:<[^>]+>|[^)]+)\)/gu, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gmu, "")
    .replace(/^\s*[-+*]\s+/gmu, "")
    .replace(/^\s*>\s?/gmu, "")
    .replace(/\\\./g, ".")
    .replace(/[*_`~]/g, ""));
}

function removeAssociationTitle(sourceBlocks: string[]): string[] {
  if (sourceBlocks.length === 0) return sourceBlocks;
  const firstHeading = headingText(sourceBlocks[0]);
  if (!firstHeading || !ASSOCIATION_TITLE_KEYS.has(headingKey(firstHeading))) return sourceBlocks;
  return sourceBlocks.slice(1);
}

function isDateEntry(value: string): boolean {
  return /^\d{2}\.\s?\d{2}\.\d{4}\b/u.test(value.trim());
}

function normalizeAssociationContentBlock(block: string, section: string): string {
  const output: string[] = [];
  for (const originalLine of block.split("\n")) {
    const trimmed = originalLine.trim();
    const listItem = trimmed.match(/^[-+*]\s+(.*)$/u);
    if (listItem) {
      const content = normalizeWhitespace(listItem[1]);
      if (section === "Bau und Renovierungsarbeiten" && !/^\d/u.test(content)) {
        const previousIndex = output.length - 1;
        invariant(previousIndex >= 0 && output[previousIndex].startsWith("- "), "Bau-Fortsetzung besitzt keinen vorherigen Listenpunkt.");
        invariant(output[previousIndex].endsWith("unter der"), `Unerwartete Bau-Fortsetzung: ${content}`);
        invariant(content === "Leitung von Steinmetz Karl Böhm", `Unbekannte Bau-Fortsetzung: ${content}`);
        output[previousIndex] = `${output[previousIndex]} ${content}`;
        continue;
      }
      output.push(`- ${content}`);
      continue;
    }
    if (ASSOCIATION_DATE_LIST_SECTIONS.has(section) && isDateEntry(trimmed)) {
      output.push(`- ${normalizeWhitespace(trimmed)}`);
      continue;
    }
    output.push(normalizeWhitespace(trimmed));
  }
  return output.join("\n");
}

function collapseListGaps(markdown: string): string {
  const lines = markdown.split("\n");
  return lines.filter((line, index) => {
    if (line !== "") return true;
    const previous = lines[index - 1]?.trim() ?? "";
    const next = lines[index + 1]?.trim() ?? "";
    return !(previous.startsWith("- ") && next.startsWith("- "));
  }).join("\n");
}

/**
 * Reconciles the sealed Vereinsdaten source with the existing local media map.
 * Source text is authoritative; only Markdown structure and image destinations
 * change. Unexpected headings, list continuations or image order fail closed.
 */
export function reconcileAssociationDataMarkdown(input: AssociationDataReconciliationInput): string {
  const currentImages = parseImages(input.currentMarkdown);
  const sourceWithoutTitle = removeAssociationTitle(blocks(input.sourceMarkdown));
  const sourceHeadings = sourceWithoutTitle.flatMap((block) => {
    const heading = headingText(block);
    return heading ? [heading] : [];
  });
  invariant(
    sourceHeadings.length === ASSOCIATION_SOURCE_HEADINGS.length
      && sourceHeadings.every((heading, index) => heading === ASSOCIATION_SOURCE_HEADINGS[index]),
    `Vereinsdaten-Überschriften sind gedriftet: ${sourceHeadings.join(" | ")}`,
  );
  invariant(currentImages.length === 2, `Vereinsdaten erwarten zwei lokale Bilder, gefunden: ${currentImages.length}.`);
  invariant(parseImages(sourceWithoutTitle.join("\n\n")).length === currentImages.length, "Quell- und aktuelle Bildanzahl stimmen nicht überein.");

  const outputBlocks: string[] = [];
  let section = "";
  for (let index = 0; index < sourceWithoutTitle.length; index += 1) {
    const block = sourceWithoutTitle[index];
    const heading = headingText(block);
    if (heading === ASSOCIATION_SOURCE_HEADINGS[0]) {
      const continuation = headingText(sourceWithoutTitle[index + 1] ?? "");
      invariant(continuation === ASSOCIATION_SOURCE_HEADINGS[1], "Die geteilte Gründungsüberschrift ist gedriftet.");
      const merged = `${heading} ${continuation}`;
      outputBlocks.push(`## ${merged}`);
      section = merged;
      index += 1;
      continue;
    }
    if (heading) {
      section = heading;
      outputBlocks.push(`${ASSOCIATION_NESTED_HEADINGS.has(heading) ? "###" : "##"} ${heading}`);
      continue;
    }
    outputBlocks.push(normalizeAssociationContentBlock(block, section));
  }

  const structuredSource = collapseListGaps(outputBlocks.join("\n\n"));
  const result = replaceImageDestinations(structuredSource, currentImages).trim();
  invariant(
    semanticText(result) === semanticText(sourceWithoutTitle.join("\n\n")),
    "Vereinsdaten-Normalisierung hat Quellfakten verändert oder verloren.",
  );
  return result;
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function campSourceWithoutTitle(sourceMarkdown: string, sourceTitle: string): string[] {
  const sourceBlocks = blocks(sourceMarkdown);
  const firstHeading = headingText(sourceBlocks[0] ?? "");
  if (firstHeading && headingKey(firstHeading) === headingKey(sourceTitle)) return sourceBlocks.slice(1);
  return sourceBlocks;
}

/** Converts every sealed Zeltlager record into one accessible table row. */
export function reconcileCampHistoryMarkdown(input: CampHistoryReconciliationInput): string {
  const sourceTitle = cleanHeading(input.sourceTitle);
  invariant(sourceTitle.length > 0, "Zeltlager-Quelltitel fehlt.");
  const sourceBlocks = campSourceWithoutTitle(input.sourceMarkdown, sourceTitle);
  invariant(sourceBlocks.length > 0, "Zeltlager-Quelle enthält keine Einträge.");

  if (sourceBlocks.length === 1 && sourceBlocks[0].startsWith("| Nr. | Zeitraum | Lager / Hinweis |\n")) {
    const tableLines = sourceBlocks[0].split("\n");
    invariant(tableLines[1] === "| ---: | --- | --- |", "Zeltlager-Tabellenkopf ist gedriftet.");
    const dataRows = tableLines.slice(2);
    invariant(dataRows.length === 52, `Zeltlager-Tabelle erwartet 52 Einträge, gefunden: ${dataRows.length}.`);
    const canonicalNumbered = dataRows.flatMap((line) => {
      const match = line.match(/^\| (\d{2})\. \|/u);
      return match ? [Number(match[1])] : [];
    });
    invariant(
      canonicalNumbered.length === 43 && canonicalNumbered.every((value, index) => value === index + 1),
      "Bereits strukturierte Zeltlager-Tabelle besitzt keine vollständige Nummernfolge.",
    );
    return [`## ${sourceTitle}`, "", sourceBlocks[0]].join("\n");
  }

  const numbered: number[] = [];
  const rows = sourceBlocks.map((sourceBlock, index) => {
    invariant(!headingText(sourceBlock), `Unerwartete Überschrift im Zeltlager-Eintrag ${index + 1}.`);
    let line = sourceBlock.replace(/\s*\n\s*/g, " ").trim();
    let ordinal = "–";
    const ordinalMatch = line.match(/^(\d{2})\\?\.\s{2,}/u);
    if (ordinalMatch) {
      ordinal = `${ordinalMatch[1]}.`;
      numbered.push(Number(ordinalMatch[1]));
      line = line.slice(ordinalMatch[0].length).trim();
    }
    const entry = line.match(/^(.*?\d{4})\s{2,}(.+)$/u);
    invariant(entry, `Zeltlager-Eintrag ${index + 1} ist nicht eindeutig teilbar: ${line}`);
    const period = normalizeWhitespace(entry[1]);
    const description = normalizeWhitespace(entry[2]);
    invariant(period.length > 0 && description.length > 0, `Zeltlager-Eintrag ${index + 1} ist unvollständig.`);
    return `| ${ordinal} | ${escapeTableCell(period)} | ${escapeTableCell(description)} |`;
  });

  invariant(
    numbered.length === 43 && numbered.every((value, index) => value === index + 1),
    `Nummerierte Zeltlagerfolge ist unvollständig: ${numbered.join(", ")}`,
  );
  invariant(rows.length === sourceBlocks.length, "Zeltlager-Normalisierung hat Einträge verloren.");

  return [
    `## ${sourceTitle}`,
    "",
    "| Nr. | Zeitraum | Lager / Hinweis |",
    "| ---: | --- | --- |",
    ...rows,
  ].join("\n");
}

function imageBasename(destination: string): string {
  try {
    const pathname = new URL(destination, "https://local.invalid").pathname;
    return decodeURIComponent(pathname.slice(pathname.lastIndexOf("/") + 1)).toLocaleLowerCase("de");
  } catch {
    throw new ReconciliationDriftError(`Ungültiges Bildziel: ${destination}`);
  }
}

function sourceGalleryPairs(sourceMarkdown: string): Array<MarkdownImage & { caption: string }> {
  const sourceBlocks = blocks(sourceMarkdown);
  const pairs: Array<MarkdownImage & { caption: string }> = [];
  for (let index = 0; index < sourceBlocks.length; index += 1) {
    const sourceBlock = sourceBlocks[index];
    const images = parseImages(sourceBlock);
    if (images.length === 0) continue;
    invariant(images.length === 1 && sourceBlock.match(MARKDOWN_IMAGE_RE)?.[0] === sourceBlock.trim(), "Pfarrheim-Quellbild steht nicht in einem eigenen Block.");
    const caption = sourceBlocks[index + 1]?.trim() ?? "";
    invariant(caption.length > 0 && parseImages(caption).length === 0 && !headingText(caption), `Pfarrheim-Bild „${images[0].alt}“ besitzt keine eindeutige Beschriftung.`);
    invariant(!/^\*?Die Adresse des Pfarrheims:/u.test(caption), `Pfarrheim-Bild „${images[0].alt}“ besitzt keine Bildbeschriftung.`);
    pairs.push({ ...images[0], caption: normalizeWhitespace(caption) });
    index += 1;
  }
  return pairs;
}

function currentParishHallHistory(currentMarkdown: string): { history: string; address: string } {
  const lines = normalizeNewlines(currentMarkdown).split("\n");
  const tableStart = lines.findIndex((line) => line.trim() === "| Jahr | Ereignis |");
  invariant(tableStart >= 0, "Bereinigte Pfarrheim-Historientabelle fehlt.");
  let tableEnd = tableStart;
  while (tableEnd + 1 < lines.length && lines[tableEnd + 1].trim().startsWith("|")) tableEnd += 1;
  invariant(tableEnd > tableStart + 1, "Pfarrheim-Historientabelle ist unvollständig.");

  const addresses = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => /^\*?Die Adresse des Pfarrheims:\s*Klosterhof 7\*?$/u.test(line));
  invariant(addresses.length === 1, `Pfarrheim-Adresse ist nicht eindeutig: ${addresses.length} Treffer.`);
  invariant(addresses[0].index > tableEnd, "Pfarrheim-Adresse steht unerwartet vor der Historie.");

  const historyLines = lines.slice(0, tableEnd + 1);
  const firstContent = historyLines.findIndex((line) => line.trim().length > 0);
  invariant(firstContent >= 0, "Pfarrheim-Historie ist leer.");
  const title = historyLines[firstContent].match(/^#{1,6}\s+(.+)$/u);
  invariant(title, "Pfarrheim-Historie besitzt keine Überschrift.");
  historyLines[firstContent] = `## ${cleanHeading(title[1])}`;
  const history = historyLines.join("\n").trim();
  invariant(parseImages(history).length === 0, "Pfarrheim-Historienkopf enthält unerwartete Bilder.");
  return { history, address: addresses[0].line };
}

function escapeImageAlt(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\]/g, "\\]");
}

function escapeImageTitle(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Keeps the editorially cleaned Pfarrheim history/address, then rebuilds the
 * gallery from source order and the current local image mapping.
 */
export function reconcileParishHallMarkdown(input: ParishHallReconciliationInput): string {
  const current = currentParishHallHistory(input.currentMarkdown);
  const sourcePairs = sourceGalleryPairs(input.sourceMarkdown);
  invariant(sourcePairs.length === 4, `Pfarrheim-Quelle erwartet vier Bild-Slots, gefunden: ${sourcePairs.length}.`);

  const unavailable = new Set(input.unavailableSourceImageUrls);
  invariant(unavailable.size === input.unavailableSourceImageUrls.length, "Pfarrheim-Ausfallliste enthält Duplikate.");
  const sourceDestinations = new Set(sourcePairs.map((pair) => pair.destination));
  for (const destination of unavailable) {
    invariant(sourceDestinations.has(destination), `Unbekanntes ausgefallenes Pfarrheim-Bild: ${destination}`);
  }

  const currentImages = parseImages(input.currentMarkdown);
  const localByBasename = new Map<string, MarkdownImage>();
  for (const image of currentImages) {
    invariant(isLocalDestination(image.destination), `Pfarrheim-Bildziel ist nicht lokal: ${image.destination}`);
    const basename = imageBasename(image.destination);
    invariant(!localByBasename.has(basename), `Doppeltes lokales Pfarrheim-Bild: ${basename}`);
    localByBasename.set(basename, image);
  }

  const unavailablePairs = sourcePairs.filter((pair) => unavailable.has(pair.destination));
  const availablePairs = sourcePairs.filter((pair) => !unavailable.has(pair.destination));
  invariant(unavailablePairs.length === 1 && sourcePairs[0] === unavailablePairs[0], "Das bekannte fehlende Pfarrheim-Bild muss der erste Quell-Slot sein.");
  invariant(availablePairs.length === 3, `Pfarrheim-Galerie erwartet drei verfügbare Bilder, gefunden: ${availablePairs.length}.`);

  const missingBasename = imageBasename(unavailablePairs[0].destination);
  invariant(!localByBasename.has(missingBasename), `Als fehlend markiertes Pfarrheim-Bild ist lokal vorhanden: ${missingBasename}`);
  const gallery = availablePairs.map((pair) => {
    const local = localByBasename.get(imageBasename(pair.destination));
    invariant(local, `Lokales Pfarrheim-Bild fehlt für ${pair.destination}.`);
    return `![${escapeImageAlt(pair.caption)}](${local.destination} "${escapeImageTitle(pair.caption)}")`;
  });
  invariant(localByBasename.size === availablePairs.length, "Aktuelles Pfarrheim-Markdown enthält zusätzliche Bilder außerhalb der Quellgalerie.");

  return [
    current.history,
    "",
    "## Einblicke in das Pfarrheim",
    "",
    `> ${unavailablePairs[0].caption} – das zugehörige Bild ist an der Quelle nicht mehr verfügbar.`,
    "",
    ...gallery.flatMap((image, index) => index === 0 ? [image] : ["", image]),
    "",
    current.address,
  ].join("\n").trim();
}

function markdownWithAssetMap(sourceMarkdown: string, assets: ReadonlyMap<string, string>): string {
  const sourceImages = parseImages(sourceMarkdown);
  invariant(sourceImages.length === assets.size, `Asset-Mapping ist unvollständig (${assets.size}/${sourceImages.length}).`);
  let mapped = 0;
  const result = normalizeNewlines(sourceMarkdown).replace(MARKDOWN_IMAGE_RE, (_whole, alt: string, bracketed: string | undefined, plain: string | undefined) => {
    const sourceUrl = bracketed ?? plain;
    invariant(sourceUrl, "Quellbild besitzt kein Ziel.");
    const localPath = assets.get(sourceUrl);
    invariant(localPath, `Lokales Asset-Mapping fehlt für ${sourceUrl}.`);
    invariant(isLocalDestination(localPath), `Gemapptes Asset ist nicht lokal: ${localPath}`);
    mapped += 1;
    return `![${alt}](${localPath})`;
  });
  invariant(mapped === assets.size, "Asset-Mapping enthält nicht verwendete Einträge.");
  return result;
}

/** Generator adapter for a sealed Vereinsdaten source and its verified assets. */
export function normalizeAssociationData(sourceMarkdown: string, assets: ReadonlyMap<string, string>): string {
  return reconcileAssociationDataMarkdown({
    currentMarkdown: markdownWithAssetMap(sourceMarkdown, assets),
    sourceMarkdown,
  });
}

/** Generator adapter for the canonical Zeltlager record. */
export function normalizeCampHistory(sourceMarkdown: string): string {
  return reconcileCampHistoryMarkdown({
    sourceMarkdown,
    sourceTitle: "Familien-Zeltlager Historie der Kolpingfamilie Ramsen",
  });
}

/** Generator adapter that derives the explicitly missing source slot from the verified asset map. */
export function reconcilePfarrheimGallery(
  currentMarkdown: string,
  sourceMarkdown: string,
  assets: ReadonlyMap<string, string>,
): string {
  const sourceImages = parseImages(sourceMarkdown);
  const unavailableSourceImageUrls = sourceImages
    .map((image) => image.destination)
    .filter((destination) => !assets.has(destination));
  invariant(sourceImages.length === assets.size + unavailableSourceImageUrls.length, "Pfarrheim-Asset-Mapping ist nicht eindeutig.");

  const currentByBasename = new Map(parseImages(currentMarkdown).map((image) => [imageBasename(image.destination), image.destination]));
  for (const [sourceUrl, localPath] of assets) {
    invariant(sourceImages.some((image) => image.destination === sourceUrl), `Pfarrheim-Mapping enthält unbekannte Quelle: ${sourceUrl}`);
    invariant(isLocalDestination(localPath), `Pfarrheim-Mapping ist nicht lokal: ${localPath}`);
    invariant(
      currentByBasename.get(imageBasename(sourceUrl)) === localPath,
      `Pfarrheim-Mapping weicht vom aktuellen lokalen Pfad ab: ${sourceUrl}`,
    );
  }
  return reconcileParishHallMarkdown({ currentMarkdown, sourceMarkdown, unavailableSourceImageUrls });
}
