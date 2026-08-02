import { preparePublicMarkdown } from "../../public-content";

function unwrapOuterPresentation(value: string): string {
  let current = value.trim();
  let previous = "";
  while (current !== previous) {
    previous = current;
    current = current
      .replace(/^_\*\*([\s\S]+)\*\*_$|^\*\*_([\s\S]+)_\*\*$|^\*\*\*([\s\S]+)\*\*\*$|^\*\*([\s\S]+)\*\*$|^_([\s\S]+)_$/u, (_match, ...groups: Array<string | undefined>) =>
        groups.find((group) => group !== undefined) ?? current)
      .trim();
  }
  return current;
}

function repairUnbalancedUnderscores(value: string): string {
  const protectedValues: string[] = [];
  const protectedText = value.replace(/`[^`]*`|\]\((?:<[^>]*>|[^)\s]+)(?:\s+"[^"]*")?\)|https?:\/\/\S+/gu, (match) => {
    const index = protectedValues.push(match) - 1;
    return `\uE000${index}\uE001`;
  });
  const underscoreCount = [...protectedText.matchAll(/(?<!\\)_/gu)].length;
  const repaired = underscoreCount % 2 === 0
    ? protectedText
    : protectedText.replace(/(?<!\\)_/gu, "");
  return repaired.replace(/\uE000(\d+)\uE001/gu, (_match, index: string) => protectedValues[Number(index)] ?? "");
}

function comparableHeading(value: string): string {
  return value.toLocaleLowerCase("de")
    .replace(/[*_~`]/g, "")
    .replace(/[^a-z0-9äöüß]+/gu, " ")
    .replace(/^(?:der|die|das)\s+/u, "")
    .trim();
}

