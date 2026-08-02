import assert from "node:assert/strict";
import test from "node:test";
import {
  matchingLegacyRedirects,
  isReservedContentSlug,
  legacySourceRedirectPath,
  normalizeInternalPathname,
  normalizedLegacyRequestKeys,
  parseStructuredContentPath,
  redirectDestinationCandidates,
} from "./legacy-routing";
import {
  cleanLegacyMetaDescription,
  preparePublicMarkdown,
} from "./public-content";
import { MAIN_NAV, SITE, SITE_SECTIONS } from "./site";
import { uniqueSitemapEntries } from "./sitemap";

test("normalizes legacy paths and query order", () => {
  assert.equal(normalizeInternalPathname("/index.php//article/?x=1"), "/index.php/article");
  assert.deepEqual(
    normalizedLegacyRequestKeys("/index.php/article/", {
      z: "last",
      catid: "2:uncategorised",
    }),
    [
      "/index.php/article?catid=2%3Auncategorised&z=last",
      "/index.php/article",
    ],
  );
  assert.equal(normalizeInternalPathname("https://example.org/elsewhere"), null);
  assert.equal(normalizeInternalPathname("//example.org/elsewhere"), null);
});

test("creates seed redirects only for non-root pages on the legacy site", () => {
  assert.equal(
    legacySourceRedirectPath(
      "https://www.kolping-ramsen.de/index.php/termine?year=2026",
    ),
    "/index.php/termine?year=2026",
  );
  assert.equal(legacySourceRedirectPath("https://kolping-ramsen.de/"), null);
  assert.equal(legacySourceRedirectPath("http://theater.kolping-ramsen.de/"), null);
  assert.equal(legacySourceRedirectPath("https://example.org/index.php"), null);
});

test("keeps native and operational routes outside CMS resolution", () => {
  assert.equal(isReservedContentSlug("admin/pages"), true);
  assert.equal(isReservedContentSlug("uploads/library/image.webp"), true);
  assert.equal(isReservedContentSlug("ueber-uns/pfarrheim"), false);
});

test("recognizes exact published news and event redirect destinations", () => {
  assert.deepEqual(parseStructuredContentPath("/aktuelles/ein-beitrag"), { kind: "news", slug: "ein-beitrag" });
  assert.deepEqual(parseStructuredContentPath("/termine/ein-termin?print=1"), { kind: "event", slug: "ein-termin" });
  assert.equal(parseStructuredContentPath("/aktuelles"), null);
  assert.equal(parseStructuredContentPath("/termine/ein-termin/ical"), null);
});

test("prefers a normalized query redirect and falls back to its pathname", () => {
  const redirects = [
    { fromPath: "/legacy", toPath: "/rueckblick" },
    {
      fromPath: "/legacy/?z=last&catid=2:uncategorised",
      toPath: "/datenschutzerklaerung",
    },
    { fromPath: "/legacy?catid=other", toPath: "/kontakt" },
  ];

  assert.deepEqual(
    matchingLegacyRedirects(redirects, "/legacy/", {
      catid: "2:uncategorised",
      z: "last",
    }).map((entry) => entry.toPath),
    ["/datenschutzerklaerung", "/rueckblick"],
  );
  assert.deepEqual(
    matchingLegacyRedirects(redirects, "/legacy", { utm_source: "newsletter" }).map(
      (entry) => entry.toPath,
    ),
    ["/rueckblick"],
  );
});

test("builds nearest-ancestor candidates only for internal destinations", () => {
  assert.deepEqual(
    redirectDestinationCandidates("/rueckblick/presse/altes-stueck?print=1"),
    ["/rueckblick/presse/altes-stueck", "/rueckblick/presse", "/rueckblick", "/"],
  );
  assert.deepEqual(redirectDestinationCandidates("https://example.org"), []);
});

test("removes Joomla preambles and keeps a single document-level heading", () => {
  const source = [
    "Details",
    "",
    "Veröffentlicht: 03. Juli 2019",
    "",
    "Zugriffe: 1146",
    "",
    "# **Adolf Kolping**",
    "",
    "# Lebenswerk",
    "",
    "```md",
    "# Beispiel im Code",
    "```",
  ].join("\n");

  assert.equal(
    preparePublicMarkdown(source, "Adolf Kolping"),
    [
      "## Lebenswerk",
      "",
      "```md",
      "# Beispiel im Code",
      "```",
    ].join("\n"),
  );
});

test("removes raw Joomla metadata and demotes a non-duplicate content H1", () => {
  const source = [
    '<meta itemprop="inLanguage" content="de-DE">',
    '<dl class="article-info text-muted"><dt>Details</dt><dd>Zugriffe: 12</dd></dl>',
    "# Die Geschichte des Pfarrheims",
    "",
    "Text",
  ].join("\n");

  assert.equal(
    preparePublicMarkdown(source, "Pfarrheim"),
    "## Die Geschichte des Pfarrheims\n\nText",
  );
});

test("cleans Joomla metadata and entities from meta descriptions", () => {
  assert.equal(
    cleanLegacyMetaDescription(
      "Details Geschrieben von: Wolfgang Rörig Veröffentlicht: 03. Juli 2019 Zugriffe: 1618 &nbsp; Kolpingsfamilie Ramsen",
    ),
    "Kolpingsfamilie Ramsen",
  );
});

test("central section data powers overview routes and navigation", () => {
  assert.deepEqual(Object.keys(SITE_SECTIONS), [
    "vereinsbereiche",
    "ueber-uns",
    "rueckblick",
    "galerien",
  ]);
  assert.ok(SITE_SECTIONS.galerien.links.length > 0);
  assert.ok(MAIN_NAV.some((item) => item.href === "/galerien"));
  assert.equal(
    MAIN_NAV.some((item) => item.href === "/mitglied-werden"),
    false,
  );
  assert.deepEqual(SITE.leadershipTeam, [
    "Bettina Schach",
    "Heiko Schmitt-Sattler",
    "Sebastian Sattler",
  ]);
  assert.equal(SITE.venue.street, "Klosterhof 7");
});

test("deduplicates sitemap URLs while preserving useful metadata", () => {
  const updatedAt = new Date("2026-08-01T10:00:00.000Z");
  const result = uniqueSitemapEntries([
    {
      url: "https://kolping-ramsen.de/impressum",
      priority: 0.7,
      changeFrequency: "weekly",
    },
    {
      url: "https://kolping-ramsen.de/impressum/",
      priority: 0.5,
      lastModified: updatedAt,
    },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].priority, 0.7);
  assert.equal(result[0].lastModified, updatedAt);
});
