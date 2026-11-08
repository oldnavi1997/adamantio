import { NextResponse } from "next/server";
import { isAdmin, requireAdmin, respuestaDeError } from "@/lib/api-admin";
import { deleteCategory, getCategoryById, updateCategory } from "@/lib/categorias";
import { editarCategoriaSchema, idSchema } from "@/lib/categorias-schema";

type Ctx = { params: Promise<{ id: string }> };

const noEncontrada = () => NextResponse.json({ error: "No encontrada" }, { status: 404 });

export async function GET(_req: Request, { params }: Ctx) {
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return noEncontrada();
  const category = await getCategoryById(id.data);
  // Una inactiva no existe para el público.
  if (!category || (!category.isActive && !(await isAdmin()))) return noEncontrada();
  return NextResponse.json(category);
}

/** Edición parcial: solo cambia lo que se manda. Cambiar `parentId` mueve el subárbol. */
export async function PATCH(req: Request, { params }: Ctx) {
  const denegado = await requireAdmin();
  if (denegado) return denegado;
  try {
    const id = idSchema.parse((await params).id);
    const data = editarCategoriaSchema.parse(await req.json());
    return NextResponse.json(await updateCategory(id, data));
  } catch (error) {
    return respuestaDeError(error, "Editar categoría");
  }
}

/** Compatibilidad con el admin anterior, que editaba con PUT. */
export const PUT = PATCH;

export async function DELETE(_req: Request, { params }: Ctx) {
  const denegado = await requireAdmin();
  if (denegado) return denegado;
  try {
    await deleteCategory(idSchema.parse((await params).id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return respuestaDeError(error, "Eliminar categoría");
  }
}
