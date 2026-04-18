const MD_IMAGE_RE = /!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/;
const HTML_IMAGE_RE = /<img[^>]+src=["']([^"']+)["']/i;

export function firstImage(content: string | null | undefined): string | null {
  if (!content) return null;
  const md = MD_IMAGE_RE.exec(content);
  if (md) return md[1];
  const html = HTML_IMAGE_RE.exec(content);
  if (html) return html[1];
  return null;
}
