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
  freeShipping: z.boolean().optional(),
  testMode: z.boolean().optional(),
  stockHombre: z.number().int().min(0).optional(),
  stockMujer: z.number().int().min(0).optional(),
  stockAlmacenH: z.number().int().min(0).optional(),
  stockAlmacenM: z.number().int().min(0).optional(),
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
      },
    });

    indexProduct(product).catch(console.error);

    const hasPosStock = data.stockHombre !== undefined || data.stockMujer !== undefined
      || data.stockAlmacenH !== undefined || data.stockAlmacenM !== undefined;
    if (hasPosStock && product.sku) {
      prisma.$executeRaw`
        UPDATE pos."Product" SET
          "stockHombre"        = COALESCE(${data.stockHombre ?? null}::int, "stockHombre"),
          "stockMujer"         = COALESCE(${data.stockMujer ?? null}::int, "stockMujer"),
          "stockAlmacenHombre" = COALESCE(${data.stockAlmacenH ?? null}::int, "stockAlmacenHombre"),
          "stockAlmacenMujer"  = COALESCE(${data.stockAlmacenM ?? null}::int, "stockAlmacenMujer"),
          "updatedAt" = now()
        WHERE sku = ${product.sku}
      `.catch(console.error);
    }

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
