-- Persist the fields used by the Goods Return Note (GRTN) workflow.
ALTER TABLE "ReturnNote"
  ADD COLUMN "siteId" TEXT,
  ADD COLUMN "siteName" TEXT,
  ADD COLUMN "subLevel" TEXT,
  ADD COLUMN "destinationType" TEXT,
  ADD COLUMN "destinationId" TEXT,
  ADD COLUMN "destinationName" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "requestedBy" TEXT;

ALTER TABLE "ReturnNoteItem"
  ADD COLUMN "unit" TEXT,
  ADD COLUMN "availableStock" DOUBLE PRECISION,
  ADD COLUMN "reason" TEXT,
  ADD COLUMN "condition" TEXT;
