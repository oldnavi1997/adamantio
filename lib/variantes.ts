/**
 * Venta por variante de los anillos de pareja.
 *
 * Un producto `esPar` se vendía solo como pareja. Ahora el comprador puede
 * llevarse el anillo de hombre, el de dama o los dos. El precio de cada mitad
 * sale de los campos que el POS ya mantenía (`precioVentaHombre`,
 * `precioVentaMujer`) y el stock de los contadores separados por lado.
 *
 * Todo el resto del código pregunta por `porVariante`, nunca por `esPar`. Esa
 * bandera en falso significa exactamente "compórtate como antes de esta
 * función", y es lo que mantiene intactos los productos normales y los pares a
 * los que todavía no se les ha cargado un precio individual.
 *
 * La regla de compatibilidad está en un solo sitio, `piezasDeVariante`:
 * **una variante nula sobre un producto `esPar` es la pareja completa.** Eso
 * cubre los carritos ya guardados en el navegador y las órdenes creadas antes
 * del despliegue que se paguen después, sin una sola rama para el pasado.
 *
 * El módulo no importa Prisma ni React: lo usan por igual el Server Component
 * de la ficha, el componente de cliente y las rutas de API.
 */

export type Variante = "HOMBRE" | "MUJER" | "PAREJA";

export const ETIQUETA_VARIANTE: Record<Variante, string> = {
  HOMBRE: "Solo anillo de hombre",
  MUJER: "Solo anillo de dama",
  PAREJA: "La pareja, dos anillos",
};

/** Para la píldora del selector, donde no cabe la etiqueta larga. */
export const ETIQUETA_CORTA: Record<Variante, string> = {
  HOMBRE: "Hombre",
  MUJER: "Dama",
  PAREJA: "Pareja",
};

/** El orden en que se ofrecen; la pareja al final, como el cierre natural. */
const ORDEN: Variante[] = ["HOMBRE", "MUJER", "PAREJA"];

/**
 * Forma estructural en vez de `Product`, para que valga igual con el modelo de
 * Prisma, con un `select` parcial y con el objeto ya serializado del cliente.
 */
export type ProductoConVariantes = {
  esPar: boolean;
  /** `Decimal` en Prisma, string una vez serializado. */
  price: unknown;
  precioVentaHombre: number;
  precioVentaMujer: number;
  stockHombre: number;
  stockMujer: number;
  stockAlmacenHombre: number;
  stockAlmacenMujer: number;
};

export type VarianteOfertada = {
  id: Variante;
  etiqueta: string;
  etiquetaCorta: string;
  /** Soles, ya redondeado a céntimos. Siempre mayor que cero. */
  precio: number;
  /** Unidades comprables de esta variante en concreto. */
  stock: number;
};

export type OpcionesDeVariante = {
  /** Falso significa "como antes": ni selector, ni precio por variante. */
  porVariante: boolean;
  /** Vacío cuando `porVariante` es falso. */
  variantes: VarianteOfertada[];
  predeterminada: Variante | null;
};

export function esVariante(v: unknown): v is Variante {
  return v === "HOMBRE" || v === "MUJER" || v === "PAREJA";
}

/**
 * `precioVenta*` son `Float` y `OrderItem.productPrice` es `Decimal(10,2)`. Sin
 * redondear aquí, el subtotal que calcula el checkout y la suma de las líneas
 * guardadas se separan un céntimo, y el correo acaba diciendo un número
 * distinto al que se cobró.
 */
function aCentimos(n: number): number {
  return Number(n.toFixed(2));
}

/**
 * Piezas físicas que consume UNA unidad de la línea. Es la regla de
 * compatibilidad con todo lo anterior a esta función, y el único sitio donde se
 * decide qué significa una variante ausente.
 */
export function piezasDeVariante(
  variante: Variante | null | undefined,
  esPar: boolean
): { hombre: number; mujer: number } {
  if (!esPar) return { hombre: 1, mujer: 0 };
  const v = esVariante(variante) ? variante : "PAREJA";
  if (v === "HOMBRE") return { hombre: 1, mujer: 0 };
  if (v === "MUJER") return { hombre: 0, mujer: 1 };
  return { hombre: 1, mujer: 1 };
}

