-- Documento de identidad en Customer.
--
-- Lo usa el POS (adamantio-puntoventa), que lo consulta contra RENIEC/SUNAT para
-- autocompletar el cliente. Se registra aquí porque este repo gobierna las
-- migraciones de la base compartida: sin esta migración, el schema de la web y
-- la base divergirían y un push dropearía las columnas con los datos dentro.
--
-- Columnas nullable y no DEFAULT '': hay filas históricas sin documento y con el
-- índice único de abajo todas colisionarían en ('', ''). En Postgres los NULL
-- son distintos entre sí, así que conviven.

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "documentType"   TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "documentNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "address"        TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_documentType_documentNumber_key"
    ON "Customer" ("documentType", "documentNumber");

CREATE INDEX IF NOT EXISTS "Customer_documentNumber_idx"
    ON "Customer" ("documentNumber");
