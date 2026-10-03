-- Tamaño del paquete para la carga masiva de Shalom (columna MERCADERIA de su
-- plantilla). Lo elige el POS por venta; nulo significa el valor por defecto
-- del POS ("PAQUETE XXS"), que es lo que tienen las filas anteriores y las que
-- crea la web.

ALTER TABLE "sale_envios" ADD COLUMN IF NOT EXISTS "mercaderia" TEXT;

ALTER TABLE "sale_envios" DROP CONSTRAINT IF EXISTS "sale_envios_mercaderia_check";
ALTER TABLE "sale_envios" ADD CONSTRAINT "sale_envios_mercaderia_check" CHECK (
    "mercaderia" IS NULL OR "mercaderia" IN
    ('SOBRE', 'PAQUETE XXS', 'PAQUETE XS', 'PAQUETE S', 'PAQUETE M', 'PAQUETE L')
);
