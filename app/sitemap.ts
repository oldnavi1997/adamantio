import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

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
      select: { id: true, updatedAt: true },
    });
    productRoutes = products.map((p) => ({
      url: `${baseUrl}/joyas/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB unavailable during build
  }

  // Las categorías son URLs con query (`/joyas?category=<slug>`), que es como
  // las enlaza el menú. Van al sitemap porque ahora cada una tiene su propio
  // título, descripción, imagen y canonical: sin declararlas, Google depende de
  // llegar a ellas rastreando el menú.
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      select: { name: true, updatedAt: true },
    });
    categoryRoutes = categories.map((c) => ({
      url: `${baseUrl}/joyas?category=${slugify(c.name)}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable during build
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
