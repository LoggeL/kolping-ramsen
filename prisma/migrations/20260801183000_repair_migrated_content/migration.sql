-- Repair one legacy duplicate without keeping a second public canonical page.
-- The content remains available as a draft for editors, with all surviving
-- image references corrected for previewing.
UPDATE "Page"
SET
  "content" = replace(
    replace(
      replace(
        replace(
          "content",
          '![P3161033](/images/P3161033.JPG)',
          ''
        ),
        '/images/P3161030.JPG',
        '/images/imported/ueber-uns/P3161030.JPG'
      ),
      '/images/P3161022.JPG',
      '/images/imported/ueber-uns/P3161022.JPG'
    ),
    '/images/P3161028.JPG',
    '/images/imported/ueber-uns/P3161028.JPG'
  ),
  "published" = false,
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" = 'ueber-uns/geschichte-pfarrheim'
  AND "title" = 'Die Geschichte des katholischen Pfarrheims'
  AND length("content") = 1350
  AND "content" LIKE '# Die Geschichte des katholischen Pfarrheims%'
  AND "content" LIKE '%![P3161033](/images/P3161033.JPG)%'
  AND "content" LIKE '%![P3161030](/images/P3161030.JPG)%'
  AND "content" LIKE '%Außengelände von der KF angelegt%';

INSERT OR IGNORE INTO "Redirect" (
  "id",
  "fromPath",
  "toPath",
  "createdAt"
)
VALUES (
  'content_repair_20260801_pfarrheim_redirect',
  '/ueber-uns/geschichte-pfarrheim',
  '/ueber-uns/pfarrheim',
  CURRENT_TIMESTAMP
);

-- These two records are unambiguously non-editorial: one has no body after
-- import and one is the application's initial demo announcement.
UPDATE "News"
SET
  "published" = false,
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" = '2025-09-06-strick-und-haekeln'
  AND length(trim("content")) = 0;

UPDATE "News"
SET
  "published" = false,
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" = 'willkommen-auf-der-neuen-website'
  AND "title" = 'Willkommen auf unserer neuen Website'
  AND "teaser" = 'Die Kolpingsfamilie Ramsen hat einen neuen Webauftritt — moderner, schneller und leichter zu pflegen.'
  AND "content" = 'Liebe Mitglieder und Freunde der Kolpingsfamilie Ramsen,

wir freuen uns, euch unsere neu gestaltete Website präsentieren zu dürfen. Hier findet ihr alle Neuigkeiten, Termine und Informationen rund um unsere Vereinsbereiche.';

-- Normalize both the canonical and retained legacy Impressum records.
UPDATE "Page"
SET
  "content" = replace(
    replace(
      "content",
      '/index.php/component/content/article/datenschutzerklaerung?catid=2:uncategorised',
      '/datenschutz'
    ),
    '/component/content/article/datenschutzerklaerung?catid=2:uncategorised',
    '/datenschutz'
  ),
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" IN ('impressum', 'kontakt/impressum')
  AND "content" LIKE '%component/content/article/datenschutzerklaerung%';
