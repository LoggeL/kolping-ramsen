-- Remove three unambiguous Joomla conversion artifacts while leaving every
-- other editorial change untouched.
UPDATE "Page"
SET
  "content" = replace(
    "content",
    'Jonas Berst, Email: Diese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein.proton.me & Nele Rörig, Email: Diese E-Mail-Adresse ist vor Spambots geschützt! Zur Anzeige muss JavaScript eingeschaltet sein.',
    'Jonas Berst & Nele Rörig – Kontakt über kolping-ramsen(at)gmx.de'
  ),
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" = 'vereinsbereiche/vorstandschaft'
  AND "content" LIKE '%Diese E-Mail-Adresse ist vor Spambots geschützt!%';

UPDATE "Page"
SET
  "content" = replace(
    "content",
    'Engagementpreis_Verleihung_02a.png)0',
    'Engagementpreis_Verleihung_02a.png)'
  ),
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" IN (
    'vereinsbereiche/jugendgruppe',
    'rueckblick/jugendaktivitaeten'
  )
  AND "content" LIKE '%Engagementpreis_Verleihung_02a.png)0%';
