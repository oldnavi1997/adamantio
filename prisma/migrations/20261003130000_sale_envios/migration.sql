-- Datos de envío de una venta, para imprimir la etiqueta del paquete.
--
-- Tabla aparte y no columnas en "Sale" a propósito: la nota de venta y su PDF
-- no la leen, así que la ciudad, el celular y la agencia nunca se imprimen en
-- ella. Y no van en "Customer" porque cada envío puede ir a otra persona o a
-- otra agencia.
--
-- La llenan dos caminos: el POS (adamantio-puntoventa) cuando una venta de
-- mostrador se marca "para envío" o se rotula después desde el historial, y la
-- web al emitir la nota de un pedido con Shalom u Olva. Una fila por venta.
--
-- `modalidad` decide qué es `destino`: la sede de la agencia (AGENCIA) o la
-- dirección de entrega (DIRECCION, Olva a domicilio).

CREATE TABLE IF NOT EXISTS "sale_envios" (
    "id"              TEXT         NOT NULL,
    "saleId"          TEXT         NOT NULL,
    "nombre"          TEXT         NOT NULL,
    "tipoDocumento"   TEXT,
    "numeroDocumento" TEXT,
    "celular"         TEXT         NOT NULL,
    "ciudad"          TEXT         NOT NULL,
    "courier"         TEXT         NOT NULL,
    "modalidad"       TEXT         NOT NULL DEFAULT 'AGENCIA',
    "destino"         TEXT         NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_envios_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sale_envios_modalidad_check" CHECK ("modalidad" IN ('AGENCIA', 'DIRECCION'))
);

CREATE UNIQUE INDEX IF NOT EXISTS "sale_envios_saleId_key" ON "sale_envios" ("saleId");

-- CASCADE: sin la venta, la etiqueta no tiene a qué paquete pegarse.
ALTER TABLE "sale_envios" DROP CONSTRAINT IF EXISTS "sale_envios_saleId_fkey";
ALTER TABLE "sale_envios" ADD CONSTRAINT "sale_envios_saleId_fkey"
    FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
