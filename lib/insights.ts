import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Estadísticas de /admin/insights. La fuente es `Sale`/`SaleItem` y no `Order`:
 * cada pedido web pagado deja su nota de venta (`canal = "WEB"`), así que ahí
 * están los dos canales una sola vez. Consultar también `Order` duplicaría la web.
 *
 * Límite conocido: `SaleItem` exige producto, de modo que un producto borrado
 * cuenta en los totales por venta pero no en los rankings.
 */

export const PERIODOS = [
  { dias: 30, etiqueta: "30 días" },
  { dias: 90, etiqueta: "90 días" },
  { dias: 365, etiqueta: "12 meses" },
  { dias: 0, etiqueta: "Todo" },
] as const;

export const PERIODO_DEFECTO = 90;
const TZ = "America/Lima";
/** Ventana fija para estimar el ritmo de venta, sea cual sea el período elegido. */
const VENTANA_RITMO = 90;
const DIA_MS = 86_400_000;

export function diasValidos(valor: string | undefined): number {
  const n = Number(valor);
  return PERIODOS.some((p) => p.dias === n) && valor !== undefined && valor !== ""
    ? n
    : PERIODO_DEFECTO;
}

type Resumen = { ventas: number; total: number; web: number; totalWeb: number; unidades: number };
export type TopProducto = {
  id: string;
  name: string;
  imageUrl: string | null;
  imageUrls: string[];
  uds: number;
  ingresos: number;
  web: number;
  stock: number;
};
export type FilaCategoria = { categoria: string; uds: number; ingresos: number };
export type FilaMes = { mes: string; tienda: number; web: number };
export type FilaConteo = { clave: string; n: number };
export type EnRiesgo = { id: string; name: string; imageUrl: string | null; imageUrls: string[]; stock: number; uds: number; dias: number };
export type Dormido = { id: string; name: string; imageUrl: string | null; imageUrls: string[]; stock: number };

function ventana(desde: Date | null, hasta: Date | null) {
  return Prisma.sql`${desde ? Prisma.sql`AND s."createdAt" >= ${desde}` : Prisma.empty}
    ${hasta ? Prisma.sql`AND s."createdAt" < ${hasta}` : Prisma.empty}`;
}

function resumen(desde: Date | null, hasta: Date | null) {
  // Las unidades van en subconsulta: unir SaleItem aquí multiplicaría `total`.
  return prisma.$queryRaw<Resumen[]>`
    SELECT count(*)::int AS ventas,
           coalesce(sum(s.total), 0)::float8 AS total,
           (count(*) FILTER (WHERE s.canal = 'WEB'))::int AS web,
           coalesce(sum(s.total) FILTER (WHERE s.canal = 'WEB'), 0)::float8 AS "totalWeb",
           coalesce((SELECT sum(i.cantidad) FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId"
                     WHERE true ${ventana(desde, hasta)}), 0)::int AS unidades
    FROM "Sale" s WHERE true ${ventana(desde, hasta)}`.then((r) => r[0]);
}

