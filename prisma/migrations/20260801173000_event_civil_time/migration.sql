-- Events are community calendar entries. Dates are civil dates, while optional
-- wall-clock times are stored separately and interpreted in Europe/Berlin.
-- This avoids accidental UTC/browser timezone shifts for all-day entries.
ALTER TABLE "Event" ADD COLUMN "startTime" TEXT;
ALTER TABLE "Event" ADD COLUMN "endTime" TEXT;
ALTER TABLE "Event" ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Event" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'Europe/Berlin';

UPDATE "Event"
SET "startTime" = CASE
  WHEN "description" GLOB '[0-2][0-9]:[0-5][0-9]*'
    AND CAST(substr("description", 1, 2) AS INTEGER) BETWEEN 0 AND 23
    THEN substr("description", 1, 5)
  WHEN "description" GLOB '[0-2][0-9].[0-5][0-9]*'
    AND CAST(substr("description", 1, 2) AS INTEGER) BETWEEN 0 AND 23
    THEN replace(substr("description", 1, 5), '.', ':')
  WHEN "description" GLOB '[0-2][0-9] Uhr*'
    AND CAST(substr("description", 1, 2) AS INTEGER) BETWEEN 0 AND 23
    THEN substr("description", 1, 2) || ':00'
  WHEN "description" GLOB '[0-9]:[0-5][0-9]*'
    THEN '0' || substr("description", 1, 4)
  WHEN "description" GLOB '[0-9].[0-5][0-9]*'
    THEN '0' || replace(substr("description", 1, 4), '.', ':')
  WHEN "description" GLOB '[0-9] Uhr*'
    THEN '0' || substr("description", 1, 1) || ':00'
  WHEN time("startDate") <> '00:00:00'
    THEN strftime('%H:%M', "startDate")
  ELSE NULL
END;

UPDATE "Event"
SET "endTime" = CASE
    WHEN "description" GLOB '[0-2][0-9]:[0-5][0-9] – [0-2][0-9]:[0-5][0-9]*'
      THEN substr("description", 9, 5)
    WHEN "endDate" IS NOT NULL AND time("endDate") <> '00:00:00'
      THEN strftime('%H:%M', "endDate")
    ELSE NULL
  END;

UPDATE "Event"
SET "allDay" = CASE WHEN "startTime" IS NULL THEN true ELSE false END;

-- `alle` was the importer placeholder. Preserve categories explicitly chosen
-- by editors in the previous admin interface.
UPDATE "Event"
SET "category" = CASE
    WHEN lower("title" || ' ' || "description") LIKE '%jugend%'
      THEN 'jugend'
    WHEN lower("title" || ' ' || "description") LIKE '%next generation%'
      OR lower("title" || ' ' || "description") LIKE '%famil%'
      OR lower("title" || ' ' || "description") LIKE '%zeltlager%'
      THEN 'familie'
    WHEN lower("title" || ' ' || "description") LIKE '%blaskapelle%'
      OR lower("title" || ' ' || "description") LIKE '%konzert%'
      THEN 'kapelle'
    WHEN lower("title" || ' ' || "description") LIKE '%bezirks%'
      OR lower("title" || ' ' || "description") LIKE '%diözesan%'
      THEN 'bezirk'
    WHEN lower("title" || ' ' || "description") LIKE '%gottesdienst%'
      OR lower("title" || ' ' || "description") LIKE '%andacht%'
      OR lower("title" || ' ' || "description") LIKE '%kolpinggedenktag%'
      OR lower("title" || ' ' || "description") LIKE '%rosenkranz%'
      THEN 'glaube'
    WHEN lower("title" || ' ' || "description") LIKE '%theater%'
      OR lower("title" || ' ' || "description") LIKE '%prunksitzung%'
      OR lower("title" || ' ' || "description") LIKE '%krimidinner%'
      THEN 'kultur'
    ELSE 'verein'
  END
WHERE "category" = 'alle';

-- The time components now live in dedicated wall-clock fields. Store the
-- remaining values as timezone-independent civil dates at UTC midnight.
UPDATE "Event"
SET
  "startDate" = substr("startDate", 1, 10) || 'T00:00:00.000Z',
  "endDate" = CASE
    WHEN "endDate" IS NULL THEN NULL
    ELSE substr("endDate", 1, 10) || 'T00:00:00.000Z'
  END;

-- The imported source literally contains an unresolved location placeholder.
-- Keep the record for editorial repair, but do not publish misinformation.
UPDATE "Event"
SET "published" = false
WHERE "description" LIKE '%?????%';
