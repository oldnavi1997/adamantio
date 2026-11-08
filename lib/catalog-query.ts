import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

/**
 * El listado paginado del catálogo, compartido por /joyas, /categorias/... y
 * GET /api/categories/[id]/products.
 */

// `newest` es el orden por defecto. Cualquier valor desconocido —incluidos los
// `featured` y `best_selling` que existieron antes— cae también en él.
//
// Cada orden termina en `id` para desempatar: hay decenas de productos que
// comparten precio, y sin una clave única el orden entre ellos es
// indeterminado, así que al paginar uno puede repetirse o desaparecer.
const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  newest:     [{ createdAt: "desc" }, { id: "desc" }],
  oldest:     [{ createdAt: "asc" }, { id: "asc" }],
  name_asc:   [{ name: "asc" }, { id: "asc" }],
  name_desc:  [{ name: "desc" }, { id: "desc" }],
  price_asc:  [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "desc" }],
};

export const POR_PAGINA = 24;

/** Filtro de "está en alguna de estas categorías". No duplica: filtra productos. */
export function enCategorias(categoryIds: string[]): Prisma.ProductWhereInput {
  return { categories: { some: { categoryId: { in: categoryIds } } } };
}

/** Rango de precio a partir de los parámetros de la URL. Ignora lo que no sea número. */
export function filtroPrecio(minPrice?: string, maxPrice?: string): Prisma.ProductWhereInput {
  const min = minPrice && Number.isFinite(Number(minPrice)) ? new Prisma.Decimal(minPrice) : null;
  const max = maxPrice && Number.isFinite(Number(maxPrice)) ? new Prisma.Decimal(maxPrice) : null;
  if (!min && !max) return {};
  return { price: { ...(min && { gte: min }), ...(max && { lte: max }) } };
}

export async function listarProductos({
  where,
  sort,
  page: pagina,
  limit = POR_PAGINA,
}: {
  where: Prisma.ProductWhereInput;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const page = Number.isFinite(pagina) && pagina! > 0 ? Math.floor(pagina!) : 1;
  const orderBy = SORT_MAP[sort ?? ""] ?? SORT_MAP.newest;

  // Los agotados se muestran, con su etiqueta, pero siempre al final: primero
  // todos los disponibles en el orden elegido y después los agotados en ese
  // mismo orden. Prisma no ordena por una condición, así que se pagina sobre
  // los dos tramos como si fueran una sola lista.
  const disponibles: Prisma.ProductWhereInput = { AND: [where, { stock: { gt: 0 } }] };
  const agotados: Prisma.ProductWhereInput = { AND: [where, { stock: { lte: 0 } }] };
  const [nDisponibles, nAgotados] = await Promise.all([
    prisma.product.count({ where: disponibles }),
    prisma.product.count({ where: agotados }),
  ]);

  const desde = (page - 1) * limit;
  const products =
    desde < nDisponibles
      ? await prisma.product.findMany({ where: disponibles, orderBy, skip: desde, take: limit })
      : [];
  if (products.length < limit) {
    products.push(
      ...(await prisma.product.findMany({
        where: agotados,
        orderBy,
        skip: Math.max(0, desde - nDisponibles),
        take: limit - products.length,
      }))
    );
  }

  const total = nDisponibles + nAgotados;
  return { products, total, pages: Math.ceil(total / limit), page };
}
