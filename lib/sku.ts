import type { PrismaClient } from "@/app/generated/prisma/client";

// Gemelo de `lib/sku.ts` del punto de venta: el SKU es el código correlativo
// que el vendedor digita en el mostrador (001, 002, …), y web y POS escriben la
// misma tabla. Si uno cambia la regla, cambia el otro.

/** Dígitos del código correlativo: 001..999. Al pasar 999 crece solo (1000). */
export const SKU_DIGITOS = 3;

/** 7 -> "007". Sobre 999 devuelve el número sin recortar. */
export function formatSku(numero: number): string {
  return String(numero).padStart(SKU_DIGITOS, "0");
}

/**
 * Siguiente correlativo libre (máximo actual + 1).
 * Se consulta con SQL para castear a entero: ordenar por texto rompe al
 * pasar de "999" a "1000". Los SKUs no numéricos (heredados) se ignoran.
 */
export async function siguienteSku(client: PrismaClient): Promise<string> {
  const filas = await client.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(sku::int) AS max FROM public."Product" WHERE sku ~ '^[0-9]+$'
  `;
  return formatSku(Number(filas[0]?.max ?? 0) + 1);
}
