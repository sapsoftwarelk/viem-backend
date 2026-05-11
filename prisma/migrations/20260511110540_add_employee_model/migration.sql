/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `SubCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `SubCategory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('PROCURED', 'IN_WAREHOUSE', 'READY', 'IN_TRANSIT', 'ON_SITE', 'RETURN_INITIATED', 'RETURNING', 'RECEIVED_AT_WH', 'DAMAGED', 'IN_REPAIR', 'INSPECTION', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('PO', 'GRN', 'SRN', 'GIN', 'GRIN', 'GRNI', 'TRN', 'DRN', 'RWO', 'SWO', 'THN', 'EXN', 'MHL', 'IAR', 'PAR', 'LMR');

-- CreateEnum
CREATE TYPE "GINStatus" AS ENUM ('DRAFT', 'READY', 'IN_TRANSIT', 'DELIVERED', 'DISCREPANCY', 'RETURNING', 'RTN_TRANSIT', 'RECEIVED_AT_WH', 'CLOSED');

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "contact" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "canCreateUsers" BOOLEAN NOT NULL DEFAULT false,
    "canRaisePO" BOOLEAN NOT NULL DEFAULT false,
    "canConfirmDeliveries" BOOLEAN NOT NULL DEFAULT false,
    "canRunAudits" BOOLEAN NOT NULL DEFAULT false,
    "canLogMachineHours" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "condition" TEXT NOT NULL,
    "maxHours" DOUBLE PRECISION NOT NULL,
    "cumulativeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ToolStatus" NOT NULL DEFAULT 'IN_WAREHOUSE',
    "locationId" TEXT,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "subCategoryId" INTEGER NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumableBatch" (
    "id" TEXT NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "originalBatchId" TEXT,
    "locationId" TEXT,

    CONSTRAINT "ConsumableBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReusableItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "pieceNum" INTEGER NOT NULL,

    CONSTRAINT "ReusableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteLocation" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,

    CONSTRAINT "SiteLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isAdminApproved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "docId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "expectedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("docId")
);

-- CreateTable
CREATE TABLE "GoodsIssueNote" (
    "docId" TEXT NOT NULL,
    "status" "GINStatus" NOT NULL DEFAULT 'DRAFT',
    "isSiteDirect" BOOLEAN NOT NULL DEFAULT false,
    "lmrId" TEXT,
    "readyAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "GoodsIssueNote_pkey" PRIMARY KEY ("docId")
);

-- CreateTable
CREATE TABLE "LorryMovementRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LorryMovementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovementHistory" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovementHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_serialNumber_key" ON "Tool"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_code_key" ON "SubCategory"("code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableBatch" ADD CONSTRAINT "ConsumableBatch_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableBatch" ADD CONSTRAINT "ConsumableBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNote" ADD CONSTRAINT "GoodsIssueNote_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNote" ADD CONSTRAINT "GoodsIssueNote_lmrId_fkey" FOREIGN KEY ("lmrId") REFERENCES "LorryMovementRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_id_fkey" FOREIGN KEY ("id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
