/**
 * Inventario por talla.
 *
 * `Product.sizes` solo dice qué tallas existen. Las cantidades viven en la
 * tabla `product_sizes`, una fila por talla, separando tienda y almacén igual
 * que el resto del inventario.
 *
 * Todo el código pregunta por `stockPorTalla`, nunca por `sizes.length`. Esa
 * bandera en falso significa exactamente «compórtate como antes de esta
 * función», y es lo que deja intacto un producto hasta que alguien cuenta sus
 * tallas y lo activa.
 *
 * Cuando la bandera está activa, **los cuatro contadores escalares del producto
 * pasan a ser un resumen derivado** de estas filas: ver `resumenEscalares`. Eso
 * es lo que permite que el catálogo, Algolia, el feed y el inventario del punto
 * de venta sigan leyendo `stock` y `stockHombre` y sigan acertando.
 *
 * ⚠️ El punto de venta (`D:\Cursor\adamantio-puntoventa`) lleva su propia copia
 * de estas reglas en su `lib/tallas.ts`. Los dos ficheros comparten contrato:
 * si cambia uno, cambia el otro, o las dos mitades dejarán de cuadrar sobre la
 * misma base.
 */

export type FilaDeTalla = {
  talla: string;
  stockTienda: number;
  stockAlmacen: number;
  orden: number;
};

export type ProductoConTallas = {
  stockPorTalla: boolean;
  tallas?: FilaDeTalla[];
};

export type TallaDisponible = {
  talla: string;
  tienda: number;
  almacen: number;
  /** Lo que se puede vender de esta talla. Cero significa agotada. */
  total: number;
};

/**
 * Todas las tallas del producto, agotadas incluidas, en el orden de la ficha.
 *
 * Devuelve vacío cuando el producto no lleva inventario por talla, que es la
 * señal de «este producto funciona como siempre». Las agotadas vienen con
 * `total: 0` a propósito: la ficha las pinta deshabilitadas en vez de
 * esconderlas, porque desaparecer una talla del selector confunde más que
 * mostrarla tachada.
 */
export function tallasDeProducto(p: ProductoConTallas): TallaDisponible[] {
  if (!p.stockPorTalla) return [];
  return (p.tallas ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden || a.talla.localeCompare(b.talla))
    .map((t) => ({
      talla: t.talla,
      tienda: t.stockTienda,
      almacen: t.stockAlmacen,
      total: t.stockTienda + t.stockAlmacen,
    }));
}

/** Las que de verdad se pueden comprar ahora mismo. */
export function tallasComprables(p: ProductoConTallas): TallaDisponible[] {
  return tallasDeProducto(p).filter((t) => t.total > 0);
}

/**
 * La talla pedida, o `null` si no se puede vender.
 *
 * Se rechaza en vez de degradar, igual que con las variantes de pareja: servir
 * una talla distinta de la que eligió el comprador es peor que un error que le
 * diga que vuelva a elegir.
 */
export function resolverTalla(
  p: ProductoConTallas,
  pedida: string | null | undefined
): TallaDisponible | null {
  if (!p.stockPorTalla) return null;
  if (!pedida) return null;
  const buscada = pedida.trim();
  return tallasDeProducto(p).find((t) => t.talla === buscada && t.total > 0) ?? null;
}

/**
 * Los cuatro contadores escalares que corresponden a un juego de tallas.
 *
 * En un producto que no es de pareja la columna «hombre» ES el stock: es la que
 * descuenta la web y la única que muestra el inventario del punto de venta. Por
 * eso todo el total va ahí y el lado «dama» queda en cero.
 */
export function resumenEscalares(tallas: { stockTienda: number; stockAlmacen: number }[]): {
  stockHombre: number;
  stockMujer: number;
  stockAlmacenHombre: number;
  stockAlmacenMujer: number;
  stockAlmacen: number;
  stock: number;
} {
  const tienda = tallas.reduce((n, t) => n + t.stockTienda, 0);
  const almacen = tallas.reduce((n, t) => n + t.stockAlmacen, 0);
  return {
    stockHombre: tienda,
    stockMujer: 0,
    stockAlmacenHombre: almacen,
    stockAlmacenMujer: 0,
    stockAlmacen: almacen,
    stock: tienda + almacen,
  };
}
