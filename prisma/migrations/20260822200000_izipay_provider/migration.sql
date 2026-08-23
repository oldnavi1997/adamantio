-- Pasarela con la que se cobró la orden. Las existentes son todas de Mercado
-- Pago, que es lo único que había hasta ahora.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT NOT NULL DEFAULT 'mercadopago';

-- Guarda de idempotencia para la aprobación: se marca en el mismo UPDATE que
-- pone la orden en PAID, así que sólo una vía puede descontar stock. Hace falta
-- porque con Izipay la respuesta del navegador y el IPN compiten en cada venta.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stockDeducted" BOOLEAN NOT NULL DEFAULT false;

-- Las órdenes ya cobradas se marcan como descontadas: su stock salió por el
-- camino viejo, y dejarlas en `false` permitiría que una reaprobación volviera a
-- descontarlo. SHIPPED cuenta: para enviarse tuvo que pagarse antes.
UPDATE "Order" SET "stockDeducted" = true WHERE "status" IN ('PAID', 'SHIPPED');
