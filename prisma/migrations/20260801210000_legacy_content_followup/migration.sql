-- Generated from sealed legacy evidence and an exhaustive per-route resolution ledger. Do not edit by hand.

PRAGMA foreign_keys=ON;

BEGIN IMMEDIATE;

CREATE TEMP TABLE "_LegacyReconciliationContext" ("isSeeded" INTEGER NOT NULL CHECK ("isSeeded" IN (0, 1)));

INSERT INTO "_LegacyReconciliationContext" ("isSeeded") SELECT CASE WHEN EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-current:page:ueber-uns/vereinsdaten' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/vereinsdaten') THEN 1 ELSE 0 END;

CREATE TEMP TABLE "_LegacyReconciliationBootstrapAssertion" ("ok" INTEGER NOT NULL ON CONFLICT ROLLBACK);

INSERT INTO "_LegacyReconciliationBootstrapAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 0 AND (EXISTS (SELECT 1 FROM "Page" WHERE "slug" IN ('ueber-uns/pfarrheim', 'ueber-uns/vereinsdaten', 'vereinsbereiche/zeltlager', 'rueckblick/presse/kirchner-hans', 'rueckblick/presse/kreativtheater2024-02', 'rueckblick/prunksitzung/prunksitzung2021', 'datenschutz', 'impressum', 'rueckblick/staedtereisen', 'rueckblick/trachtengruppe', 'ueber-uns/adolf-kolping', 'ueber-uns/kolpingsfamilie-ramsen')) OR EXISTS (SELECT 1 FROM "News" WHERE "slug" IN ('2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen')) OR EXISTS (SELECT 1 FROM "Event" WHERE "slug" IN ('2026-03-20-bezirks-kreuzweg', '2026-05-22-bezirksmaiandacht', '2026-06-14-gottesdienst', '2026-08-21-open-air-theater', '2026-08-22-creepshow-open-air-theater', '2026-08-28-open-air-theater', '2026-08-29-creepshow-open-air-theater', '2026-09-05-kennst-du-deine-heimat', '2026-11-29-musikalische-adventsandacht', '2026-12-26-theaterauffuehrung')));

DROP TABLE "_LegacyReconciliationBootstrapAssertion";

UPDATE "Page" SET "content" = '## Die Geschichte des katholischen Pfarrheims

Kloster „Ramosa" 1146 – 1494 — Zehntscheune des Klosters

| Jahr | Ereignis |
| --- | --- |
| 1494 – 1793 | Bischöfliches Klostergut (Worms). Tagungsort des „Stumpfwaldgerichts" (Neunmärkerei). Ausgangs- und Endpunkt der Grenzumgänge. |
| 1793 | Enteignung durch den franz. Staat |
| 1793 – 1814 | Französische Staatsdomäne |
| 1814 – 1828 | Eigentum des Königreiches Bayern |
| 1828 | Der Klosterbesitz wird an Private versteigert. Das Gebäude wechselt mehrmals den Besitzer. Mitte des 19. Jahrh. wird im Innern eine Kapelle errichtet. |
| 1894 | Das Gebäude geht als Vermächtnis an die kath. Kultusgemeinde |
| 1907 | Der „Elisabethenverein" übernimmt das Haus |
| 1912 | Schwesternhaus der „Armen Schulschwestern Speyer". Krankenpflegestation, Kinderbewahranstalt, Handarbeitsschule |
| 1977 | Die letzten Schwestern verlassen Ramsen |
| 1980 | Einweihung des „Pfarrheims" nach Umbau und Renovierung in Eigenleistung durch die Kolpingsfamilie Ramsen |

## Einblicke in das Pfarrheim

> Großer Versammlungsraum von der KF ausgebaut – das zugehörige Bild ist an der Quelle nicht mehr verfügbar.

![Bühne & Saal von der KF renoviert](/images/imported/ueber-uns/P3161030.JPG "Bühne & Saal von der KF renoviert")

![Jugendraum von der KF errichtet](/images/imported/ueber-uns/P3161022.JPG "Jugendraum von der KF errichtet")

![Außengelände von der KF angelegt](/images/imported/ueber-uns/P3161028.JPG "Außengelände von der KF angelegt")

*Die Adresse des Pfarrheims: Klosterhof 7*', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'ueber-uns/pfarrheim' AND "title" = 'Pfarrheim' AND "content" = '# Die Geschichte des katholischen Pfarrheims

Kloster „Ramosa" 1146 – 1494 — Zehntscheune des Klosters

| Jahr | Ereignis |
| --- | --- |
| 1494 – 1793 | Bischöfliches Klostergut (Worms). Tagungsort des „Stumpfwaldgerichts" (Neunmärkerei). Ausgangs- und Endpunkt der Grenzumgänge. |
| 1793 | Enteignung durch den franz. Staat |
| 1793 – 1814 | Französische Staatsdomäne |
| 1814 – 1828 | Eigentum des Königreiches Bayern |
| 1828 | Der Klosterbesitz wird an Private versteigert. Das Gebäude wechselt mehrmals den Besitzer. Mitte des 19. Jahrh. wird im Innern eine Kapelle errichtet. |
| 1894 | Das Gebäude geht als Vermächtnis an die kath. Kultusgemeinde |
| 1907 | Der „Elisabethenverein" übernimmt das Haus |
| 1912 | Schwesternhaus der „Armen Schulschwestern Speyer". Krankenpflegestation, Kinderbewahranstalt, Handarbeitsschule |
| 1977 | Die letzten Schwestern verlassen Ramsen |
| 1980 | Einweihung des „Pfarrheims" nach Umbau und Renovierung in Eigenleistung durch die Kolpingsfamilie Ramsen |

![P3161030](/images/imported/ueber-uns/P3161030.JPG)

Großer Versammlungsraum von der KF ausgebaut

![P3161022](/images/imported/ueber-uns/P3161022.JPG)

Bühne & Saal von der KF renoviert

![P3161028](/images/imported/ueber-uns/P3161028.JPG)

Jugendraum von der KF errichtet

Außengelände von der KF angelegt

*Die Adresse des Pfarrheims: Klosterhof 7*
' AND "metaDesc" = 'Die Geschichte des katholischen Pfarrheims in Ramsen vom ehemaligen Kloster „Ramosa" bis zum heutigen Treffpunkt der Kolpingsfamilie.' AND "parent" IS NULL AND "sortOrder" = 300 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_277fe8ab27c85a1bdf6fdb89', 'reconcile-content:page:ueber-uns/pfarrheim:article:/index.php/ueber-uns/geschichte-pfarrheim#2019-07-03-die-geschichte-des-katholischen-pfarrheims-p3161022-jpg', 'page', 'ueber-uns/pfarrheim', 'sha256:97f92692db1fc76e416fba082172038690fbfa23b31be42cb3724e7061a1b414', 'sha256:a6f385e77c0ce68ca9b25c3a78e362dfb7a7ea5a99828fb4b54eb8642dc4c43e', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'ueber-uns/pfarrheim' AND "title" = 'Pfarrheim' AND "content" = '## Die Geschichte des katholischen Pfarrheims

Kloster „Ramosa" 1146 – 1494 — Zehntscheune des Klosters

| Jahr | Ereignis |
| --- | --- |
| 1494 – 1793 | Bischöfliches Klostergut (Worms). Tagungsort des „Stumpfwaldgerichts" (Neunmärkerei). Ausgangs- und Endpunkt der Grenzumgänge. |
| 1793 | Enteignung durch den franz. Staat |
| 1793 – 1814 | Französische Staatsdomäne |
| 1814 – 1828 | Eigentum des Königreiches Bayern |
| 1828 | Der Klosterbesitz wird an Private versteigert. Das Gebäude wechselt mehrmals den Besitzer. Mitte des 19. Jahrh. wird im Innern eine Kapelle errichtet. |
| 1894 | Das Gebäude geht als Vermächtnis an die kath. Kultusgemeinde |
| 1907 | Der „Elisabethenverein" übernimmt das Haus |
| 1912 | Schwesternhaus der „Armen Schulschwestern Speyer". Krankenpflegestation, Kinderbewahranstalt, Handarbeitsschule |
| 1977 | Die letzten Schwestern verlassen Ramsen |
| 1980 | Einweihung des „Pfarrheims" nach Umbau und Renovierung in Eigenleistung durch die Kolpingsfamilie Ramsen |

## Einblicke in das Pfarrheim

> Großer Versammlungsraum von der KF ausgebaut – das zugehörige Bild ist an der Quelle nicht mehr verfügbar.

![Bühne & Saal von der KF renoviert](/images/imported/ueber-uns/P3161030.JPG "Bühne & Saal von der KF renoviert")

![Jugendraum von der KF errichtet](/images/imported/ueber-uns/P3161022.JPG "Jugendraum von der KF errichtet")

![Außengelände von der KF angelegt](/images/imported/ueber-uns/P3161028.JPG "Außengelände von der KF angelegt")

*Die Adresse des Pfarrheims: Klosterhof 7*' AND "metaDesc" = 'Die Geschichte des katholischen Pfarrheims in Ramsen vom ehemaligen Kloster „Ramosa" bis zum heutigen Treffpunkt der Kolpingsfamilie.' AND "parent" IS NULL AND "sortOrder" = 300 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "content" = '## Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7

auf Einladung des Hochw. Herrn Pfarrer Dr. Karl Zinke.

![Pfr Dr. Karl Zinke](/images/imported/ueber-uns/Pfr_Dr._Karl_Zinke.jpg)

## Gründungsvorstand (29.04.1953)

- Pfarrer Dr. Karl Zinke, Präses (verst.)
- Nikolaus Kaiser, Senior (verst.)
- Jakob Fischer, Kassenwart (verst.)
- Heinrich Fischer, Schriftführer (verst.)
- Hans-Rudi Kirchner, Beisitzer (verst.)
- Leonhard Kaiser, Beisitzer (verst.)
- Raimund Michel, Beisitzer (verst.)

## Gründungsmitglieder (06.12.1953)

### Gruppe Kolping:

- Eugen Fischer, (verst.)
- Raimund Fischer, (verst.)
- Ewald Karg, (verst.)
- Hans-Rudi Kirchner, (verst.)
- Heinrich Kirchner, (verst.)
- Bernhard Kuffler, (verst.)
- Alfred Langenstein, (verst.)
- Raimund Michel, (verst.)
- Adam Schifferstein, (verst.)
- Leander Schumacher, (verst.)
- Wilhelm Storck, (verst.)
- Oswald Veit. (verst.)

### Gruppe Altkolping:

- Karl Fischer, (verst.)
- Franz Haberkorn, (verst.)
- Leo Kaiser, (verst.)
- Jakob Krill. (verst.)

## Präses der Kolpingsfamilie:

- 29.04.1953 - 04 05.1963 Pfarrer Dr. Karl Zinke (verst.)
- 05.11.1963 - 26.02.1972 Pfarrer Ludwig Müller (verst.)
- 12.02.1964 - 31.03.1964 (Vizepräses) Kaplan Weißmann (verst.)
- 01.04.1964 - 13.07.1965 (Vizepräses) Kaplan Rolf Hagemeier
- 26.02.1972 - 31.10.1978 Pfarrer Franz-Josef Bolz (23.06.2025 verst. )
- 01.11.1978 - 20.06.2021 Pfarrer Werner Kilian (25.06.2024 verst.)
- 20.06.2021 - heute Pater Clifford Chikeobi Modum

## Senioren:

- 29.04.1953 - 20.01.1954 Nikolaus Kaiser (verst.)
- 20.01.1954 - 31.03.1957 Hans Kirchner (verst.)
- 31.03.1957 - 14.01.1960 Werner Fischer (verst.)
- 14.01.1960 - 18.03.1962 Robert Fischer
- 18.03.1962 - 07.04.1963 Bernhard Kuffler (verst.)
- 07.04.1963 - 27.03.1966 Fritz Schach
- 27.03.1966 - 03.03.1968 Heinz-Peter Geißler (verst.)
- 03.03.1968 - 06.03.1971 Peter Kaiser
- 06.03.1971 - 26.02.1972 Wolfgang Rörig
- 26.02.1972 - 06.01.1973 Bernd Aufschneider

## Altsenioren:

- 29.04.1953 - 31.03.1957 Nikolaus Kaiser (verst.)
- 31.03.1957 - 14.01.1960 Jakob Fischer (verst.)
- 14.01.1960 - 07.04.1963 Leo Kaiser (verst.)
- 07.04.1963 - 26.03.1966 Adam Schifferstein (verst.)
- 26.03.1966 - 03.03.1968 Raimund Michel (verst.)
- 03.03.1968 - 06.03.1971 Günter Wellstein (verst.)
- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)

## 1. Vorsitzende

- 06.03.1971 - 06.01.1973 Klaus Kaiser
- 06.01.1973 - 14.12.1974 Kurt Mechnich (verst.)
- 14.12.1974 - 05.05.1976 Leo Kaiser (verst.)
- 14.01.1977 - 10.01.1981 Paul Schmidt
- 10.01.1981 - 06.03.1982 Stephan Bayer
- 06.03.1982 - 27.02.1988 Wolfgang Rörig
- 27.02.1988 - 02.03.1991 Stephan Bayer (komis. von Wolfgang Rörig ausgeführt)
- 02.03.1991 - 22.02.2018 Wolfgang Rörig

## 2. Vorsitzende

- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)
- 26.02.1972 - 27.07.1974 Walter Fischer (verst.)
- 14.12.1974 - 09.01.1976 Wolfgang Rörig
- 09.01.1976 - 14.01.1977 Paul Schmidt
- 14.01.1977 - 12.01.1979 Wolfgang Rörig
- 12.01.1979 - 10.01.1981 Stephan Bayer
- 10.01.1981 - 06.03.1982 Wolfgang Rörig
- 06.03.1982 - 27.02.1988 Stephan Bayer
- 27.02.1988 - 02.03.1991 Wolfgang Rörig
- 02.03.1991- 30.03.2000 Stephan Bayer
- 30.03.2000 - 05.03.2009 Fritz Schach
- 05.03.2009 - 26.02.2015 Stephan Bayer
- 27.02.2015 - 22.02.2018 Heiko Schmitt-Sattler

## Leitungsteam

- 22.02.2018 - heute Bettina Schach, Heiko Schmitt-Sattler, Sebastian Sattler

## Familienkreis

- 08.02.2009 - heute Bettina Schach

## Familienkreis "Next Generation"

- 20.03.2025 - heute Nadja Höhn

## Jungkolpinggruppe/ Gruppenführer/Vertreter der Jugend

- 20.01.1954 – 16.03.1955 Raimund Michel (verst.)
- 16.03.1955 – 31.03.1957 Hans Balthasar (kein Mitglied)
- 31.03.1957 – 08.03.1959 Leander Schumacher und Theo Rörig (verst.)
- 08.03.1959 – 25.08.1959 Rupprecht Fischer (verst.)
- 25.08.1959 – 01.08.1962 Klaus Kaiser und Werner Balthasar
- 01.08.1962 – 16.02.1964 Peter Kaiser
- 16.02.1964 – 01.01.1966 Peter Kaiser, Hubert Matheis und Heiner Schumacher
- 01.01.1966 – 25.02.1967 Klaus Kaiser und Peter Fischer
- 25.02.1967 – 03.03.1968 Klaus Kaiser und Kurt Best
- 03.03.1968 – 15.02.1970 Kurt Best und Wolfgang Rörig
- 15.02.1970 – 06.03.1971 Winfried Weber und Gerald Mechnich
- 06.03.1971 – 01.01.1972 Gerald Mechnich
- 01.01.1972 – 06.01.1973 Klaus Weber
- 06.01.1973 – 04.02.1975 Bernhard Baldauf, Christel Weibel und Petra Dünkelberg
- 04.02.1975 – 09.01.1976 Albert Baldauf, Christel Weibel und Petra Dünkelberg
- 09.01.1976 – 24.11.1976 Christel Weibel und Manuela Wendel
- 24.11.1976 – 06.01.1978 Hubert Gattje (verst.), Jürgen Storck und Manuela Wendel
- 06.01.1978 – 12.01.1979 Hubert Gattje (verst.), Jürgen Storck, Manuela Wendel, Regina Schifferstein
- 12.01.1979 – 11.01.1980 Brigitte Steitz und Armin Balthasar
- 11.01.1980 – 06.03.1982 Silvia Storck
- 06.03.1982 – 04.02.1984 Martina Wunderlich
- 02.03.1985 – 14.03.1987 Stephan Fischer
- 14.03.1987 – 10.03.1990 Marina Heeß
- 10.03.1990 – 02.03.1991 Hans-Werner Bitter (verst.)
- 02.03.1991 – 26.02.1994 Jörg Fischer
- 26.02.1994 – 11.03.1995 Steffen Rörig, Matthias Best, Arno Schmidt, Daniela Steitz
- 11.03.1995 – 20.02.1997 Steffen Rörig
- 20.02.1997 – 30.03.2000 Andreas Best (Vertreter der Jugend)
- 30.03.2000 – 05.03.2009 Mathias Bayer (Vertreter der Jugend)
- 05.03.2009 – 05.09.2009 Astrid Pohl (Vertreter der Jugend)
- 05.09.2009 - 20.03.2024 Sebastian Sattler, Jugendleiter
- 05.09.2013 - 20.03.2024 Anton Rikart, stellvertr. Jugendleiter
- 21.03.2024 - heute Nele Rörig & Jonas Berst Jugendleitung

## Ehrenpräses der Kolpingsfamilie

- 20.06.2021 Pfr. Werner Kilian (25.06.2024 verst.)

![Pfr. Kilian](/images/imported/ueber-uns/Pfr._Kilian.jpg)

## Ehrenmitglieder der Kolpingsfamilie:

- 01.01.1983 Ludwig Vetter (verst.)
- 02.12.1990 Jakob Fischer (verst.)
- 05.07.1996 Georg Spieß (verst.)
- 06.05.2012 Hans-Rudi Kirchner (verst.)
- 05.12.2019 Wolfgang Richter
- 05.12.2019 Fritz Schach

## Verleihung der Pirminius Plakette

- 07.10.2012 Erika Behnke (durch Bischof Wiesemann)

## Verleihung der Diözesan - Ehrenurkunde:

- 29.11.1991 Jakob Fischer (verst.)
- 25.11.1994 Fritz Schach
- 01.12.1995 Lieselotte Richter
- 27.11.1998 Wolfgang Rörig
- 28.11.2003 Wolfgang Aufschneider (verst.)
- 26.11.2004 Bernd Aufschneider
- 01.12.2006 Wolfgang Scherr
- 31.11.2012 Wolfgang Richter
- 31.11.2012 Erika Behnke (wurde vom Diözesanverband Speyer vorgeschlagen)
- 25.11.2016 Wiltrud Schach
- 30.11.2018 Christel Bayer
- 18.11.2023 Sebastian Sattler

## Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland

- 02.12.2018 Wolfgang Rörig

## Verleihung der Ehrennadel in Gold von der Gemeinde Ramsen

- 05.01.2003 Georg Spieß (verst.)
- 09.01.2005 Fritz Schach
- 04.01.2009 Wolfgang Rörig
- 08.01.2012 Wolfgang Aufschneider (verst.)
- 08.01.2012 Wolfgang Scherr
- 13.01.2013 Lieselotte Richter
- 10.01.2015 Wolfgang Richter
- 10.01.2016 Wiltrud Schach
- 08.01.2017 Christel Bayer
- 08.01.2017 Anita Rieder
- 14.01.2018 Bernd Aufschneider
- 12.01.2020 Stephan Bayer
- 31.01.2026 Manfred Zengerle

## Besondere chronologische Daten:

- 06.12.1953 Banner von R. Michel angefertigt zur 1. Neuaufnahme
- 1954 im Frühjahr Gründung einer Jungkolpinggruppe
- 16\. 03.1955 Gründung der Kolpingskapelle
- 09.12.1958 Einweihung des neuen Banners, beim Kolpingwerk Köln gekauft
- 28.04. 1963 10 jähr. Jubiläum der Kolpingsfamilie im Saale des TuS 05
- 28.07. - 04.08.1963 Handwerksausstellung im Gemeindehaus Ramsen
- 26.01. 1964 1. Prunksitzung im Saale des TuS 05 mit der KF Winnweiler
- 1964/1965 10 Sitzbänke rund um Ramsen aufgestellt in Wald und Flur
- 13.08.1967 Diözesan-Radrennen in Ramsen, rund um den Schwarzwald
- 06.08.1971 Gründung der Volkstanz- und Trachtengruppe
- 04.07.1972 Gründung des Kolpingheim e.V.
- 1973 Die Mariengrotte wurde von Kolpingsmitgliedern erbaut
- 1975 -1997 Martinsumzüge der Kinder
- 12\. - 15.05.1978 25 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf dem Sportplatz
- 30.06.1988 Auflösung des Kolpingheim e.V.
- 28.03. 1999 Silbernes Priesterjubiläum von Präses Werner Kilian (in der Eistalhalle)
- 04.-06.07.2003 50 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf der Kolpingwiese
- 2005 Neues Zelt mit Fenstern für besondere Anlässe gekauft
- 2008 Die Gaststätte "Klosterschänke" wird nach 32 Jahren geschlossen
- 08.02.2009 Gründung eines "Familienkreises"
- 12.06.2009 Überlassungsvertrages vom Pfarrheim auf weitere 25 Jahre verlängert
- 2009 Neuanschaffung der Saalbestuhlung mit Tischen (80 Stühle + 12 Tische)
- 05.05.2013 60. jähr. Jubiläum mit Festmesse und Empfang im Pfarrheim
- 22.02.2014 50. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 17.05.2014 Diözesan Familientag auf der Kolpingwiese in Ramsen
- 15.07.2015 Neuanschaffung weiterer Saalbestuhlung für die Bühne (40 Stühle + 6 Tische)
- 06.05.2018 65 jähriges Jubiläum mit Festmesse/ Empfang im Pfarrheim mit Diashow über die zurückliegenden Jahre.
- 23.02.2019 55. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 2019 Alle Zeltgarnituren nachgesehen, die Guten abgeschliffen und neu lackiert
- 2020 10 Stk. neue Zeltgarnituren bei der Heinrich Kimmle Stiftung Pirmasens erwoben
- 2020/ 2021 Wegen Corona wurden die meisten Programmpunkte abgesagt
- 20.06.2021 Offizielle Auflösung der Volkstanz.- und Trachtengruppe
- 2020/ 2021 In den Sommermonaten wurde wegen Corona auf der Kolpingwiese ein Sommer-Sonderprogramm angeboten
- 2023 Feier zum 70 jährigen Jubiläum der Kolpingsfamilie im Festzelt mit Ehrungen und Neuaufnahmen.
- 25.06.2024 Unser Ehrenpräses Pfr. Werner Kilian ist kurz vor seinem 81 Geburtstag verstorben.
- 2024 Anschaffung von 12 Bühnenelementen für die Theatergruppe

## Bau und Renovierungsarbeiten

- 1973 Bau der Mariengrotte hinter der kath. Kirche Organisation durch Kurt Mechnich und unter der Leitung von Steinmetz Karl Böhm
- 1975 -1980 Umbau des Pfarrheimes zum Kolpingheim mit „Klosterschänke“
- 1991 Neubau des Jugendraumes mit Toilette, Lager und Außenanlage
- 1990 – 1993 Aufschüttung des Geländes vom ehemaligen Schwesterngarten
- 1996 Erneuerung von Fußboden und Decke mit Luftabsaugung im Pfarrsaal
- 1998 Neubau eines 2.Lagers, Richtfest am 14. Nov. 1998
- 1999 Überdachung der Sitzecke zwischen Lager und Jugendraum
- 2000 Freifläche planiert, Rasen angelegt und Thuja gepflanzt
- 05.-06.2000 Pfarrheim außen streichen und Sockel verputzen
- 2001 (Frühjahr) Renovierung der Gastwirtschaft: Abzugsanlage und neue Decke
- 2000 – 2003 Fertigstellung des neuen Lagers mit Toiletten
- 2003 Renovierung und Neueinrichtung der Gastwirtschaftsküche
- 2005 2 neue Fenster mit Rollläden in der Gastwirtschaft eingebaut
- 2007 12 neue Fenster mit Rollläden in der Wohnung eingebaut
- 11.05.2007 Außentür vom neuen Jugendraum zum Freisitz eingebaut
- 2008 Renovierung der Wohnung im Pfarrheim
- 2011 Renovierung der gesamten Toiletten im EG
- 07.10.2011 Neue Tür zum alten Jugendraum eingebaut
- 2012 Überdachung hinter dem neuen Lager angebracht
- 2012 Erneuerung der Heizkörper im Saal und Treppenhaus
- 2012 Erneuerung sämtlicher Heizkörperventile
- 2013 Erneuerung der Fenster mit Rollläden im Saal und auf der Bühne
- 2015 Anlegen eines Bouleplatzes
- 2017 Bau eines Gasflaschen Lagers
- 2018 Einbau elektrischer Rollladenantriebe und tapezieren im neuen Jugendraum
- 2018 Neueindeckung der Überdachung der Sitzecke am Jugendraum wegen Hagelschaden
- 2019 Fußboden im Saal und Bühne abgeschliffen und neu versiegelt
- 2019 Vorderer Eingangsbereich zum Pfarrheim mit Granitplatten neu verlegt
- 2019 Neuer Gasbrenner für die Heizung eingebaut
- 2019 Hintere Außentür zum Obergeschoß erneuert
- 2020 2 neue Fenster in der Bücherei eingesetzt
- 2020 Große Eingangstür Ostseite erneuert
- 2020 Treppe Ostseite erneuert
- 09.2021 Giebel Richtung Gemeindehaus wurde neu gestrichen
- 2024 Bau eines Lagers für die Theatergruppe
- 2024 Neuaufbau des Bouleplatzes', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'ueber-uns/vereinsdaten' AND "title" = 'Vereinsdaten' AND "content" = '## Relevante Vereins - Daten

### Gründungsversammlung am 29. April 1953 im Pfarrsaal

### des Schwesternhauses in Ramsen, Klosterhof 7

auf Einladung des Hochw. Herrn Pfarrer Dr. Karl Zinke.

![Pfr Dr. Karl Zinke](/images/imported/ueber-uns/Pfr_Dr._Karl_Zinke.jpg)

### Gründungsvorstand (29.04.1953)

-   Pfarrer Dr. Karl Zinke, Präses (verst.)
-   Nikolaus Kaiser, Senior (verst.)
-   Jakob Fischer, Kassenwart (verst.)
-   Heinrich Fischer, Schriftführer (verst.)
-   Hans-Rudi Kirchner, Beisitzer (verst.)
-   Leonhard Kaiser, Beisitzer (verst.)
-   Raimund Michel, Beisitzer (verst.)

### Gründungsmitglieder (06.12.1953)

### Gruppe Kolping:

-   Eugen Fischer, (verst.)
-   Raimund Fischer, (verst.)
-   Ewald Karg, (verst.)
-   Hans-Rudi Kirchner, (verst.)
-   Heinrich Kirchner, (verst.)
-   Bernhard Kuffler, (verst.)
-   Alfred Langenstein, (verst.)
-   Raimund Michel, (verst.)
-   Adam Schifferstein, (verst.)
-   Leander Schumacher, (verst.)
-   Wilhelm Storck, (verst.)
-   Oswald Veit. (verst.)

### Gruppe Altkolping:

-   Karl Fischer, (verst.)
-   Franz Haberkorn, (verst.)
-   Leo Kaiser, (verst.)
-   Jakob Krill. (verst.)

### Präses der Kolpingsfamilie:

29.04.1953 -  04 05.1963 Pfarrer Dr. Karl Zinke (verst.)

05.11.1963 -  26.02.1972 Pfarrer Ludwig Müller (verst.)

12.02.1964 - 31.03.1964 (Vizepräses) Kaplan Weißmann (verst.)

01.04.1964 -  13.07.1965 (Vizepräses) Kaplan Rolf Hagemeier

26.02.1972 -  31.10.1978 Pfarrer Franz-Josef Bolz (23.06.2025 verst. )

01.11.1978 -  20.06.2021 Pfarrer Werner Kilian (25.06.2024 verst.)

20.06.2021 - heute         Pater Clifford Chikeobi Modum

### Senioren:

29.04.1953 - 20.01.1954 Nikolaus Kaiser (verst.)

20.01.1954 - 31.03.1957 Hans Kirchner (verst.)

31.03.1957 - 14.01.1960 Werner Fischer (verst.)

14.01.1960 - 18.03.1962 Robert Fischer

18.03.1962 - 07.04.1963 Bernhard Kuffler (verst.)

07.04.1963 - 27.03.1966 Fritz Schach

27.03.1966 - 03.03.1968 Heinz-Peter Geißler (verst.)

03.03.1968 - 06.03.1971 Peter Kaiser

06.03.1971 - 26.02.1972 Wolfgang Rörig

26.02.1972 - 06.01.1973 Bernd Aufschneider

### Altsenioren:

29.04.1953 - 31.03.1957 Nikolaus Kaiser (verst.)

31.03.1957 - 14.01.1960 Jakob Fischer (verst.)

14.01.1960 - 07.04.1963 Leo Kaiser (verst.)

07.04.1963 - 26.03.1966 Adam Schifferstein (verst.)

26.03.1966 - 03.03.1968 Raimund Michel (verst.)

03.03.1968 - 06.03.1971 Günter Wellstein (verst.)

06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)

### 1\. Vorsitzende

-   06.03.1971 - 06.01.1973 Klaus Kaiser
-   06.01.1973 - 14.12.1974 Kurt Mechnich (verst.)
-   14.12.1974 - 05.05.1976 Leo Kaiser (verst.)
-   14.01.1977 - 10.01.1981 Paul Schmidt
-   10.01.1981 - 06.03.1982 Stephan Bayer
-   06.03.1982 - 27.02.1988 Wolfgang Rörig
-   27.02.1988 - 02.03.1991 Stephan Bayer (komis. von Wolfgang Rörig ausgeführt)
-   02.03.1991 - 22.02.2018 Wolfgang Rörig

### 2\. Vorsitzende