function cleanHeadingText(value: string): string {
  return repairUnbalancedUnderscores(unwrapOuterPresentation(value))
    .replace(/(?<!\\)\*{2,}/gu, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function looksLikeParagraph(value: string): boolean {
  const plain = value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .trim();
  return plain.length > 100 || (plain.length > 45 && /[.!?][”"']?$/u.test(plain));
}

/**
 * Removes presentation-only Markdown inherited from Joomla while preserving all
 * links, image destinations and meaningful inline emphasis byte-for-byte.
 */
function travelHistory(markdown: string): string {
  const blocks = markdown.split(/\n{2,}/u).map((block) => block.trim()).filter(Boolean);
  const entries: Array<{ period: string; destination: string }> = [];
  let note = "";
  for (const block of blocks) {
    if (/^#{2,3}\s+(?:Reisen\s+)?Historie\b/iu.test(block)) continue;
    if (/^(?:#{2,3}\s+)?Ab\s+2024\b/iu.test(block)) {
      note = block.replace(/^#{2,3}\s+/u, "");
      continue;
    }
    const entry = block.match(/^(.+?\b(?:19|20)\d{2})\s{2,}(.+)$/u);
    if (entry) {
      entries.push({ period: entry[1].replace(/\s+/g, " "), destination: entry[2].replace(/\s+/g, " ") });
      continue;
    }
    if (entries.length > 0) entries[entries.length - 1].destination += ` ${block.replace(/\s+/g, " ")}`;
  }
  if (entries.length < 3) return markdown;
  const table = [
    "| Zeitraum | Reiseziel |",
    "| --- | --- |",
    ...entries.map(({ period, destination }) => `| ${period.replace(/\|/g, "\\|")} | ${destination.replace(/\|/g, "\\|")} |`),
  ].join("\n");
  return ["## Reisehistorie der Kolpingsfamilie Ramsen seit 1979", table, ...(note ? [`> ${note}`] : [])].join("\n\n");
}

function legalOutline(markdown: string): string {
  const lines = markdown.split("\n");
  const output = lines.flatMap((line, index): string[] => {
    const trimmed = line.trim();
    if (index === 0 && comparableHeading(trimmed) === comparableHeading("Datenschutzerklärung")) return [];
    const letteredTitle = trimmed.match(/^A\.\s+(.+)$/u);
    if (letteredTitle) return [`## ${letteredTitle[1].replace(/\s+/g, " ")}`];
    const romanTitle = trimmed.match(/^([IVX]+)\.\s+(.+)$/u);
    if (romanTitle) return [`## ${romanTitle[1]}. ${romanTitle[2].replace(/\s+/g, " ")}`];
    const nestedTitle = trimmed.match(/^1\.\s+([a-z]\))\s+(.+)$/u);
    if (nestedTitle) return [`### ${nestedTitle[1]} ${nestedTitle[2].replace(/\s+/g, " ")}`];
    const numberedTitle = trimmed.match(/^(\d+)\.\s+(.+)$/u);
    if (numberedTitle) return [`### ${numberedTitle[1]}. ${numberedTitle[2].replace(/\s+/g, " ")}`];
    const lowerTitle = trimmed.match(/^([a-z]\))\s+(.+)$/u);
    if (lowerTitle) return [`### ${lowerTitle[1]} ${lowerTitle[2].replace(/\s+/g, " ")}`];
    return [line];
  });
  return output.join("\n")
    .replace(
      /(Vertreten durch das Leitungsteam:)\n\n([^\n]+)\n\n([^\n]+)\n\n([^\n]+)/u,
      (whole, lead: string, namesLine: string, streetsLine: string, placesLine: string) => {
        const names = namesLine.split(/\s{2,}/u).map((value) => value.trim()).filter(Boolean);
        const streets = streetsLine.split(/\s{2,}/u).map((value) => value.trim()).filter(Boolean);
        const places = placesLine.split(/\s{2,}/u).map((value) => value.trim()).filter(Boolean);
        if (names.length !== 3 || streets.length !== 3 || places.length !== 3) return whole;
        return [
          lead,
          "",
          "| Name | Anschrift |",
          "| --- | --- |",
          ...names.map((name, index) => `| ${name} | ${streets[index]}, ${places[index]} |`),
        ].join("\n");
      },
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeCurrentMarkdown(
  source: string,
  title: string,
  format: "default" | "travel-history" | "legal-outline" = "default",
): string {
  const lines = preparePublicMarkdown(source ?? "", title).replace(/\u00a0/g, " ").split("\n");
  let fence: "```" | "~~~" | null = null;
  const normalized = lines.flatMap((original): string[] => {
    const fenceMatch = original.match(/^\s{0,3}(```|~~~)/u);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1] as "```" | "~~~";
      else if (fence === fenceMatch[1]) fence = null;
      return [original.replace(/[ \t]+$/u, "")];
    }
    if (fence) return [original];

    const line = original.replace(/[ \t]+$/u, "");
    if (line.trim() === "") return [""];
    const listHeading = line.match(/^(\s*(?:[-+*]|\d+[.)])\s+)#{1,6}\s+(.+?)\s*#*\s*$/u);
    if (listHeading) {
      const content = cleanHeadingText(listHeading[2]);
      return content && !/^[_*]+$/u.test(content) ? [`${listHeading[1]}${content}`] : [];
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/u);
    if (heading) {
      const content = cleanHeadingText(heading[2]);
      if (!content || /^[_*]+$/u.test(content)) return [];
      if (comparableHeading(content) === comparableHeading(title)) return [];
      const originalLevel = heading[1].length;
      if (looksLikeParagraph(content)) return [content];
      const targetLevel = Math.min(3, Math.max(2, originalLevel));
      return [`${"#".repeat(targetLevel)} ${content}`];
    }

    const standalone = repairUnbalancedUnderscores(unwrapOuterPresentation(line));
    if (!standalone || /^[_*]+$/u.test(standalone)) return [];
    return [standalone];
  });

  const markdown = normalized.join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (format === "travel-history") return travelHistory(markdown);
  if (format === "legal-outline") return legalOutline(markdown);
  return markdown;
}
