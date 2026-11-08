import { NextResponse } from "next/server";
import { requireAdmin, respuestaDeError } from "@/lib/api-admin";
import { assignProductsToCategory } from "@/lib/categorias";
import { asignarSchema } from "@/lib/categorias-schema";
import { reindexarProductos } from "@/lib/algolia-sync";

/**
 * Cambio de categorías en lote: `add` suma, `set` reemplaza y `remove` quita.
 * La principal (Product.categoryId) se conserva salvo que se indique otra con
 * `primaryCategoryId` o que la operación la quite.
 */
export async function POST(request: Request) {
  const denegado = await requireAdmin();
  if (denegado) return denegado;
  try {
    const { productIds, categoryIds, mode, primaryCategoryId } = asignarSchema.parse(await request.json());
    const updated = await assignProductsToCategory(productIds, categoryIds, mode, primaryCategoryId);
    reindexarProductos(productIds).catch(console.error);
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return respuestaDeError(error, "Categorías en lote");
  }
}
