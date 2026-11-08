import { getAdminClient, INDEX_NAME } from "./algolia";
import { isVideoUrl } from "./media";
import { prisma } from "./prisma";

type SyncProduct = {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  price: unknown;
  comparePrice?: unknown;
  imageUrl: string | null;
  imageUrls: string[];
  stock: number;
  isActive: boolean;
  category: string | null;
  /** Todas sus categorías (product_categories). Si no se pasa, se indexa solo la principal. */
  categories?: string[];
};

export async function indexProduct(p: SyncProduct) {
  await getAdminClient().saveObject({
    indexName: INDEX_NAME,
    body: {
      objectID: p.id,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      // El tachado, para que el buscador pinte la oferta igual que el catálogo.
      comparePrice: p.comparePrice == null ? null : Number(p.comparePrice),
      slug: p.slug || p.id,
      // Solo fotos: el buscador muestra <img>, un video rompería la miniatura.
      images: [p.imageUrl, ...p.imageUrls].filter((u): u is string => !!u && !isVideoUrl(u)),
      stock: p.stock,
      active: p.isActive,
      category: p.category ?? "",
      categories: p.categories ?? (p.category ? [p.category] : []),
    },
  });
}

export async function deleteFromIndex(id: string) {
  await getAdminClient().deleteObject({ indexName: INDEX_NAME, objectID: id });
}

/** Reindexa productos leyendo sus categorías actuales. Para cambios en lote. */
export async function reindexarProductos(ids: string[]) {
  const productos = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { categories: { select: { category: { select: { name: true } } } } },
  });
  for (const p of productos) {
    await indexProduct({ ...p, categories: p.categories.map((c) => c.category.name) });
  }
}
