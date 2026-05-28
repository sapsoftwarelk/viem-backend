/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `SubCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `SubCategory` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ToolStatus" AS ENUM ('PROCURED', 'IN_WAREHOUSE', 'READY', 'IN_TRANSIT', 'ON_SITE', 'RETURN_INITIATED', 'RETURNING', 'RECEIVED_AT_WH', 'DAMAGED', 'IN_REPAIR', 'INSPECTION', 'SCRAPPED');

-- CreateEnum
CREATE TYPE "ConsumableBatchStatus" AS ENUM ('AVAILABLE', 'DEPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('PO', 'GRN', 'SRN', 'GIN', 'GRIN', 'GRNI', 'TRN', 'DRN', 'RWO', 'SWO', 'THN', 'EXN', 'MHL', 'IAR', 'PAR', 'LMR');

-- CreateEnum
CREATE TYPE "GINItemType" AS ENUM ('TOOL', 'CONSUMABLE', 'REUSABLE');

-- CreateEnum
CREATE TYPE "GINStatus" AS ENUM ('DRAFT', 'READY', 'IN_TRANSIT', 'DELIVERED', 'DISCREPANCY', 'RETURNING', 'RTN_TRANSIT', 'RECEIVED_AT_WH', 'CLOSED');

-- CreateEnum
CREATE TYPE "LMRStatus" AS ENUM ('LOADED', 'IN_TRANSIT', 'DELIVERED', 'RETURNING', 'RETURNED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('Active', 'Inactive');

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "SubCategory" ADD COLUMN     "code" TEXT NOT NULL;

-- DropTable
DROP TABLE "Item";

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT '',
    "employeeId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "contact" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleId" TEXT,
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
    "position_title" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT NOT NULL DEFAULT '',
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
    "itemName" TEXT,
    "model" TEXT NOT NULL,
    "description" TEXT,
    "supplier" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "quantity" INTEGER,
    "bladeType" TEXT,
    "serialNumber" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "maxHours" DOUBLE PRECISION NOT NULL,
    "cumulativeHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ToolStatus" NOT NULL DEFAULT 'IN_WAREHOUSE',
    "locationId" TEXT,
    "grnId" TEXT,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "insuranceExpiry" TIMESTAMP(3) NOT NULL,
    "registrationExpiry" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumableBatch" (
    "id" TEXT NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "itemName" TEXT,
    "description" TEXT,
    "supplier" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "batchDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "status" "ConsumableBatchStatus" NOT NULL DEFAULT 'AVAILABLE',
    "locationId" TEXT,
    "originalBatchId" TEXT,
    "grnId" TEXT,

    CONSTRAINT "ConsumableBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReusableItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "itemName" TEXT,
    "description" TEXT,
    "supplier" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "status" TEXT,
    "locationId" TEXT,
    "pieceCount" INTEGER,
    "individualTracking" BOOLEAN DEFAULT false,
    "pieceNum" INTEGER NOT NULL,
    "grnId" TEXT,

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
CREATE TABLE "GoodsReceivedNote" (
    "docId" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceivedNote_pkey" PRIMARY KEY ("docId")
);

-- CreateTable
CREATE TABLE "ExpiryNote" (
    "docId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpiryNote_pkey" PRIMARY KEY ("docId")
);

-- CreateTable
CREATE TABLE "GoodsIssueNote" (
    "docId" TEXT NOT NULL,
    "status" "GINStatus" NOT NULL DEFAULT 'DRAFT',
    "isSiteDirect" BOOLEAN NOT NULL DEFAULT false,
    "lmrId" TEXT,
    "siteLocationId" TEXT,
    "qrCodeDataUrl" TEXT,
    "qrPayload" TEXT,
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
    "status" "LMRStatus" NOT NULL DEFAULT 'LOADED',
    "originLocationId" TEXT,
    "destinationLocationId" TEXT,
    "expectedReturnTime" TIMESTAMP(3),
    "arrivalTime" TIMESTAMP(3),
    "actualReturnTime" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "LorryMovementRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsIssueNoteItem" (
    "id" TEXT NOT NULL,
    "ginId" TEXT NOT NULL,
    "itemType" "GINItemType" NOT NULL,
    "toolId" TEXT,
    "reusableId" TEXT,
    "consumableId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "scannedCount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fifoOverride" BOOLEAN NOT NULL DEFAULT false,
    "fifoOverrideReason" TEXT,
    "fifoOverrideApprovedBy" TEXT,
    "fifoOverrideApprovedAt" TIMESTAMP(3),

    CONSTRAINT "GoodsIssueNoteItem_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'Medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_position_title_key" ON "Role"("position_title");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_serialNumber_key" ON "Tool"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNo_key" ON "Vehicle"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceivedNote_poId_key" ON "GoodsReceivedNote"("poId");

-- CreateIndex
CREATE UNIQUE INDEX "SubCategory_code_key" ON "SubCategory"("code");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote"("docId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableBatch" ADD CONSTRAINT "ConsumableBatch_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableBatch" ADD CONSTRAINT "ConsumableBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableBatch" ADD CONSTRAINT "ConsumableBatch_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote"("docId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReusableItem" ADD CONSTRAINT "ReusableItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReusableItem" ADD CONSTRAINT "ReusableItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceivedNote"("docId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivedNote" ADD CONSTRAINT "GoodsReceivedNote_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivedNote" ADD CONSTRAINT "GoodsReceivedNote_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("docId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryNote" ADD CONSTRAINT "ExpiryNote_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpiryNote" ADD CONSTRAINT "ExpiryNote_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ConsumableBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNote" ADD CONSTRAINT "GoodsIssueNote_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNote" ADD CONSTRAINT "GoodsIssueNote_lmrId_fkey" FOREIGN KEY ("lmrId") REFERENCES "LorryMovementRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNote" ADD CONSTRAINT "GoodsIssueNote_siteLocationId_fkey" FOREIGN KEY ("siteLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_id_fkey" FOREIGN KEY ("id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_originLocationId_fkey" FOREIGN KEY ("originLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LorryMovementRecord" ADD CONSTRAINT "LorryMovementRecord_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNoteItem" ADD CONSTRAINT "GoodsIssueNoteItem_ginId_fkey" FOREIGN KEY ("ginId") REFERENCES "GoodsIssueNote"("docId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNoteItem" ADD CONSTRAINT "GoodsIssueNoteItem_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNoteItem" ADD CONSTRAINT "GoodsIssueNoteItem_reusableId_fkey" FOREIGN KEY ("reusableId") REFERENCES "ReusableItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsIssueNoteItem" ADD CONSTRAINT "GoodsIssueNoteItem_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "ConsumableBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
