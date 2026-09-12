-- Inventario por talla.
--
-- `Product.sizes` es un array de etiquetas sin cantidades: la ficha ofrece las
-- cinco tallas de un anillo aunque solo quede una del 7. Esta tabla le pone
-- número a cada talla, separando tienda y almacén igual que el resto del
-- inventario.
--
-- Todo el SQL califica `public.` a propósito: la base tiene un esquema `pos`
-- paralelo con otra tabla "Product" que nadie usa, y un DDL sin calificar
-- depende del search_path.

CREATE TABLE public."product_sizes" (
  "id"           TEXT    NOT NULL,
  "productId"    TEXT    NOT NULL,
  "talla"        TEXT    NOT NULL,
  "stockTienda"  INTEGER NOT NULL DEFAULT 0,
  "stockAlmacen" INTEGER NOT NULL DEFAULT 0,
  "orden"        INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "product_sizes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_sizes_productId_talla_key"
  ON public."product_sizes"("productId", "talla");
CREATE INDEX "product_sizes_productId_idx"
  ON public."product_sizes"("productId");

ALTER TABLE public."product_sizes"
  ADD CONSTRAINT "product_sizes_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES public."Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Las cantidades no pueden ser negativas. El POS descuenta stock sin guarda
-- atómica hoy; esta es la red que la base sí puede poner.
ALTER TABLE public."product_sizes"
  ADD CONSTRAINT "product_sizes_no_negativo"
  CHECK ("stockTienda" >= 0 AND "stockAlmacen" >= 0);

-- El interruptor. Falso significa "compórtate como antes de esta función", que
-- es lo que permite contar y activar producto por producto sin que se caiga
-- nada el día del despliegue.
ALTER TABLE public."Product"
  ADD COLUMN "stockPorTalla" BOOLEAN NOT NULL DEFAULT false;

-- Un producto es de pareja o se lleva por talla, nunca las dos cosas: la talla
-- es el único eje de un producto que se vende por talla.
ALTER TABLE public."Product"
  ADD CONSTRAINT "Product_par_o_talla"
  CHECK (NOT ("esPar" AND "stockPorTalla"));

-- Las filas de talla nacen de las que ya declara cada producto, en cero y en el
-- mismo orden, para que el formulario las muestre listas para rellenar. El
-- interruptor sigue apagado: esto todavía no cambia nada de lo que se vende.
INSERT INTO public."product_sizes" ("id", "productId", "talla", "orden")
SELECT
  'ps_' || md5(p."id" || '|' || t."talla"),
  p."id",
  t."talla",
  t."orden" - 1
FROM public."Product" p
CROSS JOIN LATERAL unnest(p."sizes") WITH ORDINALITY AS t("talla", "orden")
WHERE COALESCE(array_length(p."sizes", 1), 0) > 0;

-- Stock varado. En un producto que no es de pareja la columna "hombre" ES el
-- stock: es lo que descuenta la web y lo único que muestra el inventario del
-- POS. Las unidades que quedaron del lado "dama" no las descontaba nadie y no
-- se veían en ninguna pantalla. Se recogen al lado bueno; la suma no cambia, y
-- por tanto `stock` tampoco.
UPDATE public."Product"
SET "stockHombre"        = "stockHombre" + "stockMujer",
    "stockMujer"         = 0,
    "stockAlmacenHombre" = "stockAlmacenHombre" + "stockAlmacenMujer",
    "stockAlmacenMujer"  = 0
WHERE NOT "esPar" AND ("stockMujer" > 0 OR "stockAlmacenMujer" > 0);
