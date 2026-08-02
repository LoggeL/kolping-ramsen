import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  captureLegacySource,
  compareLegacyContent,
  CrawlIncompleteError,
  parseMigrationDecisions,
  stageLegacyContent,
  type LegacyHttp,
  type LegacyHttpResponse,
} from ".";
import { extractLegacyPage } from "./internal/normalize";
import { normalizeCurrentMarkdown } from "./internal/current-markdown";

const ORIGIN = "https://legacy.example";
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n");

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function html(body: string): LegacyHttpResponse {
  return {
    status: 200,
    finalUrl: ORIGIN,
    contentType: "text/html; charset=utf-8",
    body: Buffer.from(body),
  };
}

class MemoryHttp implements LegacyHttp {
  readonly calls: string[] = [];

  constructor(private readonly responses: ReadonlyMap<string, LegacyHttpResponse>) {}

  async get({ url }: { url: string }): Promise<LegacyHttpResponse> {
    this.calls.push(url);
    const response = this.responses.get(url);
    if (!response) return { status: 404, finalUrl: url, contentType: "text/html", body: new Uint8Array() };
    return { ...response, finalUrl: response.finalUrl === ORIGIN ? url : response.finalUrl };
  }
}

const decisions = parseMigrationDecisions({
  schemaVersion: 1,
  origin: ORIGIN,
  routes: [
    { sourcePath: "/index.php", targetPath: "/", kind: "page" },
    { sourcePath: "/index.php/aktuelles", targetPath: "/aktuelles", kind: "news", collection: true },
    { sourcePath: "/index.php/termine", targetPath: "/termine", kind: "event", collection: true },
  ],
  excludes: [{ pattern: "[?&]print=1", reason: "Druckansicht" }],
});

function fixtureHttp(): MemoryHttp {
  return new MemoryHttp(new Map([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\nDisallow: /administrator/\n"),
    }],
    [`${ORIGIN}/index.php`, html(`
      <html><head><title>Start - Kolping Ramsen</title></head><body>
        <nav><a href="/index.php/aktuelles">Aktuelles</a><a href="/index.php/termine">Termine</a></nav>
        <main><div class="item-page"><h1>Start</h1><div class="com-content-article__body">
          <h1 style="color:red">Start</h1><p style="font-size: 20px">Willkommen in Ramsen.</p>
        </div></div></main>
      </body></html>
    `)],
    [`${ORIGIN}/index.php/termine`, html(`
      <html><head><title>Termine - Kolping Ramsen</title></head><body><main>
        <div class="blog-item"><div class="item-content">
          <h1>Unsere geplanten Angebote</h1><h1>Jahresprogramm für 2026</h1>
          <h3>Sa. 10.01. 13:00 – 15:00 Uhr Kartenvorverkauf im Pfarrheim</h3>
          <h3>Fr. 18. - Sa. 25.07. Familienzeltlager in Niederschlettenbach</h3>
        </div></div>
      </main></body></html>
    `)],
    [`${ORIGIN}/index.php/aktuelles`, html(`
      <html><head><title>Aktuelles - Kolping Ramsen</title></head><body><main>
        <div class="com-content-category-blog">
          <div class="blog-item"><div class="item-content">
            <h2><strong>Erster Bericht</strong></h2>
            <dl class="article-info"><dd>Details</dd><dd>Veröffentlicht: 03. Juli 2019</dd><dd>Zugriffe: 99</dd></dl>
            <h3 style="font-size:20px;color:red"><strong>Dieser vollständige Satz ist dekorativer Fließtext und darf nicht als riesige Überschrift in den neuen Inhalt gelangen.</strong></h3>
            <img src="/images/eins.png" alt="Gemeinschaft beim Fest">
            <p><a href="/images/antrag.pdf">Antrag herunterladen</a></p>
          </div></div>
          <div class="blog-item"><div class="item-content"><h2>Zweiter Bericht</h2><p>Zweiter sauberer Inhalt.</p></div></div>
        </div>
        <a class="page-link" href="/index.php/aktuelles?start=5&utm_source=x">Weiter</a>
      </main></body></html>
    `)],
    [`${ORIGIN}/index.php/aktuelles?start=5`, html(`
      <html><head><title>Aktuelles - Kolping Ramsen</title></head><body><main>
        <div class="com-content-category-blog">
          <div class="blog-item"><div class="item-content"><h2>Zweiter Bericht</h2><p>Zweiter sauberer Inhalt.</p></div></div>
          <div class="blog-item"><div class="item-content"><h2>Dritter Bericht</h2><p>Dritter sauberer Inhalt.</p></div></div>
        </div>
      </main></body></html>
    `)],
    [`${ORIGIN}/images/eins.png`, {
      status: 200,
      finalUrl: `${ORIGIN}/images/eins.png`,
      contentType: "image/png",
      body: PNG,
    }],
    [`${ORIGIN}/images/antrag.pdf`, {
      status: 200,
      finalUrl: `${ORIGIN}/images/antrag.pdf`,
      contentType: "application/pdf",
      body: PDF,
    }],
  ]));
}

test("captures a complete Joomla fixture as deterministic clean records", async () => {
  const firstRoot = await mkdtemp(path.join(tmpdir(), "kolping-capture-a-"));
  const secondRoot = await mkdtemp(path.join(tmpdir(), "kolping-capture-b-"));
  try {
    const first = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(firstRoot, "snapshot"),
      cacheDir: path.join(firstRoot, "cache"),
      decisions,
      maxPages: 20,
      concurrency: 2,
    }, fixtureHttp());
    const second = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(secondRoot, "snapshot"),
      cacheDir: path.join(secondRoot, "cache"),
      decisions,
      maxPages: 20,
      concurrency: 2,
    }, fixtureHttp());

    assert.equal(first.snapshot.digest, second.snapshot.digest);
    assert.equal(first.snapshot.outcomes.length, 4);
    assert.equal(first.snapshot.records.length, 6);
    assert.equal(first.snapshot.assets.length, 2);
    assert.ok(first.snapshot.assets.every((asset) => asset.status === "captured"));
    assert.deepEqual(first.snapshot.assets.map((asset) => asset.assetType).sort(), ["document", "image"]);
    assert.deepEqual(
      first.snapshot.records.filter((record) => record.kind === "news").map((record) => record.targetPath),
      ["/aktuelles/2019-07-03-erster-bericht", "/aktuelles/dritter-bericht", "/aktuelles/zweiter-bericht"],
    );
    const firstArticle = first.snapshot.records.find((record) => record.title === "Erster Bericht");
    assert.ok(firstArticle);
    assert.equal(firstArticle.publishedDate, "2019-07-03");
    assert.doesNotMatch(firstArticle.markdown, /Details|Zugriffe|style=|<h3|^###/mu);
    assert.match(firstArticle.markdown, /Dieser vollständige Satz/);
    const camp = first.snapshot.records.find((record) => record.title === "Familienzeltlager");
    assert.deepEqual(camp?.event, {
      startDate: "2026-07-18",
      endDate: "2026-07-25",
      location: "Niederschlettenbach",
    });
    assert.equal(await readFile(first.snapshotPath, "utf8"), await readFile(second.snapshotPath, "utf8"));
  } finally {
    await rm(firstRoot, { recursive: true, force: true });
    await rm(secondRoot, { recursive: true, force: true });
  }
});

