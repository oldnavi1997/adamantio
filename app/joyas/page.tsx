export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { OG_DEFECTO } from "@/lib/seo";
import { OG_LADO, ogImageUrl, productThumbnail } from "@/lib/media";
import { resolverCategoria } from "@/lib/categorias";

const DESCRIPCION_GENERICA =
  "Explorá anillos, collares, pulseras y aretes en plata 925. Joyería con mensajes secretos y envío a todo Perú.";

/**
 * Metadata por categoría.
 *
 * Los enlaces del menú son `/joyas?category=<slug>`, así que sin esto todas las
 * categorías se compartían con el mismo título y la misma imagen —el logo—. Se
 * lee `searchParams` para darle a cada una su título, su descripción y una foto
 * real de la categoría.
 *
 * El `canonical` deja fuera `sort`, `view`, `mview` y los filtros de precio: son
 * permutaciones de presentación del mismo listado y sin él Google las trataría
 * como páginas distintas con el mismo contenido.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoria = params.category ? await resolverCategoria(params.category) : null;

  // Los resultados de búsqueda interna no deben indexarse: son contenido
  // generado por quien escribe en el buscador, infinitos en la práctica y de
  // poco valor en resultados. `follow` sigue en true para que los enlaces a
  // producto de esa página sigan transmitiendo autoridad.
  const robots = params.search ? { index: false, follow: true } : undefined;

  if (!categoria) {
    return {
      title: "Catálogo de Joyas",
      description: DESCRIPCION_GENERICA,
      alternates: { canonical: "/joyas" },
      ...(robots && { robots }),
      openGraph: {
        title: "Catálogo de Joyas | Adamantio",
        description: DESCRIPCION_GENERICA,
        url: "/joyas",
        type: "website",
        images: [OG_DEFECTO],
      },
      twitter: { card: "summary", images: [OG_DEFECTO.url] },
    };
  }

  const filtro = { isActive: true, stock: { gt: 0 }, category: { in: categoria.nombres } };
  const [total, primero] = await Promise.all([
    prisma.product.count({ where: filtro }),
    prisma.product.findFirst({
      where: filtro,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { imageUrl: true, imageUrls: true },
    }),
  ]);

  // La categoría no tiene imagen propia en el modelo: se usa la foto del
  // producto más reciente, que es lo más representativo sin inventar assets.
  const foto = primero ? productThumbnail(primero) : null;
  const imagen = foto
    ? { url: ogImageUrl(foto), width: OG_LADO, height: OG_LADO, alt: categoria.nombre }
    : OG_DEFECTO;

  // El nombre va delante y sin preposición: encajarlo en "modelos de X"
  // producía "modelos de de talla" y "anillos de plata en plata 925".
  const descripcion =
    total > 0
      ? `${categoria.nombre} — ${total} ${total === 1 ? "modelo disponible" : "modelos disponibles"} con envío a todo Perú. Joyería en plata 925 con mensajes secretos.`
      : `${categoria.nombre} — joyería en plata 925 con mensajes secretos y envío a todo Perú.`;

  const url = `/joyas?category=${params.category}`;

  return {
    title: categoria.nombre,
    description: descripcion,
    alternates: { canonical: url },
    ...(robots && { robots }),
    openGraph: {
      title: `${categoria.nombre} | Adamantio`,
      description: descripcion,
      url,
      type: "website",
      images: [imagen],
    },
    twitter: { card: "summary", images: [imagen.url] },
  };
}
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { Prisma } from "@/app/generated/prisma/client";

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
    const categoria = await resolverCategoria(params.category);
    // Sin coincidencia se filtra por el slug literal, que es lo que hacía antes:
    // así un valor escrito a mano sigue devolviendo lista vacía y no el catálogo entero.
    where.category = categoria ? { in: categoria.nombres } : params.category;
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
