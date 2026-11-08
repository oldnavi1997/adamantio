export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { OG_DEFECTO } from "@/lib/seo";
import { permanentRedirect } from "next/navigation";
import { resolverCategoriaLegada } from "@/lib/categorias";
import { filtroPrecio, listarProductos } from "@/lib/catalog-query";

const DESCRIPCION_GENERICA =
  "Explorá anillos, collares, pulseras y aretes en plata 925. Joyería con mensajes secretos y envío a todo Perú.";

/**
 * Las categorías tienen su propia página en /categorias/...; los enlaces
 * viejos `/joyas?category=<slug>` redirigen allí (ver la página), así que esta
 * metadata es solo la del catálogo completo.
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

  // Los resultados de búsqueda interna no deben indexarse: son contenido
  // generado por quien escribe en el buscador, infinitos en la práctica y de
  // poco valor en resultados. `follow` sigue en true para que los enlaces a
  // producto de esa página sigan transmitiendo autoridad.
  const robots = params.search ? { index: false, follow: true } : undefined;

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
  const where: Prisma.ProductWhereInput = { isActive: true, ...filtroPrecio(params.minPrice, params.maxPrice) };

  // Un `category` que no corresponde a ninguna categoría (las que sí, ya
  // redirigieron) se filtra literal, que es lo que hacía antes: así un valor
  // escrito a mano sigue devolviendo lista vacía y no el catálogo entero.
  if (params.category) where.category = params.category;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return listarProductos({ where, sort: params.sort, page: parseInt(params.page || "1") });
}

export default async function JoyasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Enlaces anteriores al módulo de categorías: 308 a la página de la
  // categoría, conservando el resto de la query (orden, vista, precio…).
  if (params.category) {
    const destino = await resolverCategoriaLegada(params.category);
    if (destino) {
      const resto = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (k !== "category" && v) resto.set(k, v);
      const qs = resto.toString();
      permanentRedirect(qs ? `${destino.path}?${qs}` : destino.path);
    }
  }

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
