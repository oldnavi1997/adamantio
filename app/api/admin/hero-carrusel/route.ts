import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { CLAVE_HERO, MAX_SLIDES, heroItemSchema } from "@/lib/home-hero";

const schema = z.object({
  productos: z
    .array(heroItemSchema)
    .max(MAX_SLIDES)
    .refine((items) => new Set(items.map((i) => i.productId)).size === items.length, {
      message: "Hay productos repetidos",
    }),
});

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { productos } = parsed.data;

  // Lista vacía: sin fila, el carrusel vuelve a ser automático.
  if (productos.length === 0) {
    await prisma.siteSetting.deleteMany({ where: { key: CLAVE_HERO } });
    return NextResponse.json({ productos, automatico: true });
  }

  const activos = await prisma.product.count({
    where: { id: { in: productos.map((p) => p.productId) }, isActive: true },
  });
  if (activos !== productos.length) {
    return NextResponse.json({ error: "Algún producto no existe o está inactivo" }, { status: 400 });
  }

  await prisma.siteSetting.upsert({
    where: { key: CLAVE_HERO },
    create: { key: CLAVE_HERO, value: { productos } },
    update: { value: { productos } },
  });

  return NextResponse.json({ productos, automatico: false });
}
