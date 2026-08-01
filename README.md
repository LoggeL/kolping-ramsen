# Kolping Ramsen — Vibe Code CMS

Eigenes, leichtgewichtiges CMS für die Website der **Kolpingsfamilie Ramsen**. Ersetzt die bisherige Joomla-Installation auf [kolping-ramsen.de](https://kolping-ramsen.de).

> Klassisch im Look, modern unter der Haube — Serif-Typografie und gedämpfte Pfälzer Pergament-Töne, dazu Server Components, ein zentrales Asset-Management und eine datenschutzfreundliche Statistik.

---

## Funktionen

- **Inhalte** — Aktuelles (News), Termine mit Kategorien, frei pflegbare CMS-Seiten, Galerien, Gästebuch mit Moderation, Kontaktformular.
- **iCal-Export** — Vereins-Termine als `.ics` zum Abonnieren.
- **Mediathek** — Eine zentrale Stelle für alle Bilder: Upload, Umbenennen (mit automatischer Aktualisierung aller Verlinkungen), Alt-Text, Löschen, plus Anzeige *wo* ein Bild verwendet wird.
- **Statistik** — Anonyme Seitenaufrufe (kein IP, kein User-Agent, kein Cookie, DNT respektiert). Eigene Auswertungs-Seite mit Top-Seiten, Referrern, Tages- und Stunden-Diagrammen.
- **Redakteur-Modus** — eingeloggte Redakteur:innen sehen unveröffentlichte Entwürfe direkt im Frontend.
- **301-Redirects** — alte Joomla-URLs werden automatisch auf die neuen Slugs gemappt.
- **SEO** — automatische Sitemap, robots.txt, OpenGraph, pflegbare Meta-Felder pro Seite.

---

## Tech-Stack

- **Next.js 16** (App Router, React 19, Turbopack)
- **TypeScript**, strict
- **Tailwind CSS v4** (klassische Serif-Optik via Source Serif 4)
- **Prisma 7** mit **SQLite** (better-sqlite3 Adapter)
- **jose** für Session-JWTs, **bcryptjs** für Passwort-Hashing
- **@uiw/react-md-editor** für den Markdown-WYSIWYG
- **Nodemailer** für Kontakt-Mails
- **Zod** für Eingabe-Validierung
- **Cheerio** + **turndown** (nur Migrations-Skript) für den Joomla-Import

---

## Setup (lokal)

```bash
git clone <repo> kolping-ramsen
cd kolping-ramsen
npm install
cp .env.example .env       # SESSION_SECRET setzen!
npm run db:migrate         # Datenbank anlegen
npm run seed               # Admin-User + Demo-Inhalte
npm run dev                # http://localhost:3000
```

Beim erstmaligen Seed muss `SEED_ADMIN_PASSWORD` explizit gesetzt sein. Es gibt
kein Standardpasswort.

---

## Umgebungsvariablen (`.env`)

```dotenv
DATABASE_URL="file:./dev.db"
SESSION_SECRET="<32+ Zeichen Zufallswert>"
SEED_ADMIN_EMAIL="admin@kolping-ramsen.de"
SEED_ADMIN_PASSWORD="<mindestens 14 Zeichen; nur beim ersten Seed>"

SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@kolping-ramsen.de"
CONTACT_TO="info@kolping-ramsen.de"
```

`SESSION_SECRET` generieren mit:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Ein bestehendes Admin-Passwort wird direkt im laufenden Container zurückgesetzt,
ohne es in Logs oder der Shell-History auszugeben:

```bash
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
ADMIN_EMAIL="admin@kolping-ramsen.de" npm run admin:reset
unset ADMIN_PASSWORD
```

Wenn `SMTP_HOST` leer ist, werden Mails nur in die Konsole geloggt — praktisch für die Entwicklung.

---

## Skripte

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run start` | Produktions-Server |
| `npm run seed` | Admin-User anlegen + Demo-Inhalte |
| `npm run scrape` | Inhalte aus alter Joomla-Seite importieren |
| `npm run db:migrate` | Prisma-Migration ausführen |
| `npm run db:generate` | Prisma-Client neu generieren |

---

## Datenmodell

Definiert in [`prisma/schema.prisma`](prisma/schema.prisma):

| Modell | Zweck |
|---|---|
| **User** | Redakteur:innen (`role`: `admin` \| `redakteur`) |
| **Page** | Statische CMS-Seiten (geschachtelt via `parent` + `slug`) |
| **News** | Aktuelles mit Datum, Teaser, Inhalt, optionalem Titelbild |
| **Event** | Termine mit Kategorie, Ort, Start/Ende |
| **Gallery** + **Image** | Bildergalerien mit alt-Text und Sortierung |
| **MediaAsset** | Pfad-basierter Eintrag pro hochgeladenem Bild (Alt-Text, Verlinkungen) |
| **GuestbookEntry** | Gästebuch-Einträge mit Moderations-Flag |
| **Redirect** | 301-Mappings von alten Joomla-URLs |
| **PageHit** | Anonyme Seitenaufrufe für die Statistik |

---

## Routenstruktur

### Öffentlich

| Route | Beschreibung |
|---|---|
| `/` | Startseite |
| `/aktuelles` · `/aktuelles/[slug]` | News |
| `/termine` · `/termine/[slug]` | Termine |
| `/galerien` · `/galerien/[slug]` | Galerien |
| `/gaestebuch` | Gästebuch (mit Eintragsformular) |
| `/kontakt` | Kontaktformular |
| `/[...slug]` | Frei pflegbare CMS-Seiten |
| `/sitemap.xml`, `/robots.txt` | SEO |
| `/termine.ics`, `/termine/[slug]/ical` | iCal-Export |
| `/api/track` | Hit-Tracking-Endpoint (POST, anonym) |

### Admin

| Route | Beschreibung |
|---|---|
| `/admin/login` | Anmeldung |
| `/admin` | Dashboard mit Inhalts-Kennzahlen + Hits-Snapshot |
| `/admin/news` · `/admin/news/[id]` | News bearbeiten (mit Thumbnail-Spalte) |
| `/admin/events` · `/admin/events/[id]` | Termine bearbeiten |
| `/admin/pages` · `/admin/pages/[id]` | Seiten bearbeiten (mit ↑/↓-Sortierung) |
| `/admin/galleries` · `/admin/galleries/[id]` | Galerien anlegen + Bilder zuordnen |
| `/admin/media` | **Mediathek** — zentrale Bildverwaltung |
| `/admin/analytics` | **Statistik** — Aufrufe, Top-Seiten, Referrer |
| `/admin/guestbook` | Moderationsqueue |

---

## Mediathek (`/admin/media`)

Eine Stelle für alle Bilder unter `public/uploads/` und `public/images/`.

- **Upload** mit MIME-Check und 10 MB-Limit, gespeichert unter `public/uploads/library/`.
- **Filter** nach Ordner („bucket") und Volltextsuche im Dateinamen.
- **Verwendet in** — pro Bild eine Liste aller Verlinkungen in News (Titelbild + Inhalt), Seiten, Terminen und Galerien, jeweils mit Sprung in den Editor und ↗-Link in die öffentliche Seite.
- **Umbenennen** — Datei wird auf der Platte umbenannt, gleichzeitig werden alle Verlinkungen (Markdown-Inhalte, `coverImage`, `Image.filename`) per SQL-`REPLACE` mit aktualisiert.
- **Alt-Text** — wird in `MediaAsset` gespeichert und in passende `Image`-Einträge gespiegelt.
- **Löschen** — Datei + DB-Einträge werden entfernt.
- **Komfort** — Buttons für „URL kopieren" und „Markdown kopieren" (`![alt](url)`).

---

## Statistik (`/admin/analytics`)

Datenschutzfreundliche Web-Analytics ohne externes Tool:

- **Erfasst werden** nur Pfad, Referrer-Host und Zeitstempel.
- **Nicht erfasst**: IP, User-Agent, Cookies, persönliche Identifikatoren.
- **Respektiert** den `Do-Not-Track`-Header.
- **Ignoriert** Aufrufe von angemeldeten Redakteur:innen sowie `/admin`- und `/api`-Pfade.
- **Auswertung**: Heute / 7 / 30 / 90 Tage, Top-Seiten, Top-Referrer, Tagesverlauf, Stundenverteilung.

Das Tracking ist ein einfacher Beacon-Request (`navigator.sendBeacon`) auf `/api/track`, der nur dann gesendet wird, wenn keine Editor-Session vorliegt.

---

## Sicherheit

- **Sessions** — HttpOnly, SameSite=Lax, JWT (HS256) signiert mit `SESSION_SECRET`. 7 Tage Laufzeit.
- **Passwörter** — bcrypt, cost 12.
- **Login-Bruteforce** — 5 Versuche / 5 Minuten pro IP (in-memory).
- **Kontakt/Gästebuch-Spam** — Honeypot-Feld + Rate-Limit + DSGVO-Consent.
- **Tracking-Spam** — Rate-Limit 60/min pro IP auf `/api/track`.
- **CSRF** — Server Actions sind durch Origin-Checks von Next.js geschützt.
- **XSS** — Inhalt wird im Markdown-Editor manuell gepflegt; im Gästebuch keinerlei HTML.
- **Vor Produktion** — HTTPS erzwingen (Reverse-Proxy / Hosting), Session-Cookie automatisch `secure` in Production.

---

## Migration von der alten Joomla-Seite

```bash
npm run scrape
```

Das Skript:

1. Crawlt `https://kolping-ramsen.de/index.php` rekursiv (max. 80 Seiten)
2. Extrahiert Titel + Inhalt jeder HTML-Seite
3. Legt sie als **unveröffentlichte** `Page`-Einträge an
4. Erstellt `Redirect`-Einträge von alten URLs auf neue Slugs

Nach dem Lauf:

1. `/admin/pages` aufrufen
2. Importierte Seiten prüfen, Inhalte ggf. korrigieren, sortieren (↑/↓)
3. Veröffentlichen
4. Bilder über die **Mediathek** hochladen oder den Galerien zuordnen

Die Redirects greifen automatisch über `src/app/(site)/[...slug]/page.tsx`.

---

## Deployment

### Self-hosted (Hetzner / VPS)

```bash
npm run build
npm run start    # Port 3000
```

Hinter Reverse-Proxy (Caddy/nginx) mit HTTPS. SQLite-Datei + `public/uploads/` regelmäßig sichern.

### Vercel

Funktioniert grundsätzlich, aber SQLite ist auf der serverless Plattform problematisch (kein persistenter Filesystem-Speicher). Für Vercel: auf Postgres + Object Storage (S3 / Vercel Blob) umstellen.

---

## Backup

Zu sichern sind:

1. `dev.db` — die SQLite-Datenbank
2. `public/uploads/` — alle hochgeladenen Bilder
3. `.env` — die Konfiguration

Empfohlen: täglich per Cron, Aufbewahrung 30 Tage.

```bash
DATE=$(date +%Y-%m-%d)
tar czf "kolping-backup-$DATE.tar.gz" dev.db public/uploads .env
```

---

## Verzeichnisstruktur

```
kolping-ramsen/
├── prisma/
│   ├── schema.prisma         # Datenmodell
│   └── migrations/           # SQL-Migrationen
├── public/
│   ├── brand/                # Logo, Wortmarke
│   ├── images/               # Statische / importierte Bilder
│   └── uploads/              # Hochgeladene Bilder (gitignored)
├── scripts/
│   ├── seed.ts               # Admin-User + Demo-Daten
│   ├── seed-from-json.ts     # Inhalts-Import aus JSON
│   ├── scrape.ts             # Joomla-Migration
│   └── html-to-markdown.ts   # Markdown-Konverter
└── src/
    ├── app/
    │   ├── (site)/           # Öffentliches Frontend
    │   ├── admin/            # Backend (Dashboard, Mediathek, Statistik, …)
    │   ├── api/              # API-Routen (Hit-Tracking)
    │   └── globals.css       # Tailwind v4 + traditionelle Serif-Typografie
    ├── components/
    │   ├── admin/            # Admin-Komponenten (Sidebar, Editor, Thumb)
    │   └── …                 # Site-Header, Footer, Tracker
    ├── lib/                  # Prisma, Auth, Mailer, Media-Scan, Referenzen
    └── generated/prisma/     # Prisma-Client (gitignored)
```

---

## Lizenz

Alle Rechte vorbehalten · Kolpingsfamilie Ramsen
