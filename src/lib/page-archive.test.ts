import assert from "node:assert/strict";
import test from "node:test";
import {
  archivePageHref,
  PAGE_ARCHIVE_PAGE_SIZE,
  pageArchiveExcerpt,
  resolveArchivePage,
} from "./page-archive";

test("resolves archive pages and their canonical URL state", () => {
  assert.equal(PAGE_ARCHIVE_PAGE_SIZE, 18);
  assert.deepEqual(resolveArchivePage(undefined, 113), {
    currentPage: 1,
    totalPages: 7,
    shouldRedirect: false,
  });
  assert.deepEqual(resolveArchivePage("2", 113), {
    currentPage: 2,
    totalPages: 7,
    shouldRedirect: false,
  });
  assert.deepEqual(resolveArchivePage("1", 113), {
    currentPage: 1,
    totalPages: 7,
    shouldRedirect: true,
  });
  assert.deepEqual(resolveArchivePage("99", 113), {
    currentPage: 7,
    totalPages: 7,
    shouldRedirect: true,
  });
});

test("normalizes malformed page queries but ignores them on ordinary pages", () => {
  for (const value of ["", "0", "02", "2.5", "nope", ["2", "3"]]) {
    assert.deepEqual(resolveArchivePage(value, 113), {
      currentPage: 1,
      totalPages: 7,
      shouldRedirect: true,
    });
  }

  assert.deepEqual(resolveArchivePage("99", 0), {
    currentPage: 1,
    totalPages: 0,
    shouldRedirect: false,
  });
});

test("builds clean archive links with page one at the parent URL", () => {
  assert.equal(
    archivePageHref("/rueckblick/jahresprogramm/", 1),
    "/rueckblick/jahresprogramm",
  );
  assert.equal(
    archivePageHref("rueckblick/jahresprogramm", 3),
    "/rueckblick/jahresprogramm?seite=3",
  );
});

test("prefers a cleaned meta description over body markup", () => {
  assert.equal(
    pageArchiveExcerpt({
      title: "Sommerfest",
      content: "# Sommerfest\n\nDieser Text soll nicht gewählt werden.",
      metaDesc:
        "Details Geschrieben von: Max Muster Veröffentlicht: 03. Juli 2019 Zugriffe: 123 &nbsp; Gemeinsam feiern wir auf der Kolpingwiese.",
    }),
    "Gemeinsam feiern wir auf der Kolpingwiese.",
  );
});

test("builds a clean excerpt from markdown without images or duplicate title", () => {
  assert.equal(
    pageArchiveExcerpt({
      title: "Ramser Kerwe",
      content: [
        "# **Ramser Kerwe**",
        "",
        "![Kerwe 2025 01](/images/Kerwe_2025_01.jpg)",
        "",
        "> Wir feierten mit [vielen Gästen](/kontakt) rund um die Eistalhalle.",
        "",
        "::gallery[kerwe-2025]::",
      ].join("\n"),
      metaDesc: null,
    }),
    "Wir feierten mit vielen Gästen rund um die Eistalhalle.",
  );
});

test("truncates at a word boundary and returns null for image-only content", () => {
  const excerpt = pageArchiveExcerpt({
    title: "Reisebericht",
    content:
      "Die Kolpingsfamilie unternahm eine gemeinsame Bildungsreise mit vielen interessanten Stationen und persönlichen Begegnungen.",
    metaDesc: null,
    maxLength: 70,
  });

  assert.equal(
    excerpt,
    "Die Kolpingsfamilie unternahm eine gemeinsame Bildungsreise mit vielen…",
  );
  assert.equal(
    pageArchiveExcerpt({
      title: "Galerie",
      content: "![Bild](/images/galerie.jpg)",
      metaDesc: null,
    }),
    null,
  );
});
