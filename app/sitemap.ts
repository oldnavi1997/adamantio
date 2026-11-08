import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { productPath } from "@/lib/utils";
import { getCategoriasPublicas } from "@/lib/categorias";
import { rutaCategoria } from "@/lib/category-tree";

export const revalidate = 3600; // regenerar cada hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`,                                                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/joyas`,                                              lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${baseUrl}/preguntas-frecuentes`,                               lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/politica-de-privacidad`,                             lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/politica-de-devoluciones-y-reembolsos`,             lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/politica-de-envios-y-cancelacion-de-pedidos`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/terminos-de-servicio`,                               lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/condiciones-de-servicio`,                            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/libro-de-reclamaciones`,                             lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, updatedAt: true },
    });
    productRoutes = products.map((p) => ({
      url: `${baseUrl}${productPath(p)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable during build
  }

  // Una URL por categoría activa, con su ruta jerárquica. Los enlaces viejos
  // (`/joyas?category=`) redirigen con 308, así que no se declaran.
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategoriasPublicas();
    categoryRoutes = categories.map((c) => ({
      url: `${baseUrl}${rutaCategoria(categories, c.id)}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: "weekly" as const,
      priority: c.level === 1 ? 0.8 : 0.7,
    }));
  } catch {
    // DB unavailable during build
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
