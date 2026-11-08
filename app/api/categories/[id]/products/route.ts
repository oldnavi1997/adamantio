import { NextResponse } from "next/server";
import { isAdmin, respuestaDeError } from "@/lib/api-admin";
import { getProductsByCategory } from "@/lib/categorias";
import { idSchema, productosDeCategoriaSchema } from "@/lib/categorias-schema";

/**
 * Productos de la categoría y de todas sus subcategorías, sin repetir,
 * paginados en el servidor. Un admin ve también los inactivos y las
 * categorías desactivadas.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = idSchema.parse((await params).id);
    const query = productosDeCategoriaSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
    const resultado = await getProductsByCategory(id, { ...query, includeInactive: await isAdmin() });
    if (!resultado) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(resultado);
  } catch (error) {
    return respuestaDeError(error, "Productos de categoría");
  }
}
