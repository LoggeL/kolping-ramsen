import assert from "node:assert/strict";
import test from "node:test";
import { renderMarkdown } from "./markdown";

test("markdown image runs become one lazy, accessible gallery", () => {
  const html = renderMarkdown([
    "![Bühne](/images/one.jpg)",
    "",
    "![Saal](/images/two.jpg)",
    "",
    "![Außengelände](/images/three.jpg)",
  ].join("\n"));

  assert.match(html, /class="md-image-series"/);
  assert.match(html, /role="list"/);
  assert.match(html, /aria-label="Bildergalerie mit 3 Bildern"/);
  assert.equal(html.match(/role="listitem"/g)?.length, 3);
  assert.equal(html.match(/<figcaption class="md-image-caption">/g)?.length, 3);
  assert.match(html, /<figcaption class="md-image-caption">Bühne<\/figcaption>/u);
  assert.match(html, /<figcaption class="md-image-caption">Saal<\/figcaption>/u);
  assert.match(html, /<figcaption class="md-image-caption">Außengelände<\/figcaption>/u);
  assert.equal(html.match(/loading="lazy"/g)?.length, 3);
  assert.equal(html.match(/decoding="async"/g)?.length, 3);
  assert.equal(html.match(/data-lightbox-trigger/g)?.length, 3);
});

test("an explicit Markdown image title becomes the visible caption", () => {
  const html = renderMarkdown(
    '![IMG_1234](/images/one.jpg "Sichtbare Bildunterschrift")',
  );

  assert.match(html, /alt="IMG_1234"/u);
  assert.match(html, /title="Sichtbare Bildunterschrift"/u);
  assert.match(html, /aria-label="Bild „Sichtbare Bildunterschrift“ in Großansicht öffnen"/u);
  assert.match(
    html,
    /<figcaption class="md-image-caption">Sichtbare Bildunterschrift<\/figcaption>/u,
  );
});

test("filename-like alt text remains accessible but is not printed as a caption", () => {
  const html = renderMarkdown([
    "![IMG_1234](/images/one.jpg)",
    "",
    "![DSCF0042](/images/two.jpg)",
    "",
    "![foo.jpg](/images/three.jpg)",
  ].join("\n"));

  assert.match(html, /class="md-image-series"/u);
  assert.match(html, /alt="IMG_1234"/u);
  assert.match(html, /alt="DSCF0042"/u);
  assert.match(html, /alt="foo\.jpg"/u);
  assert.equal(html.match(/aria-label="Bild in Großansicht öffnen"/g)?.length, 3);
  assert.doesNotMatch(html, /<figcaption/u);
});

test("decorative Markdown images do not render empty captions", () => {
  const html = renderMarkdown("![](/images/decorative.jpg)");

  assert.match(html, /aria-label="Bild in Großansicht öffnen"/u);
  assert.doesNotMatch(html, /<figcaption/u);
});

test("gallery grouping never crosses headings or article text", () => {
  const html = renderMarkdown([
    "## Erster Programmpunkt",
    "",
    "![Erstes Bild](/images/one.jpg)",
    "",
    "## Zweiter Programmpunkt",
    "",
    "Der zweite Abschnitt bleibt vollständig sichtbar.",
    "",
    "![Zweites Bild](/images/two.jpg)",
    "",
    "## Dritter Programmpunkt",
    "",
    "![Drittes Bild](/images/three.jpg)",
  ].join("\n"));

  assert.equal(html.match(/<h2>/g)?.length, 3);
  assert.match(html, /Zweiter Programmpunkt/u);
  assert.match(html, /Der zweite Abschnitt bleibt vollständig sichtbar\./u);
  assert.doesNotMatch(html, /class="md-image-series"/u);
});

test("a paragraph directly after an image remains article text rather than a caption", () => {
  const introduction =
    "Dieser einleitende Absatz gehört zum Bericht und darf weder als Bildunterschrift noch als Teil einer Galerie verkleinert werden.";
  const html = renderMarkdown([
    "![Logo](/images/logo.jpg)",
    "",
    introduction,
    "",
    "![Aktion eins](/images/one.jpg)",
    "",
    "![Aktion zwei](/images/two.jpg)",
  ].join("\n"));

  assert.match(html, new RegExp(`<p>${introduction}</p>`, "u"));
  assert.doesNotMatch(
    html,
    new RegExp(`<figcaption[^>]*>${introduction}</figcaption>`, "u"),
  );
  assert.equal(html.match(/<figcaption class="md-image-caption">/g)?.length, 3);
  assert.doesNotMatch(html, /class="md-image-series"/u);
});

test("markdown rendering strips executable URLs and scripts", () => {
  const html = renderMarkdown([
    '<script>globalThis.compromised = true</script>',
    "",
    '[Klick](javascript:alert("x"))',
  ].join("\n"));

  assert.equal(html.includes("<script"), false);
  assert.equal(html.toLowerCase().includes("javascript:"), false);
});

test("legacy HTML images receive native loading hints", () => {
  const html = renderMarkdown('<img src="/images/legacy.jpg" alt="Historisches Foto">');

  assert.match(html, /loading="lazy"/);
  assert.match(html, /decoding="async"/);
  assert.match(html, /alt="Historisches Foto"/);
});
