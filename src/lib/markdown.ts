import { marked, Renderer, type Token, type Tokens } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({
  gfm: true,
  breaks: true,
});

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderImage(token: Tokens.Image): string {
  const title = token.title ? ` title="${escapeAttribute(token.title)}"` : "";
  return `<img src="${escapeAttribute(token.href)}" alt="${escapeAttribute(token.text)}" loading="lazy" decoding="async"${title}>`;
}

function renderImageFigure(token: Tokens.Image): string {
  const description = token.text.trim();
  const label = description
    ? `Bild „${description}“ in Großansicht öffnen`
    : "Bild in Großansicht öffnen";

  return `<figure class="md-image-card" data-markdown-image><button type="button" class="md-image-trigger" data-lightbox-trigger data-lightbox-src="${escapeAttribute(token.href)}" aria-label="${escapeAttribute(label)}">${renderImage(token)}<span class="md-image-zoom" aria-hidden="true">Vergrößern</span></button></figure>`;
}

function isImageToken(token: Token): token is Tokens.Image {
  return token.type === "image" && "href" in token && "text" in token;
}

function imageOnlyTokens(tokens: Token[]): Tokens.Image[] | null {
  const images: Tokens.Image[] = [];
  for (const token of tokens) {
    if (isImageToken(token)) {
      images.push(token);
      continue;
    }
    if (token.type === "br") continue;
    if (token.type === "text" && token.text.trim() === "") continue;
    return null;
  }
  return images.length > 0 ? images : null;
}

class PublicMarkdownRenderer extends Renderer {
  override image(token: Tokens.Image): string {
    return renderImage(token);
  }

  override paragraph({ tokens }: Tokens.Paragraph): string {
    const images = imageOnlyTokens(tokens);
    if (images) return `${images.map(renderImageFigure).join("\n")}\n`;
    return `<p>${this.parser.parseInline(tokens)}</p>\n`;
  }
}

const IMAGE_FIGURE_SOURCE =
  '<figure class="md-image-card" data-markdown-image><button(?:(?!<\\/button>)[\\s\\S])*?<\\/button><\\/figure>';
const IMAGE_RUN_RE = new RegExp(`(?:${IMAGE_FIGURE_SOURCE}\\s*){3,}`, "g");
const IMAGE_ITEM_RE = new RegExp(`(${IMAGE_FIGURE_SOURCE})\\s*`, "g");

function groupImageRuns(html: string): string {
  return html.replace(IMAGE_RUN_RE, (run) => {
    const matches = Array.from(run.matchAll(IMAGE_ITEM_RE));
    const count = matches.length;
    const items = matches
      .map((match) => {
        return match[1].replace(
          "data-markdown-image",
          'data-markdown-image role="listitem"',
        );
      })
      .join("");
    return `<div class="md-image-series" data-lightbox-group role="list" aria-label="Bildergalerie mit ${count} Bildern">${items}</div>\n`;
  });
}

function addNativeImageHints(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let enhanced = tag;
    if (!/\bloading\s*=/i.test(enhanced)) {
      enhanced = enhanced.replace(/^<img\b/i, '<img loading="lazy"');
    }
    if (!/\bdecoding\s*=/i.test(enhanced)) {
      enhanced = enhanced.replace(/^<img\b/i, '<img decoding="async"');
    }
    return enhanced;
  });
}

export function renderMarkdown(md: string): string {
  if (!md) return "";
  const renderer = new PublicMarkdownRenderer();
  const html = marked.parse(md, { async: false, renderer }) as string;
  const grouped = groupImageRuns(html);
  const sanitized = DOMPurify.sanitize(grouped, {
    ADD_ATTR: [
      "target",
      "rel",
      "loading",
      "decoding",
      "data-lightbox-trigger",
      "data-lightbox-src",
      "data-lightbox-group",
      "data-markdown-image",
    ],
    ADD_TAGS: ["iframe"],
  });
  return addNativeImageHints(sanitized);
}
