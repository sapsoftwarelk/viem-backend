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
ALTER TABLE "Employee" DROP COLUMN "fullName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ReusableItem" DROP COLUMN "pieceCount",
ADD COLUMN     "subCategoryId" INTEGER;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "position_title" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SiteLocation" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "client" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "contactNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "region" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "remarks" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seq" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Planning',
ADD COLUMN     "subLevels" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "updatedAt",
DROP COLUMN "priority",
ADD COLUMN     "priority" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "subCategoryId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "TaskPriority";

-- DropEnum
DROP TYPE "TaskStatus";

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReusableItem" ADD CONSTRAINT "ReusableItem_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