-   06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)
-   26.02.1972 - 27.07.1974 Walter Fischer (verst.)
-   14.12.1974 - 09.01.1976 Wolfgang Rörig
-   09.01.1976 - 14.01.1977 Paul Schmidt
-   14.01.1977 - 12.01.1979 Wolfgang Rörig
-   12.01.1979 - 10.01.1981 Stephan Bayer
-   10.01.1981 - 06.03.1982 Wolfgang Rörig
-   06.03.1982 - 27.02.1988 Stephan Bayer
-   27.02.1988 - 02.03.1991 Wolfgang Rörig
-   02.03.1991- 30.03.2000 Stephan Bayer
-   30.03.2000 - 05.03.2009 Fritz Schach
-   05.03.2009 - 26.02.2015 Stephan Bayer
-   27.02.2015 - 22.02.2018 Heiko Schmitt-Sattler

### Leitungsteam

-   22.02.2018 - heute          Bettina Schach, Heiko Schmitt-Sattler, Sebastian Sattler

### Familienkreis

-   08.02.2009 - heute                 Bettina Schach

### Familienkreis "Next Generation"

20.03.2025 - heute                   Nadja Höhn

### Jungkolpinggruppe/ Gruppenführer/Vertreter der Jugend

-   20.01.1954 – 16.03.1955       Raimund Michel (verst.)
-   16.03.1955 – 31.03.1957       Hans Balthasar (kein Mitglied)
-   31.03.1957 – 08.03.1959       Leander Schumacher und Theo Rörig (verst.)
-   08.03.1959 – 25.08.1959       Rupprecht Fischer (verst.)
-   25.08.1959 – 01.08.1962       Klaus Kaiser und Werner Balthasar
-   01.08.1962 – 16.02.1964       Peter Kaiser
-   16.02.1964 – 01.01.1966       Peter Kaiser, Hubert Matheis und Heiner Schumacher
-   01.01.1966 – 25.02.1967       Klaus Kaiser und Peter Fischer
-   25.02.1967 – 03.03.1968       Klaus Kaiser und Kurt Best
-   03.03.1968 – 15.02.1970       Kurt Best und Wolfgang Rörig
-   15.02.1970 – 06.03.1971       Winfried Weber und Gerald Mechnich
-   06.03.1971 – 01.01.1972       Gerald Mechnich
-   01.01.1972 – 06.01.1973       Klaus Weber
-   06.01.1973 – 04.02.1975       Bernhard Baldauf, Christel Weibel und Petra Dünkelberg
-   04.02.1975 – 09.01.1976       Albert Baldauf, Christel Weibel und Petra Dünkelberg
-   09.01.1976 – 24.11.1976       Christel Weibel und Manuela Wendel
-   24.11.1976 – 06.01.1978       Hubert Gattje (verst.),  Jürgen Storck und Manuela Wendel
-   06.01.1978 – 12.01.1979       Hubert Gattje (verst.), Jürgen Storck, Manuela Wendel, Regina Schifferstein
-   12.01.1979 – 11.01.1980       Brigitte Steitz und Armin Balthasar
-   11.01.1980 – 06.03.1982       Silvia Storck
-   06.03.1982 – 04.02.1984       Martina Wunderlich
-   02.03.1985 – 14.03.1987       Stephan Fischer
-   14.03.1987 – 10.03.1990       Marina Heeß
-   10.03.1990 – 02.03.1991       Hans-Werner Bitter (verst.)
-   02.03.1991 – 26.02.1994       Jörg Fischer
-   26.02.1994 – 11.03.1995       Steffen Rörig, Matthias Best, Arno Schmidt, Daniela Steitz
-   11.03.1995 – 20.02.1997       Steffen Rörig
-   20.02.1997 – 30.03.2000       Andreas Best (Vertreter der Jugend)
-   30.03.2000 – 05.03.2009       Mathias Bayer (Vertreter der Jugend)
-   05.03.2009 – 05.09.2009       Astrid Pohl (Vertreter der Jugend)
-   05.09.2009 -  20.03.2024      Sebastian Sattler, Jugendleiter
-   05.09.2013 -  20.03.2024      Anton Rikart, stellvertr. Jugendleiter
-   21.03.2024 - heute               Nele Rörig & Jonas Berst Jugendleitung

### Ehrenpräses der Kolpingsfamilie

20.06.2021          Pfr. Werner Kilian (25.06.2024 verst.)

![Pfr. Kilian](/images/imported/ueber-uns/Pfr._Kilian.jpg)

### Ehrenmitglieder der Kolpingsfamilie:

-   01.01.1983          Ludwig Vetter   (verst.)
-   02.12.1990          Jakob Fischer    (verst.)
-   05.07.1996          Georg Spieß      (verst.)
-   06.05.2012          Hans-Rudi Kirchner (verst.)
-   05.12.2019          Wolfgang Richter
-   05.12.2019          Fritz Schach

### Verleihung der Pirminius Plakette

-   07.10.2012    Erika Behnke (durch Bischof Wiesemann)

### Verleihung der Diözesan - Ehrenurkunde:

-   29.11.1991    Jakob Fischer (verst.)
-   25.11.1994    Fritz Schach
-   01.12.1995    Lieselotte Richter
-   27.11.1998   Wolfgang Rörig
-   28.11.2003   Wolfgang Aufschneider (verst.)
-   26.11.2004   Bernd Aufschneider
-   01.12.2006   Wolfgang Scherr
-   31.11.2012   Wolfgang Richter
-   31.11.2012    Erika Behnke (wurde vom Diözesanverband Speyer vorgeschlagen)
25.11.2016    Wiltrud Schach
-   30.11.2018    Christel Bayer
-   18.11.2023    Sebastian Sattler

### Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland

02.12.2018      Wolfgang Rörig

### *Verleihung der Ehrennadel in Gold von der Gemeinde Ramsen*

-   05.01.2003     Georg Spieß (verst.)
-   09.01.2005     Fritz Schach
-   04.01.2009     Wolfgang Rörig
-   08.01.2012     Wolfgang Aufschneider (verst.)
-   08.01.2012     Wolfgang Scherr
-   13.01.2013     Lieselotte Richter
-   10.01.2015    Wolfgang Richter
-   10.01.2016     Wiltrud Schach
-   08.01.2017     Christel Bayer
-   08.01.2017     Anita Rieder
-   14.01.2018     Bernd Aufschneider
-   12.01.2020     Stephan Bayer

### Besondere chronologische Daten:

-   06.12.1953                 Banner von R. Michel angefertigt zur 1. Neuaufnahme
-   1954 im Frühjahr       Gründung einer Jungkolpinggruppe
-   16\. 03.1955                Gründung der Kolpingskapelle
-   09.12.1958                 Einweihung des neuen Banners, beim Kolpingwerk Köln gekauft
-   28.04. 1963                10 jähr. Jubiläum der Kolpingsfamilie im Saale des TuS 05
-   28.07. - 04.08.1963    Handwerksausstellung im Gemeindehaus Ramsen
-   26.01. 1964                1. Prunksitzung im Saale des TuS 05 mit der KF Winnweiler
-   1964/1965                  10 Sitzbänke rund um Ramsen aufgestellt in Wald und Flur
-   13.08.1967                 Diözesan-Radrennen in Ramsen, rund um den Schwarzwald
-   06.08.1971                 Gründung der Volkstanz- und Trachtengruppe
-   04.07.1972                 Gründung des Kolpingheim e.V.
-   1973                          Die Mariengrotte wurde von Kolpingsmitgliedern erbaut
-   1975 -1997                Martinsumzüge der Kinder
-   12\. - 15.05.1978        25 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf dem Sportplatz
-   30.06.1988                 Auflösung des Kolpingheim e.V.
-   28.03. 1999                Silbernes Priesterjubiläum von Präses Werner Kilian (in der Eistalhalle)
-   04.-06.07.2003           50 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf der Kolpingwiese
-   2005                           Neues Zelt mit Fenstern für besondere Anlässe gekauft
-   2008                           Die Gaststätte "Klosterschänke" wird nach 32 Jahren geschlossen
-   08.02.2009                 Gründung eines "Familienkreises"
-   12.06.2009                 Überlassungsvertrages vom Pfarrheim auf weitere 25 Jahre verlängert
-   2009                           Neuanschaffung der Saalbestuhlung mit Tischen (80 Stühle + 12 Tische)
-   05.05.2013                 60. jähr. Jubiläum mit Festmesse und Empfang im Pfarrheim
-   22.02.2014                 50. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
-   17.05.2014                 Diözesan Familientag auf der Kolpingwiese in Ramsen
-   15.07.2015                 Neuanschaffung weiterer Saalbestuhlung für die Bühne (40 Stühle + 6 Tische)
-   06.05.2018                 65 jähriges Jubiläum mit Festmesse/ Empfang im Pfarrheim mit Diashow über die zurückliegenden Jahre.
-   23.02.2019                 55. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
-   2019                           Alle Zeltgarnituren nachgesehen, die Guten abgeschliffen und neu lackiert
-   2020                           10 Stk. neue Zeltgarnituren bei der Heinrich Kimmle Stiftung Pirmasens erwoben
-   2020/ 2021                  Wegen Corona wurden die meisten Programmpunkte abgesagt
-   20.06.2021                  Offizielle Auflösung der Volkstanz.- und Trachtengruppe
-   2020/ 2021                  In den Sommermonaten wurde wegen Corona auf der Kolpingwiese ein Sommer-Sonderprogramm angeboten
-   2023                            Feier zum 70 jährigen Jubiläum der Kolpingsfamilie im Festzelt mit Ehrungen und Neuaufnahmen.
-   25.06.2024                  Unser Ehrenpräses Pfr. Werner Kilian ist kurz vor seinem 81 Geburtstag verstorben.
-   2024                            Anschaffung von 12 Bühnenelementen für die Theatergruppe

### Bau und Renovierungsarbeiten

-   1973                           Bau der Mariengrotte hinter der kath. Kirche Organisation durch Kurt Mechnich und unter der
-                                      Leitung von Steinmetz Karl Böhm
-   1975 -1980                 Umbau des Pfarrheimes zum Kolpingheim mit „Klosterschänke“
-   1991                           Neubau des Jugendraumes mit Toilette, Lager und Außenanlage
-   1990 – 1993               Aufschüttung des Geländes vom ehemaligen Schwesterngarten
-   1996                           Erneuerung von Fußboden und Decke mit Luftabsaugung im Pfarrsaal
-   1998                           Neubau eines 2.Lagers, Richtfest am 14. Nov. 1998
-   1999                           Überdachung der Sitzecke zwischen Lager und Jugendraum
-   2000                           Freifläche planiert, Rasen angelegt und Thuja gepflanzt
-   05.-06.2000                Pfarrheim außen streichen und Sockel verputzen
-   2001 (Frühjahr)          Renovierung der Gastwirtschaft: Abzugsanlage und neue Decke
-   2000 – 2003               Fertigstellung des neuen Lagers mit Toiletten
-   2003                           Renovierung und Neueinrichtung der Gastwirtschaftsküche
-   2005                           2 neue Fenster mit Rollläden in der Gastwirtschaft eingebaut
-   2007                          12 neue Fenster mit Rollläden in der Wohnung eingebaut
-   11.05.2007                 Außentür vom neuen Jugendraum zum Freisitz eingebaut
-   2008                           Renovierung der Wohnung im Pfarrheim
-   2011                           Renovierung der gesamten Toiletten im EG
-   07.10.2011                 Neue Tür zum alten Jugendraum eingebaut
-   2012                           Überdachung hinter dem neuen Lager angebracht
-   2012                           Erneuerung der Heizkörper im Saal und Treppenhaus
-   2012                           Erneuerung sämtlicher Heizkörperventile
-   2013                           Erneuerung der Fenster mit Rollläden im Saal und auf der Bühne
-   2015                           Anlegen eines Bouleplatzes
-   2017                           Bau eines Gasflaschen Lagers
-   2018                           Einbau elektrischer Rollladenantriebe und tapezieren im neuen Jugendraum
-   2018                           Neueindeckung der Überdachung der Sitzecke am Jugendraum wegen Hagelschaden
-   2019                           Fußboden im Saal und Bühne abgeschliffen und neu versiegelt
-   2019                           Vorderer Eingangsbereich zum Pfarrheim mit Granitplatten neu verlegt
-   2019                           Neuer Gasbrenner für die Heizung eingebaut
-   2019                           Hintere Außentür zum Obergeschoß erneuert
-   2020                           2 neue Fenster in der Bücherei eingesetzt
-   2020                           Große Eingangstür Ostseite erneuert
-   2020                           Treppe Ostseite erneuert
-   09.2021                      Giebel Richtung Gemeindehaus wurde neu gestrichen
-   2024                           Bau eines Lagers für die Theatergruppe
-   2024                           Neuaufbau des Bouleplatzes' AND "metaDesc" = 'Details Geschrieben von: Wolfgang Rörig Veröffentlicht: 03. Juli 2019 Zugriffe: 2618 Relevante Vereins - Daten Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7 auf Einladung des Hochw.&nbsp; H' AND "parent" IS NULL AND "sortOrder" = 470 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_fd9e83af87c5329bb97561d6', 'reconcile-content:page:ueber-uns/vereinsdaten:article:/index.php/ueber-uns/relevante-vereinsdaten#2019-07-03-relevante-vereinsdaten-pfr-dr-karl-zinke-jpg', 'page', 'ueber-uns/vereinsdaten', 'sha256:1d21a14d82b9981794a69b1e5edebfc4933a0493001612981c7975b333800da1', 'sha256:5a09c4d58955ea6cedf3b989a6eb702c7ffcb5699eb6ad5b89ca94a7d227e5ae', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'ueber-uns/vereinsdaten' AND "title" = 'Vereinsdaten' AND "content" = '## Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7

auf Einladung des Hochw. Herrn Pfarrer Dr. Karl Zinke.

![Pfr Dr. Karl Zinke](/images/imported/ueber-uns/Pfr_Dr._Karl_Zinke.jpg)

## Gründungsvorstand (29.04.1953)

- Pfarrer Dr. Karl Zinke, Präses (verst.)
- Nikolaus Kaiser, Senior (verst.)
- Jakob Fischer, Kassenwart (verst.)
- Heinrich Fischer, Schriftführer (verst.)
- Hans-Rudi Kirchner, Beisitzer (verst.)
- Leonhard Kaiser, Beisitzer (verst.)
- Raimund Michel, Beisitzer (verst.)

## Gründungsmitglieder (06.12.1953)

### Gruppe Kolping:

- Eugen Fischer, (verst.)
- Raimund Fischer, (verst.)
- Ewald Karg, (verst.)
- Hans-Rudi Kirchner, (verst.)
- Heinrich Kirchner, (verst.)
- Bernhard Kuffler, (verst.)
- Alfred Langenstein, (verst.)
- Raimund Michel, (verst.)
- Adam Schifferstein, (verst.)
- Leander Schumacher, (verst.)
- Wilhelm Storck, (verst.)
- Oswald Veit. (verst.)

### Gruppe Altkolping:

- Karl Fischer, (verst.)
- Franz Haberkorn, (verst.)
- Leo Kaiser, (verst.)
- Jakob Krill. (verst.)

## Präses der Kolpingsfamilie:

- 29.04.1953 - 04 05.1963 Pfarrer Dr. Karl Zinke (verst.)
- 05.11.1963 - 26.02.1972 Pfarrer Ludwig Müller (verst.)
- 12.02.1964 - 31.03.1964 (Vizepräses) Kaplan Weißmann (verst.)
- 01.04.1964 - 13.07.1965 (Vizepräses) Kaplan Rolf Hagemeier
- 26.02.1972 - 31.10.1978 Pfarrer Franz-Josef Bolz (23.06.2025 verst. )
- 01.11.1978 - 20.06.2021 Pfarrer Werner Kilian (25.06.2024 verst.)
- 20.06.2021 - heute Pater Clifford Chikeobi Modum

## Senioren:

- 29.04.1953 - 20.01.1954 Nikolaus Kaiser (verst.)
- 20.01.1954 - 31.03.1957 Hans Kirchner (verst.)
- 31.03.1957 - 14.01.1960 Werner Fischer (verst.)
- 14.01.1960 - 18.03.1962 Robert Fischer
- 18.03.1962 - 07.04.1963 Bernhard Kuffler (verst.)
- 07.04.1963 - 27.03.1966 Fritz Schach
- 27.03.1966 - 03.03.1968 Heinz-Peter Geißler (verst.)
- 03.03.1968 - 06.03.1971 Peter Kaiser
- 06.03.1971 - 26.02.1972 Wolfgang Rörig
- 26.02.1972 - 06.01.1973 Bernd Aufschneider

## Altsenioren:

- 29.04.1953 - 31.03.1957 Nikolaus Kaiser (verst.)
- 31.03.1957 - 14.01.1960 Jakob Fischer (verst.)
- 14.01.1960 - 07.04.1963 Leo Kaiser (verst.)
- 07.04.1963 - 26.03.1966 Adam Schifferstein (verst.)
- 26.03.1966 - 03.03.1968 Raimund Michel (verst.)
- 03.03.1968 - 06.03.1971 Günter Wellstein (verst.)
- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)

## 1. Vorsitzende

- 06.03.1971 - 06.01.1973 Klaus Kaiser
- 06.01.1973 - 14.12.1974 Kurt Mechnich (verst.)
- 14.12.1974 - 05.05.1976 Leo Kaiser (verst.)
- 14.01.1977 - 10.01.1981 Paul Schmidt
- 10.01.1981 - 06.03.1982 Stephan Bayer
- 06.03.1982 - 27.02.1988 Wolfgang Rörig
- 27.02.1988 - 02.03.1991 Stephan Bayer (komis. von Wolfgang Rörig ausgeführt)
- 02.03.1991 - 22.02.2018 Wolfgang Rörig

## 2. Vorsitzende

- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)
- 26.02.1972 - 27.07.1974 Walter Fischer (verst.)
- 14.12.1974 - 09.01.1976 Wolfgang Rörig
- 09.01.1976 - 14.01.1977 Paul Schmidt
- 14.01.1977 - 12.01.1979 Wolfgang Rörig
- 12.01.1979 - 10.01.1981 Stephan Bayer
- 10.01.1981 - 06.03.1982 Wolfgang Rörig
- 06.03.1982 - 27.02.1988 Stephan Bayer
- 27.02.1988 - 02.03.1991 Wolfgang Rörig
- 02.03.1991- 30.03.2000 Stephan Bayer
- 30.03.2000 - 05.03.2009 Fritz Schach
- 05.03.2009 - 26.02.2015 Stephan Bayer
- 27.02.2015 - 22.02.2018 Heiko Schmitt-Sattler

## Leitungsteam

- 22.02.2018 - heute Bettina Schach, Heiko Schmitt-Sattler, Sebastian Sattler

## Familienkreis

- 08.02.2009 - heute Bettina Schach

## Familienkreis "Next Generation"

- 20.03.2025 - heute Nadja Höhn

## Jungkolpinggruppe/ Gruppenführer/Vertreter der Jugend

- 20.01.1954 – 16.03.1955 Raimund Michel (verst.)
- 16.03.1955 – 31.03.1957 Hans Balthasar (kein Mitglied)
- 31.03.1957 – 08.03.1959 Leander Schumacher und Theo Rörig (verst.)
- 08.03.1959 – 25.08.1959 Rupprecht Fischer (verst.)
- 25.08.1959 – 01.08.1962 Klaus Kaiser und Werner Balthasar
- 01.08.1962 – 16.02.1964 Peter Kaiser
- 16.02.1964 – 01.01.1966 Peter Kaiser, Hubert Matheis und Heiner Schumacher
- 01.01.1966 – 25.02.1967 Klaus Kaiser und Peter Fischer
- 25.02.1967 – 03.03.1968 Klaus Kaiser und Kurt Best
- 03.03.1968 – 15.02.1970 Kurt Best und Wolfgang Rörig
- 15.02.1970 – 06.03.1971 Winfried Weber und Gerald Mechnich
- 06.03.1971 – 01.01.1972 Gerald Mechnich
- 01.01.1972 – 06.01.1973 Klaus Weber
- 06.01.1973 – 04.02.1975 Bernhard Baldauf, Christel Weibel und Petra Dünkelberg
- 04.02.1975 – 09.01.1976 Albert Baldauf, Christel Weibel und Petra Dünkelberg
- 09.01.1976 – 24.11.1976 Christel Weibel und Manuela Wendel
- 24.11.1976 – 06.01.1978 Hubert Gattje (verst.), Jürgen Storck und Manuela Wendel
- 06.01.1978 – 12.01.1979 Hubert Gattje (verst.), Jürgen Storck, Manuela Wendel, Regina Schifferstein
- 12.01.1979 – 11.01.1980 Brigitte Steitz und Armin Balthasar
- 11.01.1980 – 06.03.1982 Silvia Storck
- 06.03.1982 – 04.02.1984 Martina Wunderlich
- 02.03.1985 – 14.03.1987 Stephan Fischer
- 14.03.1987 – 10.03.1990 Marina Heeß
- 10.03.1990 – 02.03.1991 Hans-Werner Bitter (verst.)
- 02.03.1991 – 26.02.1994 Jörg Fischer
- 26.02.1994 – 11.03.1995 Steffen Rörig, Matthias Best, Arno Schmidt, Daniela Steitz
- 11.03.1995 – 20.02.1997 Steffen Rörig
- 20.02.1997 – 30.03.2000 Andreas Best (Vertreter der Jugend)
- 30.03.2000 – 05.03.2009 Mathias Bayer (Vertreter der Jugend)
- 05.03.2009 – 05.09.2009 Astrid Pohl (Vertreter der Jugend)
- 05.09.2009 - 20.03.2024 Sebastian Sattler, Jugendleiter
- 05.09.2013 - 20.03.2024 Anton Rikart, stellvertr. Jugendleiter
- 21.03.2024 - heute Nele Rörig & Jonas Berst Jugendleitung

## Ehrenpräses der Kolpingsfamilie

- 20.06.2021 Pfr. Werner Kilian (25.06.2024 verst.)

![Pfr. Kilian](/images/imported/ueber-uns/Pfr._Kilian.jpg)

## Ehrenmitglieder der Kolpingsfamilie:

- 01.01.1983 Ludwig Vetter (verst.)
- 02.12.1990 Jakob Fischer (verst.)
- 05.07.1996 Georg Spieß (verst.)
- 06.05.2012 Hans-Rudi Kirchner (verst.)
- 05.12.2019 Wolfgang Richter
- 05.12.2019 Fritz Schach

## Verleihung der Pirminius Plakette

- 07.10.2012 Erika Behnke (durch Bischof Wiesemann)

## Verleihung der Diözesan - Ehrenurkunde:

- 29.11.1991 Jakob Fischer (verst.)
- 25.11.1994 Fritz Schach
- 01.12.1995 Lieselotte Richter
- 27.11.1998 Wolfgang Rörig
- 28.11.2003 Wolfgang Aufschneider (verst.)
- 26.11.2004 Bernd Aufschneider
- 01.12.2006 Wolfgang Scherr
- 31.11.2012 Wolfgang Richter
- 31.11.2012 Erika Behnke (wurde vom Diözesanverband Speyer vorgeschlagen)
- 25.11.2016 Wiltrud Schach
- 30.11.2018 Christel Bayer
- 18.11.2023 Sebastian Sattler

## Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland

- 02.12.2018 Wolfgang Rörig

## Verleihung der Ehrennadel in Gold von der Gemeinde Ramsen

- 05.01.2003 Georg Spieß (verst.)
- 09.01.2005 Fritz Schach
- 04.01.2009 Wolfgang Rörig
- 08.01.2012 Wolfgang Aufschneider (verst.)
- 08.01.2012 Wolfgang Scherr
- 13.01.2013 Lieselotte Richter
- 10.01.2015 Wolfgang Richter
- 10.01.2016 Wiltrud Schach
- 08.01.2017 Christel Bayer
- 08.01.2017 Anita Rieder
- 14.01.2018 Bernd Aufschneider
- 12.01.2020 Stephan Bayer
- 31.01.2026 Manfred Zengerle

## Besondere chronologische Daten:

- 06.12.1953 Banner von R. Michel angefertigt zur 1. Neuaufnahme
- 1954 im Frühjahr Gründung einer Jungkolpinggruppe
- 16\. 03.1955 Gründung der Kolpingskapelle
- 09.12.1958 Einweihung des neuen Banners, beim Kolpingwerk Köln gekauft
- 28.04. 1963 10 jähr. Jubiläum der Kolpingsfamilie im Saale des TuS 05
- 28.07. - 04.08.1963 Handwerksausstellung im Gemeindehaus Ramsen
- 26.01. 1964 1. Prunksitzung im Saale des TuS 05 mit der KF Winnweiler
- 1964/1965 10 Sitzbänke rund um Ramsen aufgestellt in Wald und Flur
- 13.08.1967 Diözesan-Radrennen in Ramsen, rund um den Schwarzwald
- 06.08.1971 Gründung der Volkstanz- und Trachtengruppe
- 04.07.1972 Gründung des Kolpingheim e.V.
- 1973 Die Mariengrotte wurde von Kolpingsmitgliedern erbaut
- 1975 -1997 Martinsumzüge der Kinder
- 12\. - 15.05.1978 25 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf dem Sportplatz
- 30.06.1988 Auflösung des Kolpingheim e.V.
- 28.03. 1999 Silbernes Priesterjubiläum von Präses Werner Kilian (in der Eistalhalle)
- 04.-06.07.2003 50 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf der Kolpingwiese
- 2005 Neues Zelt mit Fenstern für besondere Anlässe gekauft
- 2008 Die Gaststätte "Klosterschänke" wird nach 32 Jahren geschlossen
- 08.02.2009 Gründung eines "Familienkreises"
- 12.06.2009 Überlassungsvertrages vom Pfarrheim auf weitere 25 Jahre verlängert
- 2009 Neuanschaffung der Saalbestuhlung mit Tischen (80 Stühle + 12 Tische)
- 05.05.2013 60. jähr. Jubiläum mit Festmesse und Empfang im Pfarrheim
- 22.02.2014 50. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 17.05.2014 Diözesan Familientag auf der Kolpingwiese in Ramsen
- 15.07.2015 Neuanschaffung weiterer Saalbestuhlung für die Bühne (40 Stühle + 6 Tische)
- 06.05.2018 65 jähriges Jubiläum mit Festmesse/ Empfang im Pfarrheim mit Diashow über die zurückliegenden Jahre.
- 23.02.2019 55. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 2019 Alle Zeltgarnituren nachgesehen, die Guten abgeschliffen und neu lackiert
- 2020 10 Stk. neue Zeltgarnituren bei der Heinrich Kimmle Stiftung Pirmasens erwoben
- 2020/ 2021 Wegen Corona wurden die meisten Programmpunkte abgesagt
- 20.06.2021 Offizielle Auflösung der Volkstanz.- und Trachtengruppe
- 2020/ 2021 In den Sommermonaten wurde wegen Corona auf der Kolpingwiese ein Sommer-Sonderprogramm angeboten
- 2023 Feier zum 70 jährigen Jubiläum der Kolpingsfamilie im Festzelt mit Ehrungen und Neuaufnahmen.
- 25.06.2024 Unser Ehrenpräses Pfr. Werner Kilian ist kurz vor seinem 81 Geburtstag verstorben.
- 2024 Anschaffung von 12 Bühnenelementen für die Theatergruppe

## Bau und Renovierungsarbeiten

- 1973 Bau der Mariengrotte hinter der kath. Kirche Organisation durch Kurt Mechnich und unter der Leitung von Steinmetz Karl Böhm
- 1975 -1980 Umbau des Pfarrheimes zum Kolpingheim mit „Klosterschänke“
- 1991 Neubau des Jugendraumes mit Toilette, Lager und Außenanlage
- 1990 – 1993 Aufschüttung des Geländes vom ehemaligen Schwesterngarten
- 1996 Erneuerung von Fußboden und Decke mit Luftabsaugung im Pfarrsaal
- 1998 Neubau eines 2.Lagers, Richtfest am 14. Nov. 1998
- 1999 Überdachung der Sitzecke zwischen Lager und Jugendraum
- 2000 Freifläche planiert, Rasen angelegt und Thuja gepflanzt
- 05.-06.2000 Pfarrheim außen streichen und Sockel verputzen
- 2001 (Frühjahr) Renovierung der Gastwirtschaft: Abzugsanlage und neue Decke
- 2000 – 2003 Fertigstellung des neuen Lagers mit Toiletten
- 2003 Renovierung und Neueinrichtung der Gastwirtschaftsküche
- 2005 2 neue Fenster mit Rollläden in der Gastwirtschaft eingebaut
- 2007 12 neue Fenster mit Rollläden in der Wohnung eingebaut
- 11.05.2007 Außentür vom neuen Jugendraum zum Freisitz eingebaut
- 2008 Renovierung der Wohnung im Pfarrheim
- 2011 Renovierung der gesamten Toiletten im EG
- 07.10.2011 Neue Tür zum alten Jugendraum eingebaut
- 2012 Überdachung hinter dem neuen Lager angebracht
- 2012 Erneuerung der Heizkörper im Saal und Treppenhaus
- 2012 Erneuerung sämtlicher Heizkörperventile
- 2013 Erneuerung der Fenster mit Rollläden im Saal und auf der Bühne
- 2015 Anlegen eines Bouleplatzes
- 2017 Bau eines Gasflaschen Lagers
- 2018 Einbau elektrischer Rollladenantriebe und tapezieren im neuen Jugendraum
- 2018 Neueindeckung der Überdachung der Sitzecke am Jugendraum wegen Hagelschaden
- 2019 Fußboden im Saal und Bühne abgeschliffen und neu versiegelt
- 2019 Vorderer Eingangsbereich zum Pfarrheim mit Granitplatten neu verlegt
- 2019 Neuer Gasbrenner für die Heizung eingebaut
- 2019 Hintere Außentür zum Obergeschoß erneuert
- 2020 2 neue Fenster in der Bücherei eingesetzt
- 2020 Große Eingangstür Ostseite erneuert
- 2020 Treppe Ostseite erneuert
- 09.2021 Giebel Richtung Gemeindehaus wurde neu gestrichen
- 2024 Bau eines Lagers für die Theatergruppe
- 2024 Neuaufbau des Bouleplatzes' AND "metaDesc" = 'Details Geschrieben von: Wolfgang Rörig Veröffentlicht: 03. Juli 2019 Zugriffe: 2618 Relevante Vereins - Daten Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7 auf Einladung des Hochw.&nbsp; H' AND "parent" IS NULL AND "sortOrder" = 470 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "content" = '## Familien-Zeltlager Historie der Kolpingfamilie Ramsen

