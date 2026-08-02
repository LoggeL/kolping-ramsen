-- Remove fallback text from News bodies when the same text is already rendered as the teaser.
-- Every update is guarded by the full editorial state and recorded for provenance.
PRAGMA foreign_keys=ON;

BEGIN IMMEDIATE;

CREATE TEMP TABLE "_NewsLeadCleanupContext" (
  "isSeeded" INTEGER NOT NULL CHECK ("isSeeded" IN (0, 1))
);

INSERT INTO "_NewsLeadCleanupContext" ("isSeeded")
SELECT CASE WHEN EXISTS (
  SELECT 1 FROM "LegacyContentRevision"
  WHERE "sourceKey" = 'cleanup-current:page:ueber-uns/vereinsdaten'
    AND "targetKind" = 'page'
    AND "targetKey" = 'ueber-uns/vereinsdaten'
) THEN 1 ELSE 0 END;

CREATE TEMP TABLE "_NewsLeadCleanupBootstrapAssertion" (
  "ok" INTEGER NOT NULL ON CONFLICT ROLLBACK
);

INSERT INTO "_NewsLeadCleanupBootstrapAssertion" ("ok")
SELECT NULL
WHERE (SELECT "isSeeded" FROM "_NewsLeadCleanupContext") = 0
  AND EXISTS (
    SELECT 1 FROM "News" WHERE "slug" = '2025-09-06-strick-und-haekeln'
  );

DROP TABLE "_NewsLeadCleanupBootstrapAssertion";

UPDATE "News"
SET "content" = '',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE (SELECT "isSeeded" FROM "_NewsLeadCleanupContext") = 1
  AND "slug" = '2019-07-03-adresse-pfarrheim'
  AND "title" = 'Adresse Pfarrheim'
  AND "date" = '2019-07-03T00:00:00.000+00:00'
  AND "teaser" = 'Die Adresse des Pfarrheims lautet "67305 Ramsen Klosterhof 7"'
  AND "content" = 'Die Adresse des Pfarrheims lautet "67305 Ramsen Klosterhof 7"'
  AND "coverImage" IS NULL
  AND "published" = 1;

INSERT OR IGNORE INTO "LegacyContentRevision" (
  "id", "sourceKey", "targetKind", "targetKey", "sourceDigest",
  "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt"
)
SELECT
  'legacyrev_65978ce2b0a36dec42563b2a',
  'cleanup-news-lead:2019-07-03-adresse-pfarrheim',
  'news',
  '2019-07-03-adresse-pfarrheim',
  'sha256:c23dd8afe09fa68bd7f5f3434ad17ab29f2a386781185967b2cae0fde4b2a5e7',
  'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE changes() = 1
  AND EXISTS (
    SELECT 1 FROM "News"
    WHERE "slug" = '2019-07-03-adresse-pfarrheim'
      AND "content" = ''
  );

UPDATE "News"
SET "content" = '![Strick und Häkeln](/images/imported/news/Strick_und_H_keln.jpeg?v=6449f8a3b7a3)',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE (SELECT "isSeeded" FROM "_NewsLeadCleanupContext") = 1
  AND "slug" = '2025-09-06-strick-und-haekeln'
  AND "title" = 'Strick und Häkeln'
  AND "date" = '2025-09-06T00:00:00.000Z'
  AND "teaser" = 'Bilder und Erinnerungen aus unserem Vereinsleben vom 6. September 2025.'
  AND "content" = 'Bilder und Erinnerungen aus unserem Vereinsleben vom 6. September 2025.

![Strick und Häkeln](/images/imported/news/Strick_und_H_keln.jpeg?v=6449f8a3b7a3)'
  AND "coverImage" = '/images/imported/news/Strick_und_H_keln.jpeg?v=6449f8a3b7a3'
  AND "published" = 1;

INSERT OR IGNORE INTO "LegacyContentRevision" (
  "id", "sourceKey", "targetKind", "targetKey", "sourceDigest",
  "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt"
)
SELECT
  'legacyrev_69d78c576056266126cb2b17',
  'cleanup-news-lead:2025-09-06-strick-und-haekeln',
  'news',
  '2025-09-06-strick-und-haekeln',
  'sha256:9d9b9580a8fbe661955abb64abf28a19a43977ec800bbdda2b2a54b1e36b42a8',
  'sha256:596e267f68e5133e8bdd465d5304b5471050da7b3e93aa117ded4e67e351489b',
  'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE changes() = 1
  AND EXISTS (
    SELECT 1 FROM "News"
    WHERE "slug" = '2025-09-06-strick-und-haekeln'
      AND "content" = '![Strick und Häkeln](/images/imported/news/Strick_und_H_keln.jpeg?v=6449f8a3b7a3)'
  );

