import { getAdminClient, INDEX_NAME } from "./algolia";

type SyncProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  price: unknown;
  images: string[];
  stock: number;
  active: boolean;
  category: { name: string; slug: string } | null;
};

export async function indexProduct(p: SyncProduct) {
  await getAdminClient().saveObject({
    indexName: INDEX_NAME,
    body: {
      objectID: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand ?? "",
      description: p.description ?? "",
      price: Number(p.price),
      images: p.images,
      stock: p.stock,
      active: p.active,
      category: p.category?.name ?? "",
      categorySlug: p.category?.slug ?? "",
    },
  });
}

export async function deleteFromIndex(id: string) {
  await getAdminClient().deleteObject({ indexName: INDEX_NAME, objectID: id });
}