| Nr. | Zeitraum | Lager / Hinweis |
| ---: | --- | --- |
| – | 22.07. - 24.07.1977 | 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann |
| – | 15.07. - 23. 07.1978 | Jugendzeltlager auf dem Campingplatz in Gerbach |
| – | 13.07. - 15.07.1979 | Jugendzeltlager beim SV Grün-Weiß Hochspeyer |
| – | 27.07. - 02.08.1980 | Jugendzeltlager in St. Leon |
| – | 26.07. - 01.08.1981 | Jugendzeltlager in der „Heilsbach“ bei Schönau |
| – | 01.08. - 08.08.1982 | Jugendzeltlager der Volkstanz.u.Trgr. in Dörnbach/ Donnersberg |
| 01. | 30.07. - 06.08.1983 | Familienzeltlager in Hilst/ VG Pirmasens |
| 02. | 11.08. - 18.08.1984 | Familienzeltlager in Jägersburg/ Saarland (Homburg) |
| 03. | 03.08. - 10.08.1985 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 04. | 19.07. - 26.07.1986 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 05. | 22.08. - 29.08.1987 | Familienzeltlager in Annweiler/ Südwestpfalz |
| 06. | 13.08. - 20.08.1988 | Familienzeltlager in Dahn/ Südwestpfalz |
| – | 02.06. - 04.06.1989 | Jugendzeltlager in Zell/ Mosel |
| 07. | 29.07. - 05.08.1989 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 08. | 28.07. - 04.08.1990 | Familienzeltlager in Hambach/ Neustadt |
| 09. | 20.07. - 27.07.1991 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 10. | 22.08. - 29.08.1992 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 11. | 13.08. - 21.08.1993 | Familienzeltlager am Bostalsee/ Saarland |
| 12. | 30.07. - 06.08.1994 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 13. | 04.08. - 12.08.1995 | Familienzeltlager in Hilst/ VG Pirmasens |
| 14. | 17.08. - 24.08.1996 | Familienzeltlager in Dahn/ Südwestpfalz |
| 15. | 23.08. - 29.08.1997 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 16. | 15.08. - 22.08.1998 | Familienzeltlager in Hambach/ Neustadt |
| 17. | 31.07. - 07.08.1999 | Familienzeltlager in Odenbach/ Glan |
| 18. | 22.07. - 29.07.2000 | Familienzeltleger in Jägersburg/ Saar (Homburg) |
| 19. | 28.07. - 04.08.2001 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 20. | 02.08. - 10.08.2002 | Familienzeltlager in Moosautal/ Odenwald |
| 21. | 15.08. - 23.08.2003 | Familienzeltlager in Queidersbach/ (VG Landstuhl) |
| 22. | 20.08. - 28.08. 2004 | Familienzeltlager in Saarhölzbach/ Saarland |
| 23. | 19. 08. - 27. 08.2005 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 24. | 18.08. - 26.08. 2006 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 25. | 27.07. - 04.08.2007 | Familienzeltlager am Bostalsee/ Saarland |
| 26. | 11.07. - 19.07.2008 | Familienzeltlager in Imsbach/ Donnersberg |
| 27. | 31.07. - 08.08.2009 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 28. | 23.07. - 31.07.2010 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 29. | 15.07. - 23.07.2011 | Familienzeltlager in Imsbach/ Donnersberg (wegen Schmutz im Trinkwasser, Lager abgebrochen) |
| 30. | 20.07. - 28.07.2012 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 31. | 26.07. - 03.08.2013 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 32. | 15.08. - 23.08.2014 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 33. | 14.08. - 22.08.2015 | Familienzeltlager in Geiselberg (geplant in Imsbach-Absage der Gemeinde) |
| 34. | 05.08. - 13.08.2016 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 35. | 21.07. - 29.07.2017 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 36. | 13.07. - 21.07.2018 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 37. | 19.07. - 27.07.2019 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| – | 24.07. - 01.08.2020 | Familienzeltlager in Saarburg (im Kammerforst) (wegen Corona abgesagt) |
| – | 06.08. - 14.08.2021 | Familienzeltlager in Hauenstein/ Südwestpfalz (wegen Corona abgesagt) |
| 38. | 12.08. - 20.08.2022 | Familiezeltlager in Frauenberg (Fehlbuchung des Platzbesitzers) kurzfristig umgebucht nach Hauenstein |
| 39. | 11.08. - 19.08.2023 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 40. | 02.08. - 10.08.2024 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 41. | 25.07. - 02.08.2025 | Familienzeltlager in Geiselberhg (VG Walfischbach-Burgalben) |
| 42. | 17.07. - 25.07.2026 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 43. | 2027 | Familienzeltlager in Frauenberg/ (an der Nahe) |', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'vereinsbereiche/zeltlager' AND "title" = 'Zeltlager' AND "content" = '# Familien-Zeltlager Historie der Kolpingfamilie Ramsen

       22.07. - 24.07.1977      1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann

       15.07. - 23. 07.1978      Jugendzeltlager auf dem Campingplatz in Gerbach

       13.07. - 15.07.1979       Jugendzeltlager beim SV Grün-Weiß Hochspeyer

       27.07. - 02.08.1980       Jugendzeltlager in St. Leon

       26.07. - 01.08.1981       Jugendzeltlager in der „Heilsbach“ bei Schönau

       01.08. - 08.08.1982       Jugendzeltlager der Volkstanz.u.Trgr. in Dörnbach/ Donnersberg

01.  30.07. - 06.08.1983      Familienzeltlager in Hilst/ VG Pirmasens

02.  11.08. - 18.08.1984      Familienzeltlager in Jägersburg/ Saarland (Homburg)

03.  03.08. - 10.08.1985      Familienzeltlager in Krottelbach/ (Oberes Glantal)

04\.   19.07. - 26.07.1986     Familienzeltlager in Hauenstein/ Südwestpfalz

05.   22.08. - 29.08.1987     Familienzeltlager in Annweiler/ Südwestpfalz

06.   13.08. - 20.08.1988     Familienzeltlager in Dahn/ Südwestpfalz

        02.06. - 04.06.1989     Jugendzeltlager in Zell/ Mosel

07\.   29.07. - 05.08.1989     Familienzeltlager in Hauenstein/ Südwestpfalz

08\.   28.07. - 04.08.1990     Familienzeltlager in Hambach/ Neustadt

09.   20.07. - 27.07.1991     Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

10.   22.08. - 29.08.1992     Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

11\.   13.08. - 21.08.1993     Familienzeltlager am Bostalsee/ Saarland

12\.   30.07. - 06.08.1994     Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

13.   04.08. - 12.08.1995     Familienzeltlager in Hilst/ VG Pirmasens

14\.   17.08. - 24.08.1996     Familienzeltlager in Dahn/ Südwestpfalz

15\.   23.08. - 29.08.1997     Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

16.   15.08. - 22.08.1998     Familienzeltlager in Hambach/ Neustadt

17\.   31.07. - 07.08.1999     Familienzeltlager in Odenbach/ Glan

18\.   22.07. - 29.07.2000     Familienzeltleger in Jägersburg/ Saar (Homburg)

19.   28.07. - 04.08.2001     Familienzeltlager in Hauenstein/ Südwestpfalz

20\.   02.08. - 10.08.2002     Familienzeltlager in Moosautal/ Odenwald

21\.   15.08. - 23.08.2003     Familienzeltlager in Queidersbach/ (VG Landstuhl)

22\.   20.08. - 28.08. 2004    Familienzeltlager in Saarhölzbach/ Saarland

23\.   19. 08. - 27. 08.2005   Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

24\.   18.08. - 26.08. 2006    Familienzeltlager in Hauenstein/ Südwestpfalz

25.   27.07. - 04.08.2007     Familienzeltlager am Bostalsee/ Saarland

26\.   11.07. - 19.07.2008     Familienzeltlager in Imsbach/ Donnersberg

27\.   31.07. - 08.08.2009     Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

28.   23.07. - 31.07.2010     Familienzeltlager in Krottelbach/ (Oberes Glantal)

29\.   15.07. - 23.07.2011     Familienzeltlager in Imsbach/ Donnersberg (wegen Schmutz im Trinkwasser, Lager abgebrochen)

30\.   20.07. - 28.07.2012     Familienzeltlager in Hauenstein/ Südwestpfalz

31.   26.07. - 03.08.2013     Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben)

32\.   15.08. - 23.08.2014     Familienzeltlager in Krottelbach/ (Oberes Glantal)

33\.   14.08. - 22.08.2015     Familienzeltlager in Geiselberg (geplant in Imsbach-Absage der Gemeinde)

34.   05.08. - 13.08.2016     Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg)

35\.   21.07. - 29.07.2017     Familienzeltlager in Frauenberg/ (an der Nahe)

36\.   13.07. - 21.07.2018     Familienzeltlager in Deudesfeld/ Vulkaneifel

37.   19.07. - 27.07.2019     Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg)

        24.07. - 01.08.2020     Familienzeltlager in Saarburg (im Kammerforst) (wegen Corona abgesagt)

        06.08. - 14.08.2021     Familienzeltlager in Hauenstein/ Südwestpfalz (wegen Corona abgesagt)

38.   12.08. - 20.08.2022     Familiezeltlager in Frauenberg (Fehlbuchung des Platzbesitzers) kurzfristig umgebucht nach Hauenstein

39.   11.08. - 19.08.2023     Familienzeltlager in Deudesfeld/ Vulkaneifel

40.   02.08. - 10.08.2024    Familienzeltlager in Frauenberg/ (an der Nahe)

41.   25.07. - 02.08.2025    Familienzeltlager in Geiselberhg (VG Walfischbach-Burgalben)

42.   17.07. - 25.07.2026    Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) (In Planung)
' AND "metaDesc" = 'Familien-Zeltlager Historie der Kolpingfamilie Ramsen 22.07. - 24.07.1977 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann 15.07. - 23. 07.1978' AND "parent" IS NULL AND "sortOrder" = 500 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_fbb4bb86fc8ccff7c8e343ee', 'reconcile-content:page:vereinsbereiche/zeltlager:article:/index.php/vereinsbereiche/zeltlager#2019-07-03-familien-zeltlager-historie-der-kolpingfamilie-ramsen-e7358dfa891b', 'page', 'vereinsbereiche/zeltlager', 'sha256:e7358dfa891bde3a8ac401c4034eb30af2497ab9bee5f35ce1d29ccbfbc2cd3e', 'sha256:8f6af69ebc2197d60de47ba3cc22a4ff66b525e1d1cf8c4ae2bc8d058e0abe40', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'vereinsbereiche/zeltlager' AND "title" = 'Zeltlager' AND "content" = '## Familien-Zeltlager Historie der Kolpingfamilie Ramsen

| Nr. | Zeitraum | Lager / Hinweis |
| ---: | --- | --- |
| – | 22.07. - 24.07.1977 | 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann |
| – | 15.07. - 23. 07.1978 | Jugendzeltlager auf dem Campingplatz in Gerbach |
| – | 13.07. - 15.07.1979 | Jugendzeltlager beim SV Grün-Weiß Hochspeyer |
| – | 27.07. - 02.08.1980 | Jugendzeltlager in St. Leon |
| – | 26.07. - 01.08.1981 | Jugendzeltlager in der „Heilsbach“ bei Schönau |
| – | 01.08. - 08.08.1982 | Jugendzeltlager der Volkstanz.u.Trgr. in Dörnbach/ Donnersberg |
| 01. | 30.07. - 06.08.1983 | Familienzeltlager in Hilst/ VG Pirmasens |
| 02. | 11.08. - 18.08.1984 | Familienzeltlager in Jägersburg/ Saarland (Homburg) |
| 03. | 03.08. - 10.08.1985 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 04. | 19.07. - 26.07.1986 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 05. | 22.08. - 29.08.1987 | Familienzeltlager in Annweiler/ Südwestpfalz |
| 06. | 13.08. - 20.08.1988 | Familienzeltlager in Dahn/ Südwestpfalz |
| – | 02.06. - 04.06.1989 | Jugendzeltlager in Zell/ Mosel |
| 07. | 29.07. - 05.08.1989 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 08. | 28.07. - 04.08.1990 | Familienzeltlager in Hambach/ Neustadt |
| 09. | 20.07. - 27.07.1991 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 10. | 22.08. - 29.08.1992 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 11. | 13.08. - 21.08.1993 | Familienzeltlager am Bostalsee/ Saarland |
| 12. | 30.07. - 06.08.1994 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 13. | 04.08. - 12.08.1995 | Familienzeltlager in Hilst/ VG Pirmasens |
| 14. | 17.08. - 24.08.1996 | Familienzeltlager in Dahn/ Südwestpfalz |
| 15. | 23.08. - 29.08.1997 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 16. | 15.08. - 22.08.1998 | Familienzeltlager in Hambach/ Neustadt |
| 17. | 31.07. - 07.08.1999 | Familienzeltlager in Odenbach/ Glan |
| 18. | 22.07. - 29.07.2000 | Familienzeltleger in Jägersburg/ Saar (Homburg) |
| 19. | 28.07. - 04.08.2001 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 20. | 02.08. - 10.08.2002 | Familienzeltlager in Moosautal/ Odenwald |
| 21. | 15.08. - 23.08.2003 | Familienzeltlager in Queidersbach/ (VG Landstuhl) |
| 22. | 20.08. - 28.08. 2004 | Familienzeltlager in Saarhölzbach/ Saarland |
| 23. | 19. 08. - 27. 08.2005 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 24. | 18.08. - 26.08. 2006 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 25. | 27.07. - 04.08.2007 | Familienzeltlager am Bostalsee/ Saarland |
| 26. | 11.07. - 19.07.2008 | Familienzeltlager in Imsbach/ Donnersberg |
| 27. | 31.07. - 08.08.2009 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 28. | 23.07. - 31.07.2010 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 29. | 15.07. - 23.07.2011 | Familienzeltlager in Imsbach/ Donnersberg (wegen Schmutz im Trinkwasser, Lager abgebrochen) |
| 30. | 20.07. - 28.07.2012 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 31. | 26.07. - 03.08.2013 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 32. | 15.08. - 23.08.2014 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 33. | 14.08. - 22.08.2015 | Familienzeltlager in Geiselberg (geplant in Imsbach-Absage der Gemeinde) |
| 34. | 05.08. - 13.08.2016 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 35. | 21.07. - 29.07.2017 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 36. | 13.07. - 21.07.2018 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 37. | 19.07. - 27.07.2019 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| – | 24.07. - 01.08.2020 | Familienzeltlager in Saarburg (im Kammerforst) (wegen Corona abgesagt) |
| – | 06.08. - 14.08.2021 | Familienzeltlager in Hauenstein/ Südwestpfalz (wegen Corona abgesagt) |
| 38. | 12.08. - 20.08.2022 | Familiezeltlager in Frauenberg (Fehlbuchung des Platzbesitzers) kurzfristig umgebucht nach Hauenstein |
| 39. | 11.08. - 19.08.2023 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 40. | 02.08. - 10.08.2024 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 41. | 25.07. - 02.08.2025 | Familienzeltlager in Geiselberhg (VG Walfischbach-Burgalben) |
| 42. | 17.07. - 25.07.2026 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 43. | 2027 | Familienzeltlager in Frauenberg/ (an der Nahe) |' AND "metaDesc" = 'Familien-Zeltlager Historie der Kolpingfamilie Ramsen 22.07. - 24.07.1977 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann 15.07. - 23. 07.1978' AND "parent" IS NULL AND "sortOrder" = 500 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "content" = 'Unser Gründungsmitglied Hans Kirchner ist verstorben. Der Pressebeitrag erschien am 19. Januar 2025.

![Kirchner Hans 2025 01](/images/legacy-v2/a2/a25625d5bad67afa0001fc6d4115f906-w1600-q78.webp)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/presse/kirchner-hans' AND "title" = 'Nachruf auf Hans Kirchner' AND "content" = 'Pressebeitrag aus unserem Archiv vom 19. Januar 2025.

![Kirchner Hans 2025 01](/images/legacy-v2/a2/a25625d5bad67afa0001fc6d4115f906-w1600-q78.webp)' AND "metaDesc" = 'Pressebeitrag aus unserem Archiv vom 19. Januar 2025.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 450 AND "archiveDate" = '2025-01-19T00:00:00.000Z' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_cfa268d3e9cec45c054d9812', 'reconcile-content:page:rueckblick/presse/kirchner-hans:article:/index.php/rueckblick/presse/kirchner-hans#2025-01-19-nachruf-auf-hans-kirchner-kirchner-hans-2025-01-jpg', 'page', 'rueckblick/presse/kirchner-hans', 'sha256:1dcdbdb49fb8873f66b32f03985c0f2980f5654d01780e4983595b2dd89d7726', 'sha256:dc901221070c7577b6c2119df9299433ab8a434050a4cf45e4c05205e49d4fed', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/presse/kirchner-hans' AND "title" = 'Nachruf auf Hans Kirchner' AND "content" = 'Unser Gründungsmitglied Hans Kirchner ist verstorben. Der Pressebeitrag erschien am 19. Januar 2025.

![Kirchner Hans 2025 01](/images/legacy-v2/a2/a25625d5bad67afa0001fc6d4115f906-w1600-q78.webp)' AND "metaDesc" = 'Pressebeitrag aus unserem Archiv vom 19. Januar 2025.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 450 AND "archiveDate" = '2025-01-19T00:00:00.000Z' AND "published" = 1);

UPDATE "Page" SET "content" = 'Rheinpfalz-Artikel vom Montag, 30. Dezember 2024 über das Kolping-Kreativtheater.

![Kreativtheater 2024 02](/images/legacy-v2/bd/bd915248c84e30a6d6cd5f99be75878f-w1600-q78.webp)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/presse/kreativtheater2024-02' AND "title" = 'Kreativbühne 2024 – Pressebericht vom 30. Dezember' AND "content" = 'Pressebeitrag aus unserem Archiv vom 30. Dezember 2024.

![Kreativtheater 2024 02](/images/legacy-v2/bd/bd915248c84e30a6d6cd5f99be75878f-w1600-q78.webp)' AND "metaDesc" = 'Pressebeitrag aus unserem Archiv vom 30. Dezember 2024.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 380 AND "archiveDate" = '2024-12-30T00:00:00.000Z' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_ce2fe2eaeb5ebbc3a8f7ee5e', 'reconcile-content:page:rueckblick/presse/kreativtheater2024-02:article:/index.php/rueckblick/presse/kreativtheater2024-02#2024-12-30-kreativbuehne-2024-pressebericht-vom-30-dezember-kreativtheater-2024-02-jpg', 'page', 'rueckblick/presse/kreativtheater2024-02', 'sha256:fd75c9ba41478c176bfbdd7d8f13ab34d51261ed24de87f6c9e753db17563e35', 'sha256:76bd86a0ef3a65c490c980dc5e61474a51bc1a6028a8b3465427b22fde589f83', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/presse/kreativtheater2024-02' AND "title" = 'Kreativbühne 2024 – Pressebericht vom 30. Dezember' AND "content" = 'Rheinpfalz-Artikel vom Montag, 30. Dezember 2024 über das Kolping-Kreativtheater.

![Kreativtheater 2024 02](/images/legacy-v2/bd/bd915248c84e30a6d6cd5f99be75878f-w1600-q78.webp)' AND "metaDesc" = 'Pressebeitrag aus unserem Archiv vom 30. Dezember 2024.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 380 AND "archiveDate" = '2024-12-30T00:00:00.000Z' AND "published" = 1);

UPDATE "Page" SET "content" = 'Am 6. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt.

Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube gezeigt.

Viele positive Rückmeldungen gingen bei uns ein. Die weitesten aus Enschede/ Niederlande, Almaty/ Kasachstan und Belleville, Illinois USA.

[https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s](https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s)

 ![Plakat Prunk 2021](/images/legacy-v2/45/455c9d0e2bb9fb3fb089373548a550c0-w1600-q78.webp)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/prunksitzung/prunksitzung2021' AND "title" = 'Digitale Ramser Fastnacht 2021' AND "content" = 'Am Samstag, 06. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt.

Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube gezeigt.

Viele positive Rückmeldungen gingen bei uns ein. Die weitesten aus Enschede/ Niederlande, Almaty/ Kasachstan und Belleville, Illinois USA.

[https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s](https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s)

 ![Plakat Prunk 2021](/images/legacy-v2/45/455c9d0e2bb9fb3fb089373548a550c0-w1600-q78.webp)' AND "metaDesc" = 'Am Samstag, 06. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt. Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube ge' AND "parent" = 'rueckblick/prunksitzung' AND "sortOrder" = 30 AND "archiveDate" = '2021-02-07T00:00:00.000Z' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_bb27c5ec22a25543714b71d6', 'reconcile-content:page:rueckblick/prunksitzung/prunksitzung2021:article:/index.php/rueckblick/prunksitzung/prunksitzung2021#2021-02-07-digitale-ramser-fastnacht-2021-plakat-prunk-2021-jpg', 'page', 'rueckblick/prunksitzung/prunksitzung2021', 'sha256:725059cba64061e09735d9bd4f199bfbc7b3e385ab2cea1739b44834af77883f', 'sha256:e54bcb7687a10e1f3d4c64c25103c428c35672667154eaf7d98cfa7ade68ccc3', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/prunksitzung/prunksitzung2021' AND "title" = 'Digitale Ramser Fastnacht 2021' AND "content" = 'Am 6. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt.

Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube gezeigt.

Viele positive Rückmeldungen gingen bei uns ein. Die weitesten aus Enschede/ Niederlande, Almaty/ Kasachstan und Belleville, Illinois USA.

[https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s](https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s)

 ![Plakat Prunk 2021](/images/legacy-v2/45/455c9d0e2bb9fb3fb089373548a550c0-w1600-q78.webp)' AND "metaDesc" = 'Am Samstag, 06. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt. Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube ge' AND "parent" = 'rueckblick/prunksitzung' AND "sortOrder" = 30 AND "archiveDate" = '2021-02-07T00:00:00.000Z' AND "published" = 1);

UPDATE "News" SET "content" = 'Sammelstation: Bei Wolfgang Rörig Bahnhofstr. 16 im Hof. Die Kiste steht neben der Haustür.

![Tintenpatronen sammeln](/images/imported/news/Tintenpatronen_sammeln.jpg)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen' AND "title" = 'Tintenpatronen - Sammelaktion der KF Ramsen' AND "date" = '2025-10-13T00:00:00.000+00:00' AND "teaser" = 'Wir sammeln nur Tintenpatronen mit Druckkopf' AND "content" = '### Wir sammeln nur Tintenpatronen mit Druckkopf

Sammelstation: Bei Wolfgang Rörig Bahnhofstr. 16 im Hof. Die Kiste steht neben der Haustür.

![Tintenpatronen sammeln](/images/imported/news/Tintenpatronen_sammeln.jpg)' AND "coverImage" = '/images/imported/news/Tintenpatronen_sammeln.jpg' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_6239c814862c5bb75ec2594d', 'reconcile-content:news:2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen:article:/index.php/aktuelles#2025-10-13-tintenpatronen-sammelaktion-der-kolpingsfamilie-ramsen-tintenpatronen-sammeln-jpg', 'news', '2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen', 'sha256:13f125a2f4043fe07916617cc1b5fc17997005bc7ad5fd7499240b797208c998', 'sha256:028f22cc239f05b1fae495b9ef6f944d68cb456b711d1326b1ed09e1655c0f80', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "News" WHERE "slug" = '2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen' AND "title" = 'Tintenpatronen - Sammelaktion der KF Ramsen' AND "date" = '2025-10-13T00:00:00.000+00:00' AND "teaser" = 'Wir sammeln nur Tintenpatronen mit Druckkopf' AND "content" = 'Sammelstation: Bei Wolfgang Rörig Bahnhofstr. 16 im Hof. Die Kiste steht neben der Haustür.

![Tintenpatronen sammeln](/images/imported/news/Tintenpatronen_sammeln.jpg)' AND "coverImage" = '/images/imported/news/Tintenpatronen_sammeln.jpg' AND "published" = 1);

UPDATE "Event" SET "location" = 'Park von Dirmstein', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-03-20-bezirks-kreuzweg' AND "title" = 'Bezirks Kreuzweg' AND "startDate" = '2026-03-20T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '19:00' AND "endTime" IS NULL AND "location" = 'Park' AND "description" = '19:00 Uhr — Bezirks Kreuzweg im Park von Dirmstein' AND "category" = 'bezirk' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_bb4131e9a2f4157c5cc1966c', 'reconcile-event:2026-03-20-bezirks-kreuzweg:event:2026-03-20:bezirks-kreuzweg', 'event', '2026-03-20-bezirks-kreuzweg', 'sha256:72084d4e239442c33ed41f821129965173a7b168302fb3767e65ab60e5e398f4', 'sha256:23c2ddd6efe8c6a634777aaaa7bc12eca3cb69793483f232408dc9d36f57762b', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-03-20-bezirks-kreuzweg' AND "title" = 'Bezirks Kreuzweg' AND "startDate" = '2026-03-20T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '19:00' AND "endTime" IS NULL AND "location" = 'Park von Dirmstein' AND "description" = '19:00 Uhr — Bezirks Kreuzweg im Park von Dirmstein' AND "category" = 'bezirk' AND "published" = 1);

UPDATE "Event" SET "location" = 'Mariengrotte, Ramsen', "description" = '19:00 Uhr — Bezirksmaiandacht an der Mariengrotte in Ramsen; anschließend Maibowle im Pfarrheim.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-05-22-bezirksmaiandacht' AND "title" = 'Bezirksmaiandacht' AND "startDate" = '2026-05-22T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '19:00' AND "endTime" IS NULL AND "location" = 'Ramsen' AND "description" = '19:00 Uhr — Bezirksmaiandacht in Ramsen an der Mariengrotte' AND "category" = 'bezirk' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_7d35a6ca5955799ba19fba7d', 'reconcile-event:2026-05-22-bezirksmaiandacht:event:2026-05-22:bezirksmaiandacht', 'event', '2026-05-22-bezirksmaiandacht', 'sha256:b1348910e4da16764ba50c34cb62e7a6e3dd4cc189ac0ecbaa99785bcd407862', 'sha256:7c30eef64154fe94eb33415b2a903b84a389d2f1ab8d6bceca5637884812add2', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-05-22-bezirksmaiandacht' AND "title" = 'Bezirksmaiandacht' AND "startDate" = '2026-05-22T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '19:00' AND "endTime" IS NULL AND "location" = 'Mariengrotte, Ramsen' AND "description" = '19:00 Uhr — Bezirksmaiandacht an der Mariengrotte in Ramsen; anschließend Maibowle im Pfarrheim.' AND "category" = 'bezirk' AND "published" = 1);

UPDATE "Event" SET "title" = 'Gottesdienst mit anschließendem Gemeindefest', "description" = '10:30 Uhr — Gottesdienst in der Pfarrkirche; anschließend Gemeindefest auf der Kolpingwiese (Kath. Pfarrgemeinde).', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-06-14-gottesdienst' AND "title" = 'Gottesdienst' AND "startDate" = '2026-06-14T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '10:30' AND "endTime" IS NULL AND "location" = 'Pfarrkirche' AND "description" = '10:30 Uhr — Gottesdienst in der Pfarrkirche' AND "category" = 'glaube' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_0208643dfdf62c9a6111c53f', 'reconcile-event:2026-06-14-gottesdienst:event:2026-06-14:gottesdienst-in-der-pfarrkirche', 'event', '2026-06-14-gottesdienst', 'sha256:fe30494c2b6c70b0b219d757226e1954b4e3018393a089d10887b3ec144bcb8d', 'sha256:dc2a2df46a7dd4437b21dddd797d18150782051ac7d30c09d94c474f8331ac73', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-06-14-gottesdienst' AND "title" = 'Gottesdienst mit anschließendem Gemeindefest' AND "startDate" = '2026-06-14T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '10:30' AND "endTime" IS NULL AND "location" = 'Pfarrkirche' AND "description" = '10:30 Uhr — Gottesdienst in der Pfarrkirche; anschließend Gemeindefest auf der Kolpingwiese (Kath. Pfarrgemeinde).' AND "category" = 'glaube' AND "published" = 1);

UPDATE "Event" SET "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-08-21-open-air-theater' AND "title" = 'Creepshow – Open-Air-Premiere' AND "startDate" = '2026-08-21T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_7a1ea924d2d645c633ad1768', 'reconcile-event:2026-08-21-open-air-theater:event:2026-08-21:open-air-theater', 'event', '2026-08-21-open-air-theater', 'sha256:d3e3d0154d990c0659072122fc92bb30fd50eb122a8ebf0d69c56f2ff98a2a00', 'sha256:102852e5dbaa0fe03a0e0c5302d7291c39072615ddfe1dfbfeb268fc5348b53b', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-08-21-open-air-theater' AND "title" = 'Creepshow – Open-Air-Premiere' AND "startDate" = '2026-08-21T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1);

UPDATE "Event" SET "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-08-22-creepshow-open-air-theater' AND "title" = 'Creepshow – Open-Air-Theater' AND "startDate" = '2026-08-22T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_b5ce807682bd0f2c722f472d', 'reconcile-event:2026-08-22-creepshow-open-air-theater:event:2026-08-21:open-air-theater', 'event', '2026-08-22-creepshow-open-air-theater', 'sha256:d3e3d0154d990c0659072122fc92bb30fd50eb122a8ebf0d69c56f2ff98a2a00', 'sha256:9a966b46714c39d99d4b48c0a17910b606f26dad93db8694db0bcf0c78604a0b', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-08-22-creepshow-open-air-theater' AND "title" = 'Creepshow – Open-Air-Theater' AND "startDate" = '2026-08-22T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1);

