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
