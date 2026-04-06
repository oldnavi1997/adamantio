-- AlterTable: Add shippingCost and mpCommission to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "mpCommission" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable: Add documentType and documentNumber to Address
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "documentType" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT NOT NULL DEFAULT '';

-- AlterTable: Add district to Address (if not already present)
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "district" TEXT NOT NULL DEFAULT '';
