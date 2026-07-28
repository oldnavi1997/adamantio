export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Catálogo de Joyas",
  description: "Explorá anillos, collares, pulseras y aretes en plata 925. Joyería con mensajes secretos y envío a todo Perú.",
  openGraph: {
    title: "Catálogo de Joyas | Adamantio",
    description: "Explorá anillos, collares, pulseras y aretes en plata 925. Joyería con mensajes secretos y envío a todo Perú.",
    url: "/joyas",
    type: "website",
  },
};
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { Prisma } from "@/app/generated/prisma/client";
import { slugify } from "@/lib/utils";

interface SearchParams {
  category?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  search?: string;
  view?: string;
  mview?: string;
}

async function getProducts(params: SearchParams) {
  const where: Prisma.ProductWhereInput = { isActive: true, stock: { gt: 0 } };

  if (params.category) {
    const allCategories = await prisma.category.findMany({
      select: { name: true, children: { select: { name: true, children: { select: { name: true } } } } },
    });
    const matched = allCategories.find((c) => slugify(c.name) === params.category);
    if (matched) {
      const names = [
        matched.name,
        ...matched.children.map((c) => c.name),
        ...matched.children.flatMap((c) => c.children.map((gc) => gc.name)),
      ];
      where.category = { in: names };
    } else {
      where.category = params.category;
    }
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) where.price.gte = new Prisma.Decimal(params.minPrice);
    if (params.maxPrice) where.price.lte = new Prisma.Decimal(params.maxPrice);
  }

  // `newest` es el orden por defecto. Cualquier valor desconocido —incluidos los
  // `featured` y `best_selling` que existieron antes— cae también en él.
  //
  // Cada orden termina en `id` para desempatar: hay decenas de productos que
  // comparten precio, y sin una clave única el orden entre ellos es
  // indeterminado, así que al paginar uno puede repetirse o desaparecer.
  const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
    newest:     [{ createdAt: "desc" }, { id: "desc" }],
    oldest:     [{ createdAt: "asc" }, { id: "asc" }],
    name_asc:   [{ name: "asc" }, { id: "asc" }],
    name_desc:  [{ name: "desc" }, { id: "desc" }],
    price_asc:  [{ price: "asc" }, { id: "asc" }],
    price_desc: [{ price: "desc" }, { id: "desc" }],
  };

  const page = parseInt(params.page || "1");
  const limit = 24;
  const orderBy = sortMap[params.sort ?? ""] ?? sortMap.newest;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / limit), page };
}

export default async function JoyasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const view = params.view ?? "dense";
  const mview = params.mview ?? "2";
  const { products, total, pages, page } = await getProducts(params);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      <Suspense>
        <CatalogToolbar total={total} />
      </Suspense>

      <ProductGrid products={products} view={view} mview={mview} />

      <CatalogPagination page={page} pages={pages} params={params as Record<string, string | undefined>} />
    </div>
  );
}
