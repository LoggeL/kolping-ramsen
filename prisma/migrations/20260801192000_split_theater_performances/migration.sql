-- The Joomla calendar encoded pairs of performances as inclusive date ranges.
-- The official theatre schedule lists four separate shows at 20:00 on
-- 21/22/28/29 August 2026. Only touch the unchanged imported records so later
-- editorial work remains authoritative.

INSERT OR IGNORE INTO "Event" (
  "id", "slug", "title", "startDate", "endDate", "startTime", "endTime",
  "allDay", "timeZone", "location", "description", "category", "published",
  "createdAt", "updatedAt", "authorId"
)
SELECT
  'content_repair_20260801_creepshow_22',
  '2026-08-22-creepshow-open-air-theater',
  'Creepshow – Open-Air-Theater',
  '2026-08-22T00:00:00.000Z',
  NULL,
  '20:00',
  NULL,
  false,
  'Europe/Berlin',
  "location",
  '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)',
  'kultur',
  "published",
  "createdAt",
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  "authorId"
FROM "Event"
WHERE
  "slug" = '2026-08-21-open-air-theater'
  AND "title" = 'Open Air Theater'
  AND "description" = '20 Uhr — Open Air Theater auf der Kolpingwiese (Jugend)'
  AND date("endDate") = '2026-08-22';

INSERT OR IGNORE INTO "Event" (
  "id", "slug", "title", "startDate", "endDate", "startTime", "endTime",
  "allDay", "timeZone", "location", "description", "category", "published",
  "createdAt", "updatedAt", "authorId"
)
SELECT
  'content_repair_20260801_creepshow_29',
  '2026-08-29-creepshow-open-air-theater',
  'Creepshow – Open-Air-Theater',
  '2026-08-29T00:00:00.000Z',
  NULL,
  '20:00',
  NULL,
  false,
  'Europe/Berlin',
  "location",
  '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)',
  'kultur',
  "published",
  "createdAt",
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  "authorId"
FROM "Event"
WHERE
  "slug" = '2026-08-28-open-air-theater'
  AND "title" = 'Open Air Theater'
  AND "description" = '20 Uhr — Open Air Theater auf der Kolpingwiese (Jugend)'
  AND date("endDate") = '2026-08-29';

UPDATE "Event"
SET
  "title" = CASE
    WHEN "slug" = '2026-08-21-open-air-theater'
      THEN 'Creepshow – Open-Air-Premiere'
    ELSE 'Creepshow – Open-Air-Theater'
  END,
  "endDate" = NULL,
  "startTime" = '20:00',
  "endTime" = NULL,
  "allDay" = false,
  "timeZone" = 'Europe/Berlin',
  "description" = '20:00 Uhr — „Creepshow“ auf der Kolpingwiese. Der Eintritt ist frei. [Mehr zum Stück](https://kolpingtheater-ramsen.de/)',
  "category" = 'kultur',
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" IN ('2026-08-21-open-air-theater', '2026-08-28-open-air-theater')
  AND "title" = 'Open Air Theater'
  AND "description" = '20 Uhr — Open Air Theater auf der Kolpingwiese (Jugend)'
  AND date("endDate") IN ('2026-08-22', '2026-08-29');
