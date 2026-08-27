-- Courier elegido en el checkout ("shalom" | "olva").
-- Nullable a propósito: las órdenes anteriores no lo tienen guardado.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "courier" TEXT;
