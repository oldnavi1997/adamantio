-- La talla en los movimientos del punto de venta.
--
-- Las dos tablas son suyas, pero la historia de migraciones la gobierna la web,
-- así que las columnas se crean aquí. El POS solo añade los campos a su
-- `schema.prisma` y regenera su cliente.
--
-- `SaleItem.talla` no es un adorno: anular una venta devuelve las unidades al
-- inventario, y sin saber qué talla se vendió no sabría a cuál devolverlas.
ALTER TABLE public."SaleItem"   ADD COLUMN "talla" TEXT;

-- `StockEntry` ya perdía la ubicación y el género de cada entrada. Al menos la
-- talla queda registrada.
ALTER TABLE public."StockEntry" ADD COLUMN "talla" TEXT;
