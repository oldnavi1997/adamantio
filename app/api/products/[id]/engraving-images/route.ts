import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const schema = z.object({ images: z.array(z.string().url()) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let parsed;
  try {
    parsed = schema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { engravingImages: parsed.images },
      select: { id: true, engravingImages: true },
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }
}