UPDATE "Event" SET "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-08-28-open-air-theater' AND "title" = 'Creepshow – Open-Air-Theater' AND "startDate" = '2026-08-28T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_6fefb92da18cf5518e486e60', 'reconcile-event:2026-08-28-open-air-theater:event:2026-08-28:open-air-theater', 'event', '2026-08-28-open-air-theater', 'sha256:accf822198528b7fe0bcb4e57aba8b727d30d5e3ebfa1de294187931935a4ed0', 'sha256:6ee2456f0d40d8ae70946117d229e438bebd95c66554d439fa43a0c526a57f03', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-08-28-open-air-theater' AND "title" = 'Creepshow – Open-Air-Theater' AND "startDate" = '2026-08-28T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1);

UPDATE "Event" SET "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-08-29-creepshow-open-air-theater' AND "title" = 'Creepshow – Open-Air-Theater' AND "startDate" = '2026-08-29T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_5a5a3e6dae94296350d1d606', 'reconcile-event:2026-08-29-creepshow-open-air-theater:event:2026-08-28:open-air-theater', 'event', '2026-08-29-creepshow-open-air-theater', 'sha256:accf822198528b7fe0bcb4e57aba8b727d30d5e3ebfa1de294187931935a4ed0', 'sha256:91ec64e87162834fbf256fdd273d6d7fe252acb9156caaa90563f1ab2108fde1', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-08-29-creepshow-open-air-theater' AND "title" = 'Creepshow – Open-Air-Theater' AND "startDate" = '2026-08-29T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '20:00' AND "endTime" IS NULL AND "location" = 'Kolpingwiese' AND "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. Eine Veranstaltung der Kolpingjugend. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)' AND "category" = 'kultur' AND "published" = 1);

UPDATE "Event" SET "title" = '„Kennst du deine Heimat“ – Besuch der Erdekaut', "location" = 'Erdekaut', "description" = '15:00 Uhr — „Kennst du deine Heimat“: Besuch der Erdekaut mit Erika Grün.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-09-05-kennst-du-deine-heimat' AND "title" = '„Kennst du deine Heimat“' AND "startDate" = '2026-09-05T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '15:00' AND "endTime" IS NULL AND "location" IS NULL AND "description" = '15:00 Uhr — „Kennst du deine Heimat“' AND "category" = 'verein' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_8b86a5ff32395a8994c3f7f7', 'reconcile-event:2026-09-05-kennst-du-deine-heimat:event:2026-09-05:kennst-du-deine-heimat-besuch-der-erdekaut-mit-erika-gruen', 'event', '2026-09-05-kennst-du-deine-heimat', 'sha256:db577fe31ea2db76146cbaff688433e4f37be48252fe0a95a0f3d1ff0f29cb67', 'sha256:06c19d0b1c5a802bde59683d8dd02df55a62a5ffad5066399e5a5b2c416ca404', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-09-05-kennst-du-deine-heimat' AND "title" = '„Kennst du deine Heimat“ – Besuch der Erdekaut' AND "startDate" = '2026-09-05T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '15:00' AND "endTime" IS NULL AND "location" = 'Erdekaut' AND "description" = '15:00 Uhr — „Kennst du deine Heimat“: Besuch der Erdekaut mit Erika Grün.' AND "category" = 'verein' AND "published" = 1);

UPDATE "Event" SET "description" = '18:00 Uhr — Musikalische Adventsandacht in der Ev. Kirche (Kath. und Evang. Pfarrgemeinde).', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-11-29-musikalische-adventsandacht' AND "title" = 'Musikalische Adventsandacht' AND "startDate" = '2026-11-29T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '18:00' AND "endTime" IS NULL AND "location" = 'Ev. Kirche' AND "description" = '18:00 Uhr — Musikalische Adventsandacht in der Ev. Kirche' AND "category" = 'glaube' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_abec515dad0f754195396097', 'reconcile-event:2026-11-29-musikalische-adventsandacht:event:2026-11-29:musikalische-adventsandacht-in-der-ev-kirche', 'event', '2026-11-29-musikalische-adventsandacht', 'sha256:79cc166985eb5c29b69129c458fd57a023b9b195adf54f8d22656c5d208ca271', 'sha256:68167af7d65fc1c41f74fb876897d3b838730c0cb7442a3de188293332382795', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-11-29-musikalische-adventsandacht' AND "title" = 'Musikalische Adventsandacht' AND "startDate" = '2026-11-29T00:00:00.000Z' AND "endDate" IS NULL AND "startTime" = '18:00' AND "endTime" IS NULL AND "location" = 'Ev. Kirche' AND "description" = '18:00 Uhr — Musikalische Adventsandacht in der Ev. Kirche (Kath. und Evang. Pfarrgemeinde).' AND "category" = 'glaube' AND "published" = 1);

UPDATE "Event" SET "title" = 'Theateraufführung (vorläufig)', "description" = 'Vorläufiger Termin: Theateraufführung der Jugend, falls 2026 ein Winterstück gespielt wird.', "published" = 0, "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = '2026-12-26-theaterauffuehrung' AND "title" = 'Theateraufführung' AND "startDate" = '2026-12-26T00:00:00.000Z' AND "endDate" = '2026-12-27T00:00:00.000Z' AND "startTime" IS NULL AND "endTime" IS NULL AND "location" IS NULL AND "description" = 'Theateraufführung' AND "category" = 'kultur' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_2259e17bbaa033e9a9208701', 'reconcile-event:2026-12-26-theaterauffuehrung:event:2026-12-26:theaterauffuehrung-sollte-es-ein-winterstueck-geben', 'event', '2026-12-26-theaterauffuehrung', 'sha256:ae22b24b75b50525cf44055393440bac9ba55d65d73a5fe8129f0a729c862adc', 'sha256:3afd765ca042170d86d3eca1ebfc9ac0c9b268ae190d16e99684fba5318303d9', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Event" WHERE "slug" = '2026-12-26-theaterauffuehrung' AND "title" = 'Theateraufführung (vorläufig)' AND "startDate" = '2026-12-26T00:00:00.000Z' AND "endDate" = '2026-12-27T00:00:00.000Z' AND "startTime" IS NULL AND "endTime" IS NULL AND "location" IS NULL AND "description" = 'Vorläufiger Termin: Theateraufführung der Jugend, falls 2026 ein Winterstück gespielt wird.' AND "category" = 'kultur' AND "published" = 0);

UPDATE "Page" SET "metaDesc" = 'Datenschutzerklärung der Kolpingsfamilie Ramsen mit Informationen zur Verarbeitung personenbezogener Daten und zu Ihren Rechten.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'datenschutz' AND "title" = 'Datenschutz' AND "content" = '## Datenschutzerklärung nach der DSGVO

## I. Name und Anschrift des Verantwortlichen

Der Verantwortliche im Sinne der Datenschutz-Grundverordnung und anderer nationaler Datenschutzgesetze der Mitgliedsstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist die:

Kolpingsfamilie Ramsen

Vertreten durch das Leitungsteam:

| Name | Anschrift |
| --- | --- |
| Heiko Schmitt-Sattler | Hauptstr. 1b, 67305 Ramsen |
| Bettina Schach | Gänsberg 32, 67305 Ramsen |
| Sebastian Sattler | Hauptstr. 1b, 67305 Ramsen |

## I. Allgemeines zur Datenverarbeitung

### 1. Umfang der Verarbeitung personenbezogener Daten

Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten unserer Nutzer erfolgt regelmäßig nur nach Einwilligung des Nutzers. Eine Ausnahme gilt in solchen Fällen, in denen eine vorherige Einholung einer Einwilligung aus tatsächlichen Gründen nicht möglich ist und die Verarbeitung der Daten durch gesetzliche Vorschriften gestattet ist.

### 1. Rechtsgrundlage für die Verarbeitung personenbezogener Daten

Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung der betroffenen Person einholen, dient Art. 6 Abs. 1 lit. a EU-Datenschutzgrundverordnung (DSGVO) als Rechtsgrundlage.

Bei der Verarbeitung von personenbezogenen Daten, die zur Erfüllung eines Vertrages, dessen Vertragspartei die betroffene Person ist, erforderlich ist, dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage. Dies gilt auch für Verarbeitungsvorgänge, die zur Durchführung vorvertraglicher Maßnahmen erforderlich sind.

Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, der unser Unternehmen unterliegt, dient Art. 6 Abs. 1 lit. c DSGVO als Rechtsgrundlage.

Für den Fall, dass lebenswichtige Interessen der betroffenen Person oder einer anderen natürlichen Person eine Verarbeitung personenbezogener Daten erforderlich machen, dient Art. 6 Abs. 1 lit. d DSGVO als Rechtsgrundlage.

Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich und überwiegen die Interessen, Grundrechte und Grundfreiheiten des Betroffenen das erstgenannte Interesse nicht, so dient Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage für die Verarbeitung.

### 2. Datenlöschung und Speicherdauer

Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch den europäischen oder nationalen Gesetzgeber in unionsrechtlichen Verordnungen, Gesetzen oder sonstigen Vorschriften, denen der Verantwortliche unterliegt, vorgesehen wurde. Eine Sperrung oder Löschung der Daten erfolgt auch dann, wenn eine durch die genannten Normen vorgeschriebene Speicherfrist abläuft, es sei denn, dass eine Erforderlichkeit zur weiteren Speicherung der Daten für einen Vertragsabschluss oder eine Vertragserfüllung besteht.

## II. Bereitstellung der Website und Erstellung von Logfiles

### 1. Beschreibung und Umfang der Datenverarbeitung

Bei jedem Aufruf unserer Internetseite erfasst unser System automatisiert Daten und Informationen vom Computersystem des aufrufenden Rechners.

Folgende Daten werden hierbei erhoben:

-   Informationen über den Browsertyp und die verwendete Version
-   Das Betriebssystem des Nutzers
-   Den Internet-Service-Provider des Nutzers
-   Die IP-Adresse des Nutzers
-   Datum und Uhrzeit des Zugriffs
-   Websites, von denen das System des Nutzers auf unsere Internetseite gelangt
-   Websites, die vom System des Nutzers über unsere Website aufgerufen werden

Die Daten werden ebenfalls in den Logfiles unseres Systems gespeichert. Eine Speicherung dieser Daten zusammen mit anderen personenbezogenen Daten des Nutzers findet nicht statt.

### 2. Rechtsgrundlage für die Datenverarbeitung

Rechtsgrundlage für die vorübergehende Speicherung der Daten und der Logfiles ist Art. 6 Abs. 1 lit. f DSGVO.

### 3. Zweck der Datenverarbeitung

Die vorübergehende Speicherung der IP-Adresse durch das System ist notwendig, um eine Auslieferung der Website an den Rechner des Nutzers zu ermöglichen. Hierfür muss die IP-Adresse des Nutzers für die Dauer der Sitzung gespeichert bleiben.

Die Speicherung in Logfiles erfolgt, um die Funktionsfähigkeit der Website sicherzustellen. Zudem dienen uns die Daten zur Optimierung der Website und zur Sicherstellung der Sicherheit unserer informationstechnischen Systeme. Eine Auswertung der Daten zu Marketingzwecken findet in diesem Zusammenhang nicht statt.

In diesen Zwecken liegt auch unser berechtigtes Interesse an der Datenverarbeitung nach Art. 6 Abs. 1 lit. f DSGVO.

### 4. Dauer der Speicherung

Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind. Im Falle der Erfassung der Daten zur Bereitstellung der Website ist dies der Fall, wenn die jeweilige Sitzung beendet ist.

Im Falle der Speicherung der Daten in Logfiles ist dies nach spätestens sieben Tagen der Fall. Eine darüberhinausgehende Speicherung ist möglich. In diesem Fall werden die IP-Adressen der Nutzer gelöscht oder verfremdet, sodass eine Zuordnung des aufrufenden Clients nicht mehr möglich ist.

### 5. Widerspruchs- und Beseitigungsmöglichkeit

Die Erfassung der Daten zur Bereitstellung der Website und die Speicherung der Daten in Logfiles ist für den Betrieb der Internetseite zwingend erforderlich. Es besteht folglich seitens des Nutzers keine Widerspruchsmöglichkeit.

## III. Verwendung von Cookies

### 1. **a) Beschreibung und Umfang der Datenverarbeitung**

Unsere Webseite verwendet Cookies. Bei Cookies handelt es sich um Textdateien, die im Internetbrowser bzw. vom Internetbrowser auf dem Computersystem des Nutzers gespeichert werden. Ruft ein Nutzer eine Website auf, so kann ein Cookie auf dem Betriebssystem des Nutzers gespeichert werden. Dieser Cookie enthält eine charakteristische Zeichenfolge, die eine eindeutige Identifizierung des Browsers beim erneuten Aufrufen der Website ermöglicht.

Wir setzen Cookies ein, um unsere Website nutzerfreundlicher zu gestalten. Einige Elemente unserer Internetseite erfordern es, dass der aufrufende Browser auch nach einem Seitenwechsel identifiziert werden kann.

Die auf diese Weise erhobenen Daten der Nutzer werden durch technische Vorkehrungen pseudonymisiert. Daher ist eine Zuordnung der Daten zum aufrufenden Nutzer nicht mehr möglich. Die Daten werden nicht gemeinsam mit sonstigen personenbezogenen Daten der Nutzer gespeichert.

### 1. **b) Rechtsgrundlage für die Datenverarbeitung**

Die Rechtsgrundlage für die Verarbeitung personenbezogener Daten unter Verwendung von Cookies ist Art. 6 Abs. 1 lit. f DSGVO.

### 1. **c) Zweck der Datenverarbeitung**

Der Zweck der Verwendung technisch notwendiger Cookies ist, die Nutzung von Websites für die Nutzer zu vereinfachen. Einige Funktionen unserer Internetseite können ohne den Einsatz von Cookies nicht angeboten werden. Für diese ist es erforderlich, dass der Browser auch nach einem Seitenwechsel wiedererkannt wird.

Die durch technisch notwendige Cookies erhobenen Nutzerdaten werden nicht zur Erstellung von Nutzerprofilen verwendet.

In diesen Zwecken liegt auch unser berechtigtes Interesse in der Verarbeitung der personenbezogenen Daten nach Art. 6 Abs. 1 lit. f DSGVO.

### 1. **e) Dauer der Speicherung, Widerspruchs- und Beseitigungsmöglichkeit**

Cookies werden auf dem Rechner des Nutzers gespeichert und von diesem an unserer Seite übermittelt. Daher haben Sie als Nutzer auch die volle Kontrolle über die Verwendung von Cookies. Durch eine Änderung der Einstellungen in Ihrem Internetbrowser können Sie die Übertragung von Cookies deaktivieren oder einschränken. Bereits gespeicherte Cookies können jederzeit gelöscht werden. Dies kann auch automatisiert erfolgen. Werden Cookies für unsere Website deaktiviert, können möglicherweise nicht mehr alle Funktionen der Website vollumfänglich genutzt werden.

## IV. Rechte der betroffenen Person

Werden personenbezogene Daten von Ihnen verarbeitet, sind Sie Betroffener i.S.d. DSGVO und es stehen Ihnen folgende Rechte gegenüber dem Verantwortlichen zu:

### 1. Auskunftsrecht

Sie können von dem Verantwortlichen eine Bestätigung darüber verlangen, ob personenbezogene Daten, die Sie betreffen, von uns verarbeitet werden.

Liegt eine solche Verarbeitung vor, können Sie von dem Verantwortlichen über folgende Informationen Auskunft verlangen:

(1)       die Zwecke, zu denen die personenbezogenen Daten verarbeitet werden;

(2)       die Kategorien von personenbezogenen Daten, welche verarbeitet werden;

(3)       die Empfänger bzw. die Kategorien von Empfängern, gegenüber denen die Sie betreffenden personenbezogenen Daten offengelegt wurden oder noch offengelegt werden;

(4)       die geplante Dauer der Speicherung der Sie betreffenden personenbezogenen Daten oder, falls konkrete Angaben hierzu nicht möglich sind, Kriterien für die Festlegung der Speicherdauer;

(5)       das Bestehen eines Rechts auf Berichtigung oder Löschung der Sie betreffenden personenbezogenen Daten, eines Rechts auf Einschränkung der Verarbeitung durch den Verantwortlichen oder eines Widerspruchsrechts gegen diese Verarbeitung;

(6)       das Bestehen eines Beschwerderechts bei einer Aufsichtsbehörde;

(7)       alle verfügbaren Informationen über die Herkunft der Daten, wenn die personenbezogenen Daten nicht bei der betroffenen Person erhoben werden;

(8)       das Bestehen einer automatisierten Entscheidungsfindung einschließlich Profiling gemäß Art. 22 Abs. 1 und 4 DSGVO und – zumindest in diesen Fällen – aussagekräftige Informationen über die involvierte Logik sowie die Tragweite und die angestrebten Auswirkungen einer derartigen Verarbeitung für die betroffene Person.

Ihnen steht das Recht zu, Auskunft darüber zu verlangen, ob die Sie betreffenden personenbezogenen Daten in ein Drittland oder an eine internationale Organisation übermittelt werden. In diesem Zusammenhang können Sie verlangen, über die geeigneten Garantien gem. Art. 46 DSGVO im Zusammenhang mit der Übermittlung unterrichtet zu werden.

### 2. Recht auf Berichtigung

Sie haben ein Recht auf Berichtigung und/oder Vervollständigung gegenüber dem Verantwortlichen, sofern die verarbeiteten personenbezogenen Daten, die Sie betreffen, unrichtig oder unvollständig sind. Der Verantwortliche hat die Berichtigung unverzüglich vorzunehmen.

### 3. Recht auf Einschränkung der Verarbeitung

Unter den folgenden Voraussetzungen können Sie die Einschränkung der Verarbeitung der Sie betreffenden personenbezogenen Daten verlangen:

(1)       wenn Sie die Richtigkeit der Sie betreffenden personenbezogenen für eine Dauer bestreiten, die es dem Verantwortlichen ermöglicht, die Richtigkeit der personenbezogenen Daten zu überprüfen;

(2)       die Verarbeitung unrechtmäßig ist und Sie die Löschung der personenbezogenen Daten ablehnen und stattdessen die Einschränkung der Nutzung der personenbezogenen Daten verlangen;

(3)       der Verantwortliche die personenbezogenen Daten für die Zwecke der Verarbeitung nicht länger benötigt, Sie diese jedoch zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigen, oder

(4)       wenn Sie Widerspruch gegen die Verarbeitung gemäß Art. 21 Abs. 1 DSGVO eingelegt haben und noch nicht fest steht, ob die berechtigten Gründe des Verantwortlichen gegenüber Ihren Gründen überwiegen.

Wurde die Verarbeitung der Sie betreffenden personenbezogenen Daten eingeschränkt, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Union oder eines Mitgliedstaats verarbeitet werden.

Wurde die Einschränkung der Verarbeitung nach den o.g. Voraussetzungen eingeschränkt, werden Sie von dem Verantwortlichen unterrichtet bevor die Einschränkung aufgehoben wird.

### 4. Recht auf Löschung

### a) Löschungspflicht

Sie können von dem Verantwortlichen verlangen, dass die Sie betreffenden personenbezogenen Daten unverzüglich gelöscht werden, und der Verantwortliche ist verpflichtet, diese Daten unverzüglich zu löschen, sofern einer der folgenden Gründe zutrifft:

(1)       Die Sie betreffenden personenbezogenen Daten sind für die Zwecke, für die sie erhoben oder auf sonstige Weise verarbeitet wurden, nicht mehr notwendig.

(2)       Sie widerrufen Ihre Einwilligung, auf die sich die Verarbeitung gem. Art. 6 Abs. 1 lit. a oder Art. 9 Abs. 2 lit. a DSGVO stützte, und es fehlt an einer anderweitigen Rechtsgrundlage für die Verarbeitung.

(3)       Sie legen gem. Art. 21 Abs. 1 DSGVO Widerspruch gegen die Verarbeitung ein und es liegen keine vorrangigen berechtigten Gründe für die Verarbeitung vor, oder Sie legen gem. Art. 21 Abs. 2 DSGVO Widerspruch gegen die Verarbeitung ein.

(4)       Die Sie betreffenden personenbezogenen Daten wurden unrechtmäßig verarbeitet.

(5)       Die Löschung der Sie betreffenden personenbezogenen Daten ist zur Erfüllung einer rechtlichen Verpflichtung nach dem Unionsrecht oder dem Recht der Mitgliedstaaten erforderlich, dem der Verantwortliche unterliegt.

(6)       Die Sie betreffenden personenbezogenen Daten wurden in Bezug auf angebotene Dienste der Informationsgesellschaft gemäß Art. 8 Abs. 1 DSGVO erhoben.

### a) Information an Dritte

Hat der Verantwortliche die Sie betreffenden personenbezogenen Daten öffentlich gemacht und ist er gem. Art. 17 Abs. 1 DSGVO zu deren Löschung verpflichtet, so trifft er unter Berücksichtigung der verfügbaren Technologie und der Implementierungskosten angemessene Maßnahmen, auch technischer Art, um für die Datenverarbeitung Verantwortliche, die die personenbezogenen Daten verarbeiten, darüber zu informieren, dass Sie als betroffene Person von ihnen die Löschung aller Links zu diesen personenbezogenen Daten oder von Kopien oder Replikationen dieser personenbezogenen Daten verlangt haben.

### b) Ausnahmen

Das Recht auf Löschung besteht nicht, soweit die Verarbeitung erforderlich ist

(1)       zur Ausübung des Rechts auf freie Meinungsäußerung und Information;

(2)       zur Erfüllung einer rechtlichen Verpflichtung, die die Verarbeitung nach dem Recht der Union oder der Mitgliedstaaten, dem der Verantwortliche unterliegt, erfordert, oder zur Wahrnehmung einer Aufgabe, die im öffentlichen Interesse liegt oder in Ausübung öffentlicher Gewalt erfolgt, die dem Verantwortlichen übertragen wurde;

(3)       aus Gründen des öffentlichen Interesses im Bereich der öffentlichen Gesundheit gemäß Art. 9 Abs. 2 lit. h und i sowie Art. 9 Abs. 3 DSGVO;

(4)       für im öffentlichen Interesse liegende Archivzwecke, wissenschaftliche oder historische Forschungszwecke oder für statistische Zwecke gem. Art. 89 Abs. 1 DSGVO, soweit das unter Abschnitt a) genannte Recht voraussichtlich die Verwirklichung der Ziele dieser Verarbeitung unmöglich macht oder ernsthaft beeinträchtigt, oder

(5)       zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.

### 5. Recht auf Unterrichtung

Haben Sie das Recht auf Berichtigung, Löschung oder Einschränkung der Verarbeitung gegenüber dem Verantwortlichen geltend gemacht, ist dieser verpflichtet, allen Empfängern, denen die Sie betreffenden personenbezogenen Daten offengelegt wurden, diese Berichtigung oder Löschung der Daten oder Einschränkung der Verarbeitung mitzuteilen, es sei denn, dies erweist sich als unmöglich oder ist mit einem unverhältnismäßigen Aufwand verbunden.

Ihnen steht gegenüber dem Verantwortlichen das Recht zu, über diese Empfänger unterrichtet zu werden.

### 6. Widerspruchsrecht

Sie haben das Recht, aus Gründen, die sich aus ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten, die aufgrund von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.

Der Verantwortliche verarbeitet die Sie betreffenden personenbezogenen Daten nicht mehr, es sei denn, er kann zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.

Werden die Sie betreffenden personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht.

Widersprechen Sie der Verarbeitung für Zwecke der Direktwerbung, so werden die Sie betreffenden personenbezogenen Daten nicht mehr für diese Zwecke verarbeitet.

Sie haben die Möglichkeit, im Zusammenhang mit der Nutzung von Diensten der Informationsgesellschaft – ungeachtet der Richtlinie 2002/58/EG – Ihr Widerspruchsrecht mittels automatisierter Verfahren auszuüben, bei denen technische Spezifikationen verwendet werden.

### 7. Recht auf Widerruf der datenschutzrechtlichen Einwilligungserklärung

Sie haben das Recht, Ihre datenschutzrechtliche Einwilligungserklärung jederzeit zu widerrufen. Durch den Widerruf der Einwilligung wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt.

### 8. Automatisierte Entscheidung im Einzelfall einschließlich Profiling

Sie haben das Recht, nicht einer ausschließlich auf einer automatisierten Verarbeitung – einschließlich Profiling – beruhenden Entscheidung unterworfen zu werden, die Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie in ähnlicher Weise erheblich beeinträchtigt. Dies gilt nicht, wenn die Entscheidung

(1)       für den Abschluss oder die Erfüllung eines Vertrags zwischen Ihnen und dem Verantwortlichen erforderlich ist,

(2)       aufgrund von Rechtsvorschriften der Union oder der Mitgliedstaaten, denen der Verantwortliche unterliegt, zulässig ist und diese Rechtsvorschriften angemessene Maßnahmen zur Wahrung Ihrer Rechte und Freiheiten sowie Ihrer berechtigten Interessen enthalten oder

(3)       mit Ihrer ausdrücklichen Einwilligung erfolgt.

Allerdings dürfen diese Entscheidungen nicht auf besonderen Kategorien personenbezogener Daten nach Art. 9 Abs. 1 DSGVO beruhen, sofern nicht Art. 9 Abs. 2 lit. a oder g DSGVO gilt und angemessene Maßnahmen zum Schutz der Rechte und Freiheiten sowie Ihrer berechtigten Interessen getroffen wurden.

Hinsichtlich der in (1) und (3) genannten Fälle trifft der Verantwortliche angemessene Maßnahmen, um die Rechte und Freiheiten sowie Ihre berechtigten Interessen zu wahren, wozu mindestens das Recht auf Erwirkung des Eingreifens einer Person seitens des Verantwortlichen, auf Darlegung des eigenen Standpunkts und auf Anfechtung der Entscheidung gehört.

### 9. Recht auf Beschwerde bei einer Aufsichtsbehörde

Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres Aufenthaltsorts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes, zu, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die DSGVO verstößt.

Die Aufsichtsbehörde, bei der die Beschwerde eingereicht wurde, unterrichtet den Beschwerdeführer über den Stand und die Ergebnisse der Beschwerde einschließlich der Möglichkeit eines gerichtlichen Rechtsbehelfs nach Art. 78 DSGVO.' AND "metaDesc" = 'Datenschutzerklärung A.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Datenschutzerklärung nach der DSGVO I.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Name und Anschrift des Verantwortlichen Der Verantwortliche im Sinne der Datenschutz-Grundver' AND "parent" IS NULL AND "sortOrder" = 50 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_10b61ab33084f8e95b5dc5f2', 'cleanup-metadata:page:datenschutz', 'page', 'datenschutz', 'sha256:66574e745b930802986779a15bad69359e8b22d5fa7e1a9e417d52eb5de59cea', 'sha256:353b2aa4ec38955ac6ca3e21bcbeda3d3b636290e93f610aad7f121d6238a51e', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'datenschutz' AND "title" = 'Datenschutz' AND "content" = '## Datenschutzerklärung nach der DSGVO

## I. Name und Anschrift des Verantwortlichen

Der Verantwortliche im Sinne der Datenschutz-Grundverordnung und anderer nationaler Datenschutzgesetze der Mitgliedsstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist die:

Kolpingsfamilie Ramsen

Vertreten durch das Leitungsteam:

| Name | Anschrift |
| --- | --- |
| Heiko Schmitt-Sattler | Hauptstr. 1b, 67305 Ramsen |
| Bettina Schach | Gänsberg 32, 67305 Ramsen |
| Sebastian Sattler | Hauptstr. 1b, 67305 Ramsen |

## I. Allgemeines zur Datenverarbeitung

### 1. Umfang der Verarbeitung personenbezogener Daten

Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten unserer Nutzer erfolgt regelmäßig nur nach Einwilligung des Nutzers. Eine Ausnahme gilt in solchen Fällen, in denen eine vorherige Einholung einer Einwilligung aus tatsächlichen Gründen nicht möglich ist und die Verarbeitung der Daten durch gesetzliche Vorschriften gestattet ist.

### 1. Rechtsgrundlage für die Verarbeitung personenbezogener Daten

Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung der betroffenen Person einholen, dient Art. 6 Abs. 1 lit. a EU-Datenschutzgrundverordnung (DSGVO) als Rechtsgrundlage.

Bei der Verarbeitung von personenbezogenen Daten, die zur Erfüllung eines Vertrages, dessen Vertragspartei die betroffene Person ist, erforderlich ist, dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage. Dies gilt auch für Verarbeitungsvorgänge, die zur Durchführung vorvertraglicher Maßnahmen erforderlich sind.

Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, der unser Unternehmen unterliegt, dient Art. 6 Abs. 1 lit. c DSGVO als Rechtsgrundlage.

Für den Fall, dass lebenswichtige Interessen der betroffenen Person oder einer anderen natürlichen Person eine Verarbeitung personenbezogener Daten erforderlich machen, dient Art. 6 Abs. 1 lit. d DSGVO als Rechtsgrundlage.

Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich und überwiegen die Interessen, Grundrechte und Grundfreiheiten des Betroffenen das erstgenannte Interesse nicht, so dient Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage für die Verarbeitung.

### 2. Datenlöschung und Speicherdauer

Die personenbezogenen Daten der betroffenen Person werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt. Eine Speicherung kann darüber hinaus erfolgen, wenn dies durch den europäischen oder nationalen Gesetzgeber in unionsrechtlichen Verordnungen, Gesetzen oder sonstigen Vorschriften, denen der Verantwortliche unterliegt, vorgesehen wurde. Eine Sperrung oder Löschung der Daten erfolgt auch dann, wenn eine durch die genannten Normen vorgeschriebene Speicherfrist abläuft, es sei denn, dass eine Erforderlichkeit zur weiteren Speicherung der Daten für einen Vertragsabschluss oder eine Vertragserfüllung besteht.

## II. Bereitstellung der Website und Erstellung von Logfiles

### 1. Beschreibung und Umfang der Datenverarbeitung

Bei jedem Aufruf unserer Internetseite erfasst unser System automatisiert Daten und Informationen vom Computersystem des aufrufenden Rechners.

Folgende Daten werden hierbei erhoben:

-   Informationen über den Browsertyp und die verwendete Version
-   Das Betriebssystem des Nutzers
-   Den Internet-Service-Provider des Nutzers
-   Die IP-Adresse des Nutzers
-   Datum und Uhrzeit des Zugriffs
-   Websites, von denen das System des Nutzers auf unsere Internetseite gelangt
-   Websites, die vom System des Nutzers über unsere Website aufgerufen werden

