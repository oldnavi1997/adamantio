import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireAdmin, respuestaDeError } from "@/lib/api-admin";
import { createCategory } from "@/lib/categorias";
import { crearCategoriaSchema } from "@/lib/categorias-schema";

/**
 * Lista plana. El público ve solo las activas; un admin con `?all=1` ve todas.
 * (Una hija de una inactiva sigue saliendo aquí: para lo que ve la tienda, usar
 * /api/categories/tree, que poda el subárbol.)
 */
export async function GET(req: Request) {
  const todas = new URL(req.url).searchParams.get("all") === "1" && (await isAdmin());
  const categories = await prisma.category.findMany({
    where: todas ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { children: true } },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const denegado = await requireAdmin();
  if (denegado) return denegado;
  try {
    const data = crearCategoriaSchema.parse(await req.json());
    const category = await createCategory(data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return respuestaDeError(error, "Crear categoría");
  }
}
