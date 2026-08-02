# Legacy-Inhaltsentscheidungen

`legacy-decisions.json` ist der deklarative Plan für die Migration von
`kolping-ramsen.de`. Die Datei ordnet bekannte Joomla-Pfade den heutigen
Zielrouten und einem redaktionellen Inhaltstyp zu.

Ein Eintrag mit `collection: true` bezeichnet eine Sammel- oder
Kategorieansicht. Der Import soll deren einzelne Artikel als eigenständige
Inhalte extrahieren, statt das Joomla-Wrapper-HTML als einen großen Body zu
übernehmen. Genauere Routen haben Vorrang vor ihrer übergeordneten Collection.
Ein optionaler `title` an einer genauen Route korrigiert ausschließlich
dokumentierte, aus Bilddateinamen übernommene Joomla-Titel.

`recordOverrides` korrigiert einzelne Collection-Beiträge über die versiegelte
Kombination aus Quellpfad, Veröffentlichungsdatum und erkanntem Titel. Ein
`sourceAliases`-Eintrag steht für eine weitere tatsächliche Joomla-Ansicht
desselben Beitrags. Der Capture verlangt jede Haupt- und Aliasquelle einzeln
und stoppt, sobald eine Kopie fehlt oder inhaltlich abweicht.

`recordExcludes` ist für nicht wiederherstellbare Einzelfälle reserviert. Ein
Ausschluss benötigt neben Datum und Titel einen Fingerprint des normalisierten
Quellinhalts sowie die exakten erwarteten Asset-Zustände. Auch Assets eines
ausgeschlossenen Datensatzes werden bei jedem normalen Capture neu geladen.
Wird etwa ein zuvor fehlendes Bild wiederhergestellt oder erscheint neuer
Text, wird der Datensatz nicht mehr still verworfen und der Capture schlägt
fehl. Eine erfolgreich geladene Detailseite ohne Datensatz benötigt außerdem
einen expliziten Redirect.

`redirects` dokumentiert heutige App-Aliase, die durch eine bewusst bereinigte
Informationsarchitektur ersetzt werden. Unveröffentlichte Altentwürfe an
diesen Pfaden erhalten einen neutralen Verschiebehinweis; der Redirect selbst
zeigt auf den veröffentlichten kanonischen Rückblick.

`canonicalTargets` löst ausschließlich dokumentierte Doppelablagen desselben
Inhalts auf. Wenn ein alter Artikel etwa zugleich unter einem aktuellen
Vereinsbereich und im Rückblick erschien, legt die Regel fest, in welchem
Archiv er einmalig landet. Nicht deklarierte Cross-Target-Duplikate stoppen das
Staging weiterhin mit einem Fehler.

`draftUpdates` ist die einzige Freigabe, einen bereits vorhandenen
unveröffentlichten Seiten- oder Newsdatensatz aus der Legacy-Quelle zu ersetzen
und zu veröffentlichen. Der Inhaltstyp und optionale Titelkorrekturen stehen
direkt an dieser Freigabe.
`currentNormalizations` bereinigt dagegen ausschließlich das bereits im CMS
vorhandene Markdown. Es übernimmt keinen Quelltext und lässt Links, E-Mail-
Adressen sowie lokale, cache-versionierte Medienpfade unverändert.
Die optionalen Formate `travel-history` und `legal-outline` erlauben nur die
dokumentierten semantischen Umbauten zu einer zugänglichen Reisetabelle bzw.
einer sauberen Überschriftenhierarchie; `default` bleibt rein präsentational.

`excludes[].pattern` ist ein regulärer Ausdruck gegen den normalisierten
Quellpfad einschließlich Query-String; bei externen Links darf er gegen die
absolute URL geprüft werden. Excludes unterdrücken nur den Content-Crawl.
Binärdateien dürfen weiterhin über das Asset-Manifest geladen werden.

Die Entscheidungen basieren auf `scripts/seed-data`, der aktuellen Navigation
in `src/lib/site.ts` und den bekannten Legacy-Redirects. Änderungen an der
alten oder neuen Seitenstruktur gehören in diese Datei und nicht als
seitenbezogene Sonderfälle in den Scraper.

## Reproduzierbarer Ablauf

```bash
# Unveränderliche Datenbank von vor der Inhaltsmigration bereitstellen.
# Diese Git-Version enthält alle 14 vorausgehenden Produktionsmigrationen.
git show 35e2441:build-dev.db > /tmp/kolping-legacy-baseline.db

# Alte Website frisch erfassen und read-only mit genau dieser Basis vergleichen.
MIGRATION_DATABASE_URL=file:/tmp/kolping-legacy-baseline.db \
  npm run content:migrate -- all

# Bericht sowie Snapshot- und Vergleichs-Digest prüfen
less content/legacy/report.md

# Erst nach der Prüfung eine an beide Artefakte gebundene Datenmigration erzeugen
MIGRATION_DATABASE_URL=file:/tmp/kolping-legacy-baseline.db \
  npm run content:migrate:stage -- \
  --approve sha256:<snapshot-digest> \
  --approve-comparison sha256:<vergleichs-digest>
```

Der Vergleich und das Staging müssen dieselbe unveränderte Pre-Migration-
Datenbank verwenden. Der Vergleich versiegelt einen logischen Digest aller
Seiten, News, Termine und Redirects; ein zwischenzeitlich veränderter Stand
stoppt das Staging. Insbesondere darf hierfür nicht die bereits migrierte
`build-dev.db` verwendet werden.

Der Crawl schreibt niemals direkt ins CMS. Er legt einen versiegelten Snapshot,
normalisierte Markdown-Datensätze und einen Vergleichsbericht unter
`content/legacy/` ab. Nur der separate Staging-Schritt darf daraus eine
Prisma-Migration, Redirects, optimierte WebP-Dateien und lokalisierte Dokumente
erzeugen. Bereits vorhandene, auch nur inhaltlich äquivalente CMS-Fassungen
bleiben standardmäßig unangetastet. Nur die expliziten `draftUpdates` und
`currentNormalizations` dürfen geguardet mutieren. Aggregatseiten sowie
unveröffentlichte, durch native oder kanonische Seiten ersetzte Alias-Entwürfe
werden ebenfalls nur über exakte Ausgangswert-Guards bereinigt.

Heruntergeladene Originaldateien liegen ausschließlich im ignorierten Cache
`.cache/legacy-migration/`. Sie gehören nicht ins Repository. Die versionierten
Dateien unter `public/images/legacy-v2/` sind dedupliziert, auf maximal 1600 px
begrenzt und für die Auslieferung optimiert.

Standardmäßig lädt jeder Capture alle Quell-Assets neu, damit Änderungen unter
gleichbleibenden Joomla-URLs sichtbar werden. `--reuse-assets` ist eine
bewusste Offline-/Beschleunigungsoption; auch dann werden Cache-Dateien vor der
Verwendung gegen ihren SHA-256-Digest geprüft.