UPDATE "News"
SET "content" = '![Next Generation: Ausflug zum Barfußpfad 2026 – Bild 1](/images/legacy-v2/72/72b679b6d6caaa90a2b2a87ae861f840-w1600-q78.webp)',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = '2026-07-29-next-generation-ausflug-zum-barfusspfad-2026'
  AND "title" = 'Next Generation: Ausflug zum Barfußpfad 2026'
  AND "date" = '2026-07-29T00:00:00.000Z'
  AND "teaser" = 'Bilder und Erinnerungen aus unserem Vereinsleben vom 29. Juli 2026.'
  AND "content" = 'Bilder und Erinnerungen aus unserem Vereinsleben vom 29. Juli 2026.

![Next Generation: Ausflug zum Barfußpfad 2026 – Bild 1](/images/legacy-v2/72/72b679b6d6caaa90a2b2a87ae861f840-w1600-q78.webp)'
  AND "coverImage" = '/images/legacy-v2/72/72b679b6d6caaa90a2b2a87ae861f840-w1600-q78.webp'
  AND "published" = 1;

INSERT OR IGNORE INTO "LegacyContentRevision" (
  "id", "sourceKey", "targetKind", "targetKey", "sourceDigest",
  "appliedContentDigest", "snapshotDigest", "createdAt", "updatedAt"
)
SELECT
  'legacyrev_bbecf073ea72acd61e92d23a',
  'cleanup-news-lead:2026-07-29-next-generation-ausflug-zum-barfusspfad-2026',
  'news',
  '2026-07-29-next-generation-ausflug-zum-barfusspfad-2026',
  'sha256:cb13df1fda2d032f302e0411fcc3cfb39cabd92a18790724974b179a129be4db',
  'sha256:5342daabd40317b3d873f0cf8c60ba92b98d0a9ab2e1ef043b7bb45dd8af9516',
  'sha256:08e8f0a7058f4ee7a1b5d6eed3ae685cc68946f15b3567f2ede66d0e313e70b1',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE changes() = 1
  AND EXISTS (
    SELECT 1 FROM "News"
    WHERE "slug" = '2026-07-29-next-generation-ausflug-zum-barfusspfad-2026'
      AND "content" = '![Next Generation: Ausflug zum Barfußpfad 2026 – Bild 1](/images/legacy-v2/72/72b679b6d6caaa90a2b2a87ae861f840-w1600-q78.webp)'
  );

CREATE TEMP TABLE "_NewsLeadCleanupAssertion" (
  "ok" INTEGER NOT NULL ON CONFLICT ROLLBACK
);

INSERT INTO "_NewsLeadCleanupAssertion" ("ok")
SELECT NULL
WHERE (SELECT "isSeeded" FROM "_NewsLeadCleanupContext") = 1
  AND NOT EXISTS (
    SELECT 1 FROM "LegacyContentRevision"
    WHERE "sourceKey" = 'cleanup-news-lead:2019-07-03-adresse-pfarrheim'
      AND "sourceDigest" = 'sha256:c23dd8afe09fa68bd7f5f3434ad17ab29f2a386781185967b2cae0fde4b2a5e7'
      AND "appliedContentDigest" = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );

INSERT INTO "_NewsLeadCleanupAssertion" ("ok")
SELECT NULL
WHERE (SELECT "isSeeded" FROM "_NewsLeadCleanupContext") = 1
  AND NOT EXISTS (
  SELECT 1 FROM "LegacyContentRevision"
  WHERE "sourceKey" = 'cleanup-news-lead:2025-09-06-strick-und-haekeln'
    AND "sourceDigest" = 'sha256:9d9b9580a8fbe661955abb64abf28a19a43977ec800bbdda2b2a54b1e36b42a8'
    AND "appliedContentDigest" = 'sha256:596e267f68e5133e8bdd465d5304b5471050da7b3e93aa117ded4e67e351489b'
);

INSERT INTO "_NewsLeadCleanupAssertion" ("ok")
SELECT NULL
WHERE NOT EXISTS (
  SELECT 1 FROM "LegacyContentRevision"
  WHERE "sourceKey" = 'cleanup-news-lead:2026-07-29-next-generation-ausflug-zum-barfusspfad-2026'
    AND "sourceDigest" = 'sha256:cb13df1fda2d032f302e0411fcc3cfb39cabd92a18790724974b179a129be4db'
    AND "appliedContentDigest" = 'sha256:5342daabd40317b3d873f0cf8c60ba92b98d0a9ab2e1ef043b7bb45dd8af9516'
);

DROP TABLE "_NewsLeadCleanupAssertion";

DROP TABLE "_NewsLeadCleanupContext";

COMMIT;
