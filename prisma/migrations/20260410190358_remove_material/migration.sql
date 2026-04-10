/*
  Warnings:

  - You are about to drop the column `material` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "material";

-- DropEnum
DROP TYPE "Material";
