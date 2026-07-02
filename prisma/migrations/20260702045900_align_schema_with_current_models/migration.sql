/*
  Warnings:

  - Made the column `priority` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "employmentType" TEXT NOT NULL DEFAULT 'Permanent';

-- AlterTable
ALTER TABLE "SiteLocation" ADD COLUMN     "manager" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'Medium',
ALTER COLUMN "status" SET DEFAULT 'active';
