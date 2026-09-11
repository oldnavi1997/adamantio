-- Qué mitad de un anillo de pareja se compró: 'HOMBRE' | 'MUJER' | 'PAREJA'.
--
-- TEXT y no un enum a propósito. `Genero` es un enum compartido con el POS y no
-- tiene un valor para "pareja"; añadírselo haría que el POS leyera un valor que
-- su cliente no conoce. El POS ya resuelve lo mismo con un string libre en
-- `SaleItem.generoVenta`.
--
-- Nullable y sin backfill: NULL no es un hueco, es un significado. En un
-- producto que no es par no aplica, y en las órdenes anteriores a esta función
-- quiere decir la pareja completa, que era la única forma de comprar. Esa regla
-- vive en `piezasDeVariante()` de `lib/variantes.ts`.
ALTER TABLE "OrderItem" ADD COLUMN "variante" TEXT;

-- El vocabulario es cerrado y la columna decide de qué lado se descuenta el
-- stock. Una errata descontaría del lado equivocado sin que nada se quejara.
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_variante_check"
  CHECK ("variante" IS NULL OR "variante" IN ('HOMBRE', 'MUJER', 'PAREJA'));
