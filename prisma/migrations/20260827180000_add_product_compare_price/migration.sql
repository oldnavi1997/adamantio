-- Precio tachado de una oferta. `price` sigue siendo lo que se cobra.
-- Nullable: la inmensa mayoría de productos no está en oferta.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "comparePrice" DECIMAL(10,2);
