import { getAdminClient, INDEX_NAME } from "./algolia";
import { isVideoUrl } from "./media";

type SyncProduct = {
  id: string;
  name: string;
  description: string;
  price: unknown;
  imageUrl: string | null;
  imageUrls: string[];
  stock: number;
  isActive: boolean;
  category: string | null;
};

export async function indexProduct(p: SyncProduct) {
  await getAdminClient().saveObject({
    indexName: INDEX_NAME,
    body: {
      objectID: p.id,
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      slug: p.id,
      // Solo fotos: el buscador muestra <img>, un video rompería la miniatura.
      images: [p.imageUrl, ...p.imageUrls].filter((u): u is string => !!u && !isVideoUrl(u)),
      stock: p.stock,
      active: p.isActive,
      category: p.category ?? "",
    },
  });
}

export async function deleteFromIndex(id: string) {
  await getAdminClient().deleteObject({ indexName: INDEX_NAME, objectID: id });
}
