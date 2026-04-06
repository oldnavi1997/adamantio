-- Columnas extra presentes en la BD de ecommerce-f que no estaban en las migraciones originales
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "paymentMethodId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "statusDetail" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
