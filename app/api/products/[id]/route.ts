import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";
import { indexProduct, deleteFromIndex } from "@/lib/algolia-sync";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  imageUrl: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).optional(),
  contentImages: z.array(z.string()).optional(),
  productDetails: z.string().optional(),
  sizeInfo: z.string().optional(),
  category: z.string().optional().nullable(),
  sizes: z.array(z.string()).optional(),
  sku: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  engravingEnabled: z.boolean().optional(),
  engravingImages: z.array(z.string()).optional(),
  freeShipping: z.boolean().optional(),
  testMode: z.boolean().optional(),
  stockHombre: z.number().int().min(0).optional(),
  stockMujer: z.number().int().min(0).optional(),
  stockAlmacenH: z.number().int().min(0).optional(),
  stockAlmacenM: z.number().int().min(0).optional(),
  esPar: z.boolean().optional(),
  categoria: z.enum(["ANILLO", "COLLAR", "PULSERA", "ARETE", "OTRO"]).optional().nullable(),
  precioCosto: z.number().min(0).optional().nullable(),
  stockMinimo: z.number().int().min(0).optional(),
  precioVentaHombre: z.number().min(0).optional(),
  precioVentaMujer: z.number().min(0).optional(),
  precioVentaPareja: z.number().min(0).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const { stockAlmacenH, stockAlmacenM, ...prismaData } = data;

    // Transición a FK: sincronizar categoryId solo si el payload trae category.
    const categoryId =
      data.category !== undefined
        ? data.category
          ? (await prisma.category.findUnique({ where: { name: data.category }, select: { id: true } }))?.id ?? null
          : null
        : undefined;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { stockHombre: true, stockMujer: true, stockAlmacenHombre: true, stockAlmacenMujer: true },
    });

    const newStockHombre = data.stockHombre ?? existing?.stockHombre ?? 0;
    const newStockMujer  = data.stockMujer  ?? existing?.stockMujer  ?? 0;
    const newAlmacenH    = stockAlmacenH    ?? existing?.stockAlmacenHombre ?? 0;
    const newAlmacenM    = stockAlmacenM    ?? existing?.stockAlmacenMujer  ?? 0;
    const newStock = newStockHombre + newStockMujer + newAlmacenH + newAlmacenM;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...prismaData,
        ...(categoryId !== undefined && { categoryId }),
        ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
        ...(data.stockHombre !== undefined && { stockHombre: data.stockHombre }),
        ...(data.stockMujer !== undefined && { stockMujer: data.stockMujer }),
        ...(stockAlmacenH !== undefined && { stockAlmacenHombre: stockAlmacenH }),
        ...(stockAlmacenM !== undefined && { stockAlmacenMujer: stockAlmacenM }),
        ...(stockAlmacenH !== undefined && { stockAlmacen: (stockAlmacenH ?? 0) + (stockAlmacenM ?? 0) }),
        ...(data.esPar !== undefined && { genero: data.esPar ? ["HOMBRE", "MUJER"] : ["UNISEX"] }),
        stock: newStock,
      },
    });

    indexProduct(product).catch(console.error);

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await deleteFromIndex(id).catch(console.error);
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
