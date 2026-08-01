-- The legacy deployment cached missing /images responses as immutable for one
-- year. Version the newly restored files by content hash so existing CDN 404s
-- cannot hide them after this deployment. Media lookups intentionally strip
-- query strings and still resolve these URLs to the canonical asset records.
UPDATE "Page"
SET
  "content" = replace(
    replace(
      replace(
        replace(
          "content",
          '/images/Dokumente/AntragEinzelmitglied.pdf',
          '/images/Dokumente/AntragEinzelmitglied.pdf?v=f0c157e67fb6'
        ),
        '/images/Dokumente/AntragFamilie.pdf',
        '/images/Dokumente/AntragFamilie.pdf?v=145cf1b181ac'
      ),
      '/images/Dokumente/SEPA.pdf',
      '/images/Dokumente/SEPA.pdf?v=40c43e5ff160'
    ),
    '/images/Dokumente/Beitragspreise.pdf',
    '/images/Dokumente/Beitragspreise.pdf?v=ed5a4d7fd49b'
  ),
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" = 'mitglied-werden'
  AND "content" LIKE '%/images/Dokumente/%'
  AND "content" NOT LIKE '%?v=f0c157e67fb6%';

UPDATE "Page"
SET
  "content" = replace(
    replace(
      replace(
        replace(
          replace(
            "content",
            '/images/Kerwe_2025_01.jpg',
            '/images/Kerwe_2025_01.jpg?v=d307fff759fa'
          ),
          '/images/Kerwe_2025_02.jpg',
          '/images/Kerwe_2025_02.jpg?v=1b1df19d50d9'
        ),
        '/images/Kerwe_2025_03.jpg',
        '/images/Kerwe_2025_03.jpg?v=b9605982e03e'
      ),
      '/images/Kerwe_2025_05.jpg',
      '/images/Kerwe_2025_05.jpg?v=b1a631a8adee'
    ),
    '/images/Kerwe_2025_06.jpg',
    '/images/Kerwe_2025_06.jpg?v=7daa401d8b11'
  ),
  "updatedAt" = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE
  "slug" = 'rueckblick/jahresprogramm/ramser-kerwe-2025'
  AND "content" LIKE '%/images/Kerwe_2025_%'
  AND "content" NOT LIKE '%?v=d307fff759fa%';
