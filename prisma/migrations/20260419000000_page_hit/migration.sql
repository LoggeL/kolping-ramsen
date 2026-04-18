-- CreateTable
CREATE TABLE "PageHit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PageHit_path_idx" ON "PageHit"("path");

-- CreateIndex
CREATE INDEX "PageHit_createdAt_idx" ON "PageHit"("createdAt");
