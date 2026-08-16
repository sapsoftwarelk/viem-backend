CREATE TABLE IF NOT EXISTS "SiteManagerHistory" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "SiteManagerHistory_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SiteManagerHistory_siteId_fkey') THEN
        ALTER TABLE "SiteManagerHistory" ADD CONSTRAINT "SiteManagerHistory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
