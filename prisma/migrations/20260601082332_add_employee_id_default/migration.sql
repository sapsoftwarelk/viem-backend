/*
  Warnings:

  - You are about to drop the column `fullName` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `pieceCount` on the `ReusableItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Task` table. All the data in the column will be lost.
  - The `priority` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `quantity` on the `Tool` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Vehicle` table. All the data in the column will be lost.
  - Made the column `itemName` on table `ConsumableBatch` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `name` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SiteLocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subCategoryId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConsumableBatch" ALTER COLUMN "itemName" SET NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN IF EXISTS "fullName",
ADD COLUMN IF NOT EXISTS     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ReusableItem" DROP COLUMN IF EXISTS "pieceCount",
ADD COLUMN IF NOT EXISTS     "subCategoryId" INTEGER;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "position_title" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SiteLocation" ADD COLUMN IF NOT EXISTS     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS     "client" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS     "contactNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS     "region" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS     "remarks" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS     "seq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS     "startDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "status" TEXT NOT NULL DEFAULT 'Planning',
ADD COLUMN IF NOT EXISTS     "subLevels" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN IF EXISTS "updatedAt",
DROP COLUMN IF EXISTS "priority",
ADD COLUMN IF NOT EXISTS     "priority" TEXT,
DROP COLUMN IF EXISTS "status",
ADD COLUMN IF NOT EXISTS     "status" TEXT;

-- AlterTable
ALTER TABLE "Tool" DROP COLUMN IF EXISTS "quantity";

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "createdAt",
DROP COLUMN IF EXISTS "updatedAt",
ADD COLUMN IF NOT EXISTS     "subCategoryId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE IF EXISTS "TaskPriority";

-- DropEnum
DROP TYPE IF EXISTS "TaskStatus";

-- AddForeignKey (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vehicle_subCategoryId_fkey') THEN
    ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- AddForeignKey (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReusableItem_subCategoryId_fkey') THEN
    ALTER TABLE "ReusableItem" ADD CONSTRAINT "ReusableItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;
