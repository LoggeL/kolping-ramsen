import assert from "node:assert/strict";
import test from "node:test";
import {
  extractGallerySlugs,
  renameGalleryTokens,
} from "./gallery-token";

test("gallery tokens are case-insensitive and renamed canonically", () => {
  const content = "Vorher ::gallery[Foo-Bar]:: nachher ::gallery[other]::";
  assert.deepEqual(extractGallerySlugs(content), ["foo-bar", "other"]);
  assert.equal(
    renameGalleryTokens(content, "foo-bar", "new-name"),
    "Vorher ::gallery[new-name]:: nachher ::gallery[other]::",
  );
});
