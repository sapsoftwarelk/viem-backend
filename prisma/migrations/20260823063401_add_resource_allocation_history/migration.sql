-- CreateTable
CREATE TABLE "ResourceAllocationHistory" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "status" "AllocationStatus" NOT NULL,
    "locationId" TEXT,
    "siteSubId" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceAllocationHistory_pkey" PRIMARY KEY ("id")
);
