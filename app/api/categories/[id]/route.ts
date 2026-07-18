import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, parentId } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }

    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    // `Product.category` es un texto denormalizado (sin FK). Si cambia el
    // nombre, hay que propagarlo a los productos que apuntan al nombre viejo,
    // de lo contrario quedan huérfanos y desaparecen del catálogo.
    const [category] = await prisma.$transaction([
      prisma.category.update({
        where: { id },
        data: { name, parentId: parentId || null },
      }),
      ...(current.name !== name
        ? [
            prisma.product.updateMany({
              where: { category: current.name },
              data: { category: name },
            }),
          ]
        : []),
    ]);

    return NextResponse.json(category);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    const count = await prisma.product.count({ where: { category: cat.name } });
    if (count > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${count} producto(s) asociado(s)` },
        { status: 409 }
      );
    }
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
  }
}
