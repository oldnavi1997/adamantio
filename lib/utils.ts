import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPEN(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Resuelve el estado de oferta de un producto.
 *
 * `price` es siempre lo que se cobra y `comparePrice` el precio anterior, más
 * alto — nulo si no hay oferta. Que la comparación viva aquí y no en cada vista
 * es lo que garantiza que el umbral y el redondeo del porcentaje sean uno solo.
 *
 * `antes > precio` es defensivo: un `comparePrice` igual o menor no es una
 * oferta, y pintarlo daría un `-0%` o un descuento negativo.
 */
export function precioConOferta(p: { price: unknown; comparePrice?: unknown }): {
  precio: number;
  antes: number | null;
  descuento: number;
} {
  const precio = Number(p.price);
  const antes = p.comparePrice == null ? null : Number(p.comparePrice);
  const enOferta = antes !== null && antes > precio;
  return {
    precio,
    antes: enOferta ? antes : null,
    descuento: enOferta ? Math.round((1 - precio / antes!) * 100) : 0,
  };
}

export function getPrimaryCategory(product: { category?: string | null }): { name: string } | undefined {
  if (!product.category) return undefined;
  return { name: product.category };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * S/149.00 → 14900. Las pasarelas peruanas (Izipay, Culqi) cobran en la unidad
 * mínima de la moneda. Se redondea para no arrastrar el error binario de los
 * flotantes: `1.15 * 100` es 114.99999999999999.
 */
export function aCentimos(soles: number): number {
  return Math.round(soles * 100);
}
