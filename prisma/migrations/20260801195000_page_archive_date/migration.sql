-- Keep chronological archive ordering independent from the manual navigation order.
ALTER TABLE "Page" ADD COLUMN "archiveDate" DATETIME;

CREATE INDEX "Page_parent_archiveDate_idx" ON "Page"("parent", "archiveDate");
