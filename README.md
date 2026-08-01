# Kolping Ramsen – Vereinswebsite und CMS

Moderne Vereinswebsite mit eigenem Redaktionssystem für die
**Kolpingsfamilie Ramsen**. Die produktive Installation läuft unter
[kolping-ramsen.logge.top](https://kolping-ramsen.logge.top); die Inhalte wurden
aus der früheren Joomla-Seite migriert und werden heute in SQLite gepflegt.

## Funktionen

- **Modernes Frontend** – responsive, oben angeordnete Hauptnavigation mit
  Übersichtsseiten, zugänglichem Mobilmenü und klarer aktiver Navigation.
- **Inhalte** – News, frei pflegbare CMS-Seiten, moderiertes Gästebuch und ein
  Kontaktformular mit Validierung, Honeypot und Rate-Limit.
- **Termine** – getrennte Kalenderdaten und lokale Uhrzeiten für
  `Europe/Berlin`, ganztägige sowie mehrtägige Termine und Kategorien.
- **Kalenderexport** – kompletter Kalender und Einzeltermine als
  zeitzonenkorrektes iCalendar mit `VTIMEZONE` und korrekter Ganztags-Semantik.
- **Bilder und Galerien** – zentrale `MediaAsset`-Bibliothek, stabile
  `MediaGroup`-Zuordnungen, Alt-Texte und Bildunterschriften. Markdown-Bilder
  und Galeriegruppen öffnen in einer tastaturbedienbaren Lightbox.
- **Legacy-Routing** – alte Joomla-Pfade und Query-URLs werden normalisiert und
  dauerhaft auf veröffentlichte Inhalte umgeleitet.
- **Datenschutzfreundliche Statistik** – anonyme Seitenaufrufe ohne Cookie,
  gespeicherte IP-Adresse oder User-Agent, mit DNT/GPC-Unterstützung und
  automatischer Löschung alter Einträge.
- **SEO und Betrieb** – Canonicals, Open Graph, Sitemap, Robots, Security
  Header, Liveness- und Readiness-Endpunkte sowie automatisierte Qualitätschecks.

## Tech-Stack

- Next.js 16, React 19 und TypeScript im App Router
- Tailwind CSS v4
- Prisma 7 mit SQLite und `better-sqlite3`
- `jose` für signierte Sessions und `bcryptjs` für Passwörter
- Markdown-Editor mit `marked` und DOMPurify für die öffentliche Ausgabe
- Sharp für validierte, normalisierte Bild-Uploads
- Nodemailer für den SMTP-Versand
- Zod für Eingabevalidierung

## Lokales Setup

Voraussetzung ist Node.js 22. Der mitgelieferte Inhaltsstand liegt in
`build-dev.db`. Beim ersten lokalen Setup wird daraus eine eigene `dev.db`
erstellt; vorhandene Datenbanken werden dabei nicht überschrieben.

```bash
git clone <repo> kolping-ramsen
cd kolping-ramsen
npm ci
cp .env.example .env
```

In `.env` muss zunächst ein eigener `SESSION_SECRET` mit mindestens 32 Zeichen
eingetragen werden. Ein geeignetes Secret lässt sich so erzeugen:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Danach Datenbank, Migrationen und Medienkatalog vorbereiten:

```bash
DATABASE_URL=file:./dev.db npm run db:prepare
npm run db:deploy
npm run media:sync
```

Es gibt kein mitgeliefertes oder voreingestelltes Admin-Passwort. Das erste
Konto wird bewusst mit einem eigenen Passwort von mindestens 14 Zeichen
angelegt, ohne das Passwort in die Shell-History zu schreiben:

```bash
read -s SEED_ADMIN_PASSWORD
export SEED_ADMIN_PASSWORD
npm run seed
unset SEED_ADMIN_PASSWORD
npm run dev
```

Die lokale Website ist anschließend unter <http://localhost:3000> erreichbar,
das Redaktionssystem unter <http://localhost:3000/admin>.

## Konfiguration

Die Vorlage steht in [`.env.example`](.env.example). Für Docker setzt das
`Dockerfile` bereits `DATABASE_URL=file:/data/dev.db` und
`MEDIA_UPLOAD_DIR=/data/uploads`.

| Variable | Bedeutung |
|---|---|
| `DATABASE_URL` | SQLite-URL; lokal `file:./dev.db`, im Container `file:/data/dev.db` |
| `SESSION_SECRET` | Pflichtwert mit mindestens 32 Zeichen für Session-JWTs |
| `NEXT_PUBLIC_SITE_URL` | Öffentlicher Origin für Canonicals, Open Graph, Sitemap, Robots und Kalenderlinks |
| `MEDIA_UPLOAD_DIR` | Verzeichnis für verwaltete Uploads; Produktion standardmäßig `/data/uploads`, Entwicklung `public/uploads` |
| `SEED_DATABASE_PATH` | Optionale Quelldatenbank für `db:prepare`; Standard `build-dev.db` |
| `SEED_ADMIN_EMAIL` | E-Mail-Adresse bei der erstmaligen Kontoanlage |
| `SEED_ADMIN_PASSWORD` | Nur für die erstmalige Kontoanlage; mindestens 14 Zeichen, kein Standardwert |
| `SMTP_HOST`, `SMTP_PORT` | SMTP-Server; Port 465 aktiviert implizit TLS |
| `SMTP_USER`, `SMTP_PASS` | Optionales SMTP-Login; beide Werte müssen gemeinsam gesetzt oder leer sein |
| `SMTP_FROM`, `CONTACT_TO` | Absender und Zieladresse des Kontaktformulars |
| `TRUSTED_PROXY_HOPS` | Anzahl vertrauenswürdiger Proxy-Hops; Dokploy/Traefik direkt vor Next.js: `1`, direkte Exposition: `0` |
| `RATE_LIMIT_MAX_BUCKETS` | Obergrenze des prozesslokalen Rate-Limit-Speichers; Standard `10000` |
| `ANALYTICS_RETENTION_DAYS` | Aufbewahrung anonymer Seitenaufrufe; Standard `180`, zulässig sind 1 bis 3650 Tage |

`NEXT_PUBLIC_SITE_URL` darf nur einen absoluten HTTP(S)-Origin enthalten, also
keinen Pfad, Query-String oder Zugangsdaten. Außer für localhost ist HTTPS
Pflicht. Ohne Konfiguration wird
`https://kolping-ramsen.logge.top` verwendet; fehlerhafte Werte brechen den
Build ab, bevor falsche Canonicals oder Kalenderlinks veröffentlicht werden.

Das Kontaktformular arbeitet **fail-closed**: Fehlt `SMTP_HOST`, ist die
Authentifizierung unvollständig oder schlägt die Zustellung fehl, wird dem
Besucher ein Versandfehler angezeigt. Nachrichten oder Empfängerdaten werden
nicht als Ersatz in Logs geschrieben.

## Redaktionssystem und Datenmodell

Das Schema liegt in [`prisma/schema.prisma`](prisma/schema.prisma).

| Modell | Zweck |
|---|---|
| `User` | Redaktionskonten mit Rolle `admin` oder `redakteur` |
| `Page` | Statische CMS-Seiten mit Slug, Hierarchie, Sortierung und Veröffentlichungsstatus |
| `News` | Aktuelles mit Datum, Teaser, Markdown-Inhalt und optionalem Titelbild |
| `Event` | Civil Date, optionale lokale Uhrzeiten, `allDay`, Zeitzone, Kategorie und Ort |
| `MediaAsset` | Stabiler Medienpfad plus Dateimetadaten, Hash, Alt-Text, Caption und Credit |
| `MediaGroup` | Benannte Galeriegruppe, die über `::gallery[slug]::` in Inhalte eingebettet wird |
| `MediaGroupItem` | Sortierte Referenz auf ein `MediaAsset`, optional mit Alt-/Caption-Override |
| `GuestbookEntry` | Moderierbarer Gästebucheintrag |
| `Redirect` | Mapping alter Pfade auf neue URLs |
| `PageHit` | Anonymer Seitenaufruf für die interne Statistik |

Es gibt bewusst keine separaten `Gallery`- oder `Image`-Modelle mehr.
Galeriegruppen referenzieren stabile Asset-IDs, damit Dateimetadaten und
Verwendungen an einer Stelle konsistent bleiben.

### Termine

Ein Datum wird als bürgerliches Kalenderdatum gespeichert und nicht als
beliebig umrechenbarer Zeitpunkt behandelt. Uhrzeiten stehen getrennt in
`startTime`/`endTime` und gelten für `Europe/Berlin`. Dadurch bleiben Datum und
Uhrzeit bei Server-Rendering, Browser-Hydration und Sommerzeitwechseln stabil.
Ohne Startzeit ist ein Termin ganztägig.

Kalender-Feeds:

- `/termine.ics` – alle veröffentlichten Termine
- `/termine/[slug]/ical` – ein einzelner veröffentlichter Termin

### Mediathek

Die Mediathek unter `/admin/media` katalogisiert sowohl versionierte Bilder aus
`public/images` als auch verwaltete Uploads. Galeriegruppen werden unter
`/admin/media/groups` gepflegt.

- Pro Upload sind höchstens 20 JPEG-, PNG-, WebP- oder AVIF-Dateien erlaubt,
  jeweils maximal 15 MB und 40 Megapixel.
- Sharp richtet Bilder anhand ihrer Metadaten aus, entfernt Metadaten,
  verkleinert sie auf höchstens 2560 Pixel Kantenlänge und speichert sie als
  WebP.
- Ein SHA-256-basierter Dateiname erlaubt die Deduplizierung gleicher Inhalte
  innerhalb eines Upload-Batches und ergibt eine stabile, unveränderliche URL
  unter `/uploads/library/…`.
- Alt-Text, Caption, Abmessungen, MIME-Typ, Größe und Hash stehen am
  `MediaAsset`; Galerieeinträge können Alt-Text und Caption überschreiben.
- Die Mediathek zeigt alle erkannten Verwendungen und schützt referenzierte
  Bilder vor dem Löschen.
- Nur verwaltete Uploads können gelöscht werden. Versionierte Bilder aus
  `public/images` bleiben Teil des Deployments.
- Medien-URLs werden nicht umbenannt. Nur der Slug einer Galeriegruppe kann
  geändert werden; deren Einbettungen werden dabei transaktional aktualisiert.

Im Container liegen Uploads nicht im Image, sondern dauerhaft unter
`/data/uploads`. Die Route `/uploads/[...path]` liefert diese Dateien mit
immutable Cache-Headern aus. `npm run media:sync` gleicht statische Bilder,
persistente Uploads und gegebenenfalls alte `public/uploads` mit dem
`MediaAsset`-Katalog ab. Ein tatsächlich vorhandener Legacy-Bestand wird genau
einmal atomar in das persistente Verzeichnis kopiert und dort mit
`.legacy-import-v1.complete` als abgeschlossen markiert; spätere Löschungen
werden dadurch bei Neustarts nicht wiederhergestellt.

## Öffentliche und administrative Routen

| Route | Zweck |
|---|---|
| `/` | Startseite |
| `/aktuelles` und `/aktuelles/[slug]` | Newsübersicht und Einzelbeiträge |
| `/termine` und `/termine/[slug]` | Terminübersicht und Einzeltermine |
| `/vereinsbereiche`, `/ueber-uns`, `/rueckblick`, `/galerien` | Kuratierte Bereichsübersichten |
| `/gaestebuch`, `/kontakt` | Gästebuch und Kontaktformular |
| `/[...slug]` | Veröffentlichte CMS-Seiten und Legacy-Weiterleitungen |
| `/sitemap.xml`, `/robots.txt` | Suchmaschinen-Metadaten |
| `/health/live` | Liveness: der Node-Prozess beantwortet Requests |
| `/health/ready` | Readiness: Datenbankzugriff und erwartetes Schema funktionieren |
| `/admin` | Dashboard |
| `/admin/news`, `/admin/events`, `/admin/pages` | Inhaltsverwaltung |
| `/admin/media`, `/admin/media/groups` | Mediathek und Galeriegruppen |
| `/admin/guestbook`, `/admin/analytics` | Moderation und interne Statistik |

Beide Health-Endpunkte sind dynamisch, nicht cachebar und für Suchmaschinen
gesperrt. Der Docker-Healthcheck verwendet `/health/ready`.

## Statistik und Datenschutz

Das interne Tracking speichert nur den bereinigten Pfad, die HTTP(S)-Origin
eines Referrers und einen Zeitstempel. Query-Strings, Referrer-Pfade,
Zugangsdaten, IP-Adressen, User-Agents und Cookies werden nicht in der
Analytics-Datenbank abgelegt.

`DNT: 1` und `Sec-GPC: 1` werden serverseitig respektiert. Admin- und API-Pfade
sowie Aufrufe angemeldeter Redakteur:innen werden ignoriert. Beim Prozessstart
und anschließend täglich entfernt die Anwendung Einträge, die älter als
`ANALYTICS_RETENTION_DAYS` sind.

## Sicherheit

- Session-Cookies sind `HttpOnly`, `SameSite=Lax`, in Produktion `Secure` und
  sieben Tage gültig. JWTs prüfen Issuer und Audience.
- Jede Session wird gegen den aktuellen Benutzer und dessen
  Credential-Zeitstempel geprüft. Passwort- oder Rollenänderungen machen
  bestehende Sessions ungültig.
- Passwörter werden mit bcrypt (Cost 12) gehasht; bekannte kompromittierte
  Bootstrap-Passwörter werden abgelehnt.
- Login, Kontakt, Gästebuch und Tracking verwenden einen begrenzten,
  prozesslokalen Rate-Limiter. Die Client-IP wird vom rechten Ende der
  `X-Forwarded-For`-Kette anhand von `TRUSTED_PROXY_HOPS` bestimmt.
- Öffentliches Markdown wird mit DOMPurify bereinigt; JSON-LD wird vor dem
  Einbetten script-sicher serialisiert.
- Die Anwendung setzt eine Content Security Policy sowie HSTS,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
  Clickjacking- und Cross-Origin-Schutzheader.
- Der SMTP-Versand schlägt bei fehlender oder ungültiger Konfiguration sicher
  fehl und protokolliert keine Nachrichteninhalte.

### Admin-Passwort zurücksetzen

Ein Passwort wird direkt im laufenden Container bzw. in der Zielumgebung
zurückgesetzt. Es muss mindestens 14 Zeichen lang sein. Die interaktive Eingabe
verhindert, dass es in Shell-History oder Kommandozeilenargumenten erscheint:

```bash
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
ADMIN_EMAIL="admin@kolping-ramsen.de" npm run admin:reset
unset ADMIN_PASSWORD
```

Der Reset aktualisiert den Credential-Zeitstempel, invalidiert vorhandene
Sessions und entsperrt den historisch kompromittierten Bootstrap-Account.

## Qualitätssicherung

```bash
npm run check
```

`check` erzeugt den Prisma-Client, prüft Datenbankintegrität und
Migrationsprüfsummen, führt Next-Typgenerierung und TypeScript, alle Node-Tests,
den Inhalts-Audit und den Produktions-Build aus.
`npm run content:audit` kann separat genutzt werden. Der Audit meldet unter
anderem zu kurze veröffentlichte Inhalte, fehlende Assets, inkonsistente
Termindaten, unerreichbare Navigationsziele sowie fehlende oder leere
Galeriegruppen.

Die GitHub-Actions-Workflowdatei `.github/workflows/quality.yml` läuft bei
Pull Requests und Pushes auf `main`. Zusätzlich prüft sie Produktionsabhängigkeiten
mit `npm audit`, spielt alle Migrationen auf eine frische SQLite-Datenbank und
startet das gebaute Produktions-Image für einen Smoke-Test von Readiness,
Startseite und Sitemap.

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktionsserver; führt vorher `db:prepare`, `db:deploy` und `media:sync` aus |
| `npm run check` | Vollständige lokale Quality-Gate |
| `npm test` | Unit- und Integrationstests unter `src/lib/*.test.ts` |
| `npm run typecheck` | Next-Routentypen und TypeScript prüfen |
| `npm run content:audit` | Veröffentlichte Inhalte, Assets, Navigation und Galerien prüfen |
| `npm run db:prepare` | Fehlende Zieldatenbank atomar aus `build-dev.db` initialisieren |
| `npm run db:deploy` | Vorhandene Prisma-Migrationen anwenden |
| `npm run db:verify` | Integrität und Prüfsummen der Zieldatenbank prüfen |
| `npm run db:migrate` | Migrationen während der lokalen Schemaentwicklung erzeugen/anwenden |
| `npm run db:generate` | Prisma-Client erzeugen |
| `npm run media:sync` | Dateisystem und `MediaAsset`-Katalog abgleichen |
| `npm run seed` | Initiales Admin-Konto anlegen; Beispiel-News höchstens als Entwurf |
| `npm run admin:reset` | Passwort eines vorhandenen Kontos sicher zurücksetzen |
| `npm run scrape` | Alte Joomla-Seiten als zu prüfende Entwürfe importieren |

## Deployment mit Docker und Dokploy

Das Docker-Image nutzt Node.js 22 und erwartet ein persistentes Volume unter
`/data`. Beim Start führt `npm run start` automatisch diese Schritte aus:

1. `db:prepare` kopiert `build-dev.db` nur dann nach `/data/dev.db`, wenn noch
   keine Datenbank existiert.
2. `db:deploy` spielt alle ausstehenden Prisma-Migrationen ein.
3. `media:sync` registriert statische Bilder und persistente Uploads im
   Medienkatalog.
4. Erst danach startet der Next.js-Server auf Port 3000.

Damit bleiben redaktionelle Daten und Uploads über Image-Rebuilds hinweg
erhalten. Eine neue Installation enthält absichtlich kein nutzbares
Standardkonto; das erste Konto wird einmalig mit `npm run seed` und einem
eigenen `SEED_ADMIN_PASSWORD` angelegt.

Die aktuelle Produktionsinstallation wird von Dokploy/Traefik betrieben. Ein
Push auf `main` löst dort den automatischen Build und Rollout aus. Vor einem
Push sollte `npm run check` lokal erfolgreich sein; nach dem Rollout müssen
mindestens `/health/live` und `/health/ready` erfolgreich antworten.

SQLite und lokale Uploads benötigen ein persistentes Dateisystem. Ein
serverloses Deployment ohne persistentes Volume ist deshalb nicht geeignet,
solange Datenbank und Medien nicht auf externe Dienste umgestellt werden.

## Backup und Wiederherstellung

Im produktiven Volume müssen gemeinsam gesichert werden:

1. `/data/dev.db` – redaktionelle SQLite-Datenbank einschließlich Nutzer,
   Inhalte, Redirects, Medienmetadaten und Statistik.
2. `/data/uploads` – alle über die Mediathek hochgeladenen Originalbestände
   nach der Normalisierung.

Für einen konsistenten Datenbankstand den Container während der Dateikopie
stoppen oder einen transaktionskonsistenten Volume-/SQLite-Snapshot verwenden.
Secrets und Umgebungsvariablen gehören separat in den geschützten
Konfigurations- oder Secret-Store der Plattform und nicht in dasselbe
Archiv wie die öffentlichen Medien.

Bei einer Wiederherstellung werden `/data/dev.db` und `/data/uploads` in ein
leeres persistentes Volume zurückgespielt und die Anwendung anschließend
gestartet. Der normale `prestart`-Ablauf bringt die Datenbank auf den aktuellen
Migrationsstand und synchronisiert den Medienkatalog.

## Projektstruktur

```text
kolping-ramsen/
├── .github/workflows/       # CI-Quality-Gate
├── prisma/
│   ├── schema.prisma        # Aktuelles Datenmodell
│   └── migrations/          # Versionierte SQL-Migrationen
├── public/
│   ├── brand/               # Logo und Wortmarke
│   ├── images/              # Versionierte/importierte Medien
│   └── uploads/             # Nur lokaler/Legacy-Uploadpfad
├── scripts/
│   ├── audit-content.ts     # Inhalts- und Asset-Prüfung
│   ├── prepare-database.mjs # Erstinitialisierung der persistenten DB
│   ├── sync-media-assets.mjs# Aufbau/Aktualisierung des Medienkatalogs
│   ├── verify-database.mjs   # Integrität, Migrationen und Schemas prüfen
│   ├── seed-admin.mjs        # Bewusste Konto-Erstinitialisierung
│   └── scrape.ts            # Legacy-Joomla-Import
└── src/
    ├── app/                 # Öffentliches Frontend, Admin, API und Health
    ├── components/          # Navigation, Lightbox, Redaktions-UI
    ├── generated/prisma/    # Generierter Prisma-Client
    └── lib/                 # Auth, Termine, iCal, Medien, Mail und Tracking
```

## Lizenz

Alle Rechte vorbehalten · Kolpingsfamilie Ramsen
