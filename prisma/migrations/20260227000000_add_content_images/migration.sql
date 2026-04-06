-- AlterTable: Add contentImages to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "contentImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