export async function getInsights(dias: number) {
  const ahora = new Date();
  const desde = dias > 0 ? new Date(ahora.getTime() - dias * DIA_MS) : null;
  const anterior = desde ? new Date(desde.getTime() - dias * DIA_MS) : null;
  const inicioRitmo = new Date(ahora.getTime() - VENTANA_RITMO * DIA_MS);
  const filtro = ventana(desde, null);
  const filtroPedido = desde ? Prisma.sql`AND o."createdAt" >= ${desde}` : Prisma.empty;

  const [
    actual,
    previo,
    top,
    categorias,
    meses,
    metodos,
    diasSemana,
    riesgo,
    dormidos,
    dormidosTotal,
    pedidos,
    grabado,
  ] = await Promise.all([
    resumen(desde, null),
    anterior ? resumen(anterior, desde) : null,
    prisma.$queryRaw<TopProducto[]>`
      SELECT p.id, p.name, p."imageUrl", p."imageUrls", sum(i.cantidad)::int AS uds, sum(i.subtotal)::float8 AS ingresos,
             coalesce(sum(i.cantidad) FILTER (WHERE s.canal = 'WEB'), 0)::int AS web, p.stock
      FROM "SaleItem" i
      JOIN "Sale" s ON s.id = i."saleId"
      JOIN "Product" p ON p.id = i."productId"
      WHERE true ${filtro}
      GROUP BY p.id ORDER BY uds DESC, ingresos DESC LIMIT 15`,
    prisma.$queryRaw<FilaCategoria[]>`
      SELECT coalesce(nullif(p.category, ''), 'Sin categoría') AS categoria,
             sum(i.cantidad)::int AS uds, sum(i.subtotal)::float8 AS ingresos
      FROM "SaleItem" i
      JOIN "Sale" s ON s.id = i."saleId"
      JOIN "Product" p ON p.id = i."productId"
      WHERE true ${filtro}
      GROUP BY 1 ORDER BY ingresos DESC LIMIT 8`,
    // Siempre los últimos 12 meses: la tendencia no depende del período elegido.
    prisma.$queryRaw<FilaMes[]>`
      SELECT * FROM (
        SELECT to_char(s."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TZ}, 'YYYY-MM') AS mes,
               coalesce(sum(s.total) FILTER (WHERE s.canal <> 'WEB'), 0)::float8 AS tienda,
               coalesce(sum(s.total) FILTER (WHERE s.canal = 'WEB'), 0)::float8 AS web
        FROM "Sale" s GROUP BY 1 ORDER BY 1 DESC LIMIT 12
      ) m ORDER BY mes`,
    prisma.$queryRaw<FilaConteo[]>`
      SELECT s."metodoPago"::text AS clave, count(*)::int AS n
      FROM "Sale" s WHERE true ${filtro} GROUP BY 1 ORDER BY n DESC`,
    prisma.$queryRaw<FilaConteo[]>`
      SELECT extract(isodow FROM s."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TZ})::int::text AS clave,
             count(*)::int AS n
      FROM "Sale" s WHERE true ${filtro} GROUP BY 1 ORDER BY 1`,
    // Con menos de 2 unidades vendidas no hay ritmo que proyectar.
    prisma.$queryRaw<EnRiesgo[]>`
      SELECT p.id, p.name, p."imageUrl", p."imageUrls", p.stock, r.uds,
             round(p.stock * ${VENTANA_RITMO}::numeric / r.uds)::int AS dias
      FROM "Product" p
      JOIN (SELECT i."productId", sum(i.cantidad)::int AS uds
            FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId"
            WHERE s."createdAt" >= ${inicioRitmo} GROUP BY 1) r ON r."productId" = p.id
      WHERE p."isActive" AND r.uds >= 2 AND p.stock * ${VENTANA_RITMO}::numeric / r.uds <= 30
      ORDER BY dias, r.uds DESC LIMIT 10`,
    prisma.$queryRaw<Dormido[]>`
      SELECT p.id, p.name, p."imageUrl", p."imageUrls", p.stock FROM "Product" p
      WHERE p."isActive" AND p.stock > 0 AND NOT EXISTS (
        SELECT 1 FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId"
        WHERE i."productId" = p.id AND s."createdAt" >= ${inicioRitmo})
      ORDER BY p.stock DESC, p.name LIMIT 10`,
    prisma.$queryRaw<{ n: number; uds: number }[]>`
      SELECT count(*)::int AS n, coalesce(sum(p.stock), 0)::int AS uds FROM "Product" p
      WHERE p."isActive" AND p.stock > 0 AND NOT EXISTS (
        SELECT 1 FROM "SaleItem" i JOIN "Sale" s ON s.id = i."saleId"
        WHERE i."productId" = p.id AND s."createdAt" >= ${inicioRitmo})`.then((r) => r[0]),
    prisma.$queryRaw<{ pagados: number; pendientes: number }[]>`
      SELECT (count(*) FILTER (WHERE o.status IN ('PAID', 'SHIPPED')))::int AS pagados,
             (count(*) FILTER (WHERE o.status = 'PENDING'))::int AS pendientes
      FROM "Order" o WHERE true ${filtroPedido}`.then((r) => r[0]),
    prisma.$queryRaw<{ con: number; total: number }[]>`
      SELECT (count(*) FILTER (WHERE coalesce(i."engravingText", '') <> ''))::int AS con,
             count(*)::int AS total
      FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
      WHERE o.status IN ('PAID', 'SHIPPED') ${filtroPedido}`.then((r) => r[0]),
  ]);

  return {
    actual,
    previo,
    top,
    categorias,
    meses,
    metodos,
    diasSemana,
    riesgo,
    dormidos,
    dormidosTotal,
    pedidos,
    grabado,
    ventanaRitmo: VENTANA_RITMO,
  };
}