/** Stock comprable de cada lado, sumando tienda y almacén. */
function disponibles(p: ProductoConVariantes) {
  return {
    hombre: p.stockHombre + p.stockAlmacenHombre,
    mujer: p.stockMujer + p.stockAlmacenMujer,
  };
}

/**
 * Qué puede comprar hoy el visitante de esta ficha.
 *
 * Devuelve `porVariante: false` —y por tanto lista vacía— en tres casos, todos
 * el mismo desde fuera: el producto no es par, su precio de pareja no es
 * válido, o no tiene cargado ningún precio individual. Este último es el de la
 * mayoría del catálogo hoy, y es deliberado: leer un `precioVentaHombre` en
 * cero vendería un anillo a cero.
 */
export function opcionesDeVariante(p: ProductoConVariantes): OpcionesDeVariante {
  const vacio: OpcionesDeVariante = { porVariante: false, variantes: [], predeterminada: null };
  if (!p.esPar) return vacio;

  const disp = disponibles(p);
  const precioPareja = aCentimos(Number(p.price));
  const precioHombre = aCentimos(p.precioVentaHombre);
  const precioMujer = aCentimos(p.precioVentaMujer);

  const candidatas: Record<Variante, { precio: number; stock: number }> = {
    HOMBRE: { precio: precioHombre, stock: disp.hombre },
    MUJER: { precio: precioMujer, stock: disp.mujer },
    PAREJA: { precio: precioPareja, stock: Math.min(disp.hombre, disp.mujer) },
  };

  const variantes = ORDEN.filter((id) => candidatas[id].precio > 0 && candidatas[id].stock > 0).map(
    (id) => ({
      id,
      etiqueta: ETIQUETA_VARIANTE[id],
      etiquetaCorta: ETIQUETA_CORTA[id],
      precio: candidatas[id].precio,
      stock: candidatas[id].stock,
    })
  );

  // Sin ninguna individual no hay nada que elegir: es la pareja de siempre.
  const hayIndividual = variantes.some((v) => v.id !== "PAREJA");
  if (!hayIndividual) return vacio;

  const predeterminada = variantes.find((v) => v.id === "PAREJA")?.id ?? variantes[0].id;
  return { porVariante: true, variantes, predeterminada };
}

/**
 * Lo que hay que cobrar y guardar por una línea del carrito, resolviendo qué
 * significa la variante que llegó del navegador.
 *
 * Se rechaza en vez de degradar. Si el administrador pone el precio de hombre a
 * cero mientras alguien tiene ese anillo en el carrito, bajar en silencio a la
 * pareja le cobraría el doble sin avisarle; es mejor un error que le diga que
 * vuelva a elegir.
 *
 * `variante: null` en el resultado significa que la línea se guarda sin
 * variante, que es como se guardaba todo hasta ahora.
 */
export type LineaResuelta =
  | { ok: true; variante: Variante | null; precio: number }
  | { ok: false; motivo: "no-disponible" };

export function resolverLinea(
  p: ProductoConVariantes,
  pedida: string | null | undefined
): LineaResuelta {
  const opciones = opcionesDeVariante(p);

  if (!opciones.porVariante) {
    // El producto no se vende por variante: solo vale no pedir ninguna, o pedir
    // la pareja sobre un par, que es lo que significan las líneas antiguas.
    if (pedida != null && !(p.esPar && pedida === "PAREJA")) {
      return { ok: false, motivo: "no-disponible" };
    }
    return { ok: true, variante: null, precio: aCentimos(Number(p.price)) };
  }

  const id: Variante = esVariante(pedida) ? pedida : "PAREJA";
  const elegida = opciones.variantes.find((v) => v.id === id);
  if (!elegida) return { ok: false, motivo: "no-disponible" };
  return { ok: true, variante: elegida.id, precio: elegida.precio };
}
