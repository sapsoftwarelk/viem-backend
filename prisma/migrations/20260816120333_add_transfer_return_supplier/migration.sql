/*
  Warnings:

  - You are about to drop the column `supplier` on the `GoodsReceivedNote` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `PurchaseOrder` table. All the data in the column will be lost.
  - Added the required column `supplierId` to the `GoodsReceivedNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoodsReceivedNote" DROP COLUMN "supplier",
ADD COLUMN     "supplierId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP COLUMN "supplier",
ADD COLUMN     "supplierId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "taxId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferNote" (
    "id" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "fromSiteId" TEXT,
    "sentBy" TEXT,
    "receivedBy" TEXT,
    "vehicleId" TEXT,
    "vehiclePlate" TEXT,
    "toLocationId" TEXT,
    "toSiteId" TEXT,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferNoteItem" (
    "id" TEXT NOT NULL,
    "transferNoteId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TransferNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnNote" (
    "id" TEXT NOT NULL,
    "siteId" TEXT,
    "siteName" TEXT,
    "subLevel" TEXT,
    "destinationType" TEXT,
    "destinationId" TEXT,
    "destinationName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT,
    "fromLocationId" TEXT,
    "fromSiteId" TEXT,
    "toLocationId" TEXT,
    "toSiteId" TEXT,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnNoteItem" (
    "id" TEXT NOT NULL,
    "returnNoteId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "availableStock" DOUBLE PRECISION,
    "reason" TEXT,
    "condition" TEXT,

    CONSTRAINT "ReturnNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairNote" (
    "id" TEXT NOT NULL,
    "locationId" TEXT,
    "siteId" TEXT,
    "vendor" TEXT NOT NULL,
    "repairStatus" TEXT NOT NULL DEFAULT 'Pending',
    "expectedReturnDate" TIMESTAMP(3),
    "remarks" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepairNoteItem" (
    "id" TEXT NOT NULL,
    "repairNoteId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RepairNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");

-- CreateIndex
CREATE INDEX "TransferNoteItem_transferNoteId_idx" ON "TransferNoteItem"("transferNoteId");

-- CreateIndex
CREATE INDEX "ReturnNoteItem_returnNoteId_idx" ON "ReturnNoteItem"("returnNoteId");

-- CreateIndex
CREATE INDEX "RepairNoteItem_repairNoteId_idx" ON "RepairNoteItem"("repairNoteId");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceivedNote" ADD CONSTRAINT "GoodsReceivedNote_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferNote" ADD CONSTRAINT "TransferNote_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferNote" ADD CONSTRAINT "TransferNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferNote" ADD CONSTRAINT "TransferNote_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferNoteItem" ADD CONSTRAINT "TransferNoteItem_transferNoteId_fkey" FOREIGN KEY ("transferNoteId") REFERENCES "TransferNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnNote" ADD CONSTRAINT "ReturnNote_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnNote" ADD CONSTRAINT "ReturnNote_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnNoteItem" ADD CONSTRAINT "ReturnNoteItem_returnNoteId_fkey" FOREIGN KEY ("returnNoteId") REFERENCES "ReturnNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairNote" ADD CONSTRAINT "RepairNote_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SiteLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairNoteItem" ADD CONSTRAINT "RepairNoteItem_repairNoteId_fkey" FOREIGN KEY ("repairNoteId") REFERENCES "RepairNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
