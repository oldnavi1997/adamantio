-- Nota de venta de los pedidos web.
--
-- Al aprobarse un pedido, la web escribe una fila en "Sale" para que la venta
-- aparezca en el historial del POS (adamantio-puntoventa), igual que en
-- luminus. Este repo gobierna las migraciones de la base compartida; el POS solo
-- declara las columnas en su schema.
--
-- `canal` distingue el mostrador de la web. Es TEXT con CHECK y no un enum para
-- no obligar al POS a migrar un tipo, igual que "OrderItem"."variante".
--
-- `orderId` es UNIQUE: es lo que impide que un pedido genere dos notas, sea
-- por el webhook que compite con el navegador o por el script de relleno.
--
-- `envio` y `comision` existen porque la nota lleva el total cobrado y una
-- venta del POS no tiene dónde ponerlos: "SaleItem"."productId" es NOT NULL.
-- Invariante: total = subtotal - descuento + envio + comision. En el mostrador
-- ambos quedan en 0, así que su aritmética no cambia.

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "canal"    TEXT             NOT NULL DEFAULT 'TIENDA';
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "orderId"  TEXT;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "envio"    DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "comision" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "notas"    TEXT;

ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_canal_check";
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_canal_check" CHECK ("canal" IN ('TIENDA', 'WEB'));

CREATE UNIQUE INDEX IF NOT EXISTS "Sale_orderId_key" ON "Sale" ("orderId");

-- SET NULL y no CASCADE: borrar un pedido no puede llevarse una venta que ya
-- cuenta en los reportes del POS.
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_orderId_fkey";
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
