export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategoriasPublicas, type CategoriaPublica } from "@/lib/categorias";
import { ancestros, idsDescendientes, resolverRuta, rutaCategoria } from "@/lib/category-tree";
import { enCategorias, filtroPrecio, listarProductos } from "@/lib/catalog-query";
import { OG_DEFECTO } from "@/lib/seo";
import { OG_LADO, ogImageUrl } from "@/lib/media";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CategoryHeader } from "@/components/catalog/CategoryHeader";

type SearchParams = {
  sort?: string;
  page?: string;
  view?: string;
  mview?: string;
  minPrice?: string;
  maxPrice?: string;
  disponibles?: string;
};

type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<SearchParams> };

async function resolver(slug: string[]) {
  const todas = await getCategoriasPublicas();
  const r = resolverRuta(todas, slug);
  if (!r) return null;
  const categoria = r.cadena[r.cadena.length - 1];
  return { todas, categoria, canonica: r.canonica, path: rutaCategoria(todas, categoria.id) };
}

function descripcionSeo(c: CategoriaPublica): string {
  if (c.metaDescription) return c.metaDescription;
  if (c.description) {
    return c.description.length > 160 ? `${c.description.slice(0, 157).trimEnd()}…` : c.description;
  }
  return `${c.name} — joyería en plata 925 con mensajes secretos y envío a todo Perú.`;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const r = await resolver((await params).slug);
  if (!r) return { title: "Categoría no encontrada", robots: { index: false, follow: true } };
  const { categoria: c, path } = r;
  const sp = await searchParams;

  const foto = c.banner || c.image;
  const imagen = foto ? { url: ogImageUrl(foto), width: OG_LADO, height: OG_LADO, alt: c.name } : OG_DEFECTO;
  const descripcion = descripcionSeo(c);
  // Filtrar por precio o disponibilidad da subconjuntos del mismo listado: se
  // siguen, pero no se indexan, y el canonical apunta siempre a la base.
  const filtrada = !!(sp.minPrice || sp.maxPrice || sp.disponibles);

  return {
    title: c.metaTitle || c.name,
    description: descripcion,
    alternates: { canonical: path },
    ...(filtrada && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${c.metaTitle || c.name} | Adamantio`,
      description: descripcion,
      url: path,
      type: "website",
      images: [imagen],
    },
    twitter: { card: "summary", images: [imagen.url] },
  };
}

export default async function CategoriaPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const r = await resolver(slug);
  if (!r) notFound();

  const { todas, categoria, path } = r;

  // Por id, con mayúsculas o con otra grafía: 308 a la URL canónica.
  if (!r.canonica) {
    const query = new URLSearchParams(
      Object.entries(sp).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== "")
    ).toString();
    permanentRedirect(query ? `${path}?${query}` : path);
  }

  // La categoría y toda su descendencia activa. Un producto en dos
  // subcategorías sale una sola vez: se filtran productos, no asignaciones.
  const ids = [categoria.id, ...idsDescendientes(todas, categoria.id)];
  const { products, total, pages, page } = await listarProductos({
    where: {
      isActive: true,
      ...enCategorias(ids),
      ...filtroPrecio(sp.minPrice, sp.maxPrice),
      ...(sp.disponibles === "1" && { stock: { gt: 0 } }),
    },
    sort: sp.sort,
    page: parseInt(sp.page || "1"),
  });

  const migas = [
    { name: "Inicio", href: "/" },
    ...ancestros(todas, categoria.id).map((c) => ({ name: c.name, href: rutaCategoria(todas, c.id) })),
  ];
  const subcategorias = todas
    .filter((c) => c.parentId === categoria.id)
    .map((c) => ({ id: c.id, name: c.name, image: c.image, href: rutaCategoria(todas, c.id) }));

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.name,
      item: `${base}${m.href}`,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <CategoryHeader
        migas={migas}
        titulo={categoria.name}
        descripcion={categoria.description}
        banner={categoria.banner}
        subcategorias={subcategorias}
      />

      <Suspense>
        <CatalogToolbar total={total} />
      </Suspense>

      <ProductGrid products={products} view={sp.view ?? "dense"} mview={sp.mview ?? "2"} />

      <CatalogPagination page={page} pages={pages} params={sp} />
    </div>
  );
}
