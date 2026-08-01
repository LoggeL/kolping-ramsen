import assert from "node:assert/strict";
import test from "node:test";
import {
  extractImageUrls,
  extractLocalAssetUrls,
  mediaReferenceKey,
  normalizeMediaPath,
} from "./media-paths";

test("extracts Unicode image and document paths with URL suffixes", () => {
  const source = [
    "![Außengelände](/images/Über-uns/Außen.JPG?download=1)",
    '<a href="/images/Dokumente/Antrag.pdf#seite-2">Antrag</a>',
  ].join("\n");

  assert.deepEqual(extractImageUrls(source), [
    "/images/Über-uns/Außen.JPG?download=1",
  ]);
  assert.deepEqual(extractLocalAssetUrls(source), [
    "/images/Über-uns/Außen.JPG?download=1",
    "/images/Dokumente/Antrag.pdf#seite-2",
  ]);
});

test("normalizes safe media paths and rejects traversal", () => {
  assert.equal(
    normalizeMediaPath("/images/%C3%9Cber-uns/Bild.JPG?download=1"),
    "images/Über-uns/Bild.JPG",
  );
  assert.throws(() => normalizeMediaPath("/uploads/../dev.db"), /nicht erlaubt/);
  assert.throws(() => normalizeMediaPath("https://example.org/image.jpg"), /nicht erlaubt/);
  assert.throws(() => normalizeMediaPath("/documents/file.pdf"), /nicht erlaubt/);
});

test("normalizes encoded and mixed-case media references for lookups", () => {
  assert.equal(
    mediaReferenceKey("/Images/%C3%9Cber-uns/Bild.JPG?download=1"),
    "/images/über-uns/bild.jpg",
  );
});
