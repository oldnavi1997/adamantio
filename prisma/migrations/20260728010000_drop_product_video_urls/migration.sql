-- Los videos vuelven a `imageUrls`, que pasa a ser una lista de media mezclada
-- (fotos y videos) en el orden en que se muestran en la galería. Ver `lib/media.ts`.

-- 1) Rescatar los videos que hubiera en `videoUrls`, agregándolos al final de la galería.
UPDATE "Product"
SET "imageUrls" = "imageUrls" || "videoUrls"
WHERE array_length("videoUrls", 1) > 0;

-- 2) La columna deja de tener sentido.
ALTER TABLE "Product" DROP COLUMN IF EXISTS "videoUrls";