Die Daten werden ebenfalls in den Logfiles unseres Systems gespeichert. Eine Speicherung dieser Daten zusammen mit anderen personenbezogenen Daten des Nutzers findet nicht statt.

### 2. Rechtsgrundlage für die Datenverarbeitung

Rechtsgrundlage für die vorübergehende Speicherung der Daten und der Logfiles ist Art. 6 Abs. 1 lit. f DSGVO.

### 3. Zweck der Datenverarbeitung

Die vorübergehende Speicherung der IP-Adresse durch das System ist notwendig, um eine Auslieferung der Website an den Rechner des Nutzers zu ermöglichen. Hierfür muss die IP-Adresse des Nutzers für die Dauer der Sitzung gespeichert bleiben.

Die Speicherung in Logfiles erfolgt, um die Funktionsfähigkeit der Website sicherzustellen. Zudem dienen uns die Daten zur Optimierung der Website und zur Sicherstellung der Sicherheit unserer informationstechnischen Systeme. Eine Auswertung der Daten zu Marketingzwecken findet in diesem Zusammenhang nicht statt.

In diesen Zwecken liegt auch unser berechtigtes Interesse an der Datenverarbeitung nach Art. 6 Abs. 1 lit. f DSGVO.

### 4. Dauer der Speicherung

Die Daten werden gelöscht, sobald sie für die Erreichung des Zweckes ihrer Erhebung nicht mehr erforderlich sind. Im Falle der Erfassung der Daten zur Bereitstellung der Website ist dies der Fall, wenn die jeweilige Sitzung beendet ist.

Im Falle der Speicherung der Daten in Logfiles ist dies nach spätestens sieben Tagen der Fall. Eine darüberhinausgehende Speicherung ist möglich. In diesem Fall werden die IP-Adressen der Nutzer gelöscht oder verfremdet, sodass eine Zuordnung des aufrufenden Clients nicht mehr möglich ist.

### 5. Widerspruchs- und Beseitigungsmöglichkeit

Die Erfassung der Daten zur Bereitstellung der Website und die Speicherung der Daten in Logfiles ist für den Betrieb der Internetseite zwingend erforderlich. Es besteht folglich seitens des Nutzers keine Widerspruchsmöglichkeit.

## III. Verwendung von Cookies

### 1. **a) Beschreibung und Umfang der Datenverarbeitung**

Unsere Webseite verwendet Cookies. Bei Cookies handelt es sich um Textdateien, die im Internetbrowser bzw. vom Internetbrowser auf dem Computersystem des Nutzers gespeichert werden. Ruft ein Nutzer eine Website auf, so kann ein Cookie auf dem Betriebssystem des Nutzers gespeichert werden. Dieser Cookie enthält eine charakteristische Zeichenfolge, die eine eindeutige Identifizierung des Browsers beim erneuten Aufrufen der Website ermöglicht.

Wir setzen Cookies ein, um unsere Website nutzerfreundlicher zu gestalten. Einige Elemente unserer Internetseite erfordern es, dass der aufrufende Browser auch nach einem Seitenwechsel identifiziert werden kann.

Die auf diese Weise erhobenen Daten der Nutzer werden durch technische Vorkehrungen pseudonymisiert. Daher ist eine Zuordnung der Daten zum aufrufenden Nutzer nicht mehr möglich. Die Daten werden nicht gemeinsam mit sonstigen personenbezogenen Daten der Nutzer gespeichert.

### 1. **b) Rechtsgrundlage für die Datenverarbeitung**

Die Rechtsgrundlage für die Verarbeitung personenbezogener Daten unter Verwendung von Cookies ist Art. 6 Abs. 1 lit. f DSGVO.

### 1. **c) Zweck der Datenverarbeitung**

Der Zweck der Verwendung technisch notwendiger Cookies ist, die Nutzung von Websites für die Nutzer zu vereinfachen. Einige Funktionen unserer Internetseite können ohne den Einsatz von Cookies nicht angeboten werden. Für diese ist es erforderlich, dass der Browser auch nach einem Seitenwechsel wiedererkannt wird.

Die durch technisch notwendige Cookies erhobenen Nutzerdaten werden nicht zur Erstellung von Nutzerprofilen verwendet.

In diesen Zwecken liegt auch unser berechtigtes Interesse in der Verarbeitung der personenbezogenen Daten nach Art. 6 Abs. 1 lit. f DSGVO.

### 1. **e) Dauer der Speicherung, Widerspruchs- und Beseitigungsmöglichkeit**

Cookies werden auf dem Rechner des Nutzers gespeichert und von diesem an unserer Seite übermittelt. Daher haben Sie als Nutzer auch die volle Kontrolle über die Verwendung von Cookies. Durch eine Änderung der Einstellungen in Ihrem Internetbrowser können Sie die Übertragung von Cookies deaktivieren oder einschränken. Bereits gespeicherte Cookies können jederzeit gelöscht werden. Dies kann auch automatisiert erfolgen. Werden Cookies für unsere Website deaktiviert, können möglicherweise nicht mehr alle Funktionen der Website vollumfänglich genutzt werden.

## IV. Rechte der betroffenen Person

Werden personenbezogene Daten von Ihnen verarbeitet, sind Sie Betroffener i.S.d. DSGVO und es stehen Ihnen folgende Rechte gegenüber dem Verantwortlichen zu:

### 1. Auskunftsrecht

Sie können von dem Verantwortlichen eine Bestätigung darüber verlangen, ob personenbezogene Daten, die Sie betreffen, von uns verarbeitet werden.

Liegt eine solche Verarbeitung vor, können Sie von dem Verantwortlichen über folgende Informationen Auskunft verlangen:

(1)       die Zwecke, zu denen die personenbezogenen Daten verarbeitet werden;

(2)       die Kategorien von personenbezogenen Daten, welche verarbeitet werden;

(3)       die Empfänger bzw. die Kategorien von Empfängern, gegenüber denen die Sie betreffenden personenbezogenen Daten offengelegt wurden oder noch offengelegt werden;

(4)       die geplante Dauer der Speicherung der Sie betreffenden personenbezogenen Daten oder, falls konkrete Angaben hierzu nicht möglich sind, Kriterien für die Festlegung der Speicherdauer;

(5)       das Bestehen eines Rechts auf Berichtigung oder Löschung der Sie betreffenden personenbezogenen Daten, eines Rechts auf Einschränkung der Verarbeitung durch den Verantwortlichen oder eines Widerspruchsrechts gegen diese Verarbeitung;

(6)       das Bestehen eines Beschwerderechts bei einer Aufsichtsbehörde;

(7)       alle verfügbaren Informationen über die Herkunft der Daten, wenn die personenbezogenen Daten nicht bei der betroffenen Person erhoben werden;

(8)       das Bestehen einer automatisierten Entscheidungsfindung einschließlich Profiling gemäß Art. 22 Abs. 1 und 4 DSGVO und – zumindest in diesen Fällen – aussagekräftige Informationen über die involvierte Logik sowie die Tragweite und die angestrebten Auswirkungen einer derartigen Verarbeitung für die betroffene Person.

Ihnen steht das Recht zu, Auskunft darüber zu verlangen, ob die Sie betreffenden personenbezogenen Daten in ein Drittland oder an eine internationale Organisation übermittelt werden. In diesem Zusammenhang können Sie verlangen, über die geeigneten Garantien gem. Art. 46 DSGVO im Zusammenhang mit der Übermittlung unterrichtet zu werden.

### 2. Recht auf Berichtigung

Sie haben ein Recht auf Berichtigung und/oder Vervollständigung gegenüber dem Verantwortlichen, sofern die verarbeiteten personenbezogenen Daten, die Sie betreffen, unrichtig oder unvollständig sind. Der Verantwortliche hat die Berichtigung unverzüglich vorzunehmen.

### 3. Recht auf Einschränkung der Verarbeitung

Unter den folgenden Voraussetzungen können Sie die Einschränkung der Verarbeitung der Sie betreffenden personenbezogenen Daten verlangen:

(1)       wenn Sie die Richtigkeit der Sie betreffenden personenbezogenen für eine Dauer bestreiten, die es dem Verantwortlichen ermöglicht, die Richtigkeit der personenbezogenen Daten zu überprüfen;

(2)       die Verarbeitung unrechtmäßig ist und Sie die Löschung der personenbezogenen Daten ablehnen und stattdessen die Einschränkung der Nutzung der personenbezogenen Daten verlangen;

(3)       der Verantwortliche die personenbezogenen Daten für die Zwecke der Verarbeitung nicht länger benötigt, Sie diese jedoch zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen benötigen, oder

(4)       wenn Sie Widerspruch gegen die Verarbeitung gemäß Art. 21 Abs. 1 DSGVO eingelegt haben und noch nicht fest steht, ob die berechtigten Gründe des Verantwortlichen gegenüber Ihren Gründen überwiegen.

Wurde die Verarbeitung der Sie betreffenden personenbezogenen Daten eingeschränkt, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Union oder eines Mitgliedstaats verarbeitet werden.

Wurde die Einschränkung der Verarbeitung nach den o.g. Voraussetzungen eingeschränkt, werden Sie von dem Verantwortlichen unterrichtet bevor die Einschränkung aufgehoben wird.

### 4. Recht auf Löschung

### a) Löschungspflicht

Sie können von dem Verantwortlichen verlangen, dass die Sie betreffenden personenbezogenen Daten unverzüglich gelöscht werden, und der Verantwortliche ist verpflichtet, diese Daten unverzüglich zu löschen, sofern einer der folgenden Gründe zutrifft:

(1)       Die Sie betreffenden personenbezogenen Daten sind für die Zwecke, für die sie erhoben oder auf sonstige Weise verarbeitet wurden, nicht mehr notwendig.

(2)       Sie widerrufen Ihre Einwilligung, auf die sich die Verarbeitung gem. Art. 6 Abs. 1 lit. a oder Art. 9 Abs. 2 lit. a DSGVO stützte, und es fehlt an einer anderweitigen Rechtsgrundlage für die Verarbeitung.

(3)       Sie legen gem. Art. 21 Abs. 1 DSGVO Widerspruch gegen die Verarbeitung ein und es liegen keine vorrangigen berechtigten Gründe für die Verarbeitung vor, oder Sie legen gem. Art. 21 Abs. 2 DSGVO Widerspruch gegen die Verarbeitung ein.

(4)       Die Sie betreffenden personenbezogenen Daten wurden unrechtmäßig verarbeitet.

(5)       Die Löschung der Sie betreffenden personenbezogenen Daten ist zur Erfüllung einer rechtlichen Verpflichtung nach dem Unionsrecht oder dem Recht der Mitgliedstaaten erforderlich, dem der Verantwortliche unterliegt.

(6)       Die Sie betreffenden personenbezogenen Daten wurden in Bezug auf angebotene Dienste der Informationsgesellschaft gemäß Art. 8 Abs. 1 DSGVO erhoben.

### a) Information an Dritte

Hat der Verantwortliche die Sie betreffenden personenbezogenen Daten öffentlich gemacht und ist er gem. Art. 17 Abs. 1 DSGVO zu deren Löschung verpflichtet, so trifft er unter Berücksichtigung der verfügbaren Technologie und der Implementierungskosten angemessene Maßnahmen, auch technischer Art, um für die Datenverarbeitung Verantwortliche, die die personenbezogenen Daten verarbeiten, darüber zu informieren, dass Sie als betroffene Person von ihnen die Löschung aller Links zu diesen personenbezogenen Daten oder von Kopien oder Replikationen dieser personenbezogenen Daten verlangt haben.

### b) Ausnahmen

Das Recht auf Löschung besteht nicht, soweit die Verarbeitung erforderlich ist

(1)       zur Ausübung des Rechts auf freie Meinungsäußerung und Information;

(2)       zur Erfüllung einer rechtlichen Verpflichtung, die die Verarbeitung nach dem Recht der Union oder der Mitgliedstaaten, dem der Verantwortliche unterliegt, erfordert, oder zur Wahrnehmung einer Aufgabe, die im öffentlichen Interesse liegt oder in Ausübung öffentlicher Gewalt erfolgt, die dem Verantwortlichen übertragen wurde;

(3)       aus Gründen des öffentlichen Interesses im Bereich der öffentlichen Gesundheit gemäß Art. 9 Abs. 2 lit. h und i sowie Art. 9 Abs. 3 DSGVO;

(4)       für im öffentlichen Interesse liegende Archivzwecke, wissenschaftliche oder historische Forschungszwecke oder für statistische Zwecke gem. Art. 89 Abs. 1 DSGVO, soweit das unter Abschnitt a) genannte Recht voraussichtlich die Verwirklichung der Ziele dieser Verarbeitung unmöglich macht oder ernsthaft beeinträchtigt, oder

(5)       zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.

### 5. Recht auf Unterrichtung

Haben Sie das Recht auf Berichtigung, Löschung oder Einschränkung der Verarbeitung gegenüber dem Verantwortlichen geltend gemacht, ist dieser verpflichtet, allen Empfängern, denen die Sie betreffenden personenbezogenen Daten offengelegt wurden, diese Berichtigung oder Löschung der Daten oder Einschränkung der Verarbeitung mitzuteilen, es sei denn, dies erweist sich als unmöglich oder ist mit einem unverhältnismäßigen Aufwand verbunden.

Ihnen steht gegenüber dem Verantwortlichen das Recht zu, über diese Empfänger unterrichtet zu werden.

### 6. Widerspruchsrecht

Sie haben das Recht, aus Gründen, die sich aus ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten, die aufgrund von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling.

Der Verantwortliche verarbeitet die Sie betreffenden personenbezogenen Daten nicht mehr, es sei denn, er kann zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.

Werden die Sie betreffenden personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht.

Widersprechen Sie der Verarbeitung für Zwecke der Direktwerbung, so werden die Sie betreffenden personenbezogenen Daten nicht mehr für diese Zwecke verarbeitet.

Sie haben die Möglichkeit, im Zusammenhang mit der Nutzung von Diensten der Informationsgesellschaft – ungeachtet der Richtlinie 2002/58/EG – Ihr Widerspruchsrecht mittels automatisierter Verfahren auszuüben, bei denen technische Spezifikationen verwendet werden.

### 7. Recht auf Widerruf der datenschutzrechtlichen Einwilligungserklärung

Sie haben das Recht, Ihre datenschutzrechtliche Einwilligungserklärung jederzeit zu widerrufen. Durch den Widerruf der Einwilligung wird die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung nicht berührt.

### 8. Automatisierte Entscheidung im Einzelfall einschließlich Profiling

Sie haben das Recht, nicht einer ausschließlich auf einer automatisierten Verarbeitung – einschließlich Profiling – beruhenden Entscheidung unterworfen zu werden, die Ihnen gegenüber rechtliche Wirkung entfaltet oder Sie in ähnlicher Weise erheblich beeinträchtigt. Dies gilt nicht, wenn die Entscheidung

(1)       für den Abschluss oder die Erfüllung eines Vertrags zwischen Ihnen und dem Verantwortlichen erforderlich ist,

(2)       aufgrund von Rechtsvorschriften der Union oder der Mitgliedstaaten, denen der Verantwortliche unterliegt, zulässig ist und diese Rechtsvorschriften angemessene Maßnahmen zur Wahrung Ihrer Rechte und Freiheiten sowie Ihrer berechtigten Interessen enthalten oder

(3)       mit Ihrer ausdrücklichen Einwilligung erfolgt.

Allerdings dürfen diese Entscheidungen nicht auf besonderen Kategorien personenbezogener Daten nach Art. 9 Abs. 1 DSGVO beruhen, sofern nicht Art. 9 Abs. 2 lit. a oder g DSGVO gilt und angemessene Maßnahmen zum Schutz der Rechte und Freiheiten sowie Ihrer berechtigten Interessen getroffen wurden.

Hinsichtlich der in (1) und (3) genannten Fälle trifft der Verantwortliche angemessene Maßnahmen, um die Rechte und Freiheiten sowie Ihre berechtigten Interessen zu wahren, wozu mindestens das Recht auf Erwirkung des Eingreifens einer Person seitens des Verantwortlichen, auf Darlegung des eigenen Standpunkts und auf Anfechtung der Entscheidung gehört.

### 9. Recht auf Beschwerde bei einer Aufsichtsbehörde

Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres Aufenthaltsorts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes, zu, wenn Sie der Ansicht sind, dass die Verarbeitung der Sie betreffenden personenbezogenen Daten gegen die DSGVO verstößt.

Die Aufsichtsbehörde, bei der die Beschwerde eingereicht wurde, unterrichtet den Beschwerdeführer über den Stand und die Ergebnisse der Beschwerde einschließlich der Möglichkeit eines gerichtlichen Rechtsbehelfs nach Art. 78 DSGVO.' AND "metaDesc" = 'Datenschutzerklärung der Kolpingsfamilie Ramsen mit Informationen zur Verarbeitung personenbezogener Daten und zu Ihren Rechten.' AND "parent" IS NULL AND "sortOrder" = 50 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Impressum der Kolpingsfamilie Ramsen mit Anschrift, Kontakt und rechtlichen Hinweisen.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'impressum' AND "title" = 'Impressum' AND "content" = '# Impressum

Kolpingsfamilie Ramsen

Vertreten durch

Heiko Schmitt-Sattler
Hauptstr. 1b
67305 Ramsen
Telefon: 06351-43867
E-Mail: [kolping-ramsen@gmx.de](mailto:kolping-ramsen@gmx.de)

