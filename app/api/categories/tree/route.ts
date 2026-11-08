import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/api-admin";
import { getCategoryTree, getPublicCategoryTree } from "@/lib/categorias";

/**
 * Árbol anidado. El público recibe el de la tienda (solo activas, cacheado);
 * un admin con `?all=1` recibe el completo, con conteos de productos.
 */
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.get("all") === "1" && (await isAdmin())) {
    return NextResponse.json(await getCategoryTree({ includeInactive: true }));
  }
  return NextResponse.json(await getPublicCategoryTree());
}
