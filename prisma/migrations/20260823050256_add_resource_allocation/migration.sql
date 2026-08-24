-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('EMPLOYEE', 'VEHICLE');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('IDLE', 'ACTIVE', 'REPAIR', 'ABSENT');

-- CreateTable
CREATE TABLE "ResourceAllocation" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" "ResourceType" NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'IDLE',
    "locationId" TEXT,
    "siteSubId" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResourceAllocation_locationId_idx" ON "ResourceAllocation"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAllocation_resourceId_resourceType_key" ON "ResourceAllocation"("resourceId", "resourceType");

-- AddForeignKey
ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
