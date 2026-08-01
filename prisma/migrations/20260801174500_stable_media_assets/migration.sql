-- Enrich the central asset catalog. Existing values remain valid and are
-- backfilled by the media sync script after deployment.
ALTER TABLE "MediaAsset" ADD COLUMN "originalName" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "width" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "height" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "sizeBytes" INTEGER;
ALTER TABLE "MediaAsset" ADD COLUMN "sha256" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "caption" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "credit" TEXT;

CREATE INDEX "MediaAsset_sha256_idx" ON "MediaAsset"("sha256");

-- Every legacy gallery path becomes an asset before the relation is rebuilt.
INSERT OR IGNORE INTO "MediaAsset" (
  "id", "path", "alt", "createdAt", "updatedAt"
)
SELECT
  'legacy_' || lower(hex(randomblob(16))),
  ltrim("path", '/'),
  '',
  min("createdAt"),
  CURRENT_TIMESTAMP
FROM "MediaGroupItem"
GROUP BY ltrim("path", '/');

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_MediaGroupItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "groupId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "alt" TEXT,
  "caption" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaGroupItem_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "MediaGroup"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MediaGroupItem_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_MediaGroupItem" (
  "id", "groupId", "assetId", "sortOrder", "createdAt"
)
SELECT
  item."id",
  item."groupId",
  asset."id",
  item."sortOrder",
  item."createdAt"
FROM "MediaGroupItem" item
JOIN "MediaAsset" asset ON asset."path" = ltrim(item."path", '/');

DROP TABLE "MediaGroupItem";
ALTER TABLE "new_MediaGroupItem" RENAME TO "MediaGroupItem";

CREATE INDEX "MediaGroupItem_groupId_idx" ON "MediaGroupItem"("groupId");
CREATE INDEX "MediaGroupItem_assetId_idx" ON "MediaGroupItem"("assetId");

PRAGMA foreign_keys=ON;
