import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";
import { indexProduct } from "@/lib/algolia-sync";

const productCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().default(""),
  price: z.number().positive(),
  /// Precio tachado de la oferta. Siempre mayor que `price`; null si no hay.
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).default(0),
  stockHombre: z.number().int().min(0).default(0),
  stockMujer: z.number().int().min(0).default(0),
  stockAlmacenH: z.number().int().min(0).default(0),
  stockAlmacenM: z.number().int().min(0).default(0),
  imageUrl: z.string().optional().nullable(),
  imageUrls: z.array(z.string()).default([]),
  contentImages: z.array(z.string()).default([]),
  productDetails: z.string().default(""),
  sizeInfo: z.string().default(""),
  category: z.string().optional().nullable(),
  sizes: z.array(z.string()).default([]),
  sku: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  engravingEnabled: z.boolean().default(false),
  engravingImages: z.array(z.string()).default([]),
  freeShipping: z.boolean().default(false),
  testMode: z.boolean().default(false),
  esPar: z.boolean().default(false),
  categoria: z.enum(["ANILLO", "COLLAR", "PULSERA", "ARETE", "OTRO"]).optional().nullable(),
  precioCosto: z.number().min(0).optional().nullable(),
  stockMinimo: z.number().int().min(0).default(5),
  precioVentaHombre: z.number().min(0).default(0),
  precioVentaMujer: z.number().min(0).default(0),
  precioVentaPareja: z.number().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const where: Prisma.ProductWhereInput = {};
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(48, parseInt(searchParams.get("limit") || "24"));

  if (!searchParams.has("admin")) where.isActive = true;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = new Prisma.Decimal(minPrice);
    if (maxPrice) where.price.lte = new Prisma.Decimal(maxPrice);
  }

  const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    newest: { createdAt: "desc" },
    name_asc: { name: "asc" },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortMap[sort] || { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, pages: Math.ceil(total / limit), page });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = productCreateSchema.parse(body);

    const { stockAlmacenH, stockAlmacenM, ...prismaData } = data;

    // Transición a FK: mantener categoryId sincronizado con el nombre (category).
    const categoryId = data.category
      ? (await prisma.category.findUnique({ where: { name: data.category }, select: { id: true } }))?.id ?? null
      : null;

    const product = await prisma.product.create({
      data: {
        ...prismaData,
        categoryId,
        price: new Prisma.Decimal(data.price),
        comparePrice: data.comparePrice == null ? null : new Prisma.Decimal(data.comparePrice),
        stockAlmacenHombre: stockAlmacenH,
        stockAlmacenMujer: stockAlmacenM,
        stockAlmacen: stockAlmacenH + stockAlmacenM,
        genero: data.esPar ? ["HOMBRE", "MUJER"] : ["UNISEX"],
      },
    });

    indexProduct(product).catch(console.error);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