test("requires an explicit redirect for successfully loaded detail pages without records", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-empty-detail-"));
  const http = new MemoryHttp(new Map([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\n"),
    }],
    [`${ORIGIN}/index.php`, html(`
      <html><head><title>Start</title></head><body><main><div class="item-page"><h1>Start</h1><p>Vollständiger Startinhalt.</p></div></main><a href="/index.php/leere-detailseite">Leer</a></body></html>
    `)],
    [`${ORIGIN}/index.php/leere-detailseite`, html(`
      <html><head><title>Leere Detailseite</title></head><body><main><div class="item-page"><h1>Leere Detailseite</h1></div></main></body></html>
    `)],
  ]));
  try {
    const withoutRedirect = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "without-redirect"),
      cacheDir: path.join(root, "cache-a"),
      decisions: parseMigrationDecisions({
        schemaVersion: 1,
        origin: ORIGIN,
        routes: [{ sourcePath: "/index.php", targetPath: "/", kind: "page" }],
        excludes: [],
      }),
      maxPages: 5,
    }, http);
    assert.ok(withoutRedirect.snapshot.findings.some((finding) =>
      finding.severity === "error" && finding.owner.endsWith("/index.php/leere-detailseite"),
    ));

    const withRedirect = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "with-redirect"),
      cacheDir: path.join(root, "cache-b"),
      decisions: parseMigrationDecisions({
        schemaVersion: 1,
        origin: ORIGIN,
        routes: [{ sourcePath: "/index.php", targetPath: "/", kind: "page" }],
        redirects: [{ fromPath: "/index.php/leere-detailseite", targetPath: "/", reason: "Leere Altseite verweist auf die Startseite." }],
        excludes: [],
      }),
      maxPages: 5,
    }, http);
    assert.ok(!withRedirect.snapshot.findings.some((finding) =>
      finding.severity === "error" && finding.owner.endsWith("/index.php/leere-detailseite"),
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects HTML and asset redirects that leave the approved legacy origin", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-external-redirect-"));
  const boundaryDecisions = parseMigrationDecisions({
    schemaVersion: 1,
    origin: ORIGIN,
    routes: [
      { sourcePath: "/index.php", targetPath: "/", kind: "page" },
      { sourcePath: "/index.php/extern", targetPath: "/extern", kind: "page" },
    ],
    excludes: [],
  });
  const http = new MemoryHttp(new Map([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\n"),
    }],
    [`${ORIGIN}/index.php`, html(`
      <html><body><main><div class="item-page"><h1>Start</h1><p>Vollständiger Startinhalt.</p><img src="/images/extern.png" alt="Externes Bild"></div></main><a href="/index.php/extern">Extern</a></body></html>
    `)],
    [`${ORIGIN}/index.php/extern`, {
      status: 200,
      finalUrl: "https://example.org/fremder-inhalt",
      contentType: "text/html",
      body: Buffer.from("<html><body><main><article><h1>Fremd</h1><p>Nicht übernehmen.</p></article></main></body></html>"),
    }],
    [`${ORIGIN}/images/extern.png`, {
      status: 200,
      finalUrl: "https://cdn.example.org/fremdes-bild.png",
      contentType: "image/png",
      body: PNG,
    }],
  ]));
  try {
    const captured = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "snapshot"),
      cacheDir: path.join(root, "cache"),
      decisions: boundaryDecisions,
      maxPages: 5,
    }, http);
    assert.equal(captured.snapshot.outcomes.find((outcome) => outcome.url.endsWith("/extern"))?.status, "failed");
    assert.equal(captured.snapshot.assets.find((asset) => asset.sourceUrls.includes(`${ORIGIN}/images/extern.png`))?.status, "failed");
    assert.ok(captured.snapshot.findings.some((finding) => finding.severity === "error" && finding.message.includes("Legacy-Origin")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rechecks failed assets before excluding an image-only legacy record", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-exclude-asset-"));
  const excludeDecisions = parseMigrationDecisions({
    schemaVersion: 1,
    origin: ORIGIN,
    routes: [
      { sourcePath: "/index.php", targetPath: "/", kind: "page" },
      { sourcePath: "/index.php/archiv", targetPath: "/archiv", kind: "page", collection: true },
    ],
    recordExcludes: [{
      sourcePath: "/index.php/archiv",
      publishedDate: "2024-02-06",
      detectedTitle: "Defektes Plakat",
      sourceFingerprint: "sha256:37638ebf9ff1b6597951cab80821faccf34dde9bc63e66b9263fd1b92a8a7da4",
      expectedAssetStates: [{ sourceUrl: `${ORIGIN}/images/defekt.jpg`, status: "failed", reason: "HTTP 404" }],
      reason: "Das einzige Quellbild fehlt und es gibt keinen redaktionellen Text.",
    }],
    redirects: [{
      fromPath: "/index.php/archiv",
      targetPath: "/archiv",
      reason: "Die vollständig ausgeschlossene Test-Collection verweist auf ihr heutiges Archiv.",
    }],
    excludes: [],
  });
  const responses = new Map<string, LegacyHttpResponse>([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\n"),
    }],
    [`${ORIGIN}/index.php`, html("<html><body><main><div class='item-page'><h1>Start</h1><p>Vollständiger Startinhalt.</p></div></main></body></html>")],
    [`${ORIGIN}/index.php/archiv`, html(`
      <html><head><title>Archiv</title></head><body><main><div class="blog-item"><div class="item-content">
        <dl class="article-info"><dd>Veröffentlicht: 06. Februar 2024</dd></dl>
        <img src="/images/defekt.jpg" alt="Defektes Plakat">
      </div></div></main></body></html>
    `)],
  ]);
  try {
    const missing = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "missing"),
      cacheDir: path.join(root, "cache-missing"),
      decisions: excludeDecisions,
      maxPages: 5,
    }, new MemoryHttp(responses));
    assert.equal(missing.snapshot.records.filter((record) => record.publishedDate === "2024-02-06").length, 0);
    assert.equal(missing.snapshot.assets.find((asset) => asset.sourceUrls.includes(`${ORIGIN}/images/defekt.jpg`))?.status, "failed");
    assert.ok(!missing.snapshot.findings.some((finding) =>
      finding.severity === "error" && finding.owner.startsWith("record-exclude:"),
    ));

    responses.set(`${ORIGIN}/images/defekt.jpg`, {
      status: 200,
      finalUrl: `${ORIGIN}/images/defekt.jpg`,
      contentType: "image/png",
      body: PNG,
    });
    const restored = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "restored"),
      cacheDir: path.join(root, "cache-restored"),
      decisions: excludeDecisions,
      maxPages: 5,
    }, new MemoryHttp(responses));
    assert.ok(restored.snapshot.findings.some((finding) =>
      finding.severity === "error" && finding.owner.startsWith("record-exclude:") && finding.message.includes("Asset-Zustand"),
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("cleans presentation markup, broken titles, spambots and obsolete theater links", () => {
  const extracted = extractLegacyPage(`
    <html><head><title>Archiv - Kolping Ramsen</title></head><body><main>
      <div class="item-page">
        <h2>"Arzneimittel richtig einnehmen,</h2>
        <div class="com-content-article__body">
          <h5><strong><em>Eine Bildunterschrift</em></strong></h5>
          <p><strong><em>Kolping-Ramsen bleibt mit Bindestrich lesbar.</em></strong></p>
          <p>Diese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein.</p>
          <p><a href="http://theater.kolping-ramsen.de/yt">Aufzeichnung ansehen</a></p>
        </div>
      </div>
    </main></body></html>
  `, `${ORIGIN}/index.php`, ORIGIN, decisions);
  const record = extracted.records[0];
  assert.equal(record.title, "Arzneimittel richtig einnehmen");
  assert.match(record.markdown, /Eine Bildunterschrift/u);
  assert.doesNotMatch(record.markdown, /#{4,}|\*\*|Spambots|http:\/\/theater\./u);
  assert.match(record.markdown, /Kolping-Ramsen/u);
  assert.match(record.markdown, /https:\/\/kolpingtheater-ramsen\.de\/yt/u);

  const dangling = extractLegacyPage(`
    <html><head><title>Archiv - Kolping Ramsen</title></head><body><main>
      <div class="item-page"><h2>2024 - 120 Orden herstellen und</h2><p>Aufbau beim TUS 05.</p></div>
    </main></body></html>
  `, `${ORIGIN}/index.php`, ORIGIN, decisions).records[0];
  assert.equal(dangling.title, "2024 - 120 Orden herstellen");
});

test("demotes Joomla prose and image captions while preserving semantic section headings", () => {
  const extracted = extractLegacyPage(`
    <html><head><title>Wanderbericht - Kolping Ramsen</title></head><body><main>
      <div class="item-page">
        <h1>Wanderbericht</h1>
        <div class="com-content-article__body">
          <h2><span style="color: #003300">„Wanderbericht“</span></h2>
          <h2>Am Anfang beschreibt dieser Satz den Ablauf des Tages.</h2>
          <h3><span style="color: #003300"><em>Wir trafen uns am Bahnhof und wanderten anschließend gemeinsam durch den Wald.</em></span></h3>
          <p><img src="/images/gruppe.jpg" alt="Wandergruppe"></p>
          <h3><span style="color: #003300"><em>Gruppenbild vor dem Weinbiethaus</em></span></h3>
          <p><img src="/images/weinbiethaus.jpg" alt="Gruppe am Weinbiethaus"></p>
          <h3>Historischer Hintergrund</h3>
          <p>Dieser echte Abschnitt behält seine semantische Überschrift.</p>
          <h4><strong>1. Tag:</strong></h4>
          <p>Die erste Etappe bleibt strukturiert.</p>
          <h5><strong>Präses der Kolpingsfamilie:</strong></h5>
          <p>Auch tief verschachtelte echte Joomla-Überschriften bleiben erhalten.</p>
          <h5><strong><em>Kurze dekorative Bildunterschrift</em></strong></h5>
          <h3><span style="color: #003300">Dieser Vortrag fand am Donnerstag</span></h3>
          <h3><span style="color: #003300">im Pfarrheim statt.</span></h3>
          <h3><span style="color: #003300">Die Urkunde überreichte Andrea Storminger</span></h3>
          <h3><span style="color: #003300">Begründung zu dieser Ehrung</span></h3>
          <h3><span style="color: #003300">Sebastian gründete im Jahr 2009 eine Jugendgruppe.</span></h3>
          <h3><span style="color: #003300">Fleißige Hände bereiteten das Zeltlager vor</span></h3>
          <h3><span style="color: #003300"><img src="/images/zeltlager-02.jpg" alt="Zeltlager 2025 02"></span></h3>
          <h3><span style="color: #003300">Feuerwehrmann Klaus erklärte anschließend die Ausrüstung.</span></h3>
          <h3><a href="https://video.example">Aufzeichnung ansehen</a></h3>
          <h3><span style="color: #003300">Dieser Satz leitet den nächsten Programmpunkt ein.</span></h3>
          <h3><span style="color: #003300">Samstag, 10. Juli - Spielenachmittag</span></h3>
          <h3><span style="color: #003300">Danach ließen wir den Tag gemeinsam ausklingen.</span></h3>
        </div>
      </div>
    </main></body></html>
  `, `${ORIGIN}/index.php`, ORIGIN, decisions);

  const markdown = extracted.records[0]?.markdown ?? "";
  assert.match(markdown, /Wir trafen uns am Bahnhof/u);
  assert.match(markdown, /Gruppenbild vor dem Weinbiethaus/u);
  assert.match(markdown, /Am Anfang beschreibt dieser Satz/u);
  assert.doesNotMatch(markdown, /„Wanderbericht“/u);
  assert.doesNotMatch(markdown, /^## Am Anfang/mu);
  assert.doesNotMatch(markdown, /^### (?:Wir trafen|Gruppenbild)/mu);
  assert.match(markdown, /^### Historischer Hintergrund$/mu);
  assert.match(markdown, /^### 1\\\. Tag:$/mu);
  assert.match(markdown, /^### Präses der Kolpingsfamilie:$/mu);
  assert.doesNotMatch(markdown, /^### Kurze dekorative Bildunterschrift$/mu);
  assert.doesNotMatch(markdown, /^### (?:Dieser Vortrag|im Pfarrheim|Aufzeichnung ansehen)/mu);
  assert.match(markdown, /Dieser Vortrag fand am Donnerstag im Pfarrheim statt\./u);
  assert.match(markdown, /^### Begründung zu dieser Ehrung$/mu);
  assert.doesNotMatch(markdown, /Andrea Storminger Begründung/u);
  assert.match(markdown, /!\[Zeltlager 2025 02\]\(https:\/\/legacy\.example\/images\/zeltlager-02\.jpg\)/u);
  assert.doesNotMatch(markdown, /vor !\[Zeltlager 2025 02\]/u);
  assert.match(markdown, /Dieser Satz leitet den nächsten Programmpunkt ein\./u);
  assert.match(markdown, /^### Samstag, 10\. Juli - Spielenachmittag$/mu);
  assert.doesNotMatch(markdown, /^### Danach ließen wir/mu);
});

test("applies explicit per-record titles and slugs to filename-driven collection items", () => {
  const overrideDecisions = parseMigrationDecisions({
    schemaVersion: 1,
    origin: ORIGIN,
    routes: [{ sourcePath: "/index.php/archiv", targetPath: "/archiv", kind: "page", collection: true }],
    recordOverrides: [{
      sourcePath: "/index.php/archiv/familienzeltlager-2023",
      sourceAliases: ["/index.php/archiv"],
      publishedDate: "2023-07-06",
      detectedTitle: "Zeltlager 01",
      title: "Familienzeltlager 2023 in der Vulkaneifel",
      targetPath: "/archiv/2023-07-06-familienzeltlager-vulkaneifel",
      reason: "Der Bilddateiname ist kein geeigneter Artikeltitel.",
    }],
    recordExcludes: [{
      sourcePath: "/index.php/archiv",
      publishedDate: "2024-02-06",
      detectedTitle: "Defektes Plakat",
      sourceFingerprint: "sha256:37638ebf9ff1b6597951cab80821faccf34dde9bc63e66b9263fd1b92a8a7da4",
      expectedAssetStates: [{
        sourceUrl: `${ORIGIN}/images/defekt.jpg`,
        status: "failed",
        reason: "HTTP 404",
      }],
      reason: "Der Datensatz besteht ausschließlich aus einem nicht mehr vorhandenen Bild.",
    }],
    excludes: [],
  });
  const extracted = extractLegacyPage(`
    <html><head><title>Archiv - Kolping Ramsen</title></head><body><main>
      <div class="blog-item"><div class="item-content">
        <dl class="article-info"><dd>Veröffentlicht: 06. Juli 2023</dd></dl>
        <img src="/images/Zeltlager_01.jpg" alt="Zeltlager 01">
        <p>Unsere Familienfreizeit führte uns in die Vulkaneifel.</p>
      </div></div>
      <div class="blog-item"><div class="item-content">
        <dl class="article-info"><dd>Veröffentlicht: 06. Februar 2024</dd></dl>
        <img src="/images/defekt.jpg" alt="Defektes Plakat">
      </div></div>
    </main></body></html>
  `, `${ORIGIN}/index.php/archiv`, ORIGIN, overrideDecisions);
  assert.equal(extracted.records[0]?.title, "Familienzeltlager 2023 in der Vulkaneifel");
  assert.equal(extracted.records[0]?.targetPath, "/archiv/2023-07-06-familienzeltlager-vulkaneifel");
  assert.match(extracted.records[0]?.markdown ?? "", /!\[Zeltlager 01\]/u, "Ein vorhandener Bild-Alternativtext bleibt unverändert.");
  assert.equal(extracted.records.length, 1);
  assert.ok(extracted.findings.some((finding) => finding.owner.startsWith("record-exclude:") && finding.severity === "info"));

  const drifted = extractLegacyPage(`
    <html><head><title>Archiv - Kolping Ramsen</title></head><body><main>
      <div class="blog-item"><div class="item-content">
        <dl class="article-info"><dd>Veröffentlicht: 06. Februar 2024</dd></dl>
        <img src="/images/defekt.jpg" alt="Defektes Plakat">
        <p>Der Inhalt wurde in der Quelle wiederhergestellt.</p>
      </div></div>
    </main></body></html>
  `, `${ORIGIN}/index.php/archiv`, ORIGIN, overrideDecisions);
  assert.equal(drifted.records.length, 1, "Ein gedrifteter Ausschluss darf den wiederhergestellten Inhalt nicht verwerfen.");
  assert.ok(drifted.findings.some((finding) => finding.severity === "error" && /Fingerprint ist gedriftet/u.test(finding.message)));
});

test("decodes Joomla hidden-mail elements without losing adjacent visible address parts", () => {
  const extracted = extractLegacyPage(`
    <html><head><title>Kontakt - Kolping Ramsen</title></head><body><main>
      <div class="item-page"><h1>Kontakt</h1><div class="com-content-article__body">
        <p>E-Mail: kolping-ramsen<joomla-hidden-mail is-link="1" is-email="0" first="d29sZmdhbmcucm9lcmln" last="dC1vbmxpbmUuZGU=" text="KGF0KWdteC5kZQ==">Diese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein.</joomla-hidden-mail></p>
        <p>Jonas: <joomla-hidden-mail is-link="1" is-email="0" first="am9uYXMuYmVyc3Q=" last="dC1vbmxpbmUuZGU=" text="am9uYXMuYmVyc3QoYXQp">Spambot</joomla-hidden-mail>proton.me</p>
        <p>Nele: <joomla-hidden-mail is-link="1" is-email="1" first="cm9lcmlnLm5lbGU=" last="Z21haWwuY29t" text="">Spambot</joomla-hidden-mail></p>
      </div></div>
    </main></body></html>
  `, `${ORIGIN}/index.php/kontakt`, ORIGIN, decisions);
  const markdown = extracted.records[0].markdown;
  assert.match(markdown, /kolping-ramsen\(at\)gmx\.de/u);
  assert.match(markdown, /jonas\.berst\(at\)proton\.me/u);
  assert.match(markdown, /roerig\.nele@gmail\.com/u);
  assert.doesNotMatch(markdown, /Spambot|JavaScript|joomla-hidden-mail/u);
});

test("cleans current presentation markdown without changing links, mails or cache versions", () => {
  const source = [
    "# _**Mitglied werden**_",
    "",
    "### _**Unterlagen und Kontakt.**_",
    "",
    "E-Mail: kolping-ramsen(at)gmx.de",
    "",
    "_Bettina Schach",
    "",
    "Sebastian Sattler _(Teamsprecher)",
    "",
    "[Datenschutz](/datenschutz)",
    "",
    "[Aufnahmeantrag](/images/Dokumente/Aufnahme_antrag.pdf?v=abc123)",
  ].join("\n");
  const normalized = normalizeCurrentMarkdown(source, "Mitglied werden");
  assert.doesNotMatch(normalized, /_\*\*|^# /mu);
  assert.match(normalized, /kolping-ramsen\(at\)gmx\.de/u);
  assert.match(normalized, /^Bettina Schach$/mu);
  assert.match(normalized, /^Sebastian Sattler \(Teamsprecher\)$/mu);
  assert.doesNotMatch(normalized, /^## Mitglied werden$/mu);
  assert.match(normalized, /\[Datenschutz\]\(\/datenschutz\)/u);
  assert.match(normalized, /\[Aufnahmeantrag\]\(\/images\/Dokumente\/Aufnahme_antrag\.pdf\?v=abc123\)/u);
});

test("structures approved travel histories and legal outlines without dropping content", () => {
  const travel = normalizeCurrentMarkdown([
    "# Reisen Historie der Kolpingsfamlie Ramsen seit 1979",
    "",
    "08.04. - 14. April 1979                      Busreise nach Wien/ Österreich",
    "",
    "06.10. – 09. Okt. 1999                      Busreise nach Storkow,",
    "",
    "                                                          Spreewald",
    "",
    "27.09 - 01. Okt. 2023                         Busreise - Champagne",
    "",
    "### **Ab 2024 werden keine Reisen mehr angeboten.**",
  ].join("\n"), "Städtereisen", "travel-history");
  assert.match(travel, /^## Reisehistorie der Kolpingsfamilie Ramsen seit 1979/mu);
  assert.match(travel, /\| 06\.10\. – 09\. Okt\. 1999 \| Busreise nach Storkow, Spreewald \|/u);
  assert.match(travel, /> Ab 2024 werden keine Reisen mehr angeboten\./u);

  const legal = normalizeCurrentMarkdown([
    "# **Datenschutzerklärung**",
    "",
    "A.      Datenschutzerklärung nach der DSGVO",
    "",
    "**II.       Bereitstellung der Website und Erstellung von Logfiles**",
    "",
    "**1.        Beschreibung und Umfang der Datenverarbeitung**",
    "",
    "Der rechtliche Absatz bleibt unverändert.",
  ].join("\n"), "Datenschutz", "legal-outline");
  assert.equal(legal, [
    "## Datenschutzerklärung nach der DSGVO",
    "",
    "## II. Bereitstellung der Website und Erstellung von Logfiles",
    "",
    "### 1. Beschreibung und Umfang der Datenverarbeitung",
    "",
    "Der rechtliche Absatz bleibt unverändert.",
  ].join("\n"));
});

test("preserves media nested in empty, duplicate and normalized headings", () => {
  const extracted = extractLegacyPage(`
    <html><head><title>Medienbericht - Kolping Ramsen</title></head><body><main>
      <div class="item-page">
        <h1>Medienbericht</h1>
        <div class="com-content-article__body">
          <h2>Medienbericht <img src="/images/title-duplicate.png" alt="Titelbild"></h2>
          <h3><img src="/images/heading-only.png" alt="Nur Medium"></h3>
          <h3>Zwischenüberschrift <img src="/images/normalized-heading.png" alt="Zwischenmotiv"></h3>
          <h4><iframe src="https://video.example/embed/42"></iframe></h4>
          <h5><video><source src="/media/rueckblick.mp4" type="video/mp4"></video></h5>
          <h6><audio src="/media/ansprache.mp3"></audio></h6>
        </div>
      </div>
    </main></body></html>
  `, `${ORIGIN}/index.php`, ORIGIN, decisions);

  const record = extracted.records[0];
  assert.deepEqual(record.assetUrls, [
    `${ORIGIN}/images/heading-only.png`,
    `${ORIGIN}/images/normalized-heading.png`,
    `${ORIGIN}/images/title-duplicate.png`,
  ]);
  assert.match(record.markdown, /!\[Titelbild\]\(https:\/\/legacy\.example\/images\/title-duplicate\.png\)/u);
  assert.match(record.markdown, /!\[Nur Medium\]\(https:\/\/legacy\.example\/images\/heading-only\.png\)/u);
  assert.match(record.markdown, /### Zwischenüberschrift\s*!\[Zwischenmotiv\]/u);
  assert.match(record.markdown, /\[Eingebetteten Inhalt öffnen\]\(https:\/\/video\.example\/embed\/42\)/u);
  assert.match(record.markdown, /\[Video öffnen\]\(https:\/\/legacy\.example\/media\/rueckblick\.mp4\)/u);
  assert.match(record.markdown, /\[Audio abspielen\]\(https:\/\/legacy\.example\/media\/ansprache\.mp3\)/u);
  assert.doesNotMatch(record.markdown, /^## Medienbericht/mu);
});

test("fails explicitly instead of silently truncating at maxPages", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-capture-limit-"));
  try {
    await assert.rejects(
      captureLegacySource({
        origin: ORIGIN,
        outputDir: path.join(root, "snapshot"),
        cacheDir: path.join(root, "cache"),
        decisions,
        maxPages: 1,
      }, fixtureHttp()),
      CrawlIncompleteError,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stops before crawling when robots.txt disallows the complete site", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-capture-robots-"));
  const http = new MemoryHttp(new Map([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\nDisallow: /\n"),
    }],
  ]));
  try {
    await assert.rejects(
      captureLegacySource({
        origin: ORIGIN,
        outputDir: path.join(root, "snapshot"),
        cacheDir: path.join(root, "cache"),
        decisions,
      }, http),
      /robots\.txt untersagt den vollständigen Crawl/u,
    );
    assert.deepEqual(http.calls, [`${ORIGIN}/robots.txt`]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("keeps identical articles when declarative routes place them in different collections", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-capture-identical-"));
  const routeDecisions = parseMigrationDecisions({
    schemaVersion: 1,
    origin: ORIGIN,
    routes: [
      { sourcePath: "/index.php", targetPath: "/", kind: "page" },
      { sourcePath: "/index.php/archiv-a", targetPath: "/archiv-a", kind: "page", collection: true },
      { sourcePath: "/index.php/archiv-b", targetPath: "/archiv-b", kind: "page", collection: true },
    ],
    excludes: [{ pattern: "/index\\.php/gemeinsamer-beitrag$", reason: "Nur kanonische Collection-Ansichten erfassen." }],
  });
  const sharedArticle = (title: string) => `
    <div class="blog-item"><div class="item-content">
      <h2><a href="/index.php/gemeinsamer-beitrag">${title}</a></h2>
      <p>Dieser legitime Beitrag gehört auf beiden alten Übersichtsseiten zum Archiv.</p>
    </div></div>
  `;
  const http = new MemoryHttp(new Map([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\nDisallow: /administrator/\n"),
    }],
    [`${ORIGIN}/index.php`, html(`
      <html><body><main><div class="item-page"><h1>Start</h1><p>Startinhalt für den Test.</p></div></main>
      <a href="/index.php/archiv-a">Archiv A</a><a href="/index.php/archiv-b">Archiv B</a></body></html>
    `)],
    [`${ORIGIN}/index.php/archiv-a`, html(`<html><body><main>${sharedArticle("Gemeinsamer Beitrag")}</main></body></html>`)],
    [`${ORIGIN}/index.php/archiv-b`, html(`<html><body><main>${sharedArticle("Gemeinsamer Beitrag mit Collection-Titel")}</main></body></html>`)],
  ]));

  try {
    const captured = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "snapshot"),
      cacheDir: path.join(root, "cache"),
      decisions: routeDecisions,
      maxPages: 10,
    }, http);
    const shared = captured.snapshot.records.filter((record) => record.markdown.includes("Dieser legitime Beitrag"));
    assert.deepEqual(shared.map((record) => record.targetPath), [
      "/archiv-a/gemeinsamer-beitrag",
      "/archiv-b/gemeinsamer-beitrag-mit-collection-titel",
    ]);
    assert.equal(new Set(shared.map((record) => record.sourceKey)).size, 2);
    assert.ok(captured.snapshot.findings.some((finding) =>
      finding.severity === "error" && finding.message.includes("eine kanonische Quellroute"),
    ));

    const canonicalCaptured = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "canonical-snapshot"),
      cacheDir: path.join(root, "canonical-cache"),
      decisions: parseMigrationDecisions({
        ...routeDecisions,
        canonicalTargets: [{
          targetPrefixes: ["/archiv-a", "/archiv-b"],
          preferTargetPrefix: "/archiv-a",
          reason: "Historische Beiträge liegen im kanonischen Archiv A.",
        }],
      }),
      maxPages: 10,
    }, http);
    const canonicalShared = canonicalCaptured.snapshot.records.filter((record) => record.markdown.includes("Dieser legitime Beitrag"));
    assert.deepEqual(canonicalShared.map((record) => record.targetPath), ["/archiv-a/gemeinsamer-beitrag"]);
    assert.ok(canonicalShared[0].sourcePageUrls.some((url) => url.endsWith("/archiv-b")));
    assert.equal(canonicalCaptured.snapshot.findings.some((finding) => finding.severity === "error"), false);
    assert.ok(canonicalCaptured.snapshot.findings.some((finding) =>
      finding.severity === "info" && finding.message.includes("kanonischen Archiv A"),
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("deduplicates collection copies to an explicitly declared direct route", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-capture-canonical-"));
  const routeDecisions = parseMigrationDecisions({
    schemaVersion: 1,
    origin: ORIGIN,
    routes: [
      { sourcePath: "/index.php", targetPath: "/", kind: "page" },
      { sourcePath: "/index.php/archiv", targetPath: "/archiv", kind: "page", collection: true },
      { sourcePath: "/index.php/archiv/geschichte", targetPath: "/archiv/geschichte", kind: "page" },
    ],
    recordOverrides: [{
      sourcePath: "/index.php/archiv/geschichte",
      sourceAliases: ["/index.php/archiv"],
      publishedDate: "2019-07-03",
      detectedTitle: "Geschichte",
      title: "Kanonische Geschichte",
      targetPath: "/archiv/geschichte",
      reason: "Direktseite und Collection-Kopie teilen eine redaktionelle Titelkorrektur.",
    }],
    excludes: [],
  });
  const http = new MemoryHttp(new Map([
    [`${ORIGIN}/robots.txt`, {
      status: 200,
      finalUrl: `${ORIGIN}/robots.txt`,
      contentType: "text/plain",
      body: Buffer.from("User-agent: *\nDisallow: /administrator/\n"),
    }],
    [`${ORIGIN}/index.php`, html("<html><body><main><div class='item-page'><h1>Start</h1><p>Startinhalt.</p></div></main></body></html>")],
    [`${ORIGIN}/index.php/archiv`, html(`
      <html><body><main><div class="blog-item"><time datetime="2019-07-03"></time><div class="item-content"><h2>Geschichte</h2><p>Ein kanonischer Inhalt.</p></div></div></main></body></html>
    `)],
    [`${ORIGIN}/index.php/archiv/geschichte`, html(`
      <html><body><main><div class="item-page"><h1>Geschichte</h1><time datetime="2019-07-03"></time><div class="com-content-article__body"><p>Ein kanonischer Inhalt.</p></div></div></main></body></html>
    `)],
  ]));
  try {
    const captured = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "snapshot"),
      cacheDir: path.join(root, "cache"),
      decisions: routeDecisions,
      maxPages: 10,
    }, http);
    const stories = captured.snapshot.records.filter((record) => record.targetPath === "/archiv/geschichte");
    assert.equal(stories.length, 1);
    assert.equal(stories[0].targetPath, "/archiv/geschichte");
    assert.equal(stories[0].title, "Kanonische Geschichte");
    assert.deepEqual(stories[0].sourcePageUrls, [
      `${ORIGIN}/index.php/archiv`,
      `${ORIGIN}/index.php/archiv/geschichte`,
    ]);
    assert.ok(!captured.snapshot.findings.some((finding) =>
      finding.severity === "error" && finding.owner.includes("2019-07-03-Geschichte"),
    ));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("compares the sealed snapshot with editorial SQLite and local assets", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-compare-"));
  try {
    const captured = await captureLegacySource({
      origin: ORIGIN,
      outputDir: path.join(root, "snapshot"),
      cacheDir: path.join(root, "cache"),
      decisions,
      maxPages: 20,
    }, fixtureHttp());
    const imageAsset = captured.snapshot.assets.find((asset) => asset.sourceUrls.includes(`${ORIGIN}/images/eins.png`));
    assert.ok(imageAsset?.digest);
    const imageDigest = imageAsset.digest.slice("sha256:".length);
    const derivedImage = `/images/legacy-v2/${imageDigest.slice(0, 2)}/${imageDigest.slice(0, 32)}-w1600-q78.webp`;
    const databaseFile = path.join(root, "editorial.db");
    execFileSync("sqlite3", [databaseFile, `
      CREATE TABLE Page (slug TEXT, title TEXT, content TEXT, published INTEGER);
      CREATE TABLE News (slug TEXT, title TEXT, date TEXT, teaser TEXT, content TEXT, coverImage TEXT, published INTEGER);
      CREATE TABLE Event (slug TEXT, title TEXT, startDate TEXT, endDate TEXT, startTime TEXT, endTime TEXT, location TEXT, description TEXT, published INTEGER);
      CREATE TABLE Redirect (fromPath TEXT, toPath TEXT);
      INSERT INTO News VALUES ('2019-07-03-erster-bericht', 'Erster Bericht', '2019-07-03', '', 'Dieser vollständige Satz ist dekorativer Fließtext und darf nicht als riesige Überschrift in den neuen Inhalt gelangen.\n\n![Gemeinschaft beim Fest](${derivedImage}?v=cache)\n\n[Antrag herunterladen](https://legacy.example/images/antrag.pdf)', NULL, 1);
    `]);
    const publicDir = path.join(root, "public");
    await mkdir(path.dirname(path.join(publicDir, derivedImage)), { recursive: true });
    await writeFile(path.join(publicDir, derivedImage), Buffer.concat([PNG, Buffer.from("transformed-webp-test")]));
    await mkdir(path.join(publicDir, "images"), { recursive: true });
    await writeFile(path.join(publicDir, "images", "antrag.pdf"), PDF);

    const compared = await compareLegacyContent({
      snapshotPath: captured.snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir: path.join(root, "comparison"),
    });
    assert.equal(compared.report.summary.sourceRecords, 6);
    assert.equal(compared.report.summary.currentRecords, 1);
    assert.equal(compared.report.summary.missingAssets, 0);
    assert.equal(compared.report.assets.find((asset) => asset.sourceUrl.endsWith("/eins.png"))?.status, "matched-by-derived-path");
    assert.equal(compared.report.assets.find((asset) => asset.sourceUrl.endsWith("/antrag.pdf"))?.status, "matched-by-digest");
    assert.ok(compared.report.routes.some((route) => route.targetPath === "/aktuelles/2019-07-03-erster-bericht" && route.status === "equivalent"));
    assert.match(await readFile(compared.reportPath, "utf8"), /Abgleich der Legacy-Inhalte/);

    execFileSync("sqlite3", [databaseFile, `UPDATE News SET content = replace(content, '${derivedImage}?v=cache', '/images/falsches-bild.webp');`]);
    const mismatched = await compareLegacyContent({
      snapshotPath: captured.snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir: path.join(root, "comparison-mismatch"),
    });
    const mismatchedRoute = mismatched.report.routes.find((route) => route.targetPath === "/aktuelles/2019-07-03-erster-bericht");
    assert.equal(mismatchedRoute?.status, "different");
    assert.ok(mismatchedRoute?.notes.some((note) => note.includes("Bildpfade")));

    execFileSync("sqlite3", [databaseFile, `UPDATE News SET content = replace(replace(content, '/images/falsches-bild.webp', '${derivedImage}?v=cache'), '\n\n[Antrag herunterladen](https://legacy.example/images/antrag.pdf)', '');`]);
    const incomplete = await compareLegacyContent({
      snapshotPath: captured.snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir: path.join(root, "comparison-incomplete"),
    });
    const incompleteRoute = incomplete.report.routes.find((route) => route.targetPath === "/aktuelles/2019-07-03-erster-bericht");
    assert.equal(incompleteRoute?.status, "different");
    assert.ok(incompleteRoute?.notes.some((note) => note.includes("nicht alle lokal verfügbaren Legacy-Dokumente")));

    execFileSync("sqlite3", [databaseFile, `UPDATE News SET slug = '2019-07-03-fremder-datensatz', title = 'Vollkommen anderes Thema';`]);
    const unrelatedSameDate = await compareLegacyContent({
      snapshotPath: captured.snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir: path.join(root, "comparison-unrelated-date"),
    });
    const unmatchedRoute = unrelatedSameDate.report.routes.find((route) => route.targetPath === "/aktuelles/2019-07-03-erster-bericht");
    assert.equal(unmatchedRoute?.status, "missing-current", "Ein einzelner, aber unähnlicher Datensatz desselben Datums darf nicht zugeordnet werden.");

    execFileSync("sqlite3", [databaseFile, `
      INSERT INTO Event VALUES (
        '2026-01-10-kartenverkauf', 'Kartenvorverkauf', '2026-01-10T00:00:00.000Z', NULL,
        '13:00', '15:00', 'Pfarrheim', '13:00–15:00 Uhr — Kartenvorverkauf im Pfarrheim', 1
      );
    `]);
    const containedTitle = await compareLegacyContent({
      snapshotPath: captured.snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir: path.join(root, "comparison-contained-title"),
    });
    const inferredEvent = containedTitle.report.routes.find((route) => route.kind === "event" && route.title === "Kartenvorverkauf");
    assert.notEqual(inferredEvent?.status, "missing-current");
    assert.ok(inferredEvent?.notes.some((note) => note.includes("2026-01-10-kartenverkauf")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("stages inserts, guarded normalization, draft repairs, assets and parent backfills", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "kolping-stage-"));
  try {
    const outputDir = path.join(root, "legacy");
    const cacheDir = path.join(root, "cache");
    const publicDir = path.join(root, "public");
    const migrationDir = path.join(root, "migration");
    const databaseFile = path.join(root, "editorial.db");
    const stageDecisions = parseMigrationDecisions({
      schemaVersion: 1,
      origin: ORIGIN,
      routes: [
        { sourcePath: "/index.php", targetPath: "/", kind: "page" },
        { sourcePath: "/index.php/archiv", targetPath: "/archiv", kind: "page" },
        { sourcePath: "/index.php/archiv/bestehend", targetPath: "/archiv/bestehend", kind: "page" },
        { sourcePath: "/index.php/archiv/fehlend", targetPath: "/archiv/fehlend", kind: "page" },
        { sourcePath: "/index.php/aktuelles", targetPath: "/aktuelles", kind: "news", collection: true },
      ],
      redirects: [{
        fromPath: "/archiv/verschoben",
        targetPath: "/archiv/fehlend",
        reason: "Der alte Testentwurf wurde in das kanonische Testarchiv verschoben.",
      }, {
        fromPath: "/index.php/alt?catid=2:roh",
        targetPath: "/archiv/fehlend",
        reason: "Ein nicht kanonisch gespeicherter Query-Redirect wird atomar normalisiert.",
      }],
      draftUpdates: [{
        targetPath: "/archiv/bestehend",
        kind: "page",
        publish: true,
        reason: "Der bekannte unvollständige Testentwurf darf aus der kanonischen Quelle repariert werden.",
      }, {
        targetPath: "/aktuelles/2025-06-02-entwurfsnachricht",
        kind: "news",
        publish: true,
        reason: "Die öffentlich erreichbare Testmeldung darf aus der kanonischen Quelle repariert und veröffentlicht werden.",
      }],
      currentNormalizations: [
        {
          targetPath: "/formatseite",
          kind: "page",
          reason: "Die dekorative Testformatierung darf ohne Inhaltsersetzung bereinigt werden.",
        },
        {
          targetPath: "/aktuelles/2025-06-01-saubere-meldung",
          kind: "news",
          reason: "Die dekorative Testformatierung darf ohne Inhaltsersetzung bereinigt werden.",
        },
      ],
      excludes: [{ pattern: "/index\\.php/nicht-zugeordnet", reason: "Unbekannter Testlink bleibt bewusst extern zur Migrationszuordnung." }],
    });
    const http = new MemoryHttp(new Map([
      [`${ORIGIN}/robots.txt`, {
        status: 200,
        finalUrl: `${ORIGIN}/robots.txt`,
        contentType: "text/plain",
        body: Buffer.from("User-agent: *\nDisallow: /administrator/\n"),
      }],
      [`${ORIGIN}/index.php`, html(`
        <html><head><title>Start - Kolping Ramsen</title></head><body><main><div class="item-page"><h1>Start</h1><p>Native Startseite.</p></div></main>
        <a href="/index.php/archiv">Archiv</a><a href="/index.php/archiv/bestehend">Bestehend</a><a href="/index.php/archiv/fehlend">Fehlend</a><a href="/index.php/aktuelles">Aktuelles</a></body></html>
      `)],
      [`${ORIGIN}/index.php/archiv`, html(`
        <html><head><title>Archiv - Kolping Ramsen</title></head><body><main><div class="item-page"><h1>Archiv</h1><time datetime="2023-02-01"></time><p>Sauberer Archivtext.</p></div></main></body></html>
      `)],
      [`${ORIGIN}/index.php/archiv/bestehend`, html(`
        <html><head><title>Bestehend - Kolping Ramsen</title></head><body><main><div class="item-page"><h1>Bestehend</h1><time datetime="2025-05-04"></time><p>Sauber reparierter Inhalt.</p><img src="/images/eins.png" alt="Archivbild"><p><a href="/images/antrag.pdf">Antrag herunterladen</a></p></div></main></body></html>
      `)],
      [`${ORIGIN}/index.php/archiv/fehlend`, html(`
        <html><head><title>Fehlend - Kolping Ramsen</title></head><body><main><div class="item-page"><h1>Fehlend</h1><time datetime="2024-03-02"></time><p>Neu übernommener Inhalt.</p><p><a href="${ORIGIN}/index.php/archiv">Exakter Archivlink</a> <a href="${ORIGIN}/index.php/nicht-zugeordnet?weiter=1">Unbekannter langer Link</a></p></div></main></body></html>
      `)],
      [`${ORIGIN}/index.php/aktuelles`, html(`
        <html><head><title>Aktuelles - Kolping Ramsen</title></head><body><main><div class="blog-item"><div class="item-content">
          <h2>Saubere Meldung</h2><dl class="article-info"><dd>Veröffentlicht: 01. Juni 2025</dd></dl>
          <h3><strong>Saubere Meldung für alle.</strong></h3>
        </div></div><div class="blog-item"><div class="item-content">
          <h2>Entwurfsnachricht</h2><dl class="article-info"><dd>Veröffentlicht: 02. Juni 2025</dd></dl>
          <p>Vollständige öffentliche Testmeldung.</p><img src="/images/eins.png" alt="Bild zur Entwurfsnachricht">
        </div></div><div class="blog-item"><div class="item-content">
          <h2>Bildmeldung</h2><dl class="article-info"><dd>Veröffentlicht: 03. Juni 2025</dd></dl>
          <img src="/images/eins.png" alt="Bildmeldung aus dem Vereinsleben">
        </div></div></main></body></html>
      `)],
      [`${ORIGIN}/images/eins.png`, {
        status: 200,
        finalUrl: `${ORIGIN}/images/eins.png`,
        contentType: "image/png",
        body: PNG,
      }],
      [`${ORIGIN}/images/antrag.pdf`, {
        status: 200,
        finalUrl: `${ORIGIN}/images/antrag.pdf`,
        contentType: "application/pdf",
        body: PDF,
      }],
    ]));
    const captured = await captureLegacySource({
      origin: ORIGIN,
      outputDir,
      cacheDir,
      decisions: stageDecisions,
      maxPages: 10,
    }, http);

    execFileSync("sqlite3", [databaseFile, `
      CREATE TABLE Page (
        id TEXT PRIMARY KEY, slug TEXT UNIQUE, title TEXT, content TEXT,
        metaTitle TEXT, metaDesc TEXT, parent TEXT, sortOrder INTEGER NOT NULL DEFAULT 0,
        archiveDate DATETIME, published INTEGER NOT NULL DEFAULT 0, gallerySlug TEXT, createdAt DATETIME,
        updatedAt DATETIME, authorId TEXT
      );
      CREATE TABLE News (
        id TEXT PRIMARY KEY, slug TEXT, title TEXT, date TEXT, teaser TEXT, content TEXT,
        coverImage TEXT, published INTEGER, createdAt DATETIME, updatedAt DATETIME, authorId TEXT
      );
      CREATE TABLE Event (slug TEXT, title TEXT, startDate TEXT, endDate TEXT, startTime TEXT, endTime TEXT, location TEXT, description TEXT, published INTEGER);
      CREATE TABLE Redirect (id TEXT PRIMARY KEY, fromPath TEXT UNIQUE, toPath TEXT, createdAt DATETIME);
      INSERT INTO Page VALUES ('parent', 'archiv', 'Archiv', 'Sauberer Archivtext.', NULL, NULL, NULL, 0, NULL, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO Page VALUES ('draft', 'archiv/bestehend', 'Bestehend', 'Altes <div>Wrapper-HTML</div>', NULL, NULL, NULL, 7, NULL, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO Page VALUES ('nested', 'archiv/zugeordnet', 'Zugeordnet', 'Bereits guter Inhalt.', NULL, NULL, NULL, 9, NULL, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO Page VALUES ('format', 'formatseite', 'Formatseite', '#### _**Kurze Zwischenüberschrift**_\n\n_**Ein sauberer Satz.**_', NULL, NULL, NULL, 0, NULL, 1, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO Page VALUES ('stale', 'theater', 'Theater', '#### _**Veraltete Theaterseite**_', NULL, NULL, NULL, 0, NULL, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO Page VALUES ('moved', 'archiv/verschoben', 'Verschoben', 'Alte doppelte Ablage.', NULL, NULL, 'archiv', 0, NULL, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO News VALUES ('clean-news', '2025-06-01-saubere-meldung', 'Saubere Meldung', '2025-06-01', 'Saubere Meldung für alle.', '### _**Saubere Meldung für alle.**_', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO News VALUES ('draft-news', '2025-06-02-entwurfsnachricht', 'Entwurfsnachricht', '2025-06-02', 'Alter Teaser', 'Unvollständiger Entwurf.', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL);
      INSERT INTO Redirect VALUES ('raw-query', '/index.php/alt?catid=2:roh', '/archiv/bestehend', CURRENT_TIMESTAMP);
    `]);
    await mkdir(publicDir, { recursive: true });
    const compared = await compareLegacyContent({
      snapshotPath: captured.snapshotPath,
      databaseUrl: `file:${databaseFile}`,
      publicDir,
      outputDir,
    });
    assert.equal(compared.report.summary.failedUrls, 0, JSON.stringify(captured.snapshot.outcomes));
    const tamperedComparisonPath = path.join(outputDir, "tampered-comparison.json");
    await writeFile(tamperedComparisonPath, JSON.stringify({
      ...compared.report,
      routes: compared.report.routes.map((route, index) => index === 0 ? { ...route, status: "equivalent" } : route),
    }));
    await assert.rejects(
      stageLegacyContent({
        snapshotPath: captured.snapshotPath,
        comparisonPath: tamperedComparisonPath,
        approvedSnapshotDigest: captured.snapshot.digest,
        approvedComparisonDigest: compared.report.digest,
        decisions: stageDecisions,
        databaseUrl: `file:${databaseFile}`,
        cacheDir,
        publicDir,
        migrationDir,
        outputDir,
      }),
      /Comparison-Digest ist ungültig/u,
    );
    execFileSync("sqlite3", [databaseFile, "UPDATE Page SET title = 'Redaktioneller Drift' WHERE slug = 'formatseite';"]);
    await assert.rejects(
      stageLegacyContent({
        snapshotPath: captured.snapshotPath,
        comparisonPath: compared.jsonPath,
        approvedSnapshotDigest: captured.snapshot.digest,
        approvedComparisonDigest: compared.report.digest,
        decisions: stageDecisions,
        databaseUrl: `file:${databaseFile}`,
        cacheDir,
        publicDir,
        migrationDir,
        outputDir,
      }),
      /seit dem freigegebenen Vergleich verändert/u,
    );
    execFileSync("sqlite3", [databaseFile, "UPDATE Page SET title = 'Formatseite' WHERE slug = 'formatseite';"]);
    const staged = await stageLegacyContent({
      snapshotPath: captured.snapshotPath,
      comparisonPath: compared.jsonPath,
      approvedSnapshotDigest: captured.snapshot.digest,
      approvedComparisonDigest: compared.report.digest,
      decisions: stageDecisions,
      databaseUrl: `file:${databaseFile}`,
      cacheDir,
      publicDir,
      migrationDir,
      outputDir,
    });

    assert.equal(staged.stagedPages, 1);
    assert.equal(staged.stagedNews, 1);
    assert.equal(staged.updatedDraftPages, 1);
    assert.equal(staged.updatedDraftNews, 1);
    assert.equal(staged.normalizedCurrentPages, 1);
    assert.equal(staged.normalizedCurrentNews, 1);
    assert.equal(staged.guardedStaleDraftCleanups, 2);
    assert.equal(staged.structureFixups, 1);
    assert.equal(staged.archiveDateFixups, 0, "Generische Seitencontainer dürfen kein künstliches Beitragsdatum erhalten.");
    assert.equal(staged.optimizedAssets, 1);
    assert.equal(staged.localizedDocuments, 1);
    const manifest = await readFile(staged.manifestPath, "utf8");
    assert.doesNotMatch(manifest, new RegExp(escapeRegExp(root), "u"));
    assert.match(manifest, /guarded-draft-update/u);
    assert.match(manifest, /currentNormalizations/u);
    const migration = await readFile(staged.migrationPath);
    assert.match(migration.toString(), /WHERE "slug" = 'archiv\/bestehend' AND "title" = 'Bestehend' AND "content" = 'Altes <div>Wrapper-HTML<\/div>' AND "metaDesc" IS NULL AND "parent" IS NULL AND "sortOrder" = 7 AND "archiveDate" IS NULL AND "published" = 0/u);
    const driftDatabase = path.join(root, "drift.db");
    await copyFile(databaseFile, driftDatabase);
    execFileSync("sqlite3", [driftDatabase, "UPDATE Page SET content = 'Zwischenzeitlich redaktionell geändert.' WHERE slug = 'formatseite';"]);
    const driftBefore = execFileSync("sqlite3", [driftDatabase, ".dump"], { encoding: "utf8" });
    assert.throws(
      () => execFileSync("sqlite3", [driftDatabase], { input: migration, stdio: ["pipe", "pipe", "pipe"] }),
      /constraint failed/u,
    );
    const driftAfter = execFileSync("sqlite3", [driftDatabase, ".dump"], { encoding: "utf8" });
    assert.equal(driftAfter, driftBefore, "Eine fehlgeschlagene Migration muss vollständig zurückgerollt werden.");

    const redirectDriftDatabase = path.join(root, "redirect-drift.db");
    await copyFile(databaseFile, redirectDriftDatabase);
    execFileSync("sqlite3", [redirectDriftDatabase, "UPDATE Redirect SET toPath = '/redaktionell-geaendert' WHERE fromPath = '/index.php/alt?catid=2:roh';"]);
    const redirectDriftBefore = execFileSync("sqlite3", [redirectDriftDatabase, ".dump"], { encoding: "utf8" });
    assert.throws(
      () => execFileSync("sqlite3", [redirectDriftDatabase], { input: migration, stdio: ["pipe", "pipe", "pipe"] }),
      /constraint failed/u,
    );
    const redirectDriftAfter = execFileSync("sqlite3", [redirectDriftDatabase, ".dump"], { encoding: "utf8" });
    assert.equal(redirectDriftAfter, redirectDriftBefore, "Redirect-Drift muss die gesamte Migration zurückrollen.");

    const freshDatabase = path.join(root, "fresh.db");
    const schema = execFileSync("sqlite3", [databaseFile, ".schema"], { encoding: "utf8" });
    execFileSync("sqlite3", [freshDatabase], { input: schema });
    execFileSync("sqlite3", [freshDatabase, `
      INSERT INTO Redirect (id, fromPath, toPath, createdAt)
      VALUES ('earlier-migration', '/alter-alias', '/archiv', CURRENT_TIMESTAMP);
    `]);
    execFileSync("sqlite3", [freshDatabase], { input: migration });
    const freshInsertedPages = Number(execFileSync("sqlite3", [freshDatabase, "SELECT count(*) FROM Page;"], { encoding: "utf8" }).trim());
    const freshRevisions = Number(execFileSync("sqlite3", [freshDatabase, "SELECT count(*) FROM LegacyContentRevision;"], { encoding: "utf8" }).trim());
    assert.equal(freshInsertedPages, 1, "Ein frischer Deploy übernimmt ausschließlich neue, versiegelte Datensätze.");
    assert.equal(freshRevisions, 2, "Baseline-abhängige Revisionen dürfen einen frischen Deploy nicht blockieren.");

    execFileSync("sqlite3", [databaseFile], { input: migration });
    const rows = JSON.parse(execFileSync("sqlite3", ["-json", databaseFile, "SELECT slug, parent, sortOrder, archiveDate, published, content FROM Page ORDER BY slug"], { encoding: "utf8" })) as Array<{
      slug: string;
      parent: string | null;
      sortOrder: number;
      archiveDate: string | null;
      published: number;
      content: string;
    }>;
    const repaired = rows.find((row) => row.slug === "archiv/bestehend");
    assert.equal(repaired?.parent, "archiv");
    assert.equal(repaired?.sortOrder, 7);
    assert.equal(repaired?.published, 1);
    assert.match(repaired?.content ?? "", /^Sauber reparierter Inhalt\./u);
    assert.match(repaired?.content ?? "", /\/images\/legacy-v2\//u);
    assert.match(repaired?.content ?? "", /\/documents\/legacy-v2\/.+\.pdf\?v=[a-f0-9]{12}/u);
    assert.ok(rows.some((row) => row.slug === "archiv/fehlend" && row.parent === "archiv" && row.published === 1));
    assert.ok(rows.some((row) => row.slug === "archiv/zugeordnet" && row.parent === "archiv" && row.sortOrder === 9));
    assert.ok(rows.some((row) => row.slug === "archiv" && row.archiveDate === null));
    assert.ok(rows.some((row) => row.slug === "formatseite" && row.content === "### Kurze Zwischenüberschrift\n\nEin sauberer Satz."));
    const inserted = rows.find((row) => row.slug === "archiv/fehlend");
    assert.match(inserted?.content ?? "", /\[Exakter Archivlink\]\(\/archiv\)/u);
    assert.match(inserted?.content ?? "", new RegExp(escapeRegExp(`${ORIGIN}/index.php/nicht-zugeordnet`), "u"));
    assert.ok(rows.some((row) => row.slug === "theater" && row.content.includes("kolpingtheater-ramsen.de") && row.published === 0));
    assert.ok(rows.some((row) => row.slug === "archiv/verschoben" && row.content.includes("/archiv/fehlend") && row.published === 0));
    const redirectRows = JSON.parse(execFileSync("sqlite3", ["-json", databaseFile, "SELECT fromPath, toPath FROM Redirect"], { encoding: "utf8" })) as Array<{
      fromPath: string;
      toPath: string;
    }>;
    assert.ok(redirectRows.some((row) => row.fromPath === "/archiv/verschoben" && row.toPath === "/archiv/fehlend"));
    assert.ok(redirectRows.some((row) => row.fromPath === "/index.php/alt?catid=2%3Aroh" && row.toPath === "/archiv/fehlend"));
    assert.ok(!redirectRows.some((row) => row.fromPath === "/index.php/alt?catid=2:roh"));
    const newsRows = JSON.parse(execFileSync("sqlite3", ["-json", databaseFile, "SELECT slug, date, teaser, content, coverImage, published FROM News"], { encoding: "utf8" })) as Array<{
      slug: string;
      date: string;
      teaser: string;
      content: string;
      coverImage: string | null;
      published: number;
    }>;
    const normalizedNews = newsRows.find((row) => row.slug === "2025-06-01-saubere-meldung");
    assert.equal(normalizedNews?.content, "### Saubere Meldung für alle.");
    assert.doesNotMatch(normalizedNews?.content ?? "", /_\*\*/u);
    const repairedNews = newsRows.find((row) => row.slug === "2025-06-02-entwurfsnachricht");
    assert.equal(repairedNews?.published, 1);
    assert.equal(repairedNews?.date, "2025-06-02T00:00:00.000Z");
    assert.equal(repairedNews?.teaser, "Vollständige öffentliche Testmeldung.");
    assert.match(repairedNews?.content ?? "", /Vollständige öffentliche Testmeldung\./u);
    assert.match(repairedNews?.coverImage ?? "", /\/images\/legacy-v2\//u);
    const imageNews = newsRows.find((row) => row.slug === "2025-06-03-bildmeldung");
    assert.equal(imageNews?.teaser, "Bilder und Erinnerungen aus unserem Vereinsleben vom 3. Juni 2025.");
    assert.doesNotMatch(imageNews?.content ?? "", /Bilder und Erinnerungen/u);
    assert.match(imageNews?.content ?? "", /^!\[Bildmeldung aus dem Vereinsleben\]\(\/images\/legacy-v2\//u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
