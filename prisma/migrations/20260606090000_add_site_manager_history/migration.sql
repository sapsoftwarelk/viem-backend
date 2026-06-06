CREATE TABLE "SiteManagerHistory" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,

    CONSTRAINT "SiteManagerHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SiteManagerHistory" ADD CONSTRAINT "SiteManagerHistory_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