Internet: [kolping-ramsen.logge.top](https://kolping-ramsen.logge.top)

Gestaltung der Webseite: Steffen Rörig;       Betreuung der Webseite: Wolfgang Rörig

Wir sind bemüht im Rahmen des Zumutbaren, auf dieser Website richtige und vollständige Informationen zur Verfügung zu stellen. Wir übernehmen jedoch keine Haftung oder Garantie für die Aktualität, Richtigkeit und Vollständigkeit der auf dieser Website bereitgestellten Informationen. Insbesondere gilt dies auch für alle Verbindungen ("Links"), auf welche diese Website direkt oder indirekt verweist. Für den Inhalt einer über einen solchen Link erreichten Seite wird keine Verantwortung übernommen.

Wir behalten uns das Recht vor, jederzeit und ohne vorherige Ankündigung Änderungen oder Ergänzungen der bereitgestellten Informationen vorzunehmen.

Der Inhalt dieser Website ist urheberrechtlich geschützt. Wir gewähren Ihnen jedoch das Recht, den auf dieser Website bereitgestellten Text ganz oder Ausschnittweise zu speichern und / oder zu vervielfältigen. Aus Gründen des Urheberrechts ist allerdings die Speicherung und Vervielfältigung von Bildmaterial und / oder Grafiken aus dieser Website nicht gestattet, soweit es nicht ausdrücklich zu diesen Zwecken zur Verfügung gestellt wird.

Wir haften nicht für direkte oder indirekte Schäden, einschließlich des entgangenen Gewinns, die aufgrund von oder in Verbindung mit Informationen entstehen, die auf dieser Seite bereitgehalten werden.

[Datenschutz](/datenschutz)
' AND "metaDesc" = 'Impressum Kolpingsfamilie Ramsen Vertreten durch Heiko Schmitt-Sattler Hauptstr. 1b 67305 Ramsen Telefon: 06351-43867 E-Mail: kolping-ramsen Diese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein. In' AND "parent" IS NULL AND "sortOrder" = 190 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_b0e92dac1d93c55c44b21835', 'cleanup-metadata:page:impressum', 'page', 'impressum', 'sha256:d888964f3db1202cdc6b42264de671cdccc657eee346b9225da827b3fe8a0adb', 'sha256:4935b347f8a7c4bc0ff0e7c6947878e8890fab57b71b1f12f3b36d57e459d01c', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'impressum' AND "title" = 'Impressum' AND "content" = '# Impressum

Kolpingsfamilie Ramsen

Vertreten durch

Heiko Schmitt-Sattler
Hauptstr. 1b
67305 Ramsen
Telefon: 06351-43867
E-Mail: [kolping-ramsen@gmx.de](mailto:kolping-ramsen@gmx.de)

Internet: [kolping-ramsen.logge.top](https://kolping-ramsen.logge.top)

Gestaltung der Webseite: Steffen Rörig;       Betreuung der Webseite: Wolfgang Rörig

Wir sind bemüht im Rahmen des Zumutbaren, auf dieser Website richtige und vollständige Informationen zur Verfügung zu stellen. Wir übernehmen jedoch keine Haftung oder Garantie für die Aktualität, Richtigkeit und Vollständigkeit der auf dieser Website bereitgestellten Informationen. Insbesondere gilt dies auch für alle Verbindungen ("Links"), auf welche diese Website direkt oder indirekt verweist. Für den Inhalt einer über einen solchen Link erreichten Seite wird keine Verantwortung übernommen.

Wir behalten uns das Recht vor, jederzeit und ohne vorherige Ankündigung Änderungen oder Ergänzungen der bereitgestellten Informationen vorzunehmen.

Der Inhalt dieser Website ist urheberrechtlich geschützt. Wir gewähren Ihnen jedoch das Recht, den auf dieser Website bereitgestellten Text ganz oder Ausschnittweise zu speichern und / oder zu vervielfältigen. Aus Gründen des Urheberrechts ist allerdings die Speicherung und Vervielfältigung von Bildmaterial und / oder Grafiken aus dieser Website nicht gestattet, soweit es nicht ausdrücklich zu diesen Zwecken zur Verfügung gestellt wird.

Wir haften nicht für direkte oder indirekte Schäden, einschließlich des entgangenen Gewinns, die aufgrund von oder in Verbindung mit Informationen entstehen, die auf dieser Seite bereitgehalten werden.

[Datenschutz](/datenschutz)
' AND "metaDesc" = 'Impressum der Kolpingsfamilie Ramsen mit Anschrift, Kontakt und rechtlichen Hinweisen.' AND "parent" IS NULL AND "sortOrder" = 190 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Unser Gründungsmitglied Hans Kirchner ist verstorben. Der Pressebeitrag erschien am 19. Januar 2025.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/presse/kirchner-hans' AND "title" = 'Nachruf auf Hans Kirchner' AND "content" = 'Unser Gründungsmitglied Hans Kirchner ist verstorben. Der Pressebeitrag erschien am 19. Januar 2025.

![Kirchner Hans 2025 01](/images/legacy-v2/a2/a25625d5bad67afa0001fc6d4115f906-w1600-q78.webp)' AND "metaDesc" = 'Pressebeitrag aus unserem Archiv vom 19. Januar 2025.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 450 AND "archiveDate" = '2025-01-19T00:00:00.000Z' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_6555f3f2439e63d11d6b96de', 'cleanup-metadata:page:rueckblick/presse/kirchner-hans', 'page', 'rueckblick/presse/kirchner-hans', 'sha256:cf81daddeab331783a0b9e376e8da958b76f966e28b35adbd7f9d77c9adf6f99', 'sha256:648010710165f356a842c4f381870265c558a78689e910c96f01009d6f4e7eaf', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/presse/kirchner-hans' AND "title" = 'Nachruf auf Hans Kirchner' AND "content" = 'Unser Gründungsmitglied Hans Kirchner ist verstorben. Der Pressebeitrag erschien am 19. Januar 2025.

![Kirchner Hans 2025 01](/images/legacy-v2/a2/a25625d5bad67afa0001fc6d4115f906-w1600-q78.webp)' AND "metaDesc" = 'Unser Gründungsmitglied Hans Kirchner ist verstorben. Der Pressebeitrag erschien am 19. Januar 2025.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 450 AND "archiveDate" = '2025-01-19T00:00:00.000Z' AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Rheinpfalz-Artikel vom Montag, 30. Dezember 2024 über das Kolping-Kreativtheater.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/presse/kreativtheater2024-02' AND "title" = 'Kreativbühne 2024 – Pressebericht vom 30. Dezember' AND "content" = 'Rheinpfalz-Artikel vom Montag, 30. Dezember 2024 über das Kolping-Kreativtheater.

![Kreativtheater 2024 02](/images/legacy-v2/bd/bd915248c84e30a6d6cd5f99be75878f-w1600-q78.webp)' AND "metaDesc" = 'Pressebeitrag aus unserem Archiv vom 30. Dezember 2024.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 380 AND "archiveDate" = '2024-12-30T00:00:00.000Z' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_94961ebd844152223167e9d7', 'cleanup-metadata:page:rueckblick/presse/kreativtheater2024-02', 'page', 'rueckblick/presse/kreativtheater2024-02', 'sha256:8cea78a43f3413e5284d90a123f8770608d9022f246022d55c99c17fb5d2fcae', 'sha256:b84d638172122bdb6ba24138c57d46c9ff595a9f70b5d4b5520b37d3f86fd7fd', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/presse/kreativtheater2024-02' AND "title" = 'Kreativbühne 2024 – Pressebericht vom 30. Dezember' AND "content" = 'Rheinpfalz-Artikel vom Montag, 30. Dezember 2024 über das Kolping-Kreativtheater.

![Kreativtheater 2024 02](/images/legacy-v2/bd/bd915248c84e30a6d6cd5f99be75878f-w1600-q78.webp)' AND "metaDesc" = 'Rheinpfalz-Artikel vom Montag, 30. Dezember 2024 über das Kolping-Kreativtheater.' AND "parent" = 'rueckblick/presse' AND "sortOrder" = 380 AND "archiveDate" = '2024-12-30T00:00:00.000Z' AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Am 6. Januar 2021 wurde ein Fastnachtsvideo der Kolpingjugend mit Beiträgen verschiedener Ramser Gruppen online gezeigt.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/prunksitzung/prunksitzung2021' AND "title" = 'Digitale Ramser Fastnacht 2021' AND "content" = 'Am 6. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt.

Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube gezeigt.

Viele positive Rückmeldungen gingen bei uns ein. Die weitesten aus Enschede/ Niederlande, Almaty/ Kasachstan und Belleville, Illinois USA.

[https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s](https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s)

 ![Plakat Prunk 2021](/images/legacy-v2/45/455c9d0e2bb9fb3fb089373548a550c0-w1600-q78.webp)' AND "metaDesc" = 'Am Samstag, 06. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt. Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube ge' AND "parent" = 'rueckblick/prunksitzung' AND "sortOrder" = 30 AND "archiveDate" = '2021-02-07T00:00:00.000Z' AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_0b2a1249d0e74115a6d3d12e', 'cleanup-metadata:page:rueckblick/prunksitzung/prunksitzung2021', 'page', 'rueckblick/prunksitzung/prunksitzung2021', 'sha256:868cbc9703fb7c98d1f8877b8422c766d2a0b72c3e93b36d1d369deb8aacd511', 'sha256:943c26fc9fa31e884ac5db56bca5c22e9f2918a33716871ede49e3eea97638fe', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/prunksitzung/prunksitzung2021' AND "title" = 'Digitale Ramser Fastnacht 2021' AND "content" = 'Am 6. Januar 2021 wurde ein Faschings - Video mit Coronaregeln, auf Abstand ausgestrahlt.

Die Kolpingjugend hat in Zusammenarbeit mit verschiedenen Gruppierungen aus dem Vereinsleben in Ramsen, ein Video gedreht und auf YouTube gezeigt.

Viele positive Rückmeldungen gingen bei uns ein. Die weitesten aus Enschede/ Niederlande, Almaty/ Kasachstan und Belleville, Illinois USA.

[https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s](https://www.youtube.com/watch?v=3JxWq-LC42U&t=8s)

 ![Plakat Prunk 2021](/images/legacy-v2/45/455c9d0e2bb9fb3fb089373548a550c0-w1600-q78.webp)' AND "metaDesc" = 'Am 6. Januar 2021 wurde ein Fastnachtsvideo der Kolpingjugend mit Beiträgen verschiedener Ramser Gruppen online gezeigt.' AND "parent" = 'rueckblick/prunksitzung' AND "sortOrder" = 30 AND "archiveDate" = '2021-02-07T00:00:00.000Z' AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Reisehistorie der Kolpingsfamilie Ramsen von 1979 bis 2023. Seit 2024 werden keine Reisen mehr angeboten.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/staedtereisen' AND "title" = 'Städtereisen' AND "content" = '## Reisehistorie der Kolpingsfamilie Ramsen seit 1979

| Zeitraum | Reiseziel |
| --- | --- |
| 08.04. - 14. April 1979 | Busreise nach Wien/ Österreich |
| 10.10. - 16. Okt. 1981 | Busreise nach Berlin |
| 30.10. - 05. Nov. 1983 | Busreise nach Paris/ Frankreich |
| 18.10. - 24. Okt. 1986 | Busreise nach Prag/ Tschechoslowakei |
| 15.10. - 21. Okt. 1988 | Busreise nach Budapest/ Ungarn |
| 13.10. - 21. Okt. 1990 | Busreise nach Rom/ Italien |
| 16.10. - 24. Okt. 1992 | Busreise nach London/ Großbritanien |
| 21.10. - 24. Okt. 1993 | Busreise nach Dresden - Sächsische Schweiz |
| 14.10. - 23. Okt. 1994 | Flugreise nach Madrid/ Spanien |
| 07.04. - 09. April 1995 | Michelau/ Steigerwald |
| 17.03. - 22. März 1996 | Busreise nach Wien/ Österreich |
| 12.10. - 19. Okt. 1996 | Busreise nach Kopenhagen/ Dänemark |
| 17.10. - 23. Okt. 1998 | Flugreise nach Lissabon/ Portugal |
| 06.10. – 09. Okt. 1999 | Busreise nach Storkow(Brandenburg), Berlin, Frankf. (Oder), Spreewald |
| 07.10. – 13. Okt. 2000 | Flug/ Busreise nach Dublin/ Irland und Belfast/Nordirland |
| 06.10. – 12. Okt. 2001 | Busreise nach Salem/ Mecklenburg-Vorp., Schwerin, Rostock, Rügen |
| 28.10. – 05. Okt. 2002 | Flug/ Busreise nach Moskau und St. Petersburg/ Russland |
| 24.10. – 30. Okt. 2003 | Busreise nach Berlin |
| 16.10. – 24. Okt. 2004 | Flug/ Busreise nach Athen/ Griechenland - Rundreise |
| 22.10. – 28. Okt. 2005 | Busreise nach Thüringen und Harz |
| 07.10. - 15. Okt. 2006 | Busreise nach Polen - Rundreise |
| 06.10. - 12. Okt. 2007 | Busreise nach Erzgebirge - Silberstrasse |
| 04.10. - 10. Okt. 2008 | Flug/ Busreise nach Oslo; Stockholm & Helsinki |
| 11.10. - 16. Okt. 2009 | Busreise nach Leipzig und Umgebung |
| 10.10. - 17. Okt. 2010 | Flug/ Busreise ins Baltikum: Vilnius; Riga; Tallinn |
| 06.10. - 13.Okt. 2012 | Flug/ Busreise nach Kroatien |
| 21.05. - 26. Mai 2013 | Busreise nach Lam/ Lambach 1 Bayerischer Wald |
| 17.10. - 24. Okt. 2014 | Flug/ Busreise nach Andalusien & Gibraltar |
| 09.10. - 16. Okt. 2016 | Flug/ Busreise nach Sizilien |
| 29.09. - 07. Okt. 2018 | Flug/ Busreise nach Rumänien |
| 10.10. - 15. Okt.2020 | Busreise - Nordfrankriech abgesagt - Als Ersatzreise - Ostfriesland (Emden, Leer, Baltrum usw) |
| 11.09. - 18. Sept. 2021 | Flug/ Busreise nach Norwegen |
| 03.11. - 07. Nov. 2021 | Busreise - Nordfrankreich |
| 17.10. - 23. Okt. 2022 | Busreise - Belgien |
| 27.09 - 01. Okt. 2023 | Busreise - Champagne |

> Ab 2024 werden keine Reisen mehr angeboten, da das Interesse von Vereinsmitgliedern sehr schwach war.' AND "metaDesc" = 'Reisen Historie der Kolpingsfamlie Ramsen seit 1979 08.04. - 14. April 1979&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Busreise nach Wien/ Österreich 10.10. ' AND "parent" IS NULL AND "sortOrder" = 420 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_063b4e43da5061e7f4f4fb0d', 'cleanup-metadata:page:rueckblick/staedtereisen', 'page', 'rueckblick/staedtereisen', 'sha256:b06fa9338f3e6edec596604aa3ee9d37964ea0a91074dd3571f0ef7dd3545cdf', 'sha256:fbee9c3faac6e5995da3052449ccff2962a5e5eb83d056404ef107b1800f3a1f', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/staedtereisen' AND "title" = 'Städtereisen' AND "content" = '## Reisehistorie der Kolpingsfamilie Ramsen seit 1979

| Zeitraum | Reiseziel |
| --- | --- |
| 08.04. - 14. April 1979 | Busreise nach Wien/ Österreich |
| 10.10. - 16. Okt. 1981 | Busreise nach Berlin |
| 30.10. - 05. Nov. 1983 | Busreise nach Paris/ Frankreich |
| 18.10. - 24. Okt. 1986 | Busreise nach Prag/ Tschechoslowakei |
| 15.10. - 21. Okt. 1988 | Busreise nach Budapest/ Ungarn |
| 13.10. - 21. Okt. 1990 | Busreise nach Rom/ Italien |
| 16.10. - 24. Okt. 1992 | Busreise nach London/ Großbritanien |
| 21.10. - 24. Okt. 1993 | Busreise nach Dresden - Sächsische Schweiz |
| 14.10. - 23. Okt. 1994 | Flugreise nach Madrid/ Spanien |
| 07.04. - 09. April 1995 | Michelau/ Steigerwald |
| 17.03. - 22. März 1996 | Busreise nach Wien/ Österreich |
| 12.10. - 19. Okt. 1996 | Busreise nach Kopenhagen/ Dänemark |
| 17.10. - 23. Okt. 1998 | Flugreise nach Lissabon/ Portugal |
| 06.10. – 09. Okt. 1999 | Busreise nach Storkow(Brandenburg), Berlin, Frankf. (Oder), Spreewald |
| 07.10. – 13. Okt. 2000 | Flug/ Busreise nach Dublin/ Irland und Belfast/Nordirland |
| 06.10. – 12. Okt. 2001 | Busreise nach Salem/ Mecklenburg-Vorp., Schwerin, Rostock, Rügen |
| 28.10. – 05. Okt. 2002 | Flug/ Busreise nach Moskau und St. Petersburg/ Russland |
| 24.10. – 30. Okt. 2003 | Busreise nach Berlin |
| 16.10. – 24. Okt. 2004 | Flug/ Busreise nach Athen/ Griechenland - Rundreise |
| 22.10. – 28. Okt. 2005 | Busreise nach Thüringen und Harz |
| 07.10. - 15. Okt. 2006 | Busreise nach Polen - Rundreise |
| 06.10. - 12. Okt. 2007 | Busreise nach Erzgebirge - Silberstrasse |
| 04.10. - 10. Okt. 2008 | Flug/ Busreise nach Oslo; Stockholm & Helsinki |
| 11.10. - 16. Okt. 2009 | Busreise nach Leipzig und Umgebung |
| 10.10. - 17. Okt. 2010 | Flug/ Busreise ins Baltikum: Vilnius; Riga; Tallinn |
| 06.10. - 13.Okt. 2012 | Flug/ Busreise nach Kroatien |
| 21.05. - 26. Mai 2013 | Busreise nach Lam/ Lambach 1 Bayerischer Wald |
| 17.10. - 24. Okt. 2014 | Flug/ Busreise nach Andalusien & Gibraltar |
| 09.10. - 16. Okt. 2016 | Flug/ Busreise nach Sizilien |
| 29.09. - 07. Okt. 2018 | Flug/ Busreise nach Rumänien |
| 10.10. - 15. Okt.2020 | Busreise - Nordfrankriech abgesagt - Als Ersatzreise - Ostfriesland (Emden, Leer, Baltrum usw) |
| 11.09. - 18. Sept. 2021 | Flug/ Busreise nach Norwegen |
| 03.11. - 07. Nov. 2021 | Busreise - Nordfrankreich |
| 17.10. - 23. Okt. 2022 | Busreise - Belgien |
| 27.09 - 01. Okt. 2023 | Busreise - Champagne |

> Ab 2024 werden keine Reisen mehr angeboten, da das Interesse von Vereinsmitgliedern sehr schwach war.' AND "metaDesc" = 'Reisehistorie der Kolpingsfamilie Ramsen von 1979 bis 2023. Seit 2024 werden keine Reisen mehr angeboten.' AND "parent" IS NULL AND "sortOrder" = 420 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Geschichte der Volkstanz- und Trachtengruppe der Kolpingsfamilie Ramsen, die im Juni 2021 offiziell aufgelöst wurde.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'rueckblick/trachtengruppe' AND "title" = 'Trachtengruppe' AND "content" = '## Die Volkstanz & Trachtengruppe der Kolpingsfamilie Ramsen

### (Wurde im Juni 2021 offiziell aufgelöst)

![TRACHTEN 2](/images/imported/rueckblick/TRACHTEN_2.jpg)' AND "metaDesc" = 'Die Volkstanz &amp; Trachtengruppe der Kolpingsfamilie Ramsen (Wurde im Juni 2021 offiziell aufgelöst) &nbsp; &nbsp;' AND "parent" IS NULL AND "sortOrder" = 440 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_11d9f573f0fe39a281178c48', 'cleanup-metadata:page:rueckblick/trachtengruppe', 'page', 'rueckblick/trachtengruppe', 'sha256:c5a559376ecfbeb336a7fe2095007017c8c1688a8065d864fe48ce67119e0799', 'sha256:34325e22945e6057ff425c71671a153cdf2e84f32be52903c5a6bf6061893154', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'rueckblick/trachtengruppe' AND "title" = 'Trachtengruppe' AND "content" = '## Die Volkstanz & Trachtengruppe der Kolpingsfamilie Ramsen

### (Wurde im Juni 2021 offiziell aufgelöst)

![TRACHTEN 2](/images/imported/rueckblick/TRACHTEN_2.jpg)' AND "metaDesc" = 'Geschichte der Volkstanz- und Trachtengruppe der Kolpingsfamilie Ramsen, die im Juni 2021 offiziell aufgelöst wurde.' AND "parent" IS NULL AND "sortOrder" = 440 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Stationen im Leben und Wirken Adolph Kolpings von seiner Geburt 1813 bis zur Seligsprechung 1991.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'ueber-uns/adolf-kolping' AND "title" = 'Adolf Kolping' AND "content" = '# Das Leben und wirken Adolf Kolpings

### Adolph Kolping (1813 - 1865)

am 8.12.1813 Geburt in Kerpen bei Köln

von 1820 bis 1826 Besuch der Volksschule

von 1826 bis 1837 Lehre und Gesellenzeit als Schuhmacher

von 1837 bis 1841 Schüler des Marzellengymnasiums in Köln

von 1841 bis 1842 Studium an der Universität München

von 1842 bis 1844 Studium an der Universtität Bonn

von 1844 bis 1845 Priesterseminar in Köln

am 13.4.1845 Priesterweihe in der Minoritenkirche

von 1845 bis 1849 Kaplan und Religionslehrer in Elberfeld

am 7.1847 (Zweiter) Präses des 1846 gegründeten Gesellenvereins in Elberfeld

am 1.4.1849 Domvikar in Köln

am 6.5.1849 Gründung des Kölner Gesellenvereins

am 1.1.1862 Rektor der Minoritenkirche

am 22.4.1862 Päpstlicher Geheimkämmerer

am 4.12.1865 Todestag

am 30.4.1866 Überführung der Gebeine in die Minoritenkirche

am 27.10.1991 Seligsprechung in Rom

Adolph Kolping wurde am 8. Dezember 1813 in Kerpen bei Köln geboren. Als viertes Kind eines Schäfers wuchs er in sehr bescheidenen Lebensverhältnissen auf. Da die familiären Verhältnisse den Erwerb einer höhereren Bildung, trotz Eignung und Neigung, nicht zuließen, besuchte Adolph Kolping die Volksschule. Danach erlernte er das Schuhmacherhandwerk und war insgesamt zehn Jahre lang in diesem Beruf tätig. Mehr und mehr setzte sich bei ihm der Wunsch durch, die als sehr unbefriedigend empfundenen Lebensverhältnisse aufzugeben. Im Alter von 23 Jahren wagte er den entscheidenden Schritt: Kolping gab seinen Beruf auf und wurde wieder Schüler auf dem Marzellengymnasium in Köln. Die Schule absolvierte er mit ungeheurer Energie in der kürzestmöglichen Zeit. Dabei war er durch Krankheit und die notwendige Sorge um den eigenen Lebensunterhalt stark in Anspruch genommen. In diesen Jahren entschloss sich Kolping Priester werden zu wollen. Im Sommer 1841 begann er sein theologisches Studium in München, das er später an der Bonner Universität und im Kölner Priesterseminar fortsetzte. Die Priesterweihe empfing Adolph Kolping am 13. 4. 1845 in der Kölner Minoritenkirche.

### Kaplan in Elberfeld

Seine erste Stelle erhielt Kolping 1845 als Kaplan in Elberfeld. Hier lernte er den katholischen Jünglingsverein kennen, der 1846 mit tatkräftiger Hilfe des Lehrers Johann Gregor Breuer entstanden war. 1847 wählte der Verein Kolping zu seinem Präses. Im Jünglingsverein (später in katholischer Gesellenverein umbenannt) kamen junge Menschen, zumeist Handwerksgesellen, zu gemeinsamem Tun im geselligen Bereich wie auch zu gemeinsamer Bildungsarbeit, zusammen. Hier fand Kolping seine eigentliche Lebensaufgabe. Nachdem er lange Zeit mit dem Gedanken gespielt hatte, wissenschaftlich tätig zu werden, erkannte er in dem Wirken mit und für diese jungen Menschen seine eigentliche Berufung. Da er selbst lange Jahre Geselle gewesen und daher mit den Problemen dieser Menschen vertraut war, widmete sich fortan in erster Linie dem Wirken an dieser Sache.

### Kolping der Volksschriftsteller

Im Jahre 1849 kam Kolping nach Köln. Als Domvikar blieb ihm Zeit, sich durch beispielhaftes Tun, Reisen und geschriebenes Wort für die Ausbreitung des katholischen Gesellenvereins zu engagieren.
Daneben erwarb er sich als Publizist und Volksschriftsteller breite Anerkennung in weiten Kreisen der katholischen Bevölkerung. Kolpings Wirken war erfolgreich. Nach den ersten journalistischen Aktivitäten des Studenten Adolph Kolping begann das regelmäßige publizistische Wirken mit der Übernahme der Redaktion des „Rheinischen Kirchenblattes“ zu Beginn des Jahres 1850. Zum 1. April 1854 verließ er die Zeitung, um als Herausgeber und Redakteur seiner eigenen „Rheinischen Volksblätter“ zu wirken, die er bis zu seinem Tode 1865 betreute. Als besondere Organe für den Gesellenverein wurden zwischen 1850 und 1854 die Beilagen „Vereinsorgan“ und „Feierstunde“ zum "Rheinischen Kirchenblatt" herausgegeben. Ab 1863 publizierte Kolping die "Mittheilungen für die Vorsteher der Katholischen Gesellenvereine". Kolping veröffentlichte dazu seit 1850 jährlich einen Volkskalender, dessen größere Beiträge, „Volkserzählungen", zum überwiegenden Teil aus seiner eigenen Feder stammten.

### Das Werk weitet sich aus

In den wenigen Jahren, die ihm noch beschieden waren, weitete sich das Werk ständig aus. Im Jahre 1865 gab es bereits über 400 Gesellenvereine in zahlreichen Ländern Europas und in Übersee. Kolping selbst, seit 1862 Rektor der Kölner Minoritenkirche, nahm bei seinem rastlosen Wirken in den verschiedensten Bereichen keine Rücksicht auf die eigene Gesundheit. 1850 wurde er durch den Kölner Erzbischof zum Apostolischen Notar ernannt; 1862 erfolgte durch Papst Pius IX. die Ernennung zum päpstlichen Geheimkämmerer.
Der unermüdliche Einsatz zehrte die Kräfte Adolph Kolpings frühzeitig auf; noch nicht 52-jährig, starb er am 4. Dezember 1865. Auf seinen eigenen Wunsch wurde Adolph Kolping in der Kölner Minoritenkirche beigesetzt (1866).
' AND "metaDesc" = 'Details Veröffentlicht: 03. Juli 2019 Zugriffe: 1146 Das Leben und wirken Adolf Kolpings Adolph Kolping (1813 - 1865) am 8.12.1813 Geburt in Kerpen bei Köln von 1820 bis 1826 Besuch der Volksschule von 1826 bis 1837 Lehre und Gesellenzeit a' AND "parent" IS NULL AND "sortOrder" = 20 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_c41704b919b8ef11ca37b89e', 'cleanup-metadata:page:ueber-uns/adolf-kolping', 'page', 'ueber-uns/adolf-kolping', 'sha256:0366c09e1f5eda8abd65174458c17849a347d2268c8970bd8349d95fe3b93691', 'sha256:02b1e643b01133083e8d70ea6d2ce2ccddda74e7b0e6699f55d5381b73461230', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'ueber-uns/adolf-kolping' AND "title" = 'Adolf Kolping' AND "content" = '# Das Leben und wirken Adolf Kolpings

### Adolph Kolping (1813 - 1865)

am 8.12.1813 Geburt in Kerpen bei Köln

von 1820 bis 1826 Besuch der Volksschule

von 1826 bis 1837 Lehre und Gesellenzeit als Schuhmacher

von 1837 bis 1841 Schüler des Marzellengymnasiums in Köln

von 1841 bis 1842 Studium an der Universität München

von 1842 bis 1844 Studium an der Universtität Bonn

von 1844 bis 1845 Priesterseminar in Köln

am 13.4.1845 Priesterweihe in der Minoritenkirche

von 1845 bis 1849 Kaplan und Religionslehrer in Elberfeld

am 7.1847 (Zweiter) Präses des 1846 gegründeten Gesellenvereins in Elberfeld

am 1.4.1849 Domvikar in Köln

am 6.5.1849 Gründung des Kölner Gesellenvereins

am 1.1.1862 Rektor der Minoritenkirche

am 22.4.1862 Päpstlicher Geheimkämmerer

am 4.12.1865 Todestag

am 30.4.1866 Überführung der Gebeine in die Minoritenkirche

am 27.10.1991 Seligsprechung in Rom

Adolph Kolping wurde am 8. Dezember 1813 in Kerpen bei Köln geboren. Als viertes Kind eines Schäfers wuchs er in sehr bescheidenen Lebensverhältnissen auf. Da die familiären Verhältnisse den Erwerb einer höhereren Bildung, trotz Eignung und Neigung, nicht zuließen, besuchte Adolph Kolping die Volksschule. Danach erlernte er das Schuhmacherhandwerk und war insgesamt zehn Jahre lang in diesem Beruf tätig. Mehr und mehr setzte sich bei ihm der Wunsch durch, die als sehr unbefriedigend empfundenen Lebensverhältnisse aufzugeben. Im Alter von 23 Jahren wagte er den entscheidenden Schritt: Kolping gab seinen Beruf auf und wurde wieder Schüler auf dem Marzellengymnasium in Köln. Die Schule absolvierte er mit ungeheurer Energie in der kürzestmöglichen Zeit. Dabei war er durch Krankheit und die notwendige Sorge um den eigenen Lebensunterhalt stark in Anspruch genommen. In diesen Jahren entschloss sich Kolping Priester werden zu wollen. Im Sommer 1841 begann er sein theologisches Studium in München, das er später an der Bonner Universität und im Kölner Priesterseminar fortsetzte. Die Priesterweihe empfing Adolph Kolping am 13. 4. 1845 in der Kölner Minoritenkirche.

### Kaplan in Elberfeld

Seine erste Stelle erhielt Kolping 1845 als Kaplan in Elberfeld. Hier lernte er den katholischen Jünglingsverein kennen, der 1846 mit tatkräftiger Hilfe des Lehrers Johann Gregor Breuer entstanden war. 1847 wählte der Verein Kolping zu seinem Präses. Im Jünglingsverein (später in katholischer Gesellenverein umbenannt) kamen junge Menschen, zumeist Handwerksgesellen, zu gemeinsamem Tun im geselligen Bereich wie auch zu gemeinsamer Bildungsarbeit, zusammen. Hier fand Kolping seine eigentliche Lebensaufgabe. Nachdem er lange Zeit mit dem Gedanken gespielt hatte, wissenschaftlich tätig zu werden, erkannte er in dem Wirken mit und für diese jungen Menschen seine eigentliche Berufung. Da er selbst lange Jahre Geselle gewesen und daher mit den Problemen dieser Menschen vertraut war, widmete sich fortan in erster Linie dem Wirken an dieser Sache.

### Kolping der Volksschriftsteller

Im Jahre 1849 kam Kolping nach Köln. Als Domvikar blieb ihm Zeit, sich durch beispielhaftes Tun, Reisen und geschriebenes Wort für die Ausbreitung des katholischen Gesellenvereins zu engagieren.
Daneben erwarb er sich als Publizist und Volksschriftsteller breite Anerkennung in weiten Kreisen der katholischen Bevölkerung. Kolpings Wirken war erfolgreich. Nach den ersten journalistischen Aktivitäten des Studenten Adolph Kolping begann das regelmäßige publizistische Wirken mit der Übernahme der Redaktion des „Rheinischen Kirchenblattes“ zu Beginn des Jahres 1850. Zum 1. April 1854 verließ er die Zeitung, um als Herausgeber und Redakteur seiner eigenen „Rheinischen Volksblätter“ zu wirken, die er bis zu seinem Tode 1865 betreute. Als besondere Organe für den Gesellenverein wurden zwischen 1850 und 1854 die Beilagen „Vereinsorgan“ und „Feierstunde“ zum "Rheinischen Kirchenblatt" herausgegeben. Ab 1863 publizierte Kolping die "Mittheilungen für die Vorsteher der Katholischen Gesellenvereine". Kolping veröffentlichte dazu seit 1850 jährlich einen Volkskalender, dessen größere Beiträge, „Volkserzählungen", zum überwiegenden Teil aus seiner eigenen Feder stammten.

### Das Werk weitet sich aus

In den wenigen Jahren, die ihm noch beschieden waren, weitete sich das Werk ständig aus. Im Jahre 1865 gab es bereits über 400 Gesellenvereine in zahlreichen Ländern Europas und in Übersee. Kolping selbst, seit 1862 Rektor der Kölner Minoritenkirche, nahm bei seinem rastlosen Wirken in den verschiedensten Bereichen keine Rücksicht auf die eigene Gesundheit. 1850 wurde er durch den Kölner Erzbischof zum Apostolischen Notar ernannt; 1862 erfolgte durch Papst Pius IX. die Ernennung zum päpstlichen Geheimkämmerer.
Der unermüdliche Einsatz zehrte die Kräfte Adolph Kolpings frühzeitig auf; noch nicht 52-jährig, starb er am 4. Dezember 1865. Auf seinen eigenen Wunsch wurde Adolph Kolping in der Kölner Minoritenkirche beigesetzt (1866).
' AND "metaDesc" = 'Stationen im Leben und Wirken Adolph Kolpings von seiner Geburt 1813 bis zur Seligsprechung 1991.' AND "parent" IS NULL AND "sortOrder" = 20 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Die Kolpingsfamilie Ramsen stellt sich vor: gegründet 1953, heute mit über 300 Mitgliedern und vielfältigem Vereinsleben.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'ueber-uns/kolpingsfamilie-ramsen' AND "title" = 'Kolpingsfamilie Ramsen' AND "content" = 'Die Kolpingsfamilie Ramsen, wurde am 29. April 1953 gegründet. Unser Dorf hat ca. 1850 Einwohner und wir haben zur Zeit (2026) über 300 Mitglieder und sind in den Bezirk Grünstadt-Frankenthal eingegliedert, dieser wiederum dem Kolpingwerk Diözesanverband Speyer. Wir haben ein großes Pfarrheim, dieses war früher die mittelalterliche Zehntscheune im Kloster Ramosa und wurde von der Kolpingsfamilie seit 1978 umgebaut und renoviert. Wie man heute sehen kann, mit Erfolg. Als Kolpingsfamilie halten wir dieses Gebäude (im Ramser Sprachgebrauch auch Kolpingheim genannt) auf Stand, dass alle Gruppierungen in unserer Pfarrgemeinde ein festes Zuhause haben. Daneben wurde ab den 90 ger Jahren eine große Wiese mit viel Aufwand angelegt. Hier werden hauptsächlich Veranstaltungen im Freien durchgeführt. Besonders das Boulespiel einmal im Monat, auf dem eigens dafür angelegten Bouleplatz, oder Ende August die Open Air Veranstaltungen unserer Theatergruppe. Familienkreis 1 und 2 "Next Generation" bieten in loser Folge verschiedene Veranstaltungen an. Wir verfügen über eine Blaskapelle (gegr. 16.03.1955).

### Die Ramser Kolpingsfamilie hat ein dichtgedrängtes Programm:

Verschiedene gemeinsame Gottesdienste auf Orts-und Bezirksebene, Wanderungen und Fahrten, die Prunksitzung, das Generationen übergreifende Familienzeltlager in den Sommerferien, Beteiligung an verschiedenen örtlichen Ereignissen, auch ein gemütliches Zwiebelkuchenessen mit neuem Wein oder eine Maibowle gehören dazu. Nicht fehlen dürfen auch die traditionellen Bildungsveranstaltungen über religiöse, geographische, gesundheitliche oder rechtliche Themen, die zwei bis drei mal im Jahr angeboten werden. Zwei Kolpinggedenkgottesdienste, eine Maiandacht und ein Rosenkranzgebet haben wir auch im Programm. Einige Veranstaltungen davon finden im Pfarrheim ( Kolpingheim ) statt. Dienstags treffen sich junge Mädchen um sich dem Garde und Showtanz hinzugeben. Unsere Theatergruppe im Alter ab 14 Jahren, trifft sich jeden Mittwoch. Der Gruppenleiter Sebastian bietet für diese jungen Menschen schon seit mehr als 10 Jahren ein selbstgeschriebenes Theaterstück an, das ab Ende August an 4 Abenden als Open Air Veranstaltungen, oder Ende Dezember als Kreativtheater im Kolpingheim mit 4 Veranstaltungen dem geneigten Puplikum angeboten wird. Die Blaskapelle trifft sich wöchentlich am Freitag zu Probestunden. Es gibt auch einen Kolping - Stammtisch, der sich wöchentlich donnerstags trifft. Jeden Mittwochabend treffen sich Strick & Häkelinteressierte. Von April bis Oktober treffen sich Interessierte jeden letzten Dienstag auf der Kolpingwiese zum Boule Spiel "Jeder gegen Jeden". Ebenfalls im Angebot ist eine Ebike Tagestour jeden ersten Mittwoch im Monat. Ihr seht dass unsere Kolpingsfamilie ein breites Angebot für Jung und Alt hat. Wer Interesse an verschiedenen Angeboten hat, kann einfach vorbei kommen, oder die Verantwortlichen fragen. Die Telefonnummern findet Ihr unter Kontakt.

Auch im Pfarreirat sind wir offiziell vertreten.

Näheres über uns könnt ihr unter den verschiedenen Memüs und das "Neuste" könnt ihr unter Termine oder Aktuelles erfahren.' AND "metaDesc" = 'Details Geschrieben von: Wolfgang Rörig Veröffentlicht: 03. Juli 2019 Zugriffe: 1618 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp' AND "parent" IS NULL AND "sortOrder" = 240 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_5b8e2e82ec0002271248eca9', 'cleanup-metadata:page:ueber-uns/kolpingsfamilie-ramsen', 'page', 'ueber-uns/kolpingsfamilie-ramsen', 'sha256:27638c5f6487697d0a60da28893193c72abf340890e62d6473fecd5efa72203c', 'sha256:17d093affe17dd18b84a79e0645ebe89fd950be39a6ac4e1846d3cc419450514', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'ueber-uns/kolpingsfamilie-ramsen' AND "title" = 'Kolpingsfamilie Ramsen' AND "content" = 'Die Kolpingsfamilie Ramsen, wurde am 29. April 1953 gegründet. Unser Dorf hat ca. 1850 Einwohner und wir haben zur Zeit (2026) über 300 Mitglieder und sind in den Bezirk Grünstadt-Frankenthal eingegliedert, dieser wiederum dem Kolpingwerk Diözesanverband Speyer. Wir haben ein großes Pfarrheim, dieses war früher die mittelalterliche Zehntscheune im Kloster Ramosa und wurde von der Kolpingsfamilie seit 1978 umgebaut und renoviert. Wie man heute sehen kann, mit Erfolg. Als Kolpingsfamilie halten wir dieses Gebäude (im Ramser Sprachgebrauch auch Kolpingheim genannt) auf Stand, dass alle Gruppierungen in unserer Pfarrgemeinde ein festes Zuhause haben. Daneben wurde ab den 90 ger Jahren eine große Wiese mit viel Aufwand angelegt. Hier werden hauptsächlich Veranstaltungen im Freien durchgeführt. Besonders das Boulespiel einmal im Monat, auf dem eigens dafür angelegten Bouleplatz, oder Ende August die Open Air Veranstaltungen unserer Theatergruppe. Familienkreis 1 und 2 "Next Generation" bieten in loser Folge verschiedene Veranstaltungen an. Wir verfügen über eine Blaskapelle (gegr. 16.03.1955).

### Die Ramser Kolpingsfamilie hat ein dichtgedrängtes Programm:

Verschiedene gemeinsame Gottesdienste auf Orts-und Bezirksebene, Wanderungen und Fahrten, die Prunksitzung, das Generationen übergreifende Familienzeltlager in den Sommerferien, Beteiligung an verschiedenen örtlichen Ereignissen, auch ein gemütliches Zwiebelkuchenessen mit neuem Wein oder eine Maibowle gehören dazu. Nicht fehlen dürfen auch die traditionellen Bildungsveranstaltungen über religiöse, geographische, gesundheitliche oder rechtliche Themen, die zwei bis drei mal im Jahr angeboten werden. Zwei Kolpinggedenkgottesdienste, eine Maiandacht und ein Rosenkranzgebet haben wir auch im Programm. Einige Veranstaltungen davon finden im Pfarrheim ( Kolpingheim ) statt. Dienstags treffen sich junge Mädchen um sich dem Garde und Showtanz hinzugeben. Unsere Theatergruppe im Alter ab 14 Jahren, trifft sich jeden Mittwoch. Der Gruppenleiter Sebastian bietet für diese jungen Menschen schon seit mehr als 10 Jahren ein selbstgeschriebenes Theaterstück an, das ab Ende August an 4 Abenden als Open Air Veranstaltungen, oder Ende Dezember als Kreativtheater im Kolpingheim mit 4 Veranstaltungen dem geneigten Puplikum angeboten wird. Die Blaskapelle trifft sich wöchentlich am Freitag zu Probestunden. Es gibt auch einen Kolping - Stammtisch, der sich wöchentlich donnerstags trifft. Jeden Mittwochabend treffen sich Strick & Häkelinteressierte. Von April bis Oktober treffen sich Interessierte jeden letzten Dienstag auf der Kolpingwiese zum Boule Spiel "Jeder gegen Jeden". Ebenfalls im Angebot ist eine Ebike Tagestour jeden ersten Mittwoch im Monat. Ihr seht dass unsere Kolpingsfamilie ein breites Angebot für Jung und Alt hat. Wer Interesse an verschiedenen Angeboten hat, kann einfach vorbei kommen, oder die Verantwortlichen fragen. Die Telefonnummern findet Ihr unter Kontakt.

Auch im Pfarreirat sind wir offiziell vertreten.

Näheres über uns könnt ihr unter den verschiedenen Memüs und das "Neuste" könnt ihr unter Termine oder Aktuelles erfahren.' AND "metaDesc" = 'Die Kolpingsfamilie Ramsen stellt sich vor: gegründet 1953, heute mit über 300 Mitgliedern und vielfältigem Vereinsleben.' AND "parent" IS NULL AND "sortOrder" = 240 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Vereinsgeschichte der Kolpingsfamilie Ramsen seit der Gründung 1953 mit Vorständen, Ehrungen und wichtigen chronologischen Daten.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'ueber-uns/vereinsdaten' AND "title" = 'Vereinsdaten' AND "content" = '## Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7

auf Einladung des Hochw. Herrn Pfarrer Dr. Karl Zinke.

![Pfr Dr. Karl Zinke](/images/imported/ueber-uns/Pfr_Dr._Karl_Zinke.jpg)

## Gründungsvorstand (29.04.1953)

- Pfarrer Dr. Karl Zinke, Präses (verst.)
- Nikolaus Kaiser, Senior (verst.)
- Jakob Fischer, Kassenwart (verst.)
- Heinrich Fischer, Schriftführer (verst.)
- Hans-Rudi Kirchner, Beisitzer (verst.)
- Leonhard Kaiser, Beisitzer (verst.)
- Raimund Michel, Beisitzer (verst.)

## Gründungsmitglieder (06.12.1953)

### Gruppe Kolping:

- Eugen Fischer, (verst.)
- Raimund Fischer, (verst.)
- Ewald Karg, (verst.)
- Hans-Rudi Kirchner, (verst.)
- Heinrich Kirchner, (verst.)
- Bernhard Kuffler, (verst.)
- Alfred Langenstein, (verst.)
- Raimund Michel, (verst.)
- Adam Schifferstein, (verst.)
- Leander Schumacher, (verst.)
- Wilhelm Storck, (verst.)
- Oswald Veit. (verst.)

### Gruppe Altkolping:

- Karl Fischer, (verst.)
- Franz Haberkorn, (verst.)
- Leo Kaiser, (verst.)
- Jakob Krill. (verst.)

## Präses der Kolpingsfamilie:

- 29.04.1953 - 04 05.1963 Pfarrer Dr. Karl Zinke (verst.)
- 05.11.1963 - 26.02.1972 Pfarrer Ludwig Müller (verst.)
- 12.02.1964 - 31.03.1964 (Vizepräses) Kaplan Weißmann (verst.)
- 01.04.1964 - 13.07.1965 (Vizepräses) Kaplan Rolf Hagemeier
- 26.02.1972 - 31.10.1978 Pfarrer Franz-Josef Bolz (23.06.2025 verst. )
- 01.11.1978 - 20.06.2021 Pfarrer Werner Kilian (25.06.2024 verst.)
- 20.06.2021 - heute Pater Clifford Chikeobi Modum

## Senioren:

- 29.04.1953 - 20.01.1954 Nikolaus Kaiser (verst.)
- 20.01.1954 - 31.03.1957 Hans Kirchner (verst.)
- 31.03.1957 - 14.01.1960 Werner Fischer (verst.)
- 14.01.1960 - 18.03.1962 Robert Fischer
- 18.03.1962 - 07.04.1963 Bernhard Kuffler (verst.)
- 07.04.1963 - 27.03.1966 Fritz Schach
- 27.03.1966 - 03.03.1968 Heinz-Peter Geißler (verst.)
- 03.03.1968 - 06.03.1971 Peter Kaiser
- 06.03.1971 - 26.02.1972 Wolfgang Rörig
- 26.02.1972 - 06.01.1973 Bernd Aufschneider

## Altsenioren:

- 29.04.1953 - 31.03.1957 Nikolaus Kaiser (verst.)
- 31.03.1957 - 14.01.1960 Jakob Fischer (verst.)
- 14.01.1960 - 07.04.1963 Leo Kaiser (verst.)
- 07.04.1963 - 26.03.1966 Adam Schifferstein (verst.)
- 26.03.1966 - 03.03.1968 Raimund Michel (verst.)
- 03.03.1968 - 06.03.1971 Günter Wellstein (verst.)
- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)

## 1. Vorsitzende

- 06.03.1971 - 06.01.1973 Klaus Kaiser
- 06.01.1973 - 14.12.1974 Kurt Mechnich (verst.)
- 14.12.1974 - 05.05.1976 Leo Kaiser (verst.)
- 14.01.1977 - 10.01.1981 Paul Schmidt
- 10.01.1981 - 06.03.1982 Stephan Bayer
- 06.03.1982 - 27.02.1988 Wolfgang Rörig
- 27.02.1988 - 02.03.1991 Stephan Bayer (komis. von Wolfgang Rörig ausgeführt)
- 02.03.1991 - 22.02.2018 Wolfgang Rörig

## 2. Vorsitzende

- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)
- 26.02.1972 - 27.07.1974 Walter Fischer (verst.)
- 14.12.1974 - 09.01.1976 Wolfgang Rörig
- 09.01.1976 - 14.01.1977 Paul Schmidt
- 14.01.1977 - 12.01.1979 Wolfgang Rörig
- 12.01.1979 - 10.01.1981 Stephan Bayer
- 10.01.1981 - 06.03.1982 Wolfgang Rörig
- 06.03.1982 - 27.02.1988 Stephan Bayer
- 27.02.1988 - 02.03.1991 Wolfgang Rörig
- 02.03.1991- 30.03.2000 Stephan Bayer
- 30.03.2000 - 05.03.2009 Fritz Schach
- 05.03.2009 - 26.02.2015 Stephan Bayer
- 27.02.2015 - 22.02.2018 Heiko Schmitt-Sattler

## Leitungsteam

- 22.02.2018 - heute Bettina Schach, Heiko Schmitt-Sattler, Sebastian Sattler

## Familienkreis

- 08.02.2009 - heute Bettina Schach

## Familienkreis "Next Generation"

- 20.03.2025 - heute Nadja Höhn

## Jungkolpinggruppe/ Gruppenführer/Vertreter der Jugend

- 20.01.1954 – 16.03.1955 Raimund Michel (verst.)
- 16.03.1955 – 31.03.1957 Hans Balthasar (kein Mitglied)
- 31.03.1957 – 08.03.1959 Leander Schumacher und Theo Rörig (verst.)
- 08.03.1959 – 25.08.1959 Rupprecht Fischer (verst.)
- 25.08.1959 – 01.08.1962 Klaus Kaiser und Werner Balthasar
- 01.08.1962 – 16.02.1964 Peter Kaiser
- 16.02.1964 – 01.01.1966 Peter Kaiser, Hubert Matheis und Heiner Schumacher
- 01.01.1966 – 25.02.1967 Klaus Kaiser und Peter Fischer
- 25.02.1967 – 03.03.1968 Klaus Kaiser und Kurt Best
- 03.03.1968 – 15.02.1970 Kurt Best und Wolfgang Rörig
- 15.02.1970 – 06.03.1971 Winfried Weber und Gerald Mechnich
- 06.03.1971 – 01.01.1972 Gerald Mechnich
- 01.01.1972 – 06.01.1973 Klaus Weber
- 06.01.1973 – 04.02.1975 Bernhard Baldauf, Christel Weibel und Petra Dünkelberg
- 04.02.1975 – 09.01.1976 Albert Baldauf, Christel Weibel und Petra Dünkelberg
- 09.01.1976 – 24.11.1976 Christel Weibel und Manuela Wendel
- 24.11.1976 – 06.01.1978 Hubert Gattje (verst.), Jürgen Storck und Manuela Wendel
- 06.01.1978 – 12.01.1979 Hubert Gattje (verst.), Jürgen Storck, Manuela Wendel, Regina Schifferstein
- 12.01.1979 – 11.01.1980 Brigitte Steitz und Armin Balthasar
- 11.01.1980 – 06.03.1982 Silvia Storck
- 06.03.1982 – 04.02.1984 Martina Wunderlich
- 02.03.1985 – 14.03.1987 Stephan Fischer
- 14.03.1987 – 10.03.1990 Marina Heeß
- 10.03.1990 – 02.03.1991 Hans-Werner Bitter (verst.)
- 02.03.1991 – 26.02.1994 Jörg Fischer
- 26.02.1994 – 11.03.1995 Steffen Rörig, Matthias Best, Arno Schmidt, Daniela Steitz
- 11.03.1995 – 20.02.1997 Steffen Rörig
- 20.02.1997 – 30.03.2000 Andreas Best (Vertreter der Jugend)
- 30.03.2000 – 05.03.2009 Mathias Bayer (Vertreter der Jugend)
- 05.03.2009 – 05.09.2009 Astrid Pohl (Vertreter der Jugend)
- 05.09.2009 - 20.03.2024 Sebastian Sattler, Jugendleiter
- 05.09.2013 - 20.03.2024 Anton Rikart, stellvertr. Jugendleiter
- 21.03.2024 - heute Nele Rörig & Jonas Berst Jugendleitung

## Ehrenpräses der Kolpingsfamilie

- 20.06.2021 Pfr. Werner Kilian (25.06.2024 verst.)

![Pfr. Kilian](/images/imported/ueber-uns/Pfr._Kilian.jpg)

## Ehrenmitglieder der Kolpingsfamilie:

- 01.01.1983 Ludwig Vetter (verst.)
- 02.12.1990 Jakob Fischer (verst.)
- 05.07.1996 Georg Spieß (verst.)
- 06.05.2012 Hans-Rudi Kirchner (verst.)
- 05.12.2019 Wolfgang Richter
- 05.12.2019 Fritz Schach

## Verleihung der Pirminius Plakette

- 07.10.2012 Erika Behnke (durch Bischof Wiesemann)

## Verleihung der Diözesan - Ehrenurkunde:

- 29.11.1991 Jakob Fischer (verst.)
- 25.11.1994 Fritz Schach
- 01.12.1995 Lieselotte Richter
- 27.11.1998 Wolfgang Rörig
- 28.11.2003 Wolfgang Aufschneider (verst.)
- 26.11.2004 Bernd Aufschneider
- 01.12.2006 Wolfgang Scherr
- 31.11.2012 Wolfgang Richter
- 31.11.2012 Erika Behnke (wurde vom Diözesanverband Speyer vorgeschlagen)
- 25.11.2016 Wiltrud Schach
- 30.11.2018 Christel Bayer
- 18.11.2023 Sebastian Sattler

## Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland

- 02.12.2018 Wolfgang Rörig

## Verleihung der Ehrennadel in Gold von der Gemeinde Ramsen

- 05.01.2003 Georg Spieß (verst.)
- 09.01.2005 Fritz Schach
- 04.01.2009 Wolfgang Rörig
- 08.01.2012 Wolfgang Aufschneider (verst.)
- 08.01.2012 Wolfgang Scherr
- 13.01.2013 Lieselotte Richter
- 10.01.2015 Wolfgang Richter
- 10.01.2016 Wiltrud Schach
- 08.01.2017 Christel Bayer
- 08.01.2017 Anita Rieder
- 14.01.2018 Bernd Aufschneider
- 12.01.2020 Stephan Bayer
- 31.01.2026 Manfred Zengerle

## Besondere chronologische Daten:

- 06.12.1953 Banner von R. Michel angefertigt zur 1. Neuaufnahme
- 1954 im Frühjahr Gründung einer Jungkolpinggruppe
- 16\. 03.1955 Gründung der Kolpingskapelle
- 09.12.1958 Einweihung des neuen Banners, beim Kolpingwerk Köln gekauft
- 28.04. 1963 10 jähr. Jubiläum der Kolpingsfamilie im Saale des TuS 05
- 28.07. - 04.08.1963 Handwerksausstellung im Gemeindehaus Ramsen
- 26.01. 1964 1. Prunksitzung im Saale des TuS 05 mit der KF Winnweiler
- 1964/1965 10 Sitzbänke rund um Ramsen aufgestellt in Wald und Flur
- 13.08.1967 Diözesan-Radrennen in Ramsen, rund um den Schwarzwald
- 06.08.1971 Gründung der Volkstanz- und Trachtengruppe
- 04.07.1972 Gründung des Kolpingheim e.V.
- 1973 Die Mariengrotte wurde von Kolpingsmitgliedern erbaut
- 1975 -1997 Martinsumzüge der Kinder
- 12\. - 15.05.1978 25 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf dem Sportplatz
- 30.06.1988 Auflösung des Kolpingheim e.V.
- 28.03. 1999 Silbernes Priesterjubiläum von Präses Werner Kilian (in der Eistalhalle)
- 04.-06.07.2003 50 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf der Kolpingwiese
- 2005 Neues Zelt mit Fenstern für besondere Anlässe gekauft
- 2008 Die Gaststätte "Klosterschänke" wird nach 32 Jahren geschlossen
- 08.02.2009 Gründung eines "Familienkreises"
- 12.06.2009 Überlassungsvertrages vom Pfarrheim auf weitere 25 Jahre verlängert
- 2009 Neuanschaffung der Saalbestuhlung mit Tischen (80 Stühle + 12 Tische)
- 05.05.2013 60. jähr. Jubiläum mit Festmesse und Empfang im Pfarrheim
- 22.02.2014 50. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 17.05.2014 Diözesan Familientag auf der Kolpingwiese in Ramsen
- 15.07.2015 Neuanschaffung weiterer Saalbestuhlung für die Bühne (40 Stühle + 6 Tische)
- 06.05.2018 65 jähriges Jubiläum mit Festmesse/ Empfang im Pfarrheim mit Diashow über die zurückliegenden Jahre.
- 23.02.2019 55. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 2019 Alle Zeltgarnituren nachgesehen, die Guten abgeschliffen und neu lackiert
- 2020 10 Stk. neue Zeltgarnituren bei der Heinrich Kimmle Stiftung Pirmasens erwoben
- 2020/ 2021 Wegen Corona wurden die meisten Programmpunkte abgesagt
- 20.06.2021 Offizielle Auflösung der Volkstanz.- und Trachtengruppe
- 2020/ 2021 In den Sommermonaten wurde wegen Corona auf der Kolpingwiese ein Sommer-Sonderprogramm angeboten
- 2023 Feier zum 70 jährigen Jubiläum der Kolpingsfamilie im Festzelt mit Ehrungen und Neuaufnahmen.
- 25.06.2024 Unser Ehrenpräses Pfr. Werner Kilian ist kurz vor seinem 81 Geburtstag verstorben.
- 2024 Anschaffung von 12 Bühnenelementen für die Theatergruppe

## Bau und Renovierungsarbeiten

- 1973 Bau der Mariengrotte hinter der kath. Kirche Organisation durch Kurt Mechnich und unter der Leitung von Steinmetz Karl Böhm
- 1975 -1980 Umbau des Pfarrheimes zum Kolpingheim mit „Klosterschänke“
- 1991 Neubau des Jugendraumes mit Toilette, Lager und Außenanlage
- 1990 – 1993 Aufschüttung des Geländes vom ehemaligen Schwesterngarten
- 1996 Erneuerung von Fußboden und Decke mit Luftabsaugung im Pfarrsaal
- 1998 Neubau eines 2.Lagers, Richtfest am 14. Nov. 1998
- 1999 Überdachung der Sitzecke zwischen Lager und Jugendraum
- 2000 Freifläche planiert, Rasen angelegt und Thuja gepflanzt
- 05.-06.2000 Pfarrheim außen streichen und Sockel verputzen
- 2001 (Frühjahr) Renovierung der Gastwirtschaft: Abzugsanlage und neue Decke
- 2000 – 2003 Fertigstellung des neuen Lagers mit Toiletten
- 2003 Renovierung und Neueinrichtung der Gastwirtschaftsküche
- 2005 2 neue Fenster mit Rollläden in der Gastwirtschaft eingebaut
- 2007 12 neue Fenster mit Rollläden in der Wohnung eingebaut
- 11.05.2007 Außentür vom neuen Jugendraum zum Freisitz eingebaut
- 2008 Renovierung der Wohnung im Pfarrheim
- 2011 Renovierung der gesamten Toiletten im EG
- 07.10.2011 Neue Tür zum alten Jugendraum eingebaut
- 2012 Überdachung hinter dem neuen Lager angebracht
- 2012 Erneuerung der Heizkörper im Saal und Treppenhaus
- 2012 Erneuerung sämtlicher Heizkörperventile
- 2013 Erneuerung der Fenster mit Rollläden im Saal und auf der Bühne
- 2015 Anlegen eines Bouleplatzes
- 2017 Bau eines Gasflaschen Lagers
- 2018 Einbau elektrischer Rollladenantriebe und tapezieren im neuen Jugendraum
- 2018 Neueindeckung der Überdachung der Sitzecke am Jugendraum wegen Hagelschaden
- 2019 Fußboden im Saal und Bühne abgeschliffen und neu versiegelt
- 2019 Vorderer Eingangsbereich zum Pfarrheim mit Granitplatten neu verlegt
- 2019 Neuer Gasbrenner für die Heizung eingebaut
- 2019 Hintere Außentür zum Obergeschoß erneuert
- 2020 2 neue Fenster in der Bücherei eingesetzt
- 2020 Große Eingangstür Ostseite erneuert
- 2020 Treppe Ostseite erneuert
- 09.2021 Giebel Richtung Gemeindehaus wurde neu gestrichen
- 2024 Bau eines Lagers für die Theatergruppe
- 2024 Neuaufbau des Bouleplatzes' AND "metaDesc" = 'Details Geschrieben von: Wolfgang Rörig Veröffentlicht: 03. Juli 2019 Zugriffe: 2618 Relevante Vereins - Daten Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7 auf Einladung des Hochw.&nbsp; H' AND "parent" IS NULL AND "sortOrder" = 470 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_ccc0ad10f29a147b326c727f', 'cleanup-metadata:page:ueber-uns/vereinsdaten', 'page', 'ueber-uns/vereinsdaten', 'sha256:bd6ac86849ffda4d525168376caa937770f4481e8939fe09d973f5a67dfa94f1', 'sha256:b157c6b8aeb76bb79dd82e8d2b32459453f8c546b01a9b696d9214c080039569', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'ueber-uns/vereinsdaten' AND "title" = 'Vereinsdaten' AND "content" = '## Gründungsversammlung am 29. April 1953 im Pfarrsaal des Schwesternhauses in Ramsen, Klosterhof 7

auf Einladung des Hochw. Herrn Pfarrer Dr. Karl Zinke.

![Pfr Dr. Karl Zinke](/images/imported/ueber-uns/Pfr_Dr._Karl_Zinke.jpg)

## Gründungsvorstand (29.04.1953)

- Pfarrer Dr. Karl Zinke, Präses (verst.)
- Nikolaus Kaiser, Senior (verst.)
- Jakob Fischer, Kassenwart (verst.)
- Heinrich Fischer, Schriftführer (verst.)
- Hans-Rudi Kirchner, Beisitzer (verst.)
- Leonhard Kaiser, Beisitzer (verst.)
- Raimund Michel, Beisitzer (verst.)

## Gründungsmitglieder (06.12.1953)

### Gruppe Kolping:

- Eugen Fischer, (verst.)
- Raimund Fischer, (verst.)
- Ewald Karg, (verst.)
- Hans-Rudi Kirchner, (verst.)
- Heinrich Kirchner, (verst.)
- Bernhard Kuffler, (verst.)
- Alfred Langenstein, (verst.)
- Raimund Michel, (verst.)
- Adam Schifferstein, (verst.)
- Leander Schumacher, (verst.)
- Wilhelm Storck, (verst.)
- Oswald Veit. (verst.)

### Gruppe Altkolping:

- Karl Fischer, (verst.)
- Franz Haberkorn, (verst.)
- Leo Kaiser, (verst.)
- Jakob Krill. (verst.)

## Präses der Kolpingsfamilie:

- 29.04.1953 - 04 05.1963 Pfarrer Dr. Karl Zinke (verst.)
- 05.11.1963 - 26.02.1972 Pfarrer Ludwig Müller (verst.)
- 12.02.1964 - 31.03.1964 (Vizepräses) Kaplan Weißmann (verst.)
- 01.04.1964 - 13.07.1965 (Vizepräses) Kaplan Rolf Hagemeier
- 26.02.1972 - 31.10.1978 Pfarrer Franz-Josef Bolz (23.06.2025 verst. )
- 01.11.1978 - 20.06.2021 Pfarrer Werner Kilian (25.06.2024 verst.)
- 20.06.2021 - heute Pater Clifford Chikeobi Modum

## Senioren:

- 29.04.1953 - 20.01.1954 Nikolaus Kaiser (verst.)
- 20.01.1954 - 31.03.1957 Hans Kirchner (verst.)
- 31.03.1957 - 14.01.1960 Werner Fischer (verst.)
- 14.01.1960 - 18.03.1962 Robert Fischer
- 18.03.1962 - 07.04.1963 Bernhard Kuffler (verst.)
- 07.04.1963 - 27.03.1966 Fritz Schach
- 27.03.1966 - 03.03.1968 Heinz-Peter Geißler (verst.)
- 03.03.1968 - 06.03.1971 Peter Kaiser
- 06.03.1971 - 26.02.1972 Wolfgang Rörig
- 26.02.1972 - 06.01.1973 Bernd Aufschneider

## Altsenioren:

- 29.04.1953 - 31.03.1957 Nikolaus Kaiser (verst.)
- 31.03.1957 - 14.01.1960 Jakob Fischer (verst.)
- 14.01.1960 - 07.04.1963 Leo Kaiser (verst.)
- 07.04.1963 - 26.03.1966 Adam Schifferstein (verst.)
- 26.03.1966 - 03.03.1968 Raimund Michel (verst.)
- 03.03.1968 - 06.03.1971 Günter Wellstein (verst.)
- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)

