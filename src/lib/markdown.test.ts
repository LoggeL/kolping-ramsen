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
  assert.equal(html.match(/loading="lazy"/g)?.length, 3);
  assert.equal(html.match(/decoding="async"/g)?.length, 3);
  assert.equal(html.match(/data-lightbox-trigger/g)?.length, 3);
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
