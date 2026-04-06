import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true } },
    },
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    const { name, parentId } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }
    const category = await prisma.category.create({
      data: { id: randomUUID(), name, parentId: parentId || null },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
  }
}
