# Admin-Handbuch — Kolping Ramsen Website

Kurzanleitung für Vorstand und Redaktion. Die Website lebt von aktuellen Inhalten — diese Anleitung zeigt, wie man News, Termine, Seiten, Galerien und das Gästebuch pflegt.

## 1. Anmelden

1. Im Browser `https://kolping-ramsen.de/admin/login` aufrufen
2. E-Mail und Passwort eingeben
3. Klick auf **Anmelden**

Nach 7 Tagen wird man automatisch abgemeldet. Bei 5 Fehlversuchen wird die IP für 5 Minuten gesperrt.

> **Wichtig**: Das initiale Passwort `ChangeMe!2026` sofort beim ersten Login ändern (siehe Abschnitt 7).

## 2. Dashboard

Nach dem Login sieht man auf einen Blick:
- Anzahl News, Termine, Seiten, Galerien
- **Gelb hervorgehoben**: Wartende Gästebuch-Einträge — die müssen geprüft werden!

## 3. News pflegen

### Neue News anlegen

1. Im Menü oben auf **News** klicken
2. Button **+ Neue News**
3. Felder ausfüllen:
   - **Titel**: Schlagzeile, klar und kurz
   - **Slug**: leer lassen, wird automatisch erzeugt
   - **Datum**: heute oder das tatsächliche Datum
   - **Teaser**: 1–2 Sätze als Anriss (für Übersichtsseite und Vorschau)
   - **Inhalt**: HTML-Code des Artikels — siehe HTML-Hilfe unten
   - **Veröffentlicht**: Häkchen setzen, sobald die News online gehen soll
4. **Anlegen**

### Bestehende News bearbeiten

1. **News** im Menü → in der Liste auf **Bearbeiten** klicken
2. Felder anpassen
3. **Speichern**

### News löschen

In der Detailansicht ganz unten auf **News löschen** klicken.

### HTML-Hilfe für den Inhalt

Im Inhaltsfeld kann einfaches HTML verwendet werden:

```html
<p>Ein normaler Absatz mit <strong>fettem Text</strong>.</p>

<h2>Eine Zwischenüberschrift</h2>

<p>Noch ein Absatz mit einem <a href="https://example.com">Link</a>.</p>

<ul>
  <li>Erster Listenpunkt</li>
  <li>Zweiter Listenpunkt</li>
</ul>

<img src="/uploads/mein-bild.jpg" alt="Beschreibung" />
```

## 4. Termine pflegen

1. Menü → **Termine** → **+ Neuer Termin**
2. Felder:
   - **Titel**: z.B. "Jahreshauptversammlung"
   - **Beginn**: Datum + Uhrzeit
   - **Ende**: optional
   - **Ort**: z.B. "Pfarrheim Ramsen"
   - **Kategorie**: `alle`, `jugend`, `familie`, oder `verein` — bestimmt den Filter auf der Website
   - **Beschreibung**: ausführlicher Text
3. **Anlegen**

Termine erscheinen automatisch in der Übersicht (sortiert nach Datum) und im iCal-Export.

## 5. Galerien anlegen

### Galerie erstellen

1. Menü → **Galerien** → **+ Neue Galerie**
2. Titel, optional Datum und Beschreibung
3. **Anlegen und Bilder hochladen**

### Bilder hochladen

1. In der Bearbeitungsansicht der Galerie → **Bilder hochladen**
2. **Datei auswählen** → mehrere Bilder auf einmal markieren (Strg/Cmd+Klick)
3. **Hochladen**

Erlaubt: JPEG, PNG, WebP, GIF, AVIF. Maximal 10 MB pro Bild.

### Alt-Texte ergänzen (wichtig für Barrierefreiheit)

Unter jedem hochgeladenen Bild gibt es ein Eingabefeld für den Alt-Text. Bitte kurz beschreiben, was zu sehen ist (z.B. "Vorstand bei der Jahresversammlung 2025").

### Bild oder Galerie löschen

- Einzelnes Bild: unter dem Bild auf **Bild löschen**
- Ganze Galerie: ganz unten auf der Bearbeitungsseite **Galerie löschen** — entfernt auch alle Bilder

## 6. Seiten (CMS) pflegen

Seiten sind die statischen Inhalte wie "Über uns", "Pfarrheim", "Vereinsdaten" etc.

### Neue Seite anlegen

1. Menü → **Seiten** → **+ Neue Seite**
2. **Titel**: wie er als H1 erscheinen soll
3. **Slug**: nur Kleinbuchstaben + Bindestriche (z.B. `pfarrheim`)
4. **Übergeordnet** (optional): wenn die Seite unter `/ueber-uns/` liegen soll, hier `ueber-uns` eintragen
5. **Inhalt**: HTML wie bei News
6. **Meta-Titel** und **Meta-Beschreibung**: für Google-Suche (optional, sonst werden Titel und nichts verwendet)
7. **Anlegen**

Die Seite ist dann unter `https://kolping-ramsen.de/<parent>/<slug>` erreichbar.

## 7. Gästebuch moderieren

> **Wichtig**: Gästebuch-Einträge werden NICHT automatisch veröffentlicht. Sie warten auf eine Freigabe.

1. Menü → **Gästebuch**
2. Im oberen Bereich **"Wartet auf Freigabe"** stehen alle neuen Einträge
3. Pro Eintrag:
   - **Freigeben** → Eintrag wird auf der öffentlichen Gästebuchseite sichtbar
   - **Löschen** → Eintrag wird permanent gelöscht (z.B. bei Spam)

Bereits freigegebene Einträge können unten ebenfalls gelöscht werden.

**Empfehlung**: Mindestens einmal pro Woche das Gästebuch checken.

## 8. Kontaktformular

Das öffentliche Kontaktformular leitet alle Nachrichten an die in der `.env`-Datei konfigurierte Adresse weiter (`CONTACT_TO`). Nichts zu pflegen — funktioniert automatisch.

## 9. Fehler und Hilfe

- **Login funktioniert nicht** → Passwort vergessen? Tech-Ansprechpartner kontaktieren
- **Bild lädt nicht hoch** → größer als 10 MB? Format prüfen (jpg/png/webp)
- **Slug bereits vergeben** → einen anderen wählen
- **Versehentlich gelöscht** → aus dem Backup wiederherstellen lassen

## 10. Best Practices

- **Bilder vorher verkleinern** — keine Originale aus der Kamera (3000 px breit reicht völlig)
- **Aussagekräftige Alt-Texte** für Barrierefreiheit und SEO
- **Termine früh anlegen** — sie sind die wichtigsten Inhalte für viele Besucher
- **Vor dem Veröffentlichen**: Häkchen "Veröffentlicht" prüfen, sonst bleibt der Inhalt im Entwurf
- **Niemals** das Adminpasswort weitergeben — bei Bedarf einen weiteren Redakteur anlegen lassen
