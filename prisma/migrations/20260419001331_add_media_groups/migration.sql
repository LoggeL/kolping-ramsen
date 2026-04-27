-- CreateTable
CREATE TABLE "MediaGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaGroupItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaGroupItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MediaGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaGroup_slug_key" ON "MediaGroup"("slug");

-- CreateIndex
CREATE INDEX "MediaGroup_slug_idx" ON "MediaGroup"("slug");

-- CreateIndex
CREATE INDEX "MediaGroupItem_groupId_idx" ON "MediaGroupItem"("groupId");