## 1. Vorsitzende

- 06.03.1971 - 06.01.1973 Klaus Kaiser
- 06.01.1973 - 14.12.1974 Kurt Mechnich (verst.)
- 14.12.1974 - 05.05.1976 Leo Kaiser (verst.)
- 14.01.1977 - 10.01.1981 Paul Schmidt
- 10.01.1981 - 06.03.1982 Stephan Bayer
- 06.03.1982 - 27.02.1988 Wolfgang Rörig
- 27.02.1988 - 02.03.1991 Stephan Bayer (komis. von Wolfgang Rörig ausgeführt)
- 02.03.1991 - 22.02.2018 Wolfgang Rörig

## 2. Vorsitzende

- 06.03.1971 - 26.02.1972 Kurt Mechnich (verst.)
- 26.02.1972 - 27.07.1974 Walter Fischer (verst.)
- 14.12.1974 - 09.01.1976 Wolfgang Rörig
- 09.01.1976 - 14.01.1977 Paul Schmidt
- 14.01.1977 - 12.01.1979 Wolfgang Rörig
- 12.01.1979 - 10.01.1981 Stephan Bayer
- 10.01.1981 - 06.03.1982 Wolfgang Rörig
- 06.03.1982 - 27.02.1988 Stephan Bayer
- 27.02.1988 - 02.03.1991 Wolfgang Rörig
- 02.03.1991- 30.03.2000 Stephan Bayer
- 30.03.2000 - 05.03.2009 Fritz Schach
- 05.03.2009 - 26.02.2015 Stephan Bayer
- 27.02.2015 - 22.02.2018 Heiko Schmitt-Sattler

## Leitungsteam

- 22.02.2018 - heute Bettina Schach, Heiko Schmitt-Sattler, Sebastian Sattler

## Familienkreis

- 08.02.2009 - heute Bettina Schach

## Familienkreis "Next Generation"

- 20.03.2025 - heute Nadja Höhn

## Jungkolpinggruppe/ Gruppenführer/Vertreter der Jugend

- 20.01.1954 – 16.03.1955 Raimund Michel (verst.)
- 16.03.1955 – 31.03.1957 Hans Balthasar (kein Mitglied)
- 31.03.1957 – 08.03.1959 Leander Schumacher und Theo Rörig (verst.)
- 08.03.1959 – 25.08.1959 Rupprecht Fischer (verst.)
- 25.08.1959 – 01.08.1962 Klaus Kaiser und Werner Balthasar
- 01.08.1962 – 16.02.1964 Peter Kaiser
- 16.02.1964 – 01.01.1966 Peter Kaiser, Hubert Matheis und Heiner Schumacher
- 01.01.1966 – 25.02.1967 Klaus Kaiser und Peter Fischer
- 25.02.1967 – 03.03.1968 Klaus Kaiser und Kurt Best
- 03.03.1968 – 15.02.1970 Kurt Best und Wolfgang Rörig
- 15.02.1970 – 06.03.1971 Winfried Weber und Gerald Mechnich
- 06.03.1971 – 01.01.1972 Gerald Mechnich
- 01.01.1972 – 06.01.1973 Klaus Weber
- 06.01.1973 – 04.02.1975 Bernhard Baldauf, Christel Weibel und Petra Dünkelberg
- 04.02.1975 – 09.01.1976 Albert Baldauf, Christel Weibel und Petra Dünkelberg
- 09.01.1976 – 24.11.1976 Christel Weibel und Manuela Wendel
- 24.11.1976 – 06.01.1978 Hubert Gattje (verst.), Jürgen Storck und Manuela Wendel
- 06.01.1978 – 12.01.1979 Hubert Gattje (verst.), Jürgen Storck, Manuela Wendel, Regina Schifferstein
- 12.01.1979 – 11.01.1980 Brigitte Steitz und Armin Balthasar
- 11.01.1980 – 06.03.1982 Silvia Storck
- 06.03.1982 – 04.02.1984 Martina Wunderlich
- 02.03.1985 – 14.03.1987 Stephan Fischer
- 14.03.1987 – 10.03.1990 Marina Heeß
- 10.03.1990 – 02.03.1991 Hans-Werner Bitter (verst.)
- 02.03.1991 – 26.02.1994 Jörg Fischer
- 26.02.1994 – 11.03.1995 Steffen Rörig, Matthias Best, Arno Schmidt, Daniela Steitz
- 11.03.1995 – 20.02.1997 Steffen Rörig
- 20.02.1997 – 30.03.2000 Andreas Best (Vertreter der Jugend)
- 30.03.2000 – 05.03.2009 Mathias Bayer (Vertreter der Jugend)
- 05.03.2009 – 05.09.2009 Astrid Pohl (Vertreter der Jugend)
- 05.09.2009 - 20.03.2024 Sebastian Sattler, Jugendleiter
- 05.09.2013 - 20.03.2024 Anton Rikart, stellvertr. Jugendleiter
- 21.03.2024 - heute Nele Rörig & Jonas Berst Jugendleitung

## Ehrenpräses der Kolpingsfamilie

- 20.06.2021 Pfr. Werner Kilian (25.06.2024 verst.)

![Pfr. Kilian](/images/imported/ueber-uns/Pfr._Kilian.jpg)

## Ehrenmitglieder der Kolpingsfamilie:

- 01.01.1983 Ludwig Vetter (verst.)
- 02.12.1990 Jakob Fischer (verst.)
- 05.07.1996 Georg Spieß (verst.)
- 06.05.2012 Hans-Rudi Kirchner (verst.)
- 05.12.2019 Wolfgang Richter
- 05.12.2019 Fritz Schach

## Verleihung der Pirminius Plakette

- 07.10.2012 Erika Behnke (durch Bischof Wiesemann)

## Verleihung der Diözesan - Ehrenurkunde:

- 29.11.1991 Jakob Fischer (verst.)
- 25.11.1994 Fritz Schach
- 01.12.1995 Lieselotte Richter
- 27.11.1998 Wolfgang Rörig
- 28.11.2003 Wolfgang Aufschneider (verst.)
- 26.11.2004 Bernd Aufschneider
- 01.12.2006 Wolfgang Scherr
- 31.11.2012 Wolfgang Richter
- 31.11.2012 Erika Behnke (wurde vom Diözesanverband Speyer vorgeschlagen)
- 25.11.2016 Wiltrud Schach
- 30.11.2018 Christel Bayer
- 18.11.2023 Sebastian Sattler

## Verleihung des Ehrenzeichens der Kolpingfamilien im Kolpingwerk Deutschland

- 02.12.2018 Wolfgang Rörig

## Verleihung der Ehrennadel in Gold von der Gemeinde Ramsen

- 05.01.2003 Georg Spieß (verst.)
- 09.01.2005 Fritz Schach
- 04.01.2009 Wolfgang Rörig
- 08.01.2012 Wolfgang Aufschneider (verst.)
- 08.01.2012 Wolfgang Scherr
- 13.01.2013 Lieselotte Richter
- 10.01.2015 Wolfgang Richter
- 10.01.2016 Wiltrud Schach
- 08.01.2017 Christel Bayer
- 08.01.2017 Anita Rieder
- 14.01.2018 Bernd Aufschneider
- 12.01.2020 Stephan Bayer
- 31.01.2026 Manfred Zengerle

## Besondere chronologische Daten:

- 06.12.1953 Banner von R. Michel angefertigt zur 1. Neuaufnahme
- 1954 im Frühjahr Gründung einer Jungkolpinggruppe
- 16\. 03.1955 Gründung der Kolpingskapelle
- 09.12.1958 Einweihung des neuen Banners, beim Kolpingwerk Köln gekauft
- 28.04. 1963 10 jähr. Jubiläum der Kolpingsfamilie im Saale des TuS 05
- 28.07. - 04.08.1963 Handwerksausstellung im Gemeindehaus Ramsen
- 26.01. 1964 1. Prunksitzung im Saale des TuS 05 mit der KF Winnweiler
- 1964/1965 10 Sitzbänke rund um Ramsen aufgestellt in Wald und Flur
- 13.08.1967 Diözesan-Radrennen in Ramsen, rund um den Schwarzwald
- 06.08.1971 Gründung der Volkstanz- und Trachtengruppe
- 04.07.1972 Gründung des Kolpingheim e.V.
- 1973 Die Mariengrotte wurde von Kolpingsmitgliedern erbaut
- 1975 -1997 Martinsumzüge der Kinder
- 12\. - 15.05.1978 25 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf dem Sportplatz
- 30.06.1988 Auflösung des Kolpingheim e.V.
- 28.03. 1999 Silbernes Priesterjubiläum von Präses Werner Kilian (in der Eistalhalle)
- 04.-06.07.2003 50 jähriges Jubiläum der Kolpingsfamilie, mit einem Zelt auf der Kolpingwiese
- 2005 Neues Zelt mit Fenstern für besondere Anlässe gekauft
- 2008 Die Gaststätte "Klosterschänke" wird nach 32 Jahren geschlossen
- 08.02.2009 Gründung eines "Familienkreises"
- 12.06.2009 Überlassungsvertrages vom Pfarrheim auf weitere 25 Jahre verlängert
- 2009 Neuanschaffung der Saalbestuhlung mit Tischen (80 Stühle + 12 Tische)
- 05.05.2013 60. jähr. Jubiläum mit Festmesse und Empfang im Pfarrheim
- 22.02.2014 50. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 17.05.2014 Diözesan Familientag auf der Kolpingwiese in Ramsen
- 15.07.2015 Neuanschaffung weiterer Saalbestuhlung für die Bühne (40 Stühle + 6 Tische)
- 06.05.2018 65 jähriges Jubiläum mit Festmesse/ Empfang im Pfarrheim mit Diashow über die zurückliegenden Jahre.
- 23.02.2019 55. Prunksitzung in der Eistalhalle des TUS 05 Ramsen
- 2019 Alle Zeltgarnituren nachgesehen, die Guten abgeschliffen und neu lackiert
- 2020 10 Stk. neue Zeltgarnituren bei der Heinrich Kimmle Stiftung Pirmasens erwoben
- 2020/ 2021 Wegen Corona wurden die meisten Programmpunkte abgesagt
- 20.06.2021 Offizielle Auflösung der Volkstanz.- und Trachtengruppe
- 2020/ 2021 In den Sommermonaten wurde wegen Corona auf der Kolpingwiese ein Sommer-Sonderprogramm angeboten
- 2023 Feier zum 70 jährigen Jubiläum der Kolpingsfamilie im Festzelt mit Ehrungen und Neuaufnahmen.
- 25.06.2024 Unser Ehrenpräses Pfr. Werner Kilian ist kurz vor seinem 81 Geburtstag verstorben.
- 2024 Anschaffung von 12 Bühnenelementen für die Theatergruppe

