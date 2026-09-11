-- Tramo legible en /joyas/<slug>. Nullable a propósito: el POS escribe en esta
-- misma tabla sin pasar por la web, y un producto sin slug cae al `id`.
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;

-- Backfill. Va aquí dentro y no en un script aparte porque en producción lo
-- único que corre es `prisma migrate deploy` (ver vercel.json).
WITH base AS (
  SELECT
    id,
    "createdAt",
    NULLIF(
      regexp_replace(
        regexp_replace(
          lower(translate(
            name,
            'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
            'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
          )),
          '[^a-z0-9]+', '-', 'g'
        ),
        '(^-+)|(-+$)', '', 'g'
      ),
      ''
    ) AS s
  FROM "Product"
),
numerados AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY "createdAt", id) AS n
  FROM base
  WHERE s IS NOT NULL
)
UPDATE "Product" p
SET "slug" = CASE WHEN num.n = 1 THEN num.s ELSE num.s || '-' || num.n END
FROM numerados num
WHERE p.id = num.id;

-- Red de seguridad: dos nombres distintos pueden aterrizar en el mismo slug
-- numerado ("Aro 2" y un segundo "Aro"). El que sobra se queda con su `id`,
-- que es la PK y por tanto no choca, antes de crear el índice único.
WITH dup AS (
  SELECT id, row_number() OVER (PARTITION BY "slug" ORDER BY "createdAt", id) AS n
  FROM "Product"
  WHERE "slug" IS NOT NULL
)
UPDATE "Product" p
SET "slug" = p.id
FROM dup
WHERE p.id = dup.id AND dup.n > 1;

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
