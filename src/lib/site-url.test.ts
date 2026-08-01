import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SITE_URL, resolveSiteUrl } from "./site-url";

test("uses the active deployment as the canonical URL by default", () => {
  assert.equal(resolveSiteUrl(undefined), "https://kolping-ramsen.logge.top");
  assert.equal(DEFAULT_SITE_URL, "https://kolping-ramsen.logge.top");
});

test("normalizes a configured canonical origin", () => {
  assert.equal(resolveSiteUrl(" https://www.example.org/ "), "https://www.example.org");
  assert.equal(resolveSiteUrl("http://localhost:3000/"), "http://localhost:3000");
});

test("rejects unsafe or ambiguous canonical URLs", () => {
  assert.throws(() => resolveSiteUrl("kolping.example"), /absolute URL/);
  assert.throws(() => resolveSiteUrl("http://example.org"), /must use https/);
  assert.throws(() => resolveSiteUrl("https://user:secret@example.org"), /credentials/);
  assert.throws(() => resolveSiteUrl("https://example.org/subpath"), /only an origin/);
  assert.throws(() => resolveSiteUrl("https://example.org/?preview=1"), /only an origin/);
});
