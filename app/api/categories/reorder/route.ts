import { NextResponse } from "next/server";
import { requireAdmin, respuestaDeError } from "@/lib/api-admin";
import { reorderCategories } from "@/lib/categorias";
import { reordenarSchema } from "@/lib/categorias-schema";

/** Cuerpo: `[{ id, sortOrder }]`. Se aplica entero o nada. */
export async function PATCH(req: Request) {
  const denegado = await requireAdmin();
  if (denegado) return denegado;
  try {
    await reorderCategories(reordenarSchema.parse(await req.json()));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, "Reordenar categorías");
  }
}

/** Compatibilidad con el admin anterior. */
export const PUT = PATCH;