## Bau und Renovierungsarbeiten

- 1973 Bau der Mariengrotte hinter der kath. Kirche Organisation durch Kurt Mechnich und unter der Leitung von Steinmetz Karl Böhm
- 1975 -1980 Umbau des Pfarrheimes zum Kolpingheim mit „Klosterschänke“
- 1991 Neubau des Jugendraumes mit Toilette, Lager und Außenanlage
- 1990 – 1993 Aufschüttung des Geländes vom ehemaligen Schwesterngarten
- 1996 Erneuerung von Fußboden und Decke mit Luftabsaugung im Pfarrsaal
- 1998 Neubau eines 2.Lagers, Richtfest am 14. Nov. 1998
- 1999 Überdachung der Sitzecke zwischen Lager und Jugendraum
- 2000 Freifläche planiert, Rasen angelegt und Thuja gepflanzt
- 05.-06.2000 Pfarrheim außen streichen und Sockel verputzen
- 2001 (Frühjahr) Renovierung der Gastwirtschaft: Abzugsanlage und neue Decke
- 2000 – 2003 Fertigstellung des neuen Lagers mit Toiletten
- 2003 Renovierung und Neueinrichtung der Gastwirtschaftsküche
- 2005 2 neue Fenster mit Rollläden in der Gastwirtschaft eingebaut
- 2007 12 neue Fenster mit Rollläden in der Wohnung eingebaut
- 11.05.2007 Außentür vom neuen Jugendraum zum Freisitz eingebaut
- 2008 Renovierung der Wohnung im Pfarrheim
- 2011 Renovierung der gesamten Toiletten im EG
- 07.10.2011 Neue Tür zum alten Jugendraum eingebaut
- 2012 Überdachung hinter dem neuen Lager angebracht
- 2012 Erneuerung der Heizkörper im Saal und Treppenhaus
- 2012 Erneuerung sämtlicher Heizkörperventile
- 2013 Erneuerung der Fenster mit Rollläden im Saal und auf der Bühne
- 2015 Anlegen eines Bouleplatzes
- 2017 Bau eines Gasflaschen Lagers
- 2018 Einbau elektrischer Rollladenantriebe und tapezieren im neuen Jugendraum
- 2018 Neueindeckung der Überdachung der Sitzecke am Jugendraum wegen Hagelschaden
- 2019 Fußboden im Saal und Bühne abgeschliffen und neu versiegelt
- 2019 Vorderer Eingangsbereich zum Pfarrheim mit Granitplatten neu verlegt
- 2019 Neuer Gasbrenner für die Heizung eingebaut
- 2019 Hintere Außentür zum Obergeschoß erneuert
- 2020 2 neue Fenster in der Bücherei eingesetzt
- 2020 Große Eingangstür Ostseite erneuert
- 2020 Treppe Ostseite erneuert
- 09.2021 Giebel Richtung Gemeindehaus wurde neu gestrichen
- 2024 Bau eines Lagers für die Theatergruppe
- 2024 Neuaufbau des Bouleplatzes' AND "metaDesc" = 'Vereinsgeschichte der Kolpingsfamilie Ramsen seit der Gründung 1953 mit Vorständen, Ehrungen und wichtigen chronologischen Daten.' AND "parent" IS NULL AND "sortOrder" = 470 AND "archiveDate" IS NULL AND "published" = 1);

UPDATE "Page" SET "metaDesc" = 'Chronik der Familien- und Jugendzeltlager der Kolpingsfamilie Ramsen von 1977 bis 2027.', "updatedAt" = CURRENT_TIMESTAMP WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND "slug" = 'vereinsbereiche/zeltlager' AND "title" = 'Zeltlager' AND "content" = '## Familien-Zeltlager Historie der Kolpingfamilie Ramsen

| Nr. | Zeitraum | Lager / Hinweis |
| ---: | --- | --- |
| – | 22.07. - 24.07.1977 | 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann |
| – | 15.07. - 23. 07.1978 | Jugendzeltlager auf dem Campingplatz in Gerbach |
| – | 13.07. - 15.07.1979 | Jugendzeltlager beim SV Grün-Weiß Hochspeyer |
| – | 27.07. - 02.08.1980 | Jugendzeltlager in St. Leon |
| – | 26.07. - 01.08.1981 | Jugendzeltlager in der „Heilsbach“ bei Schönau |
| – | 01.08. - 08.08.1982 | Jugendzeltlager der Volkstanz.u.Trgr. in Dörnbach/ Donnersberg |
| 01. | 30.07. - 06.08.1983 | Familienzeltlager in Hilst/ VG Pirmasens |
| 02. | 11.08. - 18.08.1984 | Familienzeltlager in Jägersburg/ Saarland (Homburg) |
| 03. | 03.08. - 10.08.1985 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 04. | 19.07. - 26.07.1986 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 05. | 22.08. - 29.08.1987 | Familienzeltlager in Annweiler/ Südwestpfalz |
| 06. | 13.08. - 20.08.1988 | Familienzeltlager in Dahn/ Südwestpfalz |
| – | 02.06. - 04.06.1989 | Jugendzeltlager in Zell/ Mosel |
| 07. | 29.07. - 05.08.1989 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 08. | 28.07. - 04.08.1990 | Familienzeltlager in Hambach/ Neustadt |
| 09. | 20.07. - 27.07.1991 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 10. | 22.08. - 29.08.1992 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 11. | 13.08. - 21.08.1993 | Familienzeltlager am Bostalsee/ Saarland |
| 12. | 30.07. - 06.08.1994 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 13. | 04.08. - 12.08.1995 | Familienzeltlager in Hilst/ VG Pirmasens |
| 14. | 17.08. - 24.08.1996 | Familienzeltlager in Dahn/ Südwestpfalz |
| 15. | 23.08. - 29.08.1997 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 16. | 15.08. - 22.08.1998 | Familienzeltlager in Hambach/ Neustadt |
| 17. | 31.07. - 07.08.1999 | Familienzeltlager in Odenbach/ Glan |
| 18. | 22.07. - 29.07.2000 | Familienzeltleger in Jägersburg/ Saar (Homburg) |
| 19. | 28.07. - 04.08.2001 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 20. | 02.08. - 10.08.2002 | Familienzeltlager in Moosautal/ Odenwald |
| 21. | 15.08. - 23.08.2003 | Familienzeltlager in Queidersbach/ (VG Landstuhl) |
| 22. | 20.08. - 28.08. 2004 | Familienzeltlager in Saarhölzbach/ Saarland |
| 23. | 19. 08. - 27. 08.2005 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 24. | 18.08. - 26.08. 2006 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 25. | 27.07. - 04.08.2007 | Familienzeltlager am Bostalsee/ Saarland |
| 26. | 11.07. - 19.07.2008 | Familienzeltlager in Imsbach/ Donnersberg |
| 27. | 31.07. - 08.08.2009 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 28. | 23.07. - 31.07.2010 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 29. | 15.07. - 23.07.2011 | Familienzeltlager in Imsbach/ Donnersberg (wegen Schmutz im Trinkwasser, Lager abgebrochen) |
| 30. | 20.07. - 28.07.2012 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 31. | 26.07. - 03.08.2013 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 32. | 15.08. - 23.08.2014 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 33. | 14.08. - 22.08.2015 | Familienzeltlager in Geiselberg (geplant in Imsbach-Absage der Gemeinde) |
| 34. | 05.08. - 13.08.2016 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 35. | 21.07. - 29.07.2017 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 36. | 13.07. - 21.07.2018 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 37. | 19.07. - 27.07.2019 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| – | 24.07. - 01.08.2020 | Familienzeltlager in Saarburg (im Kammerforst) (wegen Corona abgesagt) |
| – | 06.08. - 14.08.2021 | Familienzeltlager in Hauenstein/ Südwestpfalz (wegen Corona abgesagt) |
| 38. | 12.08. - 20.08.2022 | Familiezeltlager in Frauenberg (Fehlbuchung des Platzbesitzers) kurzfristig umgebucht nach Hauenstein |
| 39. | 11.08. - 19.08.2023 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 40. | 02.08. - 10.08.2024 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 41. | 25.07. - 02.08.2025 | Familienzeltlager in Geiselberhg (VG Walfischbach-Burgalben) |
| 42. | 17.07. - 25.07.2026 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 43. | 2027 | Familienzeltlager in Frauenberg/ (an der Nahe) |' AND "metaDesc" = 'Familien-Zeltlager Historie der Kolpingfamilie Ramsen 22.07. - 24.07.1977 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann 15.07. - 23. 07.1978' AND "parent" IS NULL AND "sortOrder" = 500 AND "archiveDate" IS NULL AND "published" = 1;
INSERT OR IGNORE INTO "LegacyContentRevision" ("id", "sourceKey", "targetKind", "targetKey", "sourceDigest", "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt")
SELECT 'legacyrev_23cedbd5e3819c51d62c801d', 'cleanup-metadata:page:vereinsbereiche/zeltlager', 'page', 'vereinsbereiche/zeltlager', 'sha256:20c6bfcba5b75f032ea22e12a19967b47df28da2472da441477e765e9f5d4eee', 'sha256:6ce36077a2ddc1a5fba27c8b40431561a61be5cab39c5d95187a032c76a1734c', 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE changes() = 1 AND EXISTS (SELECT 1 FROM "Page" WHERE "slug" = 'vereinsbereiche/zeltlager' AND "title" = 'Zeltlager' AND "content" = '## Familien-Zeltlager Historie der Kolpingfamilie Ramsen

| Nr. | Zeitraum | Lager / Hinweis |
| ---: | --- | --- |
| – | 22.07. - 24.07.1977 | 1. Familien-Wochenendzeltlager am Forsthaus „Steigerhof“ bei Bann |
| – | 15.07. - 23. 07.1978 | Jugendzeltlager auf dem Campingplatz in Gerbach |
| – | 13.07. - 15.07.1979 | Jugendzeltlager beim SV Grün-Weiß Hochspeyer |
| – | 27.07. - 02.08.1980 | Jugendzeltlager in St. Leon |
| – | 26.07. - 01.08.1981 | Jugendzeltlager in der „Heilsbach“ bei Schönau |
| – | 01.08. - 08.08.1982 | Jugendzeltlager der Volkstanz.u.Trgr. in Dörnbach/ Donnersberg |
| 01. | 30.07. - 06.08.1983 | Familienzeltlager in Hilst/ VG Pirmasens |
| 02. | 11.08. - 18.08.1984 | Familienzeltlager in Jägersburg/ Saarland (Homburg) |
| 03. | 03.08. - 10.08.1985 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 04. | 19.07. - 26.07.1986 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 05. | 22.08. - 29.08.1987 | Familienzeltlager in Annweiler/ Südwestpfalz |
| 06. | 13.08. - 20.08.1988 | Familienzeltlager in Dahn/ Südwestpfalz |
| – | 02.06. - 04.06.1989 | Jugendzeltlager in Zell/ Mosel |
| 07. | 29.07. - 05.08.1989 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 08. | 28.07. - 04.08.1990 | Familienzeltlager in Hambach/ Neustadt |
| 09. | 20.07. - 27.07.1991 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 10. | 22.08. - 29.08.1992 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 11. | 13.08. - 21.08.1993 | Familienzeltlager am Bostalsee/ Saarland |
| 12. | 30.07. - 06.08.1994 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 13. | 04.08. - 12.08.1995 | Familienzeltlager in Hilst/ VG Pirmasens |
| 14. | 17.08. - 24.08.1996 | Familienzeltlager in Dahn/ Südwestpfalz |
| 15. | 23.08. - 29.08.1997 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 16. | 15.08. - 22.08.1998 | Familienzeltlager in Hambach/ Neustadt |
| 17. | 31.07. - 07.08.1999 | Familienzeltlager in Odenbach/ Glan |
| 18. | 22.07. - 29.07.2000 | Familienzeltleger in Jägersburg/ Saar (Homburg) |
| 19. | 28.07. - 04.08.2001 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 20. | 02.08. - 10.08.2002 | Familienzeltlager in Moosautal/ Odenwald |
| 21. | 15.08. - 23.08.2003 | Familienzeltlager in Queidersbach/ (VG Landstuhl) |
| 22. | 20.08. - 28.08. 2004 | Familienzeltlager in Saarhölzbach/ Saarland |
| 23. | 19. 08. - 27. 08.2005 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 24. | 18.08. - 26.08. 2006 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 25. | 27.07. - 04.08.2007 | Familienzeltlager am Bostalsee/ Saarland |
| 26. | 11.07. - 19.07.2008 | Familienzeltlager in Imsbach/ Donnersberg |
| 27. | 31.07. - 08.08.2009 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 28. | 23.07. - 31.07.2010 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 29. | 15.07. - 23.07.2011 | Familienzeltlager in Imsbach/ Donnersberg (wegen Schmutz im Trinkwasser, Lager abgebrochen) |
| 30. | 20.07. - 28.07.2012 | Familienzeltlager in Hauenstein/ Südwestpfalz |
| 31. | 26.07. - 03.08.2013 | Familienzeltlager in Geiselberg/ (VG Walfischbach-Burgalben) |
| 32. | 15.08. - 23.08.2014 | Familienzeltlager in Krottelbach/ (Oberes Glantal) |
| 33. | 14.08. - 22.08.2015 | Familienzeltlager in Geiselberg (geplant in Imsbach-Absage der Gemeinde) |
| 34. | 05.08. - 13.08.2016 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 35. | 21.07. - 29.07.2017 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 36. | 13.07. - 21.07.2018 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 37. | 19.07. - 27.07.2019 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| – | 24.07. - 01.08.2020 | Familienzeltlager in Saarburg (im Kammerforst) (wegen Corona abgesagt) |
| – | 06.08. - 14.08.2021 | Familienzeltlager in Hauenstein/ Südwestpfalz (wegen Corona abgesagt) |
| 38. | 12.08. - 20.08.2022 | Familiezeltlager in Frauenberg (Fehlbuchung des Platzbesitzers) kurzfristig umgebucht nach Hauenstein |
| 39. | 11.08. - 19.08.2023 | Familienzeltlager in Deudesfeld/ Vulkaneifel |
| 40. | 02.08. - 10.08.2024 | Familienzeltlager in Frauenberg/ (an der Nahe) |
| 41. | 25.07. - 02.08.2025 | Familienzeltlager in Geiselberhg (VG Walfischbach-Burgalben) |
| 42. | 17.07. - 25.07.2026 | Familienzeltlager in Niederschlettenbach/ Südpfalz (Am Teilberg) |
| 43. | 2027 | Familienzeltlager in Frauenberg/ (an der Nahe) |' AND "metaDesc" = 'Chronik der Familien- und Jugendzeltlager der Kolpingsfamilie Ramsen von 1977 bis 2027.' AND "parent" IS NULL AND "sortOrder" = 500 AND "archiveDate" IS NULL AND "published" = 1);

CREATE TEMP TABLE "_LegacyReconciliationAssertion" ("ok" INTEGER NOT NULL ON CONFLICT ROLLBACK);

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:page:ueber-uns/pfarrheim:article:/index.php/ueber-uns/geschichte-pfarrheim#2019-07-03-die-geschichte-des-katholischen-pfarrheims-p3161022-jpg' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/pfarrheim' AND "sourceDigest" = 'sha256:97f92692db1fc76e416fba082172038690fbfa23b31be42cb3724e7061a1b414' AND "appliedContentDigest" = 'sha256:a6f385e77c0ce68ca9b25c3a78e362dfb7a7ea5a99828fb4b54eb8642dc4c43e' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:page:ueber-uns/vereinsdaten:article:/index.php/ueber-uns/relevante-vereinsdaten#2019-07-03-relevante-vereinsdaten-pfr-dr-karl-zinke-jpg' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/vereinsdaten' AND "sourceDigest" = 'sha256:1d21a14d82b9981794a69b1e5edebfc4933a0493001612981c7975b333800da1' AND "appliedContentDigest" = 'sha256:5a09c4d58955ea6cedf3b989a6eb702c7ffcb5699eb6ad5b89ca94a7d227e5ae' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:page:vereinsbereiche/zeltlager:article:/index.php/vereinsbereiche/zeltlager#2019-07-03-familien-zeltlager-historie-der-kolpingfamilie-ramsen-e7358dfa891b' AND "targetKind" = 'page' AND "targetKey" = 'vereinsbereiche/zeltlager' AND "sourceDigest" = 'sha256:e7358dfa891bde3a8ac401c4034eb30af2497ab9bee5f35ce1d29ccbfbc2cd3e' AND "appliedContentDigest" = 'sha256:8f6af69ebc2197d60de47ba3cc22a4ff66b525e1d1cf8c4ae2bc8d058e0abe40' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:page:rueckblick/presse/kirchner-hans:article:/index.php/rueckblick/presse/kirchner-hans#2025-01-19-nachruf-auf-hans-kirchner-kirchner-hans-2025-01-jpg' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/presse/kirchner-hans' AND "sourceDigest" = 'sha256:1dcdbdb49fb8873f66b32f03985c0f2980f5654d01780e4983595b2dd89d7726' AND "appliedContentDigest" = 'sha256:dc901221070c7577b6c2119df9299433ab8a434050a4cf45e4c05205e49d4fed' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:page:rueckblick/presse/kreativtheater2024-02:article:/index.php/rueckblick/presse/kreativtheater2024-02#2024-12-30-kreativbuehne-2024-pressebericht-vom-30-dezember-kreativtheater-2024-02-jpg' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/presse/kreativtheater2024-02' AND "sourceDigest" = 'sha256:fd75c9ba41478c176bfbdd7d8f13ab34d51261ed24de87f6c9e753db17563e35' AND "appliedContentDigest" = 'sha256:76bd86a0ef3a65c490c980dc5e61474a51bc1a6028a8b3465427b22fde589f83' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:page:rueckblick/prunksitzung/prunksitzung2021:article:/index.php/rueckblick/prunksitzung/prunksitzung2021#2021-02-07-digitale-ramser-fastnacht-2021-plakat-prunk-2021-jpg' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/prunksitzung/prunksitzung2021' AND "sourceDigest" = 'sha256:725059cba64061e09735d9bd4f199bfbc7b3e385ab2cea1739b44834af77883f' AND "appliedContentDigest" = 'sha256:e54bcb7687a10e1f3d4c64c25103c428c35672667154eaf7d98cfa7ade68ccc3' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-content:news:2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen:article:/index.php/aktuelles#2025-10-13-tintenpatronen-sammelaktion-der-kolpingsfamilie-ramsen-tintenpatronen-sammeln-jpg' AND "targetKind" = 'news' AND "targetKey" = '2025-10-13-tintenpatronen-sammelaktion-der-kf-ramsen' AND "sourceDigest" = 'sha256:13f125a2f4043fe07916617cc1b5fc17997005bc7ad5fd7499240b797208c998' AND "appliedContentDigest" = 'sha256:028f22cc239f05b1fae495b9ef6f944d68cb456b711d1326b1ed09e1655c0f80' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-03-20-bezirks-kreuzweg:event:2026-03-20:bezirks-kreuzweg' AND "targetKind" = 'event' AND "targetKey" = '2026-03-20-bezirks-kreuzweg' AND "sourceDigest" = 'sha256:72084d4e239442c33ed41f821129965173a7b168302fb3767e65ab60e5e398f4' AND "appliedContentDigest" = 'sha256:23c2ddd6efe8c6a634777aaaa7bc12eca3cb69793483f232408dc9d36f57762b' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-05-22-bezirksmaiandacht:event:2026-05-22:bezirksmaiandacht' AND "targetKind" = 'event' AND "targetKey" = '2026-05-22-bezirksmaiandacht' AND "sourceDigest" = 'sha256:b1348910e4da16764ba50c34cb62e7a6e3dd4cc189ac0ecbaa99785bcd407862' AND "appliedContentDigest" = 'sha256:7c30eef64154fe94eb33415b2a903b84a389d2f1ab8d6bceca5637884812add2' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-06-14-gottesdienst:event:2026-06-14:gottesdienst-in-der-pfarrkirche' AND "targetKind" = 'event' AND "targetKey" = '2026-06-14-gottesdienst' AND "sourceDigest" = 'sha256:fe30494c2b6c70b0b219d757226e1954b4e3018393a089d10887b3ec144bcb8d' AND "appliedContentDigest" = 'sha256:dc2a2df46a7dd4437b21dddd797d18150782051ac7d30c09d94c474f8331ac73' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-08-21-open-air-theater:event:2026-08-21:open-air-theater' AND "targetKind" = 'event' AND "targetKey" = '2026-08-21-open-air-theater' AND "sourceDigest" = 'sha256:d3e3d0154d990c0659072122fc92bb30fd50eb122a8ebf0d69c56f2ff98a2a00' AND "appliedContentDigest" = 'sha256:102852e5dbaa0fe03a0e0c5302d7291c39072615ddfe1dfbfeb268fc5348b53b' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-08-22-creepshow-open-air-theater:event:2026-08-21:open-air-theater' AND "targetKind" = 'event' AND "targetKey" = '2026-08-22-creepshow-open-air-theater' AND "sourceDigest" = 'sha256:d3e3d0154d990c0659072122fc92bb30fd50eb122a8ebf0d69c56f2ff98a2a00' AND "appliedContentDigest" = 'sha256:9a966b46714c39d99d4b48c0a17910b606f26dad93db8694db0bcf0c78604a0b' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-08-28-open-air-theater:event:2026-08-28:open-air-theater' AND "targetKind" = 'event' AND "targetKey" = '2026-08-28-open-air-theater' AND "sourceDigest" = 'sha256:accf822198528b7fe0bcb4e57aba8b727d30d5e3ebfa1de294187931935a4ed0' AND "appliedContentDigest" = 'sha256:6ee2456f0d40d8ae70946117d229e438bebd95c66554d439fa43a0c526a57f03' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-08-29-creepshow-open-air-theater:event:2026-08-28:open-air-theater' AND "targetKind" = 'event' AND "targetKey" = '2026-08-29-creepshow-open-air-theater' AND "sourceDigest" = 'sha256:accf822198528b7fe0bcb4e57aba8b727d30d5e3ebfa1de294187931935a4ed0' AND "appliedContentDigest" = 'sha256:91ec64e87162834fbf256fdd273d6d7fe252acb9156caaa90563f1ab2108fde1' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-09-05-kennst-du-deine-heimat:event:2026-09-05:kennst-du-deine-heimat-besuch-der-erdekaut-mit-erika-gruen' AND "targetKind" = 'event' AND "targetKey" = '2026-09-05-kennst-du-deine-heimat' AND "sourceDigest" = 'sha256:db577fe31ea2db76146cbaff688433e4f37be48252fe0a95a0f3d1ff0f29cb67' AND "appliedContentDigest" = 'sha256:06c19d0b1c5a802bde59683d8dd02df55a62a5ffad5066399e5a5b2c416ca404' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-11-29-musikalische-adventsandacht:event:2026-11-29:musikalische-adventsandacht-in-der-ev-kirche' AND "targetKind" = 'event' AND "targetKey" = '2026-11-29-musikalische-adventsandacht' AND "sourceDigest" = 'sha256:79cc166985eb5c29b69129c458fd57a023b9b195adf54f8d22656c5d208ca271' AND "appliedContentDigest" = 'sha256:68167af7d65fc1c41f74fb876897d3b838730c0cb7442a3de188293332382795' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'reconcile-event:2026-12-26-theaterauffuehrung:event:2026-12-26:theaterauffuehrung-sollte-es-ein-winterstueck-geben' AND "targetKind" = 'event' AND "targetKey" = '2026-12-26-theaterauffuehrung' AND "sourceDigest" = 'sha256:ae22b24b75b50525cf44055393440bac9ba55d65d73a5fe8129f0a729c862adc' AND "appliedContentDigest" = 'sha256:3afd765ca042170d86d3eca1ebfc9ac0c9b268ae190d16e99684fba5318303d9' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:datenschutz' AND "targetKind" = 'page' AND "targetKey" = 'datenschutz' AND "sourceDigest" = 'sha256:66574e745b930802986779a15bad69359e8b22d5fa7e1a9e417d52eb5de59cea' AND "appliedContentDigest" = 'sha256:353b2aa4ec38955ac6ca3e21bcbeda3d3b636290e93f610aad7f121d6238a51e' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:impressum' AND "targetKind" = 'page' AND "targetKey" = 'impressum' AND "sourceDigest" = 'sha256:d888964f3db1202cdc6b42264de671cdccc657eee346b9225da827b3fe8a0adb' AND "appliedContentDigest" = 'sha256:4935b347f8a7c4bc0ff0e7c6947878e8890fab57b71b1f12f3b36d57e459d01c' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:rueckblick/presse/kirchner-hans' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/presse/kirchner-hans' AND "sourceDigest" = 'sha256:cf81daddeab331783a0b9e376e8da958b76f966e28b35adbd7f9d77c9adf6f99' AND "appliedContentDigest" = 'sha256:648010710165f356a842c4f381870265c558a78689e910c96f01009d6f4e7eaf' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:rueckblick/presse/kreativtheater2024-02' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/presse/kreativtheater2024-02' AND "sourceDigest" = 'sha256:8cea78a43f3413e5284d90a123f8770608d9022f246022d55c99c17fb5d2fcae' AND "appliedContentDigest" = 'sha256:b84d638172122bdb6ba24138c57d46c9ff595a9f70b5d4b5520b37d3f86fd7fd' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:rueckblick/prunksitzung/prunksitzung2021' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/prunksitzung/prunksitzung2021' AND "sourceDigest" = 'sha256:868cbc9703fb7c98d1f8877b8422c766d2a0b72c3e93b36d1d369deb8aacd511' AND "appliedContentDigest" = 'sha256:943c26fc9fa31e884ac5db56bca5c22e9f2918a33716871ede49e3eea97638fe' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:rueckblick/staedtereisen' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/staedtereisen' AND "sourceDigest" = 'sha256:b06fa9338f3e6edec596604aa3ee9d37964ea0a91074dd3571f0ef7dd3545cdf' AND "appliedContentDigest" = 'sha256:fbee9c3faac6e5995da3052449ccff2962a5e5eb83d056404ef107b1800f3a1f' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:rueckblick/trachtengruppe' AND "targetKind" = 'page' AND "targetKey" = 'rueckblick/trachtengruppe' AND "sourceDigest" = 'sha256:c5a559376ecfbeb336a7fe2095007017c8c1688a8065d864fe48ce67119e0799' AND "appliedContentDigest" = 'sha256:34325e22945e6057ff425c71671a153cdf2e84f32be52903c5a6bf6061893154' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:ueber-uns/adolf-kolping' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/adolf-kolping' AND "sourceDigest" = 'sha256:0366c09e1f5eda8abd65174458c17849a347d2268c8970bd8349d95fe3b93691' AND "appliedContentDigest" = 'sha256:02b1e643b01133083e8d70ea6d2ce2ccddda74e7b0e6699f55d5381b73461230' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:ueber-uns/kolpingsfamilie-ramsen' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/kolpingsfamilie-ramsen' AND "sourceDigest" = 'sha256:27638c5f6487697d0a60da28893193c72abf340890e62d6473fecd5efa72203c' AND "appliedContentDigest" = 'sha256:17d093affe17dd18b84a79e0645ebe89fd950be39a6ac4e1846d3cc419450514' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:ueber-uns/vereinsdaten' AND "targetKind" = 'page' AND "targetKey" = 'ueber-uns/vereinsdaten' AND "sourceDigest" = 'sha256:bd6ac86849ffda4d525168376caa937770f4481e8939fe09d973f5a67dfa94f1' AND "appliedContentDigest" = 'sha256:b157c6b8aeb76bb79dd82e8d2b32459453f8c546b01a9b696d9214c080039569' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

INSERT INTO "_LegacyReconciliationAssertion" ("ok") SELECT NULL WHERE (SELECT "isSeeded" FROM "_LegacyReconciliationContext") = 1 AND NOT EXISTS (SELECT 1 FROM "LegacyContentRevision" WHERE "sourceKey" = 'cleanup-metadata:page:vereinsbereiche/zeltlager' AND "targetKind" = 'page' AND "targetKey" = 'vereinsbereiche/zeltlager' AND "sourceDigest" = 'sha256:20c6bfcba5b75f032ea22e12a19967b47df28da2472da441477e765e9f5d4eee' AND "appliedContentDigest" = 'sha256:6ce36077a2ddc1a5fba27c8b40431561a61be5cab39c5d95187a032c76a1734c' AND "snapshotDigest" = 'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1');

DROP TABLE "_LegacyReconciliationAssertion";

DROP TABLE "_LegacyReconciliationContext";

COMMIT;
