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
  stock: z.number().int().min(0).default(0),
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
  freeShipping: z.boolean().default(false),
  testMode: z.boolean().default(false),
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

    const product = await prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
      },
    });

    indexProduct(product).catch(console.error);

    // Reflejar en POS si tiene SKU
    if (product.sku) {
      const categoriaMap: Record<string, string> = {
        anillo: "ANILLO", anillos: "ANILLO",
        collar: "COLLAR", collares: "COLLAR",
        pulsera: "PULSERA", pulseras: "PULSERA",
        arete: "ARETE", aretes: "ARETE",
      };
      const catKey = (product.category ?? "").toLowerCase().split(" ")[0];
      const categoria = categoriaMap[catKey] ?? "OTRO";

      await prisma.$executeRaw`
        INSERT INTO pos."Product" (
          id, name, sku, categoria, material,
          "precioCosto", "precioVenta",
          "precioVentaHombre", "precioVentaMujer", "precioVentaPareja",
          stock, "stockMinimo",
          "stockHombre", "stockMujer", "stockAlmacen",
          "stockAlmacenHombre", "stockAlmacenMujer",
          genero, descripcion, "imagenUrl",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, ${product.name}, ${product.sku},
          ${categoria}::pos."Categoria", 'OTRO'::pos."Material",
          ${data.price}, ${data.price},
          ${data.price}, ${data.price}, ${data.price},
          ${product.stock}, 5,
          0, 0, 0, 0, 0,
          ARRAY['UNISEX']::pos."Genero"[],
          ${product.description?.slice(0, 500) ?? null},
          ${product.imageUrl ?? null},
          now(), now()
        )
        ON CONFLICT (sku) DO NOTHING
      `;
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
