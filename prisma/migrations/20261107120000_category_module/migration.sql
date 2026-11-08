-- Módulo de categorías: jerarquía de hasta 3 niveles, slug, SEO y asignación
-- de un producto a varias categorías. Todo es aditivo: ninguna columna ni fila
-- existente se borra o cambia de significado. El POS comparte `categories` y
-- "Product" y no conoce estas columnas, por eso todas son nullable o tienen
-- default.

-- ─── categories: columnas nuevas ─────────────────────────────────────────────
ALTER TABLE "categories"
  ADD COLUMN "slug"             TEXT,
  ADD COLUMN "description"      TEXT,
  ADD COLUMN "image"            TEXT,
  ADD COLUMN "banner"           TEXT,
  ADD COLUMN "level"            INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "is_active"        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "meta_title"       TEXT,
  ADD COLUMN "meta_description" TEXT;

-- Nivel de cada categoría según su cadena de padres. El tope de 10 vueltas es
-- solo una guarda contra un ciclo ya existente: sin ella el CTE no termina.
WITH RECURSIVE arbol AS (
  SELECT id, 1 AS nivel FROM "categories" WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, a.nivel + 1
  FROM "categories" c
  JOIN arbol a ON c.parent_id = a.id
  WHERE a.nivel < 10
)
UPDATE "categories" c SET "level" = a.nivel FROM arbol a WHERE c.id = a.id;

-- Si hay un 4.º nivel (o un ciclo, que deja filas sin alcanzar desde una raíz)
-- se aborta en vez de recortar en silencio: alguien tiene que decidir dónde va.
DO $$
DECLARE
  profundas INTEGER;
  huerfanas INTEGER;
BEGIN
  SELECT count(*) INTO profundas FROM "categories" WHERE "level" > 3;
  WITH RECURSIVE alcanzables AS (
    SELECT id, 1 AS n FROM "categories" WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, a.n + 1 FROM "categories" c JOIN alcanzables a ON c.parent_id = a.id WHERE a.n < 10
  )
  SELECT count(*) INTO huerfanas FROM "categories" WHERE id NOT IN (SELECT id FROM alcanzables);
  IF profundas > 0 OR huerfanas > 0 THEN
    RAISE EXCEPTION 'categories: % fila(s) con más de 3 niveles y % fuera del árbol (ciclo). Corrige la jerarquía antes de aplicar esta migración.', profundas, huerfanas;
  END IF;
END $$;

ALTER TABLE "categories" ADD CONSTRAINT "categories_level_check" CHECK ("level" BETWEEN 1 AND 3);
ALTER TABLE "categories" ADD CONSTRAINT "categories_not_own_parent" CHECK (parent_id IS NULL OR parent_id <> id);

-- Slug: misma regla que `slugFromName()` en lib/utils.ts y que el backfill de
-- "Product".slug (20260911120000_add_product_slug). Si dos nombres caen en el
-- mismo slug, el segundo se numera.
WITH base AS (
  SELECT
    id,
    created_at,
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
  FROM "categories"
),
numerados AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY created_at, id) AS n
  FROM base
  WHERE s IS NOT NULL
)
UPDATE "categories" c
SET "slug" = CASE WHEN num.n = 1 THEN num.s ELSE num.s || '-' || num.n END
FROM numerados num
WHERE c.id = num.id;

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_parent_id_sort_order_idx" ON "categories"("parent_id", "sort_order");

-- ─── product_categories ──────────────────────────────────────────────────────
CREATE TABLE "product_categories" (
  "product_id"  TEXT NOT NULL,
  "category_id" TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("product_id", "category_id")
);

CREATE INDEX "product_categories_category_id_product_id_idx" ON "product_categories"("category_id", "product_id");

ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RESTRICT: una categoría con productos no se borra; se vacía o se desactiva.
ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Cada producto entra con la categoría que ya tenía.
INSERT INTO "product_categories" ("product_id", "category_id")
SELECT id, "categoryId" FROM "Product" WHERE "categoryId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─── La principal siempre tiene su fila ─────────────────────────────────────
-- El POS cambia "Product"."categoryId" sin saber de esta tabla. Este trigger
-- hace que el cambio se vea igual en la tienda: quita la fila de la principal
-- anterior y crea la de la nueva. La web escribe primero el producto y después
-- reconcilia el conjunto completo, así que el trigger nunca le gana.
CREATE OR REPLACE FUNCTION "product_categories_sync_principal"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD."categoryId" IS NOT NULL
     AND OLD."categoryId" IS DISTINCT FROM NEW."categoryId" THEN
    DELETE FROM "product_categories"
    WHERE "product_id" = NEW.id AND "category_id" = OLD."categoryId";
  END IF;
  IF NEW."categoryId" IS NOT NULL THEN
    INSERT INTO "product_categories" ("product_id", "category_id")
    VALUES (NEW.id, NEW."categoryId")
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "product_categories_sync_principal"
AFTER INSERT OR UPDATE OF "categoryId" ON "Product"
FOR EACH ROW EXECUTE FUNCTION "product_categories_sync_principal"();
