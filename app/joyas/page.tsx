export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { Prisma } from "@/app/generated/prisma/client";
import { seededShuffle, slugify } from "@/lib/utils";

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
  const where: Prisma.ProductWhereInput = { isActive: true };

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

  const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    best_selling: { createdAt: "desc" },
    name_asc:     { name: "asc" },
    name_desc:    { name: "desc" },
    price_asc:    { price: "asc" },
    price_desc:   { price: "desc" },
    oldest:       { createdAt: "asc" },
  };

  const page = parseInt(params.page || "1");
  const limit = 24;
  const useShuffleSort = !params.sort || params.sort === "newest";

  if (useShuffleSort) {
    const allIds = await prisma.product.findMany({
      where,
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
    const shuffledIds = seededShuffle(allIds.map((p) => p.id), seed);
    const total = shuffledIds.length;
    const pageIds = shuffledIds.slice((page - 1) * limit, page * limit);

    const raw = await prisma.product.findMany({
      where: { id: { in: pageIds } },
    });

    const map = new Map(raw.map((p) => [p.id, p]));
    const products = pageIds.map((id) => map.get(id)!).filter(Boolean);

    return { products, total, pages: Math.ceil(total / limit), page };
  }

  const orderBy = sortMap[params.sort!] || { createdAt: "desc" };

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
